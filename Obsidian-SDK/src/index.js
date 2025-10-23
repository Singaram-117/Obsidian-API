import axios from 'axios';
import os from 'os';

/**
 * Obsidian Agent
 * Drop-in library for automatic service registration
 */
class ObsidianAgent {
  constructor(config = {}) {
    this.config = {
      obsidianUrl: config.obsidianUrl || process.env.OBSIDIAN_URL || 'http://localhost:5000',
      serviceName: config.serviceName || process.env.SERVICE_NAME || this.detectServiceName(),
      serviceUrl: config.serviceUrl || process.env.SERVICE_URL || this.detectServiceUrl(),
      healthEndpoint: config.healthEndpoint || '/health',
      healthInterval: config.healthInterval || 30000,
      heartbeatInterval: config.heartbeatInterval || 60000,
      autoRegister: config.autoRegister !== false,
      metadata: config.metadata || {},
    };

    this.registered = false;
    this.heartbeatTimer = null;
  }

  /**
   * Detect service name from package.json or hostname
   */
  detectServiceName() {
    try {
      // Try to read package.json
      const pkg = require(process.cwd() + '/package.json');
      return pkg.name;
    } catch {
      // Fallback to hostname
      return os.hostname();
    }
  }

  /**
   * Detect service URL from environment or default
   */
  detectServiceUrl() {
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || 3000;
    return `http://${host}:${port}`;
  }

  /**
   * Initialize agent
   */
  async initialize() {
    console.log('[Obsidian Agent] Initializing...', {
      serviceName: this.config.serviceName,
      serviceUrl: this.config.serviceUrl,
      obsidianUrl: this.config.obsidianUrl,
    });

    if (this.config.autoRegister) {
      await this.register();
      this.startHeartbeat();
    }

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Register service with Obsidian
   */
  async register() {
    try {
      const registrationData = {
        name: this.config.serviceName,
        url: this.config.serviceUrl,
        healthCheck: {
          endpoint: this.config.healthEndpoint,
          interval: this.config.healthInterval,
          timeout: 5000,
        },
        metadata: {
          ...this.config.metadata,
          hostname: os.hostname(),
          platform: os.platform(),
          nodeVersion: process.version,
          pid: process.pid,
          registeredAt: new Date().toISOString(),
          agentVersion: '1.0.0',
        },
      };

      const response = await axios.post(
        `${this.config.obsidianUrl}/api/services`,
        registrationData,
        {
          timeout: 10000,
        }
      );

      this.registered = true;
      console.log('[Obsidian Agent] Service registered successfully', {
        serviceName: this.config.serviceName,
      });

      return response.data;
    } catch (error) {
      console.error('[Obsidian Agent] Failed to register service', {
        error: error.message,
      });
      
      // Retry after delay
      setTimeout(() => this.register(), 30000);
    }
  }

  /**
   * Send heartbeat to Obsidian
   */
  async sendHeartbeat() {
    if (!this.registered) return;

    try {
      await axios.post(
        `${this.config.obsidianUrl}/api/services/${this.config.serviceName}/heartbeat`,
        {
          timestamp: new Date().toISOString(),
          metrics: {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            cpu: process.cpuUsage(),
          },
        },
        {
          timeout: 5000,
        }
      );

      console.log('[Obsidian Agent] Heartbeat sent');
    } catch (error) {
      console.error('[Obsidian Agent] Failed to send heartbeat', {
        error: error.message,
      });
    }
  }

  /**
   * Start periodic heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(
      () => this.sendHeartbeat(),
      this.config.heartbeatInterval
    );
  }

  /**
   * Unregister service (on shutdown)
   */
  async unregister() {
    if (!this.registered) return;

    try {
      await axios.delete(
        `${this.config.obsidianUrl}/api/services/${this.config.serviceName}`,
        {
          timeout: 5000,
        }
      );

      console.log('[Obsidian Agent] Service unregistered');
    } catch (error) {
      console.error('[Obsidian Agent] Failed to unregister service', {
        error: error.message,
      });
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[Obsidian Agent] Shutting down...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    await this.unregister();

    process.exit(0);
  }

  /**
   * Express middleware for automatic endpoint tracking
   */
  expressMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Send metric to Obsidian
        this.sendMetric({
          type: 'request',
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString(),
        }).catch(() => {
          // Silently fail
        });
      });

      next();
    };
  }

  /**
   * Send custom metric
   */
  async sendMetric(metric) {
    if (!this.registered) return;

    try {
      await axios.post(
        `${this.config.obsidianUrl}/api/metrics`,
        {
          serviceName: this.config.serviceName,
          ...metric,
        },
        {
          timeout: 5000,
        }
      );
    } catch (error) {
      // Silently fail to not disrupt service
    }
  }

  /**
   * Send custom event
   */
  async sendEvent(event) {
    if (!this.registered) return;

    try {
      await axios.post(
        `${this.config.obsidianUrl}/api/events`,
        {
          serviceName: this.config.serviceName,
          ...event,
        },
        {
          timeout: 5000,
        }
      );
    } catch (error) {
      // Silently fail
    }
  }
}

/**
 * Factory function for easy initialization
 */
export function createAgent(config) {
  const agent = new ObsidianAgent(config);
  agent.initialize();
  return agent;
}

export default ObsidianAgent;

