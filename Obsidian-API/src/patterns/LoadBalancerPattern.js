import logger from '../utils/logger.js';

/**
 * Load Balancer Pattern Implementation
 * Distributes requests across multiple service instances
 * 
 * Strategies:
 * - Round Robin
 * - Least Connections
 * - Random
 * - Weighted Round Robin
 * - Response Time Based
 * 
 * Based on: https://www.geeksforgeeks.org/system-design/microservices-resilience-patterns/
 */

/**
 * Service Instance
 */
class ServiceInstance {
  constructor(url, weight = 1) {
    this.url = url;
    this.weight = weight;
    this.activeConnections = 0;
    this.totalRequests = 0;
    this.failedRequests = 0;
    this.totalResponseTime = 0;
    this.healthy = true;
    this.lastHealthCheck = new Date();
  }

  incrementConnections() {
    this.activeConnections++;
    this.totalRequests++;
  }

  decrementConnections() {
    this.activeConnections--;
  }

  recordResponseTime(time) {
    this.totalResponseTime += time;
  }

  recordFailure() {
    this.failedRequests++;
  }

  getAverageResponseTime() {
    return this.totalRequests > 0
      ? this.totalResponseTime / this.totalRequests
      : 0;
  }

  getSuccessRate() {
    return this.totalRequests > 0
      ? ((this.totalRequests - this.failedRequests) / this.totalRequests) * 100
      : 100;
  }

  markUnhealthy() {
    this.healthy = false;
  }

  markHealthy() {
    this.healthy = true;
  }
}

/**
 * Load Balancer
 */
class LoadBalancerPattern {
  constructor() {
    this.services = new Map(); // serviceName -> instances[]
    this.currentIndex = new Map(); // serviceName -> current index for round robin
    this.strategy = 'round-robin'; // Default strategy
  }

  /**
   * Register service instances
   */
  registerService(serviceName, instances) {
    const serviceInstances = instances.map(
      (inst) => new ServiceInstance(inst.url, inst.weight || 1)
    );

    this.services.set(serviceName, serviceInstances);
    this.currentIndex.set(serviceName, 0);

    logger.info(`Load balancer registered service: ${serviceName}`, {
      instanceCount: instances.length,
    });
  }

  /**
   * Set load balancing strategy
   */
  setStrategy(strategy) {
    const validStrategies = [
      'round-robin',
      'least-connections',
      'random',
      'weighted-round-robin',
      'response-time',
    ];

    if (!validStrategies.includes(strategy)) {
      throw new Error(`Invalid strategy: ${strategy}`);
    }

    this.strategy = strategy;
    logger.info(`Load balancer strategy set to: ${strategy}`);
  }

  /**
   * Get next instance based on strategy
   */
  getNextInstance(serviceName) {
    const instances = this.services.get(serviceName);

    if (!instances || instances.length === 0) {
      throw new Error(`No instances found for service: ${serviceName}`);
    }

    // Filter healthy instances
    const healthyInstances = instances.filter((inst) => inst.healthy);

    if (healthyInstances.length === 0) {
      logger.warn(`No healthy instances for service: ${serviceName}`);
      throw new Error(`No healthy instances available for ${serviceName}`);
    }

    // Select instance based on strategy
    let selectedInstance;

    switch (this.strategy) {
      case 'round-robin':
        selectedInstance = this._roundRobin(serviceName, healthyInstances);
        break;

      case 'least-connections':
        selectedInstance = this._leastConnections(healthyInstances);
        break;

      case 'random':
        selectedInstance = this._random(healthyInstances);
        break;

      case 'weighted-round-robin':
        selectedInstance = this._weightedRoundRobin(serviceName, healthyInstances);
        break;

      case 'response-time':
        selectedInstance = this._responseTimeBased(healthyInstances);
        break;

      default:
        selectedInstance = this._roundRobin(serviceName, healthyInstances);
    }

    selectedInstance.incrementConnections();

    return selectedInstance;
  }

  /**
   * Round Robin Strategy
   */
  _roundRobin(serviceName, instances) {
    const currentIdx = this.currentIndex.get(serviceName);
    const instance = instances[currentIdx % instances.length];

    // Update index
    this.currentIndex.set(serviceName, currentIdx + 1);

    return instance;
  }

  /**
   * Least Connections Strategy
   */
  _leastConnections(instances) {
    return instances.reduce((min, inst) =>
      inst.activeConnections < min.activeConnections ? inst : min
    );
  }

  /**
   * Random Strategy
   */
  _random(instances) {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  /**
   * Weighted Round Robin Strategy
   */
  _weightedRoundRobin(serviceName, instances) {
    // Build weighted list
    const weightedList = [];

    for (const inst of instances) {
      for (let i = 0; i < inst.weight; i++) {
        weightedList.push(inst);
      }
    }

    const currentIdx = this.currentIndex.get(serviceName);
    const instance = weightedList[currentIdx % weightedList.length];

    this.currentIndex.set(serviceName, currentIdx + 1);

    return instance;
  }

  /**
   * Response Time Based Strategy
   */
  _responseTimeBased(instances) {
    // Select instance with lowest average response time
    return instances.reduce((min, inst) => {
      const minAvg = min.getAverageResponseTime();
      const instAvg = inst.getAverageResponseTime();

      // If no data, prefer the instance
      if (minAvg === 0) return inst;
      if (instAvg === 0) return min;

      return instAvg < minAvg ? inst : min;
    });
  }

  /**
   * Release instance (decrement connections)
   */
  releaseInstance(serviceName, instanceUrl) {
    const instances = this.services.get(serviceName);

    if (instances) {
      const instance = instances.find((inst) => inst.url === instanceUrl);

      if (instance) {
        instance.decrementConnections();
      }
    }
  }

  /**
   * Record request metrics
   */
  recordMetrics(serviceName, instanceUrl, responseTime, success) {
    const instances = this.services.get(serviceName);

    if (instances) {
      const instance = instances.find((inst) => inst.url === instanceUrl);

      if (instance) {
        instance.recordResponseTime(responseTime);

        if (!success) {
          instance.recordFailure();
        }
      }
    }
  }

  /**
   * Mark instance as unhealthy
   */
  markInstanceUnhealthy(serviceName, instanceUrl) {
    const instances = this.services.get(serviceName);

    if (instances) {
      const instance = instances.find((inst) => inst.url === instanceUrl);

      if (instance) {
        instance.markUnhealthy();
        logger.warn(`Instance marked unhealthy: ${instanceUrl}`);
      }
    }
  }

  /**
   * Mark instance as healthy
   */
  markInstanceHealthy(serviceName, instanceUrl) {
    const instances = this.services.get(serviceName);

    if (instances) {
      const instance = instances.find((inst) => inst.url === instanceUrl);

      if (instance) {
        instance.markHealthy();
        logger.info(`Instance marked healthy: ${instanceUrl}`);
      }
    }
  }

  /**
   * Get load balancer statistics
   */
  getStats(serviceName) {
    const instances = this.services.get(serviceName);

    if (!instances) {
      return null;
    }

    return {
      serviceName,
      strategy: this.strategy,
      totalInstances: instances.length,
      healthyInstances: instances.filter((inst) => inst.healthy).length,
      instances: instances.map((inst) => ({
        url: inst.url,
        healthy: inst.healthy,
        activeConnections: inst.activeConnections,
        totalRequests: inst.totalRequests,
        failedRequests: inst.failedRequests,
        avgResponseTime: inst.getAverageResponseTime().toFixed(2),
        successRate: inst.getSuccessRate().toFixed(2) + '%',
      })),
    };
  }

  /**
   * Get all services statistics
   */
  getAllStats() {
    const stats = [];

    for (const [serviceName] of this.services) {
      stats.push(this.getStats(serviceName));
    }

    return stats;
  }
}

// Export singleton instance
const loadBalancerPattern = new LoadBalancerPattern();
export default loadBalancerPattern;

