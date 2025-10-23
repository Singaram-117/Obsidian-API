import CircuitBreaker from 'opossum';
import axios from 'axios';
import config from '../config/config.js';
import logger, { logEvent } from '../utils/logger.js';
import { eventEmitter } from './eventService.js';

/**
 * Circuit Breaker Service
 * Implements Circuit Breaker Pattern using Opossum
 * Prevents cascading failures by stopping requests to failing services
 */
class CircuitBreakerService {
  constructor() {
    this.breakers = new Map();
    this.options = {
      timeout: config.get('circuitBreaker.timeout'),
      errorThresholdPercentage: config.get('circuitBreaker.errorThresholdPercentage'),
      resetTimeout: config.get('circuitBreaker.resetTimeout'),
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      name: 'defaultBreaker',
    };
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName, serviceUrl) {
    if (!this.breakers.has(serviceName)) {
      const breaker = this.createBreaker(serviceName, serviceUrl);
      this.breakers.set(serviceName, breaker);
      logger.info(`Circuit breaker created for service: ${serviceName}`);
    }
    return this.breakers.get(serviceName);
  }

  /**
   * Create a new circuit breaker with event handlers
   */
  createBreaker(serviceName, serviceUrl) {
    const breakerFunction = async (endpoint, options = {}) => {
      const startTime = Date.now();
      
      try {
        const response = await axios({
          method: options.method || 'GET',
          url: `${serviceUrl}${endpoint}`,
          data: options.data,
          headers: options.headers,
          timeout: this.options.timeout,
        });
        
        const responseTime = Date.now() - startTime;
        
        // Emit success event
        eventEmitter.emit('request:success', {
          serviceName,
          endpoint,
          responseTime,
          statusCode: response.status,
        });
        
        return {
          success: true,
          data: response.data,
          status: response.status,
          responseTime,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Emit failure event
        eventEmitter.emit('request:failure', {
          serviceName,
          endpoint,
          responseTime,
          error: error.message,
        });
        
        throw error;
      }
    };

    const breaker = new CircuitBreaker(breakerFunction, {
      ...this.options,
      name: serviceName,
    });

    // Circuit Breaker Event Handlers
    breaker.on('open', () => {
      logEvent('error', `Circuit breaker OPENED for ${serviceName}`, {
        serviceName,
        event: 'circuit_opened',
      });
      
      eventEmitter.emit('circuit:open', {
        serviceName,
        timestamp: new Date(),
      });
    });

    breaker.on('halfOpen', () => {
      logEvent('warning', `Circuit breaker HALF-OPEN for ${serviceName}`, {
        serviceName,
        event: 'circuit_half_open',
      });
      
      eventEmitter.emit('circuit:halfOpen', {
        serviceName,
        timestamp: new Date(),
      });
    });

    breaker.on('close', () => {
      logEvent('info', `Circuit breaker CLOSED for ${serviceName}`, {
        serviceName,
        event: 'circuit_closed',
      });
      
      eventEmitter.emit('circuit:close', {
        serviceName,
        timestamp: new Date(),
      });
    });

    breaker.on('success', (result) => {
      logger.debug(`Request succeeded for ${serviceName}`, {
        serviceName,
        responseTime: result.responseTime,
      });
    });

    breaker.on('failure', (error) => {
      logEvent('error', `Request failed for ${serviceName}`, {
        serviceName,
        error: error.message,
        event: 'request_failed',
      });
    });

    breaker.on('timeout', () => {
      logEvent('warning', `Request timeout for ${serviceName}`, {
        serviceName,
        event: 'request_timeout',
      });
    });

    breaker.on('reject', () => {
      logEvent('warning', `Request rejected for ${serviceName} (circuit open)`, {
        serviceName,
        event: 'request_rejected',
      });
    });

    return breaker;
  }

  /**
   * Execute a request through the circuit breaker
   */
  async execute(serviceName, serviceUrl, endpoint, options = {}) {
    const breaker = this.getBreaker(serviceName, serviceUrl);
    
    try {
      const result = await breaker.fire(endpoint, options);
      return result;
    } catch (error) {
      logger.error(`Circuit breaker execution failed for ${serviceName}`, {
        serviceName,
        endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(serviceName) {
    const breaker = this.breakers.get(serviceName);
    
    if (!breaker) {
      return null;
    }

    const stats = breaker.stats;
    
    return {
      serviceName,
      status: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: {
        fires: stats.fires,
        successes: stats.successes,
        failures: stats.failures,
        rejects: stats.rejects,
        timeouts: stats.timeouts,
        fallbacks: stats.fallbacks,
        semaphoreRejections: stats.semaphoreRejections,
        percentiles: stats.percentiles,
        latencyMean: stats.latencyMean,
      },
    };
  }

  /**
   * Get all circuit breakers status
   */
  getAllStats() {
    const allStats = [];
    
    for (const [serviceName, breaker] of this.breakers) {
      allStats.push(this.getStats(serviceName));
    }
    
    return allStats;
  }

  /**
   * Manually open a circuit breaker (for testing/chaos engineering)
   */
  openCircuit(serviceName) {
    const breaker = this.breakers.get(serviceName);
    
    if (breaker) {
      breaker.open();
      logger.info(`Circuit breaker manually opened for ${serviceName}`);
      return true;
    }
    
    return false;
  }

  /**
   * Manually close a circuit breaker
   */
  closeCircuit(serviceName) {
    const breaker = this.breakers.get(serviceName);
    
    if (breaker) {
      breaker.close();
      logger.info(`Circuit breaker manually closed for ${serviceName}`);
      return true;
    }
    
    return false;
  }
}

// Export singleton instance
const circuitBreakerService = new CircuitBreakerService();
export default circuitBreakerService;

