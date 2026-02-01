import Service from '../models/Service.js';
import circuitBreakerService from './circuitBreakerService.js';
import { eventEmitter } from './eventService.js';
import logger from '../utils/logger.js';

export const normalizeHealthEndpoint = (endpoint = '/health') => {
  const defaultEndpoint = '/health';

  if (!endpoint) {
    return defaultEndpoint;
  }

  const trimmed = String(endpoint).trim();

  if (!trimmed) {
    return defaultEndpoint;
  }

  try {
    const parsedUrl = new URL(trimmed);
    const normalizedPath = `${parsedUrl.pathname}${parsedUrl.search || ''}${parsedUrl.hash || ''}`;
    return normalizedPath || defaultEndpoint;
  } catch {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
};

/**
 * Health Check Service
 * Monitors service health and updates service status
 */
class HealthCheckService {
  constructor() {
    this.healthCheckIntervals = new Map();
    this.isRunning = false;
  }

  /**
   * Start health checks for all registered services
   */
  async startHealthChecks() {
    if (this.isRunning) {
      logger.warn('Health checks already running');
      return;
    }

    try {
      const services = await Service.find();
      
      for (const service of services) {
        this.startServiceHealthCheck(service);
      }
      
      this.isRunning = true;
      logger.info(`Health checks started for ${services.length} services`);
    } catch (error) {
      logger.error('Failed to start health checks', {
        error: error.message,
      });
    }
  }

  /**
   * Start health check for a specific service
   */
  startServiceHealthCheck(service) {
    // Clear existing interval if any
    if (this.healthCheckIntervals.has(service.name)) {
      clearInterval(this.healthCheckIntervals.get(service.name));
    }

    // Perform initial health check
    this.performHealthCheck(service);

    // Schedule recurring health checks
    const interval = setInterval(() => {
      this.performHealthCheck(service);
    }, service.healthCheck.interval);

    this.healthCheckIntervals.set(service.name, interval);
    
    logger.debug(`Health check scheduled for ${service.name}`, {
      serviceName: service.name,
      interval: service.healthCheck.interval,
    });
  }

  /**
   * Perform a health check for a service
   */
  async performHealthCheck(service) {
    try {
      const startTime = Date.now();
      
      // Use circuit breaker to call health endpoint
      const result = await circuitBreakerService.execute(
        service.name,
        service.url,
        service.healthCheck.endpoint,
        { timeout: service.healthCheck.timeout }
      );

      console.log(result)
      
      const responseTime = Date.now() - startTime;
      const isHealthy = result.success && result.status >= 200 && result.status < 300;
      
      // Update service status
      const previousStatus = service.status;
      const newStatus = isHealthy ? 'healthy' : 'degraded';
      
      // Calculate metrics updates
      const metricsUpdate = {
        $inc: { 'metrics.totalRequests': 1 },
        $set: {
          'metrics.lastRequestTime': new Date(),
        }
      };

      if (isHealthy) {
        metricsUpdate.$inc['metrics.successfulRequests'] = 1;
      } else {
        metricsUpdate.$inc['metrics.failedRequests'] = 1;
      }

      // Update average response time
      const currentAvg = service.metrics?.averageResponseTime || 0;
      const totalRequests = (service.metrics?.totalRequests || 0) + 1;
      const newAvg = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
      metricsUpdate.$set['metrics.averageResponseTime'] = Math.round(newAvg);
      
      console.log(`Service ${service.name}: Response time ${responseTime}ms, New avg: ${Math.round(newAvg)}ms`);

      await Service.findOneAndUpdate(
        { name: service.name },
        {
          status: newStatus,
          'healthCheck.lastCheck': new Date(),
          ...metricsUpdate,
        }
      );
      
      // Emit event if status changed
      if (previousStatus !== newStatus) {
        if (newStatus === 'healthy') {
          eventEmitter.emit('service:up', {
            serviceName: service.name,
            responseTime,
          });
        } else {
          eventEmitter.emit('service:degraded', {
            serviceName: service.name,
            responseTime,
          });
        }
      }
      
      logger.debug(`Health check completed for ${service.name}`, {
        serviceName: service.name,
        status: newStatus,
        responseTime,
      });
    } catch (error) {
      // Service is down
      logger.error(`Health check failed for ${service.name}`, {
        serviceName: service.name,
        error: error.message,
      });
      
      const previousStatus = service.status;
      
      await Service.findOneAndUpdate(
        { name: service.name },
        {
          status: 'down',
          'healthCheck.lastCheck': new Date(),
        }
      );
      
      if (previousStatus !== 'down') {
        eventEmitter.emit('service:down', {
          serviceName: service.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Stop health check for a specific service
   */
  stopServiceHealthCheck(serviceName) {
    if (this.healthCheckIntervals.has(serviceName)) {
      clearInterval(this.healthCheckIntervals.get(serviceName));
      this.healthCheckIntervals.delete(serviceName);
      
      logger.info(`Health check stopped for ${serviceName}`);
    }
  }

  /**
   * Stop all health checks
   */
  stopAllHealthChecks() {
    for (const [serviceName, interval] of this.healthCheckIntervals) {
      clearInterval(interval);
      logger.debug(`Health check stopped for ${serviceName}`);
    }
    
    this.healthCheckIntervals.clear();
    this.isRunning = false;
    
    logger.info('All health checks stopped');
  }

  /**
   * Register a new service and start health checks
   */
  async registerService(serviceData) {
    try {
      // Check if service already exists
      let service = await Service.findOne({ name: serviceData.name });
      
      if (service) {
        // Update existing service
        service = await Service.findOneAndUpdate(
          { name: serviceData.name },
          serviceData,
          { new: true }
        );
        
        logger.info(`Service updated: ${serviceData.name}`);
      } else {
        // Create new service
        service = new Service(serviceData);
        await service.save();
        
        logger.info(`Service registered: ${serviceData.name}`);
      }
      
      // Start health checks for this service
      this.startServiceHealthCheck(service);
      
      return service;
    } catch (error) {
      logger.error('Failed to register service', {
        serviceName: serviceData.name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Unregister a service
   */
  async unregisterService(serviceName) {
    try {
      // Stop health checks
      this.stopServiceHealthCheck(serviceName);
      
      // Remove from database
      await Service.findOneAndDelete({ name: serviceName });
      
      logger.info(`Service unregistered: ${serviceName}`);
    } catch (error) {
      logger.error('Failed to unregister service', {
        serviceName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(serviceName) {
    try {
      const service = await Service.findOne({ name: serviceName });
      
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }
      
      const circuitStats = circuitBreakerService.getStats(serviceName);
      
      return {
        name: service.name,
        url: service.url,
        status: service.status,
        circuitStatus: circuitStats?.status || 'unknown',
        metrics: service.metrics,
        lastHealthCheck: service.healthCheck.lastCheck,
        circuitStats: circuitStats?.stats,
      };
    } catch (error) {
      logger.error('Failed to get service health', {
        serviceName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all services health status
   */
  async getAllServicesHealth() {
    try {
      const services = await Service.find();
      const healthData = [];
      
      for (const service of services) {
        const health = await this.getServiceHealth(service.name);
        healthData.push(health);
      }
      
      return healthData;
    } catch (error) {
      logger.error('Failed to get all services health', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
const healthCheckService = new HealthCheckService();
export default healthCheckService;

