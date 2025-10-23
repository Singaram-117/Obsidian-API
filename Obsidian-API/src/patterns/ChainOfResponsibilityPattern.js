import logger from '../utils/logger.js';
import circuitBreakerService from '../services/circuitBreakerService.js';
import bulkheadPattern from './BulkheadPattern.js';
import fallbackPattern from './FallbackPattern.js';

/**
 * Chain of Responsibility Pattern Implementation
 * Creates a chain of handlers for processing requests
 * 
 * Use Case: Request processing pipeline (rate limit → auth → circuit breaker → bulkhead → execute)
 * Based on: https://refactoring.guru/design-patterns/chain-of-responsibility
 */

/**
 * Base Handler
 */
class Handler {
  constructor() {
    this.nextHandler = null;
  }

  setNext(handler) {
    this.nextHandler = handler;
    return handler; // Return handler for chaining
  }

  async handle(request) {
    if (this.nextHandler) {
      return await this.nextHandler.handle(request);
    }
    return request;
  }
}

/**
 * Authentication Handler
 * Validates authentication tokens
 */
class AuthenticationHandler extends Handler {
  async handle(request) {
    logger.debug('AuthenticationHandler processing request');

    // Check if authentication is required
    if (request.requiresAuth && !request.authToken) {
      logger.warn('Authentication required but no token provided', {
        serviceName: request.serviceName,
      });

      return {
        success: false,
        error: 'Authentication required',
        handlerName: 'AuthenticationHandler',
        request,
      };
    }

    // Validate token (simplified)
    if (request.authToken && request.authToken === 'invalid') {
      logger.warn('Invalid authentication token', {
        serviceName: request.serviceName,
      });

      return {
        success: false,
        error: 'Invalid authentication token',
        handlerName: 'AuthenticationHandler',
        request,
      };
    }

    // Pass to next handler
    return await super.handle(request);
  }
}

/**
 * Rate Limiting Handler
 * Checks if rate limit is exceeded
 */
class RateLimitHandler extends Handler {
  constructor() {
    super();
    this.requestCounts = new Map();
    this.windowSize = 60000; // 1 minute
    this.maxRequests = 100; // 100 requests per minute
  }

  async handle(request) {
    logger.debug('RateLimitHandler processing request');

    const key = `${request.serviceName}:${request.clientId || 'anonymous'}`;
    const now = Date.now();

    // Get current window
    let record = this.requestCounts.get(key);

    if (!record) {
      record = { count: 0, windowStart: now };
      this.requestCounts.set(key, record);
    }

    // Reset window if expired
    if (now - record.windowStart > this.windowSize) {
      record.count = 0;
      record.windowStart = now;
    }

    // Check limit
    if (record.count >= this.maxRequests) {
      logger.warn('Rate limit exceeded', {
        serviceName: request.serviceName,
        count: record.count,
        limit: this.maxRequests,
      });

      return {
        success: false,
        error: 'Rate limit exceeded',
        handlerName: 'RateLimitHandler',
        retryAfter: this.windowSize - (now - record.windowStart),
        request,
      };
    }

    // Increment count
    record.count++;

    // Pass to next handler
    return await super.handle(request);
  }
}

/**
 * Circuit Breaker Handler
 * Checks circuit breaker state
 */
class CircuitBreakerHandler extends Handler {
  async handle(request) {
    logger.debug('CircuitBreakerHandler processing request');

    const breaker = circuitBreakerService.getBreaker(request.serviceName);

    if (!breaker) {
      logger.warn('No circuit breaker found for service', {
        serviceName: request.serviceName,
      });
      return await super.handle(request);
    }

    // Check if circuit is open
    if (breaker.opened) {
      logger.warn('Circuit breaker is open', {
        serviceName: request.serviceName,
      });

      return {
        success: false,
        error: 'Circuit breaker is open',
        handlerName: 'CircuitBreakerHandler',
        circuitState: 'open',
        request,
      };
    }

    // Pass to next handler
    return await super.handle(request);
  }
}

/**
 * Bulkhead Handler
 * Checks bulkhead capacity
 */
class BulkheadHandler extends Handler {
  async handle(request) {
    logger.debug('BulkheadHandler processing request');

    const bulkhead = bulkheadPattern.bulkheads.get(request.serviceName);

    if (bulkhead) {
      const canExecute =
        bulkhead.activeRequests < bulkhead.config.maxConcurrent ||
        bulkhead.queue.length < bulkhead.config.maxQueue;

      if (!canExecute) {
        logger.warn('Bulkhead capacity exceeded', {
          serviceName: request.serviceName,
          activeRequests: bulkhead.activeRequests,
          queueLength: bulkhead.queue.length,
        });

        return {
          success: false,
          error: 'Bulkhead capacity exceeded',
          handlerName: 'BulkheadHandler',
          request,
        };
      }
    }

    // Pass to next handler
    return await super.handle(request);
  }
}

/**
 * Validation Handler
 * Validates request data
 */
class ValidationHandler extends Handler {
  async handle(request) {
    logger.debug('ValidationHandler processing request');

    // Validate required fields
    if (!request.serviceName) {
      return {
        success: false,
        error: 'Service name is required',
        handlerName: 'ValidationHandler',
        request,
      };
    }

    if (!request.url) {
      return {
        success: false,
        error: 'URL is required',
        handlerName: 'ValidationHandler',
        request,
      };
    }

    // Validate URL format
    try {
      new URL(request.url);
    } catch (error) {
      return {
        success: false,
        error: 'Invalid URL format',
        handlerName: 'ValidationHandler',
        request,
      };
    }

    // Pass to next handler
    return await super.handle(request);
  }
}

/**
 * Logging Handler
 * Logs request details
 */
class LoggingHandler extends Handler {
  async handle(request) {
    logger.info('Request received', {
      serviceName: request.serviceName,
      url: request.url,
      method: request.method || 'GET',
      clientId: request.clientId,
    });

    const startTime = Date.now();
    const result = await super.handle(request);
    const duration = Date.now() - startTime;

    logger.info('Request processed', {
      serviceName: request.serviceName,
      success: result.success,
      duration,
    });

    return result;
  }
}

/**
 * Execution Handler
 * Final handler that executes the request
 */
class ExecutionHandler extends Handler {
  async handle(request) {
    logger.debug('ExecutionHandler processing request');

    const axios = (await import('axios')).default;

    try {
      const response = await axios({
        url: request.url,
        method: request.method || 'GET',
        data: request.data,
        headers: request.headers,
        timeout: request.timeout || 5000,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
        handlerName: 'ExecutionHandler',
        request,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        handlerName: 'ExecutionHandler',
        request,
      };
    }
  }
}

/**
 * Request Processing Pipeline
 */
class RequestPipeline {
  constructor() {
    this.chain = null;
  }

  /**
   * Build default pipeline
   */
  buildDefaultPipeline() {
    const logging = new LoggingHandler();
    const validation = new ValidationHandler();
    const auth = new AuthenticationHandler();
    const rateLimit = new RateLimitHandler();
    const circuitBreaker = new CircuitBreakerHandler();
    const bulkhead = new BulkheadHandler();
    const execution = new ExecutionHandler();

    // Chain handlers
    logging
      .setNext(validation)
      .setNext(auth)
      .setNext(rateLimit)
      .setNext(circuitBreaker)
      .setNext(bulkhead)
      .setNext(execution);

    this.chain = logging;

    logger.info('Default request pipeline built');

    return this;
  }

  /**
   * Build custom pipeline
   */
  buildCustomPipeline(handlers) {
    if (handlers.length === 0) {
      throw new Error('At least one handler is required');
    }

    this.chain = handlers[0];

    for (let i = 1; i < handlers.length; i++) {
      handlers[i - 1].setNext(handlers[i]);
    }

    logger.info('Custom request pipeline built', {
      handlerCount: handlers.length,
    });

    return this;
  }

  /**
   * Process request through pipeline
   */
  async process(request) {
    if (!this.chain) {
      throw new Error('Pipeline not built. Call buildDefaultPipeline() or buildCustomPipeline()');
    }

    return await this.chain.handle(request);
  }
}

/**
 * Example Usage:
 * 
 * // Build default pipeline
 * const pipeline = new RequestPipeline().buildDefaultPipeline();
 * 
 * // Process request
 * const result = await pipeline.process({
 *   serviceName: 'payment-service',
 *   url: 'http://api/payment',
 *   method: 'POST',
 *   data: { amount: 100 },
 *   requiresAuth: true,
 *   authToken: 'valid-token',
 *   clientId: 'user123'
 * });
 * 
 * // Or build custom pipeline
 * const customPipeline = new RequestPipeline().buildCustomPipeline([
 *   new ValidationHandler(),
 *   new CircuitBreakerHandler(),
 *   new ExecutionHandler()
 * ]);
 */

export {
  Handler,
  AuthenticationHandler,
  RateLimitHandler,
  CircuitBreakerHandler,
  BulkheadHandler,
  ValidationHandler,
  LoggingHandler,
  ExecutionHandler,
  RequestPipeline,
};

