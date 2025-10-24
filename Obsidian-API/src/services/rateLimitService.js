import Service from '../models/Service.js';
import logger from '../utils/logger.js';

/**
 * Advanced Rate Limiting Service
 * Implements per-service, per-endpoint, and per-client rate limiting
 */
class RateLimitService {
  constructor() {
    // In-memory store for rate limit buckets
    // Format: Map<key, { count, resetAt }>
    this.buckets = new Map();
    this.cleanupInterval = null;

    // Start cleanup task
    this.startCleanup();
  }

  /**
   * Check if a request should be rate limited
   */
  async checkLimit(serviceName, endpoint = '*', clientId = 'default') {
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      return { allowed: true, reason: 'service_not_found' };
    }

    // Check service-level rate limit
    const serviceLimit = service.rateLimit;
    if (serviceLimit && serviceLimit.enabled) {
      const serviceKey = `service:${serviceName}`;
      const serviceCheck = this.checkBucket(
        serviceKey,
        serviceLimit.requestsPerMinute,
        60000
      );

      if (!serviceCheck.allowed) {
        logger.warn('Service rate limit exceeded', {
          serviceName,
          limit: serviceLimit.requestsPerMinute,
          resetAt: serviceCheck.resetAt,
        });
        return {
          allowed: false,
          reason: 'service_limit_exceeded',
          limit: serviceLimit.requestsPerMinute,
          resetAt: serviceCheck.resetAt,
          retryAfter: Math.ceil((serviceCheck.resetAt - Date.now()) / 1000),
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
   * Get rate limit status for a service
   */
  async getRateLimitStatus(serviceName) {
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      throw new Error('Service not found');
    }

    // Get current bucket stats
    const serviceKey = `service:${serviceName}`;
    const serviceBucket = this.buckets.get(serviceKey);

    const status = {
      service: {
        enabled: service.rateLimit?.enabled || false,
        limit: service.rateLimit?.requestsPerMinute || 0,
        current: serviceBucket?.count || 0,
        resetAt: serviceBucket?.resetAt || null,
      },
      endpoints: {},
      client: {
        enabled: service.clientRateLimit?.enabled || false,
        limit: service.clientRateLimit?.requestsPerMinute || 0,
      },
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

