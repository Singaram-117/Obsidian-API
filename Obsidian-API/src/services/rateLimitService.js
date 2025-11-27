import Service from '../models/Service.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { eventEmitter } from './eventService.js';

/**
 * Advanced Rate Limiting Service - Strategy Pattern Implementation
 * Implements per-service, per-endpoint, and per-client rate limiting
 * Uses different strategies for different types of rate limiting
 */
class RateLimitService {
  constructor() {
    // In-memory store for rate limit buckets
    // Format: Map<key, { count, resetAt, windowStart }>
    this.buckets = new Map();
    this.cleanupInterval = null;

    // Rate limiting strategies - Strategy Pattern
    this.strategies = {
      'fixed-window': this.fixedWindowStrategy.bind(this),
      'sliding-window': this.slidingWindowStrategy.bind(this),
      'token-bucket': this.tokenBucketStrategy.bind(this),
    };

    // Start cleanup task
    this.startCleanup();
  }

  /**
   * Fixed Window Strategy - Simple time window based rate limiting
   */
  async fixedWindowStrategy(key, limit, windowMs) {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      // New window or first request
      this.buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
        windowStart: now,
      });

      return { allowed: true };
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        resetAt: bucket.resetAt,
        remaining: 0,
      };
    }

    bucket.count++;
    return {
      allowed: true,
      remaining: limit - bucket.count,
      resetAt: bucket.resetAt,
    };
  }

  /**
   * Sliding Window Strategy - More accurate rate limiting
   */
  async slidingWindowStrategy(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const bucket = this.buckets.get(key);

    if (!bucket) {
      this.buckets.set(key, {
        requests: [{ timestamp: now }],
        resetAt: now + windowMs,
      });
      return { allowed: true };
    }

    // Remove old requests outside the window
    bucket.requests = bucket.requests.filter(req => req.timestamp > windowStart);

    if (bucket.requests.length >= limit) {
      const oldestRequest = bucket.requests[0];
      return {
        allowed: false,
        resetAt: oldestRequest.timestamp + windowMs,
        remaining: 0,
      };
    }

    bucket.requests.push({ timestamp: now });
    return {
      allowed: true,
      remaining: limit - bucket.requests.length,
      resetAt: bucket.requests[0].timestamp + windowMs,
    };
  }

  /**
   * Token Bucket Strategy - Allows bursts but maintains average rate
   */
  async tokenBucketStrategy(key, limit, windowMs) {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket) {
      this.buckets.set(key, {
        tokens: limit,
        lastRefill: now,
        resetAt: now + windowMs,
      });
      return { allowed: true };
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / (windowMs / limit));

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    if (bucket.tokens <= 0) {
      return {
        allowed: false,
        resetAt: bucket.lastRefill + (windowMs / limit),
        remaining: 0,
      };
    }

    bucket.tokens--;
    return {
      allowed: true,
      remaining: bucket.tokens,
      resetAt: bucket.lastRefill + (windowMs / limit),
    };
  }

  /**
   * Check if a request should be rate limited - Strategy Pattern Facade
   */
  async checkLimit(serviceName, endpoint = '*', clientId = 'default') {
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      return { allowed: true, reason: 'service_not_found' };
    }

    // Get rate limit configuration
    const rateLimitConfig = service.rateLimit || {};
    const strategy = rateLimitConfig.strategy || 'fixed-window';
    const strategyFn = this.strategies[strategy] || this.strategies['fixed-window'];

    // Check service-level rate limit
    if (rateLimitConfig.enabled) {
      const limit = rateLimitConfig.requestsPerMinute || config.get('rateLimit.service.defaultRequestsPerMinute');
      const serviceKey = `service:${serviceName}:${clientId}`;
      const serviceCheck = await strategyFn(serviceKey, limit, 60000);

      if (!serviceCheck.allowed) {
        logger.warn('Service rate limit exceeded', {
          serviceName,
          clientId,
          limit,
          strategy,
          resetAt: serviceCheck.resetAt,
        });
        this.emitRateLimitEvent({
          serviceName,
          endpoint: '*',
          clientId,
          limit,
          strategy,
          reason: 'service_limit_exceeded',
          resetAt: serviceCheck.resetAt,
        });
        return {
          allowed: false,
          reason: 'service_limit_exceeded',
          limit,
          resetAt: serviceCheck.resetAt,
          retryAfter: Math.ceil((serviceCheck.resetAt - Date.now()) / 1000),
        };
      }
    }

    // Check endpoint-level rate limit
    const endpointLimit = rateLimitConfig.endpointLimits?.[endpoint] || rateLimitConfig.endpointLimits?.['*'];
    if (endpointLimit && endpointLimit.enabled) {
      const limit = endpointLimit.requestsPerMinute || config.get('rateLimit.service.endpointRequestsPerMinute');
      const endpointKey = `endpoint:${serviceName}:${endpoint}:${clientId}`;
      const endpointCheck = await strategyFn(endpointKey, limit, 60000);

      if (!endpointCheck.allowed) {
        logger.warn('Endpoint rate limit exceeded', {
          serviceName,
          endpoint,
          clientId,
          limit,
          resetAt: endpointCheck.resetAt,
        });
        this.emitRateLimitEvent({
          serviceName,
          endpoint,
          clientId,
          limit,
          strategy,
          reason: 'endpoint_limit_exceeded',
          resetAt: endpointCheck.resetAt,
        });
        return {
          allowed: false,
          reason: 'endpoint_limit_exceeded',
          limit,
          resetAt: endpointCheck.resetAt,
          retryAfter: Math.ceil((endpointCheck.resetAt - Date.now()) / 1000),
        };
      }
    }

    // Check endpoint-level rate limit
    const endpointLimits = service.endpointRateLimits || {};
    if (endpointLimits[endpoint]) {
      const endpointKey = `endpoint:${serviceName}:${endpoint}`;
      const endpointCheck = this.checkBucket(
        endpointKey,
        endpointLimits[endpoint].requestsPerMinute,
        60000
      );

      if (!endpointCheck.allowed) {
        logger.warn('Endpoint rate limit exceeded', {
          serviceName,
          endpoint,
          limit: endpointLimits[endpoint].requestsPerMinute,
        });
        this.emitRateLimitEvent({
          serviceName,
          endpoint,
          limit: endpointLimits[endpoint].requestsPerMinute,
          reason: 'endpoint_limit_exceeded',
          resetAt: endpointCheck.resetAt,
        });
        return {
          allowed: false,
          reason: 'endpoint_limit_exceeded',
          endpoint,
          limit: endpointLimits[endpoint].requestsPerMinute,
          resetAt: endpointCheck.resetAt,
          retryAfter: Math.ceil((endpointCheck.resetAt - Date.now()) / 1000),
        };
      }
    }

    // Check client-level rate limit
    const clientLimit = service.clientRateLimit;
    if (clientLimit && clientLimit.enabled) {
      const clientKey = `client:${serviceName}:${clientId}`;
      const clientCheck = this.checkBucket(
        clientKey,
        clientLimit.requestsPerMinute,
        60000
      );

      if (!clientCheck.allowed) {
        logger.warn('Client rate limit exceeded', {
          serviceName,
          clientId,
          limit: clientLimit.requestsPerMinute,
        });
        this.emitRateLimitEvent({
          serviceName,
          clientId,
          limit: clientLimit.requestsPerMinute,
          reason: 'client_limit_exceeded',
          resetAt: clientCheck.resetAt,
        });
        return {
          allowed: false,
          reason: 'client_limit_exceeded',
          clientId,
          limit: clientLimit.requestsPerMinute,
          resetAt: clientCheck.resetAt,
          retryAfter: Math.ceil((clientCheck.resetAt - Date.now()) / 1000),
        };
      }
    }

    return {
      allowed: true,
      reason: 'ok',
    };
  }

  /**
   * Check and update a rate limit bucket
   */
  checkBucket(key, limit, windowMs) {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      // Create new bucket
      this.buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return { allowed: true, count: 1, resetAt: now + windowMs };
    }

    if (bucket.count >= limit) {
      return { allowed: false, count: bucket.count, resetAt: bucket.resetAt };
    }

    bucket.count++;
    return { allowed: true, count: bucket.count, resetAt: bucket.resetAt };
  }

  emitRateLimitEvent(payload) {
    try {
      eventEmitter.emit('rateLimit:exceeded', {
        timestamp: new Date(),
        ...payload,
      });
    } catch (error) {
      logger.warn('Failed to emit rate limit event', {
        error: error.message,
        payload,
      });
    }
  }

  /**
   * Update service rate limit configuration
   */
  async updateServiceRateLimit(serviceName, config) {
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      throw new Error('Service not found');
    }

    service.rateLimit = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      requestsPerMinute: config.requestsPerMinute || 100,
    };

    await service.save();

    logger.info('Service rate limit updated', {
      serviceName,
      config: service.rateLimit,
    });

    return service.rateLimit;
  }

  /**
   * Update endpoint rate limit configuration
   */
  async updateEndpointRateLimit(serviceName, endpoint, config) {
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      throw new Error('Service not found');
    }

    if (!service.endpointRateLimits) {
      service.endpointRateLimits = {};
    }

    service.endpointRateLimits[endpoint] = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      requestsPerMinute: config.requestsPerMinute || 50,
    };

    // Mark the field as modified for Mongoose
    service.markModified('endpointRateLimits');

    await service.save();

    logger.info('Endpoint rate limit updated', {
      serviceName,
      endpoint,
      config: service.endpointRateLimits[endpoint],
    });

    return service.endpointRateLimits[endpoint];
  }

  /**
   * Update client rate limit configuration
   */
  async updateClientRateLimit(serviceName, config) {
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      throw new Error('Service not found');
    }

    service.clientRateLimit = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      requestsPerMinute: config.requestsPerMinute || 60,
    };

    await service.save();

    logger.info('Client rate limit updated', {
      serviceName,
      config: service.clientRateLimit,
    });

    return service.clientRateLimit;
  }

  /**
   * Get rate limit status for a service - Observer Pattern Integration
   */
  async getRateLimitStatus(serviceName) {
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      return {
        enabled: false,
        reason: 'service_not_found',
        strategy: 'fixed-window',
        requestsPerMinute: 0,
        currentUsage: { totalRequests: 0, activeBuckets: 0 },
      };
    }

    const rateLimitConfig = service.rateLimit || {};

    // Get current bucket stats
    const serviceKey = `service:${serviceName}`;
    const serviceBucket = this.buckets.get(serviceKey);

    // Get current bucket stats for all clients
    let totalRequests = 0;
    let activeBuckets = 0;

    for (const [key, bucket] of this.buckets.entries()) {
      if (key.startsWith(`service:${serviceName}:`)) {
        activeBuckets++;
        totalRequests += bucket.count || bucket.requests?.length || bucket.tokens || 0;
      }
    }

    const status = {
      enabled: rateLimitConfig.enabled || false,
      strategy: rateLimitConfig.strategy || 'fixed-window',
      requestsPerMinute: rateLimitConfig.requestsPerMinute || config.get('rateLimit.service.defaultRequestsPerMinute'),
      currentUsage: {
        totalRequests,
        activeBuckets,
      },
      endpoints: rateLimitConfig.endpointLimits || {},
      clientLimits: rateLimitConfig.clientRateLimit || {},
    };

    // Get endpoint bucket stats
    if (service.endpointRateLimits) {
      for (const [endpoint, config] of Object.entries(service.endpointRateLimits)) {
        const endpointKey = `endpoint:${serviceName}:${endpoint}`;
        const bucket = this.buckets.get(endpointKey);

        status.endpoints[endpoint] = {
          enabled: config.enabled,
          limit: config.requestsPerMinute,
          current: bucket?.count || 0,
          resetAt: bucket?.resetAt || null,
        };
      }
    }

    return status;
  }

  /**
   * Reset rate limit buckets for a service
   */
  async resetServiceLimits(serviceName) {
    const keysToDelete = [];

    for (const key of this.buckets.keys()) {
      if (key.includes(serviceName)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.buckets.delete(key));

    logger.info('Service rate limits reset', {
      serviceName,
      bucketsCleared: keysToDelete.length,
    });

    return { cleared: keysToDelete.length };
  }

  /**
   * Start cleanup task to remove expired buckets
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, bucket] of this.buckets.entries()) {
        if (now >= bucket.resetAt) {
          this.buckets.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug('Rate limit buckets cleaned up', { cleaned });
      }
    }, 60000); // Run every minute
  }

  /**
   * Stop cleanup task
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export default new RateLimitService();