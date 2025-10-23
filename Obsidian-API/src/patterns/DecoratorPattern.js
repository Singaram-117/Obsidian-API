import logger from '../utils/logger.js';
import { eventEmitter } from '../services/eventService.js';

/**
 * Decorator Pattern Implementation
 * Dynamically adds behavior to requests without modifying their structure
 * 
 * Use Case: Enhance service requests with logging, metrics, tracing, caching, etc.
 * Based on: https://refactoring.guru/design-patterns/decorator
 */

/**
 * Base Request Component
 */
class BaseRequest {
  constructor(serviceName, url, options = {}) {
    this.serviceName = serviceName;
    this.url = url;
    this.options = options;
    this.metadata = {};
  }

  async execute() {
    const axios = (await import('axios')).default;
    const startTime = Date.now();

    try {
      const response = await axios({
        url: this.url,
        method: this.options.method || 'GET',
        data: this.options.data,
        headers: this.options.headers,
        timeout: this.options.timeout || 5000,
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: response.data,
        status: response.status,
        duration,
        metadata: this.metadata,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        duration,
        metadata: this.metadata,
      };
    }
  }
}

/**
 * Base Decorator
 */
class RequestDecorator {
  constructor(request) {
    this.request = request;
  }

  async execute() {
    return await this.request.execute();
  }
}

/**
 * Logging Decorator
 * Adds request/response logging
 */
class LoggingDecorator extends RequestDecorator {
  async execute() {
    logger.info('Request started', {
      serviceName: this.request.serviceName,
      url: this.request.url,
      method: this.request.options.method || 'GET',
    });

    const result = await super.execute();

    if (result.success) {
      logger.info('Request completed', {
        serviceName: this.request.serviceName,
        status: result.status,
        duration: result.duration,
      });
    } else {
      logger.error('Request failed', {
        serviceName: this.request.serviceName,
        error: result.error,
        duration: result.duration,
      });
    }

    return result;
  }
}

/**
 * Metrics Decorator
 * Collects performance metrics
 */
class MetricsDecorator extends RequestDecorator {
  async execute() {
    const result = await super.execute();

    // Record metrics
    this.request.metadata.metrics = {
      duration: result.duration,
      success: result.success,
      status: result.status,
      timestamp: new Date(),
    };

    // Emit metrics event
    eventEmitter.emit('metrics:recorded', {
      serviceName: this.request.serviceName,
      duration: result.duration,
      success: result.success,
    });

    return result;
  }
}

/**
 * Tracing Decorator
 * Adds distributed tracing headers
 */
class TracingDecorator extends RequestDecorator {
  async execute() {
    // Generate trace ID
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

    // Add tracing headers
    this.request.options.headers = {
      ...this.request.options.headers,
      'X-Trace-Id': traceId,
      'X-Span-Id': spanId,
      'X-Parent-Span-Id': this.request.metadata.parentSpanId || 'root',
    };

    this.request.metadata.traceId = traceId;
    this.request.metadata.spanId = spanId;

    logger.debug('Trace headers added', { traceId, spanId });

    const result = await super.execute();

    result.traceId = traceId;
    result.spanId = spanId;

    return result;
  }
}

/**
 * Caching Decorator
 * Adds caching layer
 */
class CachingDecorator extends RequestDecorator {
  constructor(request, ttl = 60000) {
    super(request);
    this.cache = new Map();
    this.ttl = ttl;
  }

  getCacheKey() {
    return `${this.request.serviceName}:${this.request.url}:${JSON.stringify(
      this.request.options.data || {}
    )}`;
  }

  async execute() {
    const cacheKey = this.getCacheKey();

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      logger.debug('Cache hit', { cacheKey });

      return {
        ...cached.result,
        fromCache: true,
        cacheAge: Date.now() - cached.timestamp,
      };
    }

    // Execute request
    const result = await super.execute();

    // Cache successful responses
    if (result.success) {
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      // Auto-cleanup old entries
      if (this.cache.size > 1000) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
    }

    return result;
  }
}

/**
 * Retry Decorator
 * Adds retry logic
 */
class RetryDecorator extends RequestDecorator {
  constructor(request, maxRetries = 3, backoff = 1000) {
    super(request);
    this.maxRetries = maxRetries;
    this.backoff = backoff;
  }

  async execute() {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const result = await super.execute();

      if (result.success) {
        result.attempts = attempt;
        return result;
      }

      lastError = result;

      if (attempt < this.maxRetries) {
        const delay = this.backoff * Math.pow(2, attempt - 1);
        logger.info(`Retry attempt ${attempt}/${this.maxRetries}`, {
          serviceName: this.request.serviceName,
          delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    lastError.attempts = this.maxRetries;
    return lastError;
  }
}

/**
 * Authentication Decorator
 * Adds authentication headers
 */
class AuthDecorator extends RequestDecorator {
  constructor(request, token) {
    super(request);
    this.token = token;
  }

  async execute() {
    this.request.options.headers = {
      ...this.request.options.headers,
      Authorization: `Bearer ${this.token}`,
    };

    return await super.execute();
  }
}

/**
 * Compression Decorator
 * Adds compression headers
 */
class CompressionDecorator extends RequestDecorator {
  async execute() {
    this.request.options.headers = {
      ...this.request.options.headers,
      'Accept-Encoding': 'gzip, deflate, br',
    };

    return await super.execute();
  }
}

/**
 * Request Builder - Fluent API for building decorated requests
 */
class RequestBuilder {
  constructor(serviceName, url, options = {}) {
    this.request = new BaseRequest(serviceName, url, options);
  }

  withLogging() {
    this.request = new LoggingDecorator(this.request);
    return this;
  }

  withMetrics() {
    this.request = new MetricsDecorator(this.request);
    return this;
  }

  withTracing() {
    this.request = new TracingDecorator(this.request);
    return this;
  }

  withCaching(ttl) {
    this.request = new CachingDecorator(this.request, ttl);
    return this;
  }

  withRetry(maxRetries, backoff) {
    this.request = new RetryDecorator(this.request, maxRetries, backoff);
    return this;
  }

  withAuth(token) {
    this.request = new AuthDecorator(this.request, token);
    return this;
  }

  withCompression() {
    this.request = new CompressionDecorator(this.request);
    return this;
  }

  build() {
    return this.request;
  }

  async execute() {
    return await this.request.execute();
  }
}

/**
 * Example Usage:
 * 
 * const request = new RequestBuilder('payment-service', 'http://api/payment')
 *   .withLogging()
 *   .withMetrics()
 *   .withTracing()
 *   .withCaching(60000)
 *   .withRetry(3, 1000)
 *   .build();
 * 
 * const result = await request.execute();
 */

export {
  BaseRequest,
  RequestDecorator,
  LoggingDecorator,
  MetricsDecorator,
  TracingDecorator,
  CachingDecorator,
  RetryDecorator,
  AuthDecorator,
  CompressionDecorator,
  RequestBuilder,
};

