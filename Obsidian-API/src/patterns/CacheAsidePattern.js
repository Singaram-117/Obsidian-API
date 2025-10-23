import logger from '../utils/logger.js';

/**
 * Cache-Aside Pattern (Lazy Loading)
 * Application manages cache explicitly
 * 
 * Flow:
 * 1. Check cache first
 * 2. If miss, load from data source
 * 3. Update cache
 * 4. Return data
 * 
 * Based on: https://www.geeksforgeeks.org/system-design/microservices-resilience-patterns/
 */
class CacheAsidePattern {
  constructor(cacheProvider) {
    this.cache = cacheProvider || new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };
    this.ttlTimers = new Map();
  }

  /**
   * Get data with cache-aside pattern
   */
  async get(key, loaderFn, options = {}) {
    const { ttl = 300000, skipCache = false } = options;

    // Check cache first (unless skipped)
    if (!skipCache) {
      const cachedValue = this.cache.get(key);

      if (cachedValue !== undefined) {
        this.stats.hits++;
        logger.debug(`Cache hit for key: ${key}`);

        return {
          data: cachedValue,
          cached: true,
          source: 'cache',
        };
      }
    }

    // Cache miss - load from source
    this.stats.misses++;
    logger.debug(`Cache miss for key: ${key}`);

    try {
      const value = await loaderFn();

      // Store in cache
      this.set(key, value, ttl);

      return {
        data: value,
        cached: false,
        source: 'loader',
      };
    } catch (error) {
      logger.error(`Failed to load data for key: ${key}`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = 300000) {
    // Clear existing TTL timer if any
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
    }

    // Set value
    this.cache.set(key, value);
    this.stats.sets++;

    // Set TTL
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.evict(key);
      }, ttl);

      this.ttlTimers.set(key, timer);
    }

    logger.debug(`Cache set for key: ${key} with TTL: ${ttl}ms`);
  }

  /**
   * Evict key from cache
   */
  evict(key) {
    const existed = this.cache.delete(key);

    if (existed) {
      this.stats.evictions++;
      logger.debug(`Cache evicted for key: ${key}`);
    }

    // Clear TTL timer
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }

    return existed;
  }

  /**
   * Invalidate cache (pattern for write-through)
   */
  async invalidate(key, updateFn) {
    // Evict from cache
    this.evict(key);

    // Update data source
    if (updateFn) {
      try {
        await updateFn();
        logger.debug(`Cache invalidated and data updated for key: ${key}`);
      } catch (error) {
        logger.error(`Failed to update data for key: ${key}`, {
          error: error.message,
        });
        throw error;
      }
    }
  }

  /**
   * Get multiple keys
   */
  async getMulti(keys, loaderFn, options = {}) {
    const results = {};
    const misses = [];

    // Check cache for all keys
    for (const key of keys) {
      const cachedValue = this.cache.get(key);

      if (cachedValue !== undefined) {
        results[key] = { data: cachedValue, cached: true };
        this.stats.hits++;
      } else {
        misses.push(key);
        this.stats.misses++;
      }
    }

    // Load missing keys
    if (misses.length > 0 && loaderFn) {
      try {
        const loadedData = await loaderFn(misses);

        for (const key of misses) {
          if (loadedData[key] !== undefined) {
            this.set(key, loadedData[key], options.ttl);
            results[key] = { data: loadedData[key], cached: false };
          }
        }
      } catch (error) {
        logger.error('Failed to load multiple keys', {
          keys: misses,
          error: error.message,
        });
        throw error;
      }
    }

    return results;
  }

  /**
   * Warm cache (pre-populate)
   */
  async warm(keys, loaderFn, options = {}) {
    logger.info('Warming cache', { keyCount: keys.length });

    for (const key of keys) {
      try {
        await this.get(key, () => loaderFn(key), options);
      } catch (error) {
        logger.error(`Failed to warm cache for key: ${key}`, {
          error: error.message,
        });
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;

    // Clear all TTL timers
    for (const [, timer] of this.ttlTimers) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.ttlTimers.clear();
    this.stats.evictions += size;

    logger.info('Cache cleared', { evicted: size });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  /**
   * Get all keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists
   */
  has(key) {
    return this.cache.has(key);
  }
}

// Export singleton instance with Map
const cacheAsidePattern = new CacheAsidePattern();
export default cacheAsidePattern;

