import logger from '../utils/logger.js';
import crypto from 'crypto';
import config from '../config/config.js';

/**
 * Response Cache Service - Cache-Aside Pattern Implementation
 * Caches microservice responses to reduce load and improve performance
 */
class ResponseCacheService {
  constructor() {
    // In-memory cache
    // Format: Map<cacheKey, { data, expiresAt, hits, createdAt }>
    this.cache = new Map();
    this.maxSize = config.get('gateway.cache.maxSize');
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };

    // Start cleanup task
    this.startCleanup();
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(serviceName, endpoint, method, params = {}) {
    const keyData = {
      serviceName,
      endpoint,
      method,
      params: JSON.stringify(params),
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Get cached response
   */
  get(serviceName, endpoint, method, params = {}) {
    const key = this.generateKey(serviceName, endpoint, method, params);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      logger.debug('Cache miss', { serviceName, endpoint, method });
      return null;
    }

    // Check if expired
    if (Date.now() >= cached.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      logger.debug('Cache expired', { serviceName, endpoint, method });
      return null;
    }

    // Update hit count
    cached.hits++;
    this.stats.hits++;

    logger.debug('Cache hit', {
      serviceName,
      endpoint,
      method,
      hits: cached.hits,
      age: Date.now() - cached.createdAt,
    });

    return cached.data;
  }

  /**
   * Set cached response
   */
  set(serviceName, endpoint, method, params = {}, data, ttl = 60000) {
    const key = this.generateKey(serviceName, endpoint, method, params);

    this.cache.set(key, {
      serviceName,
      endpoint,
      method,
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
      hits: 0,
    });

    this.stats.sets++;

    logger.debug('Cache set', {
      serviceName,
      endpoint,
      method,
      ttl,
      cacheKey: key,
    });

    return true;
  }

  /**
   * Invalidate cache for a service
   */
  invalidateService(serviceName) {
    let invalidated = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.serviceName === serviceName) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    logger.info('Service cache invalidated', { serviceName, invalidated });

    return { invalidated };
  }

  /**
   * Invalidate cache for a specific endpoint
   */
  invalidateEndpoint(serviceName, endpoint) {
    let invalidated = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.serviceName === serviceName && cached.endpoint === endpoint) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    logger.info('Endpoint cache invalidated', { serviceName, endpoint, invalidated });

    return { invalidated };
  }

  /**
   * Clear all cache
   */
  clearAll() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.evictions += size;

    logger.info('All cache cleared', { cleared: size });

    return { cleared: size };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      size: this.cache.size,
      entries: Array.from(this.cache.values()).map((entry) => ({
        serviceName: entry.serviceName,
        endpoint: entry.endpoint,
        method: entry.method,
        hits: entry.hits,
        age: Date.now() - entry.createdAt,
        ttl: entry.expiresAt - Date.now(),
      })),
    };
  }

  /**
   * Get service-specific cache stats
   */
  getServiceStats(serviceName) {
    const entries = [];

    for (const [key, cached] of this.cache.entries()) {
      if (cached.serviceName === serviceName) {
        entries.push({
          endpoint: cached.endpoint,
          method: cached.method,
          hits: cached.hits,
          age: Date.now() - cached.createdAt,
          ttl: cached.expiresAt - Date.now(),
        });
      }
    }

    return {
      serviceName,
      totalEntries: entries.length,
      entries,
    };
  }

  /**
   * Start cleanup task to remove expired entries
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, cached] of this.cache.entries()) {
        if (now >= cached.expiresAt) {
          this.cache.delete(key);
          cleaned++;
          this.stats.evictions++;
        }
      }

      if (cleaned > 0) {
        logger.debug('Cache entries cleaned up', { cleaned });
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

  /**
   * Get cache statistics for a service
   */
  getServiceStats(serviceName) {
    let hits = 0;
    let misses = 0;
    let entries = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(serviceName + ':')) {
        entries++;
        hits += entry.hits || 0;
      }
    }

    misses = this.stats.misses - hits;

    return {
      totalEntries: entries,
      totalHits: hits,
      totalMisses: misses,
      hitRate: entries > 0 ? (hits / (hits + misses)) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Record a cache hit
   */
  recordHit(cacheKey) {
    const entry = this.cache.get(cacheKey);
    if (entry) {
      entry.hits = (entry.hits || 0) + 1;
      this.stats.hits++;
    }
  }

  /**
   * Set cache entry with TTL
   */
  set(cacheKey, data, ttl = 300) {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry = {
      data,
      expiresAt: Date.now() + (ttl * 1000),
      hits: 0,
      createdAt: Date.now(),
      size: this.estimateSize(data),
    };

    this.cache.set(cacheKey, entry);
    this.stats.sets++;

    return entry;
  }

  /**
   * Get cache entry
   */
  get(cacheKey) {
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    return entry;
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size || 0;
    }
    return totalSize;
  }

  /**
   * Estimate data size
   */
  estimateSize(data) {
    return JSON.stringify(data).length * 2; // Rough estimate in bytes
  }

  /**
   * Get top cached endpoints by hits
   */
  getTopEndpoints(limit = 10) {
    const entries = Array.from(this.cache.values())
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);

    return entries.map((entry) => ({
      serviceName: entry.serviceName,
      endpoint: entry.endpoint,
      method: entry.method,
      hits: entry.hits,
      age: Date.now() - entry.createdAt,
    }));
  }
}

export default new ResponseCacheService();

