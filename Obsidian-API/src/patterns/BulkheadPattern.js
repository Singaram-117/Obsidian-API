import logger from '../utils/logger.js';

/**
 * Bulkhead Pattern Implementation
 * Isolates resources to prevent cascading failures
 * 
 * Bulkheads partition resources (threads, connections, memory) so that
 * if one partition fails or becomes overloaded, it doesn't affect others.
 * 
 * Based on: https://www.geeksforgeeks.org/system-design/microservices-resilience-patterns/
 */
class BulkheadPattern {
  constructor() {
    this.bulkheads = new Map();
  }

  /**
   * Create a bulkhead with resource limits
   */
  createBulkhead(name, config = {}) {
    const bulkhead = {
      name,
      maxConcurrent: config.maxConcurrent || 10,
      maxQueue: config.maxQueue || 100,
      timeout: config.timeout || 30000,
      currentExecuting: 0,
      queue: [],
      stats: {
        executed: 0,
        rejected: 0,
        timedOut: 0,
        queued: 0,
      },
    };

    this.bulkheads.set(name, bulkhead);
    logger.info(`Bulkhead created: ${name}`, {
      maxConcurrent: bulkhead.maxConcurrent,
      maxQueue: bulkhead.maxQueue,
    });

    return bulkhead;
  }

  /**
   * Execute a function within bulkhead constraints
   */
  async execute(bulkheadName, fn) {
    const bulkhead = this.bulkheads.get(bulkheadName);

    if (!bulkhead) {
      throw new Error(`Bulkhead ${bulkheadName} not found`);
    }

    // Check if we can execute immediately
    if (bulkhead.currentExecuting < bulkhead.maxConcurrent) {
      return this._executeImmediately(bulkhead, fn);
    }

    // Check if we can queue
    if (bulkhead.queue.length < bulkhead.maxQueue) {
      return this._executeQueued(bulkhead, fn);
    }

    // Reject if queue is full
    bulkhead.stats.rejected++;
    logger.warn(`Bulkhead ${bulkheadName} rejected request`, {
      currentExecuting: bulkhead.currentExecuting,
      queueLength: bulkhead.queue.length,
    });

    throw new Error(
      `Bulkhead ${bulkheadName} is full. Current: ${bulkhead.currentExecuting}, Queue: ${bulkhead.queue.length}`
    );
  }

  /**
   * Execute immediately (under concurrent limit)
   */
  async _executeImmediately(bulkhead, fn) {
    bulkhead.currentExecuting++;
    bulkhead.stats.executed++;

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Bulkhead timeout')), bulkhead.timeout)
      );

      const result = await Promise.race([fn(), timeoutPromise]);

      return result;
    } catch (error) {
      if (error.message === 'Bulkhead timeout') {
        bulkhead.stats.timedOut++;
      }
      throw error;
    } finally {
      bulkhead.currentExecuting--;
      this._processQueue(bulkhead);
    }
  }

  /**
   * Execute from queue
   */
  _executeQueued(bulkhead, fn) {
    bulkhead.stats.queued++;

    return new Promise((resolve, reject) => {
      bulkhead.queue.push({ fn, resolve, reject });
    });
  }

  /**
   * Process queued requests
   */
  async _processQueue(bulkhead) {
    if (
      bulkhead.queue.length > 0 &&
      bulkhead.currentExecuting < bulkhead.maxConcurrent
    ) {
      const { fn, resolve, reject } = bulkhead.queue.shift();

      this._executeImmediately(bulkhead, fn)
        .then(resolve)
        .catch(reject);
    }
  }

  /**
   * Get bulkhead statistics
   */
  getStats(bulkheadName) {
    const bulkhead = this.bulkheads.get(bulkheadName);

    if (!bulkhead) {
      return null;
    }

    return {
      name: bulkhead.name,
      currentExecuting: bulkhead.currentExecuting,
      queueLength: bulkhead.queue.length,
      maxConcurrent: bulkhead.maxConcurrent,
      maxQueue: bulkhead.maxQueue,
      stats: bulkhead.stats,
      utilization: (bulkhead.currentExecuting / bulkhead.maxConcurrent) * 100,
    };
  }

  /**
   * Get all bulkheads statistics
   */
  getAllStats() {
    const stats = [];

    for (const [name] of this.bulkheads) {
      stats.push(this.getStats(name));
    }

    return stats;
  }
}

// Export singleton instance
const bulkheadPattern = new BulkheadPattern();
export default bulkheadPattern;

