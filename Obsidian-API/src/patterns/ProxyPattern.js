import logger from '../utils/logger.js';
import circuitBreakerService from '../services/circuitBreakerService.js';
import { eventEmitter } from '../services/eventService.js';

/**
 * Proxy Pattern Implementation
 * Provides a surrogate to control access to objects
 * 
 * Use Case: Resilient proxy for service calls with automatic circuit breaker, logging, caching
 * Based on: https://refactoring.guru/design-patterns/proxy
 */

/**
 * Service Interface
 */
class ServiceInterface {
  async request(url, options = {}) {
    throw new Error('Method must be implemented');
  }
}

/**
 * Real Service
 * The actual service making HTTP calls
 */
class RealService extends ServiceInterface {
  async request(url, options = {}) {
    const axios = (await import('axios')).default;

    const response = await axios({
      url,
      method: options.method || 'GET',
      data: options.data,
      headers: options.headers,
      timeout: options.timeout || 5000,
    });

    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  }
}

/**
 * Resilient Proxy
 * Adds resilience patterns to service calls
 */
class ResilientProxy extends ServiceInterface {
  constructor(realService, serviceName) {
    super();
    this.realService = realService;
    this.serviceName = serviceName;
    this.cache = new Map();
  }

  async request(url, options = {}) {
    const startTime = Date.now();

    try {
      logger.info('Proxy intercepting request', {
        serviceName: this.serviceName,
        url,
        method: options.method || 'GET',
      });

      // Check circuit breaker
      const breaker = circuitBreakerService.getBreaker(this.serviceName);
      if (breaker && breaker.opened) {
        logger.warn('Circuit breaker is open - request blocked', {
          serviceName: this.serviceName,
        });

        throw new Error('Circuit breaker is open');
      }

      // Check cache for GET requests
      if (!options.method || options.method === 'GET') {
        const cached = this.checkCache(url, options);
        if (cached) {
          logger.info('Cache hit - returning cached response', {
            serviceName: this.serviceName,
          });

          return {
            ...cached,
            fromCache: true,
          };
        }
      }

      // Execute real request
      const result = await this.realService.request(url, options);

      const duration = Date.now() - startTime;

      // Cache successful GET responses
      if (result.success && (!options.method || options.method === 'GET')) {
        this.cacheResponse(url, options, result);
      }

      // Record metrics
      eventEmitter.emit('metrics:recorded', {
        serviceName: this.serviceName,
        url,
        duration,
        success: true,
      });

      logger.info('Proxy request completed', {
        serviceName: this.serviceName,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Proxy request failed', {
        serviceName: this.serviceName,
        error: error.message,
        duration,
      });

      // Record failure metrics
      eventEmitter.emit('metrics:recorded', {
        serviceName: this.serviceName,
        url,
        duration,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  checkCache(url, options) {
    const cacheKey = this.getCacheKey(url, options);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.data;
    }

    return null;
  }

  cacheResponse(url, options, data) {
    const cacheKey = this.getCacheKey(url, options);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Cleanup old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  getCacheKey(url, options) {
    return `${url}:${JSON.stringify(options.data || {})}`;
  }
}

/**
 * Logging Proxy
 * Adds detailed logging
 */
class LoggingProxy extends ServiceInterface {
  constructor(realService, serviceName) {
    super();
    this.realService = realService;
    this.serviceName = serviceName;
  }

  async request(url, options = {}) {
    logger.info('=== REQUEST START ===', {
      serviceName: this.serviceName,
      url,
      method: options.method || 'GET',
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await this.realService.request(url, options);

      logger.info('=== REQUEST SUCCESS ===', {
        serviceName: this.serviceName,
        status: result.status,
        dataSize: JSON.stringify(result.data).length,
      });

      return result;
    } catch (error) {
      logger.error('=== REQUEST FAILED ===', {
        serviceName: this.serviceName,
        error: error.message,
      });

      throw error;
    }
  }
}

/**
 * Authentication Proxy
 * Adds authentication headers
 */
class AuthenticationProxy extends ServiceInterface {
  constructor(realService, tokenProvider) {
    super();
    this.realService = realService;
    this.tokenProvider = tokenProvider;
  }

  async request(url, options = {}) {
    const token = await this.tokenProvider();

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    return await this.realService.request(url, options);
  }
}

/**
 * Virtual Proxy
 * Lazy initialization of expensive resources
 */
class VirtualProxy extends ServiceInterface {
  constructor(serviceName) {
    super();
    this.serviceName = serviceName;
    this.realService = null;
  }

  async request(url, options = {}) {
    // Lazy initialization
    if (!this.realService) {
      logger.info('Virtual proxy initializing real service', {
        serviceName: this.serviceName,
      });

      this.realService = new RealService();
    }

    return await this.realService.request(url, options);
  }
}

/**
 * Protection Proxy
 * Controls access based on permissions
 */
class ProtectionProxy extends ServiceInterface {
  constructor(realService, permissionChecker) {
    super();
    this.realService = realService;
    this.permissionChecker = permissionChecker;
  }

  async request(url, options = {}) {
    const hasPermission = await this.permissionChecker(url, options);

    if (!hasPermission) {
      throw new Error('Access denied - insufficient permissions');
    }

    return await this.realService.request(url, options);
  }
}

/**
 * Proxy Factory
 * Creates proxies with specific configurations
 */
class ProxyFactory {
  static createResilientProxy(serviceName) {
    const realService = new RealService();
    return new ResilientProxy(realService, serviceName);
  }

  static createLoggingProxy(serviceName) {
    const realService = new RealService();
    return new LoggingProxy(realService, serviceName);
  }

  static createAuthProxy(tokenProvider) {
    const realService = new RealService();
    return new AuthenticationProxy(realService, tokenProvider);
  }

  static createVirtualProxy(serviceName) {
    return new VirtualProxy(serviceName);
  }

  static createProtectionProxy(permissionChecker) {
    const realService = new RealService();
    return new ProtectionProxy(realService, permissionChecker);
  }

  /**
   * Create a proxy with multiple layers
   */
  static createCompositeProxy(serviceName, options = {}) {
    let service = new RealService();

    // Add resilience layer
    if (options.resilient !== false) {
      service = new ResilientProxy(service, serviceName);
    }

    // Add logging layer
    if (options.logging) {
      service = new LoggingProxy(service, serviceName);
    }

    // Add authentication layer
    if (options.tokenProvider) {
      service = new AuthenticationProxy(service, options.tokenProvider);
    }

    return service;
  }
}

/**
 * Example Usage:
 * 
 * // Create resilient proxy
 * const proxy = ProxyFactory.createResilientProxy('payment-service');
 * const result = await proxy.request('http://api/payment', {
 *   method: 'POST',
 *   data: { amount: 100 }
 * });
 * 
 * // Create composite proxy with multiple layers
 * const compositeProxy = ProxyFactory.createCompositeProxy('api-service', {
 *   resilient: true,
 *   logging: true,
 *   tokenProvider: async () => 'auth-token-123'
 * });
 */

export {
  ServiceInterface,
  RealService,
  ResilientProxy,
  LoggingProxy,
  AuthenticationProxy,
  VirtualProxy,
  ProtectionProxy,
  ProxyFactory,
};

