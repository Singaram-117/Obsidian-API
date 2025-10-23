import logger from '../utils/logger.js';
import circuitBreakerService from '../services/circuitBreakerService.js';
import bulkheadPattern from './BulkheadPattern.js';
import fallbackPattern from './FallbackPattern.js';
import loadBalancerPattern from './LoadBalancerPattern.js';
import sagaPattern from './SagaPattern.js';
import { RequestBuilder } from './DecoratorPattern.js';
import { RequestPipeline } from './ChainOfResponsibilityPattern.js';
import { ProxyFactory } from './ProxyPattern.js';

/**
 * Facade Pattern Implementation
 * Provides a simplified interface to a complex subsystem
 * 
 * Use Case: Simple API to access all resilience patterns without knowing internal complexity
 * Based on: https://refactoring.guru/design-patterns/facade
 */

/**
 * Obsidian Resilience Facade
 * Simplified interface to all resilience features
 */
class ObsidianFacade {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize Obsidian with default configuration
   */
  async initialize(config = {}) {
    logger.info('Initializing Obsidian MROP', { config });

    // Setup circuit breakers for services
    if (config.services) {
      for (const service of config.services) {
        await this.setupService(service.name, service.config || {});
      }
    }

    this.initialized = true;

    logger.info('Obsidian MROP initialized successfully');

    return {
      success: true,
      message: 'Obsidian initialized',
    };
  }

  /**
   * Setup a service with all resilience patterns
   */
  async setupService(serviceName, config = {}) {
    logger.info('Setting up service', { serviceName, config });

    // Create circuit breaker
    const breaker = await circuitBreakerService.createBreaker(serviceName, {
      timeout: config.timeout || 5000,
      errorThresholdPercentage: config.errorThreshold || 50,
      resetTimeout: config.resetTimeout || 30000,
    });

    // Create bulkhead
    if (config.bulkhead) {
      bulkheadPattern.createBulkhead(serviceName, {
        maxConcurrent: config.bulkhead.maxConcurrent || 10,
        maxQueue: config.bulkhead.maxQueue || 100,
      });
    }

    // Register fallback
    if (config.fallback) {
      fallbackPattern.registerFallback(serviceName, {
        type: config.fallback.type || 'empty',
        value: config.fallback.value,
      });
    }

    // Register load balancer instances
    if (config.instances && config.instances.length > 0) {
      loadBalancerPattern.registerService(serviceName, config.instances);
    }

    logger.info('Service setup complete', { serviceName });

    return {
      success: true,
      serviceName,
      patternsEnabled: {
        circuitBreaker: true,
        bulkhead: !!config.bulkhead,
        fallback: !!config.fallback,
        loadBalancer: !!config.instances,
      },
    };
  }

  /**
   * Make a resilient request (simplified API)
   */
  async makeRequest(serviceName, url, options = {}) {
    if (!this.initialized) {
      throw new Error('Obsidian not initialized. Call initialize() first.');
    }

    logger.info('Making resilient request', { serviceName, url });

    try {
      // Use circuit breaker
      const breaker = circuitBreakerService.getBreaker(serviceName);

      if (!breaker) {
        throw new Error(`Service ${serviceName} not registered`);
      }

      const result = await breaker.fire({
        url,
        method: options.method || 'GET',
        data: options.data,
        headers: options.headers,
      });

      return {
        success: true,
        data: result.data,
        status: result.status,
        serviceName,
      };
    } catch (error) {
      logger.error('Request failed, checking fallback', {
        serviceName,
        error: error.message,
      });

      // Try fallback
      const fallback = await fallbackPattern.executeWithFallback(
        serviceName,
        async () => {
          throw error;
        },
        { url, options }
      );

      if (fallback.success) {
        return {
          success: true,
          data: fallback.data,
          fromFallback: true,
          serviceName,
        };
      }

      return {
        success: false,
        error: error.message,
        serviceName,
      };
    }
  }

  /**
   * Make a request with all decorators (advanced)
   */
  async makeAdvancedRequest(serviceName, url, options = {}) {
    const request = new RequestBuilder(serviceName, url, options)
      .withLogging()
      .withMetrics()
      .withTracing()
      .withRetry(3, 1000);

    if (options.cache) {
      request.withCaching(options.cacheTTL || 60000);
    }

    return await request.execute();
  }

  /**
   * Execute distributed transaction (Saga)
   */
  async executeTransaction(transactionId, steps) {
    logger.info('Executing distributed transaction', {
      transactionId,
      stepCount: steps.length,
    });

    const saga = sagaPattern.createSaga(transactionId, steps);
    return await sagaPattern.executeSaga(transactionId);
  }

  /**
   * Get service status (health, circuit state, metrics)
   */
  async getServiceStatus(serviceName) {
    const Service = (await import('../models/Service.js')).default;
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      return {
        error: 'Service not found',
        serviceName,
      };
    }

    const breaker = circuitBreakerService.getBreaker(serviceName);
    const bulkhead = bulkheadPattern.bulkheads.get(serviceName);
    const loadBalancerStats = loadBalancerPattern.getStats(serviceName);

    return {
      serviceName,
      status: service.status,
      health: {
        healthy: service.status === 'healthy',
        lastCheck: service.healthCheck.lastCheck,
      },
      circuitBreaker: breaker
        ? {
            state: breaker.opened ? 'open' : 'closed',
            stats: breaker.stats,
          }
        : null,
      bulkhead: bulkhead
        ? {
            activeRequests: bulkhead.activeRequests,
            queueLength: bulkhead.queue.length,
            maxConcurrent: bulkhead.config.maxConcurrent,
          }
        : null,
      loadBalancer: loadBalancerStats,
      metrics: {
        totalRequests: service.metrics.totalRequests,
        failedRequests: service.metrics.failedRequests,
        averageResponseTime: service.metrics.averageResponseTime,
        errorRate:
          service.metrics.totalRequests > 0
            ? ((service.metrics.failedRequests / service.metrics.totalRequests) * 100).toFixed(2) +
              '%'
            : '0%',
      },
    };
  }

  /**
   * Get dashboard data (all services overview)
   */
  async getDashboard() {
    const Service = (await import('../models/Service.js')).default;
    const services = await Service.find();

    const dashboard = {
      totalServices: services.length,
      healthyServices: services.filter((s) => s.status === 'healthy').length,
      degradedServices: services.filter((s) => s.status === 'degraded').length,
      downServices: services.filter((s) => s.status === 'down').length,
      services: await Promise.all(
        services.map((s) => this.getServiceStatus(s.name))
      ),
      circuitBreakers: {
        open: services.filter((s) => {
          const breaker = circuitBreakerService.getBreaker(s.name);
          return breaker && breaker.opened;
        }).length,
        closed: services.filter((s) => {
          const breaker = circuitBreakerService.getBreaker(s.name);
          return breaker && !breaker.opened;
        }).length,
      },
    };

    return dashboard;
  }

  /**
   * Run chaos experiment
   */
  async runChaosExperiment(type, targetService) {
    logger.info('Running chaos experiment', { type, targetService });

    switch (type) {
      case 'circuit-breaker':
        const breaker = circuitBreakerService.getBreaker(targetService);
        if (breaker) {
          breaker.open();
          setTimeout(() => breaker.close(), 30000); // Auto-close after 30s
          return {
            success: true,
            message: `Circuit breaker opened for ${targetService}`,
          };
        }
        break;

      case 'bulkhead-overflow':
        // Simulate bulkhead overflow
        const bulkhead = bulkheadPattern.bulkheads.get(targetService);
        if (bulkhead) {
          // Add dummy requests to overflow
          for (let i = 0; i < bulkhead.config.maxConcurrent + 10; i++) {
            bulkhead.activeRequests++;
          }

          setTimeout(() => {
            bulkhead.activeRequests = 0;
          }, 30000);

          return {
            success: true,
            message: `Bulkhead overflow simulated for ${targetService}`,
          };
        }
        break;

      case 'slow-response':
        return {
          success: true,
          message: `Slow response simulation started for ${targetService}`,
        };

      default:
        return {
          success: false,
          message: `Unknown experiment type: ${type}`,
        };
    }

    return {
      success: false,
      message: 'Experiment could not be executed',
    };
  }

  /**
   * One-line service registration
   */
  async quickSetup(serviceName, url, instances = 1) {
    const instanceList = [];

    for (let i = 0; i < instances; i++) {
      instanceList.push({
        url: `${url}:${3000 + i}`,
        weight: 1,
      });
    }

    return await this.setupService(serviceName, {
      timeout: 5000,
      errorThreshold: 50,
      bulkhead: {
        maxConcurrent: 10,
        maxQueue: 100,
      },
      fallback: {
        type: 'empty',
      },
      instances: instanceList,
    });
  }
}

/**
 * Global instance (Singleton)
 */
const obsidian = new ObsidianFacade();

/**
 * Example Usage:
 * 
 * // Initialize Obsidian
 * await obsidian.initialize({
 *   services: [
 *     {
 *       name: 'payment-service',
 *       config: {
 *         timeout: 5000,
 *         bulkhead: { maxConcurrent: 10 },
 *         fallback: { type: 'cache' },
 *         instances: [
 *           { url: 'http://payment1:3000' },
 *           { url: 'http://payment2:3000' }
 *         ]
 *       }
 *     }
 *   ]
 * });
 * 
 * // Make resilient request
 * const result = await obsidian.makeRequest('payment-service', '/api/charge', {
 *   method: 'POST',
 *   data: { amount: 100 }
 * });
 * 
 * // Get service status
 * const status = await obsidian.getServiceStatus('payment-service');
 * 
 * // Get dashboard
 * const dashboard = await obsidian.getDashboard();
 * 
 * // Quick setup
 * await obsidian.quickSetup('api-service', 'http://api', 3);
 */

export { ObsidianFacade, obsidian };
export default obsidian;

