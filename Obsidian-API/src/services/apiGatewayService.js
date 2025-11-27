import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import rateLimitService from './rateLimitService.js';
import loadBalancerService from './loadBalancerService.js';
import responseCacheService from './responseCacheService.js';
import circuitBreakerService from './circuitBreakerService.js';
import Service from '../models/Service.js';
import { eventEmitter } from './eventService.js';

/**
 * API Gateway Service - Proxy Pattern Implementation
 * Acts as a reverse proxy for microservices with resilience patterns
 */
class ApiGatewayService {
  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Obsidian-API-Gateway/1.0',
      },
      validateStatus: () => true, // Don't throw on any status code
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Gateway outgoing request', {
          method: config.method,
          url: config.url,
          service: config.serviceName,
        });
        return config;
      },
      (error) => {
        logger.error('Gateway request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and metrics
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Gateway response received', {
          status: response.status,
          service: response.config.serviceName,
          responseTime: Date.now() - response.config.startTime,
        });
        return response;
      },
      (error) => {
        logger.error('Gateway response error', {
          status: error.response?.status,
          service: error.config?.serviceName,
          error: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Main gateway method - Facade Pattern
   * Handles the entire request pipeline with resilience patterns
   */
  async handleRequest(serviceName, endpoint, method, data = null, headers = {}, clientInfo = {}) {
    const startTime = Date.now();

    try {
      // 1. Rate Limiting - Strategy Pattern
      const rateLimitResult = await this.checkRateLimit(serviceName, endpoint, clientInfo);
      if (!rateLimitResult.allowed) {
        return this.createRateLimitResponse(rateLimitResult);
      }

      // 2. Check Cache - Cache-Aside Pattern
      const cacheKey = this.generateCacheKey(serviceName, endpoint, method, data);
      const cachedResponse = await responseCacheService.get(cacheKey);
      if (cachedResponse) {
        responseCacheService.recordHit(cacheKey);
        logger.debug('Cache hit', { serviceName, endpoint });
        return this.createSuccessResponse(cachedResponse.data, cachedResponse.headers, startTime);
      }

      // 3. Load Balancing - Strategy Pattern
      const targetInstance = await this.selectInstance(serviceName, clientInfo);

      // 4. Make request directly (circuit breaker is already in the route handler)
      const response = await this.makeRequest(targetInstance, endpoint, method, data, headers, serviceName, startTime);

      // 5. Cache Response - Cache-Aside Pattern
      await this.cacheResponse(cacheKey, response);

      // 6. Record Metrics
      await this.recordMetrics(serviceName, response.status, Date.now() - startTime, true);

      return response;

    } catch (error) {
      logger.error('Gateway request failed', {
        serviceName,
        endpoint,
        error: error.message,
        errorStack: error.stack,
        errorCode: error.code,
        responseTime: Date.now() - startTime,
      });

      // Record failure metrics
      await this.recordMetrics(serviceName, error.response?.status || 500, Date.now() - startTime, false);

      // Emit failure event
      eventEmitter.emit('service:request:failed', {
        serviceName,
        endpoint,
        error: error.message,
        timestamp: new Date(),
      });

      return this.createErrorResponse(error);
    }
  }

  /**
   * Check rate limits using Strategy pattern
   */
  async checkRateLimit(serviceName, endpoint, clientInfo) {
    const clientId = this.getClientId(clientInfo);

    // Check service-level rate limit
    const serviceLimit = await rateLimitService.checkLimit(serviceName, '*', clientId);
    if (!serviceLimit.allowed) {
      return serviceLimit;
    }

    // Check endpoint-level rate limit
    const endpointLimit = await rateLimitService.checkLimit(serviceName, endpoint, clientId);
    if (!endpointLimit.allowed) {
      return endpointLimit;
    }

    return { allowed: true };
  }

  /**
   * Select instance using Load Balancing Strategy pattern
   */
  async selectInstance(serviceName, clientInfo) {
    const service = await Service.findOne({ name: serviceName });
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // If service has instances, use load balancer
    if (service.instances && service.instances.length > 0) {
      const strategy = service.loadBalancing?.strategy || 'round-robin';
      const instance = await loadBalancerService.getInstance(serviceName, strategy, clientInfo);
      
      logger.info('Selected instance from load balancer', {
        serviceName,
        instanceId: instance?.instanceId,
        url: instance?.url,
        strategy,
      });

      return instance;
    }

    // Fallback to service URL if no instances
    logger.info('Using service URL as fallback', {
      serviceName,
      serviceUrl: service.url,
    });

    return {
      instanceId: `${serviceName}-default`,
      url: service.url,
      status: 'healthy',
    };
  }

  /**
   * Make HTTP request to microservice instance
   */
  async makeRequest(instance, endpoint, method, data, headers, serviceName, startTime) {
    // Ensure we have a valid instance with URL
    if (!instance || !instance.url) {
      throw new Error(`Invalid instance for service ${serviceName}: missing URL`);
    }

    // Convert Mongoose document to plain object if needed
    const instanceData = instance.toObject ? instance.toObject() : instance;
    const url = `${instanceData.url}${endpoint}`;
    
    logger.info('Making request to microservice', {
      instanceUrl: instanceData.url,
      endpoint,
      fullUrl: url,
      method,
      serviceName,
      instanceId: instanceData.instanceId,
    });

    const config = {
      method,
      url,
      data,
      headers: {
        ...headers,
        'X-Service-Name': serviceName,
        'X-Instance-ID': instanceData.instanceId || 'unknown',
        'Content-Type': 'application/json',
      },
      serviceName,
      startTime,
    };

    try {
      const response = await this.client.request(config);

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Request failed', {
        serviceName,
        endpoint,
        url,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Cache response using Cache-Aside pattern
   */
  async cacheResponse(cacheKey, response) {
    try {
      const service = await this.getServiceFromCacheKey(cacheKey);
      const cacheConfig = service?.cache;

      if (cacheConfig?.enabled && response.status === 200) {
        await responseCacheService.set(cacheKey, response.data, cacheConfig.ttl || 300);
        logger.debug('Response cached', { cacheKey, ttl: cacheConfig.ttl });
      }
    } catch (error) {
      logger.warn('Failed to cache response', { cacheKey, error: error.message });
    }
  }

  /**
   * Record metrics for monitoring
   */
  async recordMetrics(serviceName, status, responseTime, success) {
    try {
      await Service.updateOne(
        { name: serviceName },
        {
          $inc: {
            'metrics.totalRequests': 1,
            ...(success ? { 'metrics.successfulRequests': 1 } : { 'metrics.failedRequests': 1 }),
          },
          $set: {
            'metrics.lastRequestTime': new Date(),
          },
        }
      );

      // Update rolling average response time
      const service = await Service.findOne({ name: serviceName });
      if (service?.metrics) {
        const currentAvg = service.metrics.averageResponseTime || 0;
        const totalRequests = service.metrics.totalRequests + 1;
        const newAvg = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;

        await Service.updateOne(
          { name: serviceName },
          { $set: { 'metrics.averageResponseTime': Math.round(newAvg) } }
        );
      }
    } catch (error) {
      logger.warn('Failed to record metrics', { serviceName, error: error.message });
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(serviceName, endpoint, method, data) {
    const keyData = {
      serviceName,
      endpoint,
      method,
      data: data ? JSON.stringify(data) : null,
    };

    return `${serviceName}:${endpoint}:${method}:${crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 16)}`;
  }

  /**
   * Get service from cache key (helper method)
   */
  async getServiceFromCacheKey(cacheKey) {
    const serviceName = cacheKey.split(':')[0];
    return await Service.findOne({ name: serviceName });
  }

  /**
   * Get client identifier for rate limiting
   */
  getClientId(clientInfo) {
    return clientInfo.ip || clientInfo.userId || clientInfo.apiKey || 'default';
  }

  /**
   * Create rate limit response
   */
  createRateLimitResponse(rateLimitResult) {
    return {
      status: 429,
      data: {
        error: 'Rate limit exceeded',
        reason: rateLimitResult.reason,
        retryAfter: rateLimitResult.retryAfter,
        limit: rateLimitResult.limit,
      },
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit,
        'X-RateLimit-Reset': rateLimitResult.resetAt,
        'Retry-After': rateLimitResult.retryAfter,
      },
    };
  }

  /**
   * Create success response
   */
  createSuccessResponse(data, headers = {}, startTime) {
    return {
      status: 200,
      data,
      headers,
      responseTime: Date.now() - startTime,
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;

    return {
      status,
      data: {
        error: 'Service request failed',
        message,
        timestamp: new Date().toISOString(),
      },
      headers: {},
    };
  }

  /**
   * Health check for gateway
   */
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        rateLimit: 'active',
        loadBalancer: 'active',
        cache: 'active',
        circuitBreaker: 'active',
      },
    };
  }
}

// Export singleton instance
const apiGatewayService = new ApiGatewayService();
export default apiGatewayService;
