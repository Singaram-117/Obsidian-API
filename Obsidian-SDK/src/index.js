import axios from 'axios';
import logger from './logger.js';

/**
 * Obsidian SDK - Observer Pattern Integration
 * Provides seamless integration with Obsidian MROP
 */
class ObsidianSDK {
  constructor(config = {}) {
    this.config = {
      obsidianUrl: config.obsidianUrl || 'http://localhost:5000',
      serviceName: config.serviceName || 'unknown-service',
      instanceId: config.instanceId || this.generateInstanceId(),
      heartbeatInterval: config.heartbeatInterval || 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.obsidianUrl,
      timeout: 5000,
      headers: {
        'User-Agent': `Obsidian-SDK/${this.config.serviceName}/${this.config.instanceId}`,
      },
    });

    this.heartbeatInterval = null;
    this.isRegistered = false;
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
    };

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Generate unique instance ID
   */
  generateInstanceId() {
    return `${this.config.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register service with Obsidian - Observer Pattern
   */
  async register() {
    try {
      const registrationData = {
        name: this.config.serviceName,
        url: this.config.serviceUrl || `http://localhost:${this.config.port || 3000}`,
        description: this.config.description || 'Microservice registered via SDK',
        instanceId: this.config.instanceId,
      };

      const response = await this.client.post('/api/services', registrationData);

      this.isRegistered = true;
      logger.info('Service registered with Obsidian', {
        serviceName: this.config.serviceName,
        instanceId: this.config.instanceId,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to register with Obsidian', {
        error: error.message,
        serviceName: this.config.serviceName,
      });
      throw error;
    }
  }

  /**
   * Start heartbeat to keep service alive - Observer Pattern
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        logger.warn('Heartbeat failed', { error: error.message });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Send heartbeat to Obsidian
   */
  async sendHeartbeat() {
    if (!this.isRegistered) {
      return;
    }

    try {
      await this.client.post(`/api/services/${this.config.serviceName}/heartbeat`, {
        instanceId: this.config.instanceId,
        metrics: this.metrics,
        timestamp: new Date(),
      });

      logger.debug('Heartbeat sent', {
        serviceName: this.config.serviceName,
        instanceId: this.config.instanceId,
      });
    } catch (error) {
      logger.warn('Failed to send heartbeat', { error: error.message });
    }
  }

  /**
   * Record metrics - Observer Pattern
   */
  recordMetrics(responseTime, success = true) {
    this.metrics.requestCount++;

    if (!success) {
      this.metrics.errorCount++;
    }

    // Update rolling average response time
    const currentAvg = this.metrics.averageResponseTime || 0;
    const totalRequests = this.metrics.requestCount;
    this.metrics.averageResponseTime = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  /**
   * Create middleware for automatic request tracking
   */
  createTrackingMiddleware() {
    return async (req, res, next) => {
      const startTime = Date.now();

      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode >= 200 && res.statusCode < 400;

        // Record metrics
        this.recordMetrics(responseTime, success);

        // Send metrics to Obsidian
        this.sendMetrics(req, res, responseTime, success);

        // Call original end
        originalEnd.apply(res, args);
      }.bind(this);

      // Continue to next middleware/route handler
      next();
    };
  }

  /**
   * Send metrics to Obsidian
   */
  async sendMetrics(req, res, responseTime, success) {
    if (!this.isRegistered) {
      return;
    }

    try {
      await this.client.post(`/api/services/${this.config.serviceName}/metrics`, {
        instanceId: this.config.instanceId,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        success,
        timestamp: new Date(),
      });
    } catch (error) {
      // Don't throw error for metrics failures
      logger.debug('Failed to send metrics', { error: error.message });
    }
  }

  /**
   * Health check endpoint
   */
  createHealthEndpoint() {
    return (req, res) => {
      const health = {
        service: this.config.serviceName,
        instance: this.config.instanceId,
        status: 'healthy',
        metrics: this.metrics,
        timestamp: new Date(),
      };

      res.json(health);
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

/**
 * Factory function to create SDK instance
 */
function createAgent(config) {
  return new ObsidianSDK(config);
}

/**
 * Express middleware for easy integration
 */
function obsidianMiddleware(config) {
  const sdk = new ObsidianSDK(config);

  return {
    register: () => sdk.register(),
    tracking: sdk.createTrackingMiddleware(),
    health: sdk.createHealthEndpoint(),
    destroy: () => sdk.destroy(),
  };
}

// ES6 exports
export { ObsidianSDK, createAgent, obsidianMiddleware };
export default ObsidianSDK;