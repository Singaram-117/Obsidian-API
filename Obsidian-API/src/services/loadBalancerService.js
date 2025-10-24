import ServiceInstance from '../models/ServiceInstance.js';
import logger from '../utils/logger.js';

/**
 * Load Balancer Service
 * Implements multiple load balancing strategies
 */
class LoadBalancerService {
  constructor() {
    this.strategies = {
      'round-robin': this.roundRobin.bind(this),
      'least-connections': this.leastConnections.bind(this),
      'weighted-round-robin': this.weightedRoundRobin.bind(this),
      'weighted-response-time': this.weightedResponseTime.bind(this),
      random: this.random.bind(this),
      'ip-hash': this.ipHash.bind(this),
    };
    this.roundRobinCounters = new Map();
  }

  /**
   * Get a service instance using the specified strategy
   */
  async getInstance(serviceName, strategy = 'round-robin', metadata = {}) {
    const instances = await this.getHealthyInstances(serviceName);

    if (instances.length === 0) {
      throw new Error(`No healthy instances available for service: ${serviceName}`);
    }

    const strategyFn = this.strategies[strategy] || this.strategies['round-robin'];
    const selectedInstance = await strategyFn(instances, metadata);

    logger.debug(`Selected instance for ${serviceName}`, {
      strategy,
      instanceId: selectedInstance.instanceId,
      url: selectedInstance.url,
    });

    return selectedInstance;
  }

  /**
   * Get all healthy instances for a service
   */
  async getHealthyInstances(serviceName) {
    return await ServiceInstance.find({
      serviceName,
      status: { $in: ['healthy', 'draining'] },
    }).sort({ weight: -1, 'metrics.activeConnections': 1 });
  }

  /**
   * Round Robin Strategy
   */
  async roundRobin(instances) {
    if (!this.roundRobinCounters.has(instances[0].serviceName)) {
      this.roundRobinCounters.set(instances[0].serviceName, 0);
    }

    const counter = this.roundRobinCounters.get(instances[0].serviceName);
    const instance = instances[counter % instances.length];

    this.roundRobinCounters.set(
      instances[0].serviceName,
      (counter + 1) % instances.length
    );

    return instance;
  }

  /**
   * Least Connections Strategy
   */
  async leastConnections(instances) {
    return instances.reduce((min, instance) =>
      instance.metrics.activeConnections < min.metrics.activeConnections
        ? instance
        : min
    );
  }

  /**
   * Weighted Round Robin Strategy
   */
  async weightedRoundRobin(instances) {
    const totalWeight = instances.reduce((sum, inst) => sum + inst.weight, 0);
    const random = Math.random() * totalWeight;

    let weightSum = 0;
    for (const instance of instances) {
      weightSum += instance.weight;
      if (random <= weightSum) {
        return instance;
      }
    }

    return instances[0];
  }

  /**
   * Weighted Response Time Strategy
   */
  async weightedResponseTime(instances) {
    // Calculate weights inversely proportional to response time
    const weights = instances.map((inst) => {
      const responseTime = inst.metrics.avgResponseTime || 100;
      return { instance: inst, weight: 1 / responseTime };
    });

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    const random = Math.random() * totalWeight;

    let weightSum = 0;
    for (const { instance, weight } of weights) {
      weightSum += weight;
      if (random <= weightSum) {
        return instance;
      }
    }

    return instances[0];
  }

  /**
   * Random Strategy
   */
  async random(instances) {
    return instances[Math.floor(Math.random() * instances.length)];
  }

  /**
   * IP Hash Strategy
   */
  async ipHash(instances, metadata = {}) {
    const clientIp = metadata.clientIp || '0.0.0.0';
    const hash = this.hashString(clientIp);
    return instances[hash % instances.length];
  }

  /**
   * Hash a string to a number
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Register a new service instance
   */
  async registerInstance(data) {
    const {
      serviceName,
      url,
      weight = 1,
      metadata = {},
      trafficPercentage = 100,
      isCanary = false,
    } = data;

    const instanceId = `${serviceName}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const instance = new ServiceInstance({
      serviceName,
      instanceId,
      url,
      weight,
      metadata,
      trafficPercentage,
      isCanary,
      status: 'healthy',
    });

    await instance.save();

    logger.info('Service instance registered', {
      serviceName,
      instanceId,
      url,
    });

    return instance;
  }

  /**
   * Deregister a service instance
   */
  async deregisterInstance(instanceId) {
    const instance = await ServiceInstance.findOneAndDelete({ instanceId });

    if (instance) {
      logger.info('Service instance deregistered', {
        serviceName: instance.serviceName,
        instanceId,
      });
    }

    return instance;
  }

  /**
   * Update instance health
   */
  async updateInstanceHealth(instanceId, isHealthy) {
    const instance = await ServiceInstance.findOne({ instanceId });

    if (instance) {
      await instance.updateHealth(isHealthy);
      logger.debug('Instance health updated', {
        instanceId,
        status: instance.status,
        consecutiveFailures: instance.health.consecutiveFailures,
      });
    }

    return instance;
  }

  /**
   * Drain an instance (stop sending new traffic)
   */
  async drainInstance(instanceId) {
    const instance = await ServiceInstance.findOneAndUpdate(
      { instanceId },
      { status: 'draining' },
      { new: true }
    );

    logger.info('Instance set to draining', { instanceId });
    return instance;
  }

  /**
   * Enable an instance
   */
  async enableInstance(instanceId) {
    const instance = await ServiceInstance.findOneAndUpdate(
      { instanceId },
      { status: 'healthy' },
      { new: true }
    );

    logger.info('Instance enabled', { instanceId });
    return instance;
  }

  /**
   * Disable an instance
   */
  async disableInstance(instanceId) {
    const instance = await ServiceInstance.findOneAndUpdate(
      { instanceId },
      { status: 'disabled' },
      { new: true }
    );

    logger.info('Instance disabled', { instanceId });
    return instance;
  }

  /**
   * Get all instances for a service
   */
  async getAllInstances(serviceName) {
    return await ServiceInstance.find({ serviceName }).sort({ createdAt: -1 });
  }

  /**
   * Get instance statistics
   */
  async getInstanceStats(serviceName) {
    const instances = await ServiceInstance.find({ serviceName });

    const stats = {
      total: instances.length,
      healthy: 0,
      unhealthy: 0,
      draining: 0,
      disabled: 0,
      totalConnections: 0,
      totalRequests: 0,
      avgResponseTime: 0,
    };

    instances.forEach((inst) => {
      stats[inst.status]++;
      stats.totalConnections += inst.metrics.activeConnections;
      stats.totalRequests += inst.metrics.totalRequests;
    });

    if (instances.length > 0) {
      stats.avgResponseTime =
        instances.reduce((sum, inst) => sum + (inst.metrics.avgResponseTime || 0), 0) /
        instances.length;
    }

    return stats;
  }
}

export default new LoadBalancerService();

