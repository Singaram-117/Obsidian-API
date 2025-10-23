import logger from '../utils/logger.js';

/**
 * Fallback Pattern Implementation
 * Provides alternative responses when primary service fails
 * 
 * When a service call fails, instead of returning an error,
 * return cached data, default values, or degraded functionality.
 * 
 * Based on: https://www.geeksforgeeks.org/system-design/microservices-resilience-patterns/
 */
class FallbackPattern {
  constructor() {
    this.fallbackStrategies = new Map();
    this.cache = new Map();
  }

  /**
   * Register a fallback strategy for a service
   */
  registerFallback(serviceName, strategy) {
    this.fallbackStrategies.set(serviceName, strategy);
    logger.info(`Fallback strategy registered for ${serviceName}`, {
      strategyType: strategy.type,
    });
  }

  /**
   * Execute with fallback
   */
  async executeWithFallback(serviceName, primaryFn, context = {}) {
    try {
      // Try primary function
      const result = await primaryFn();

      // Cache successful result for future fallbacks
      if (result) {
        this._cacheResult(serviceName, context, result);
      }

      return {
        success: true,
        source: 'primary',
        data: result,
      };
    } catch (error) {
      logger.warn(`Primary function failed for ${serviceName}, using fallback`, {
        error: error.message,
      });

      // Get fallback strategy
      const strategy = this.fallbackStrategies.get(serviceName);

      if (!strategy) {
        throw new Error(
          `No fallback strategy defined for ${serviceName}: ${error.message}`
        );
      }

      // Execute fallback based on strategy type
      return await this._executeFallback(serviceName, strategy, context, error);
    }
  }

  /**
   * Execute fallback strategy
   */
  async _executeFallback(serviceName, strategy, context, originalError) {
    switch (strategy.type) {
      case 'cache':
        return this._cacheF

allback(serviceName, context);

      case 'default':
        return this._defaultFallback(strategy);

      case 'function':
        return this._functionFallback(strategy, context, originalError);

      case 'empty':
        return this._emptyFallback();

      case 'degraded':
        return this._degradedFallback(strategy, context);

      default:
        throw new Error(`Unknown fallback strategy type: ${strategy.type}`);
    }
  }

  /**
   * Cache fallback - return cached data
   */
  _cacheFallback(serviceName, context) {
    const cacheKey = this._getCacheKey(serviceName, context);
    const cachedData = this.cache.get(cacheKey);

    if (cachedData) {
      logger.info(`Using cached fallback for ${serviceName}`);
      return {
        success: true,
        source: 'cache',
        data: cachedData,
        warning: 'Using cached data due to service unavailability',
      };
    }

    throw new Error(`No cached data available for fallback: ${serviceName}`);
  }

  /**
   * Default fallback - return predefined default value
   */
  _defaultFallback(strategy) {
    logger.info('Using default fallback');
    return {
      success: true,
      source: 'default',
      data: strategy.defaultValue,
      warning: 'Using default value due to service unavailability',
    };
  }

  /**
   * Function fallback - execute custom fallback function
   */
  async _functionFallback(strategy, context, originalError) {
    logger.info('Using function fallback');

    try {
      const result = await strategy.fallbackFn(context, originalError);
      return {
        success: true,
        source: 'fallback_function',
        data: result,
        warning: 'Using fallback function due to service unavailability',
      };
    } catch (error) {
      logger.error('Fallback function also failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Empty fallback - return empty result
   */
  _emptyFallback() {
    logger.info('Using empty fallback');
    return {
      success: true,
      source: 'empty',
      data: null,
      warning: 'Service unavailable, returning empty result',
    };
  }

  /**
   * Degraded fallback - return limited functionality
   */
  _degradedFallback(strategy, context) {
    logger.info('Using degraded fallback');
    return {
      success: true,
      source: 'degraded',
      data: strategy.degradedData || {},
      warning: 'Service operating in degraded mode with limited functionality',
    };
  }

  /**
   * Cache result for future fallbacks
   */
  _cacheResult(serviceName, context, result) {
    const cacheKey = this._getCacheKey(serviceName, context);
    const ttl = 300000; // 5 minutes

    this.cache.set(cacheKey, result);

    // Set expiration
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, ttl);
  }

  /**
   * Generate cache key
   */
  _getCacheKey(serviceName, context) {
    return `${serviceName}:${JSON.stringify(context)}`;
  }

  /**
   * Clear cache for a service
   */
  clearCache(serviceName) {
    for (const [key] of this.cache) {
      if (key.startsWith(`${serviceName}:`)) {
        this.cache.delete(key);
      }
    }
    logger.info(`Cache cleared for ${serviceName}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalCached: this.cache.size,
      strategies: this.fallbackStrategies.size,
    };
  }
}

// Export singleton instance
const fallbackPattern = new FallbackPattern();
export default fallbackPattern;

