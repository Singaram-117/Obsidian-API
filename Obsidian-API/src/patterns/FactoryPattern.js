import logger from '../utils/logger.js';
import circuitBreakerService from '../services/circuitBreakerService.js';
import bulkheadPattern from './BulkheadPattern.js';
import fallbackPattern from './FallbackPattern.js';

/**
 * Factory Pattern Implementation
 * Creates objects without specifying their concrete classes
 * 
 * Use Case: Create different types of resilience strategies, monitoring adapters, alerting handlers
 * Based on: https://refactoring.guru/design-patterns/factory-method
 */

/**
 * ===========================
 * RESILIENCE STRATEGY FACTORY
 * ===========================
 */

/**
 * Base Resilience Strategy
 */
class ResilienceStrategy {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
  }

  async apply(serviceName, operation) {
    throw new Error('Method must be implemented');
  }

  getDescription() {
    throw new Error('Method must be implemented');
  }
}

/**
 * Circuit Breaker Strategy
 */
class CircuitBreakerStrategy extends ResilienceStrategy {
  constructor(config = {}) {
    super('circuit-breaker', config);
  }

  async apply(serviceName, operation) {
    logger.info('Applying Circuit Breaker strategy', { serviceName });

    const breaker = circuitBreakerService.getBreaker(serviceName);

    if (!breaker) {
      logger.warn('No circuit breaker found, creating one', { serviceName });
      await circuitBreakerService.createBreaker(serviceName, this.config);
      return await operation();
    }

    return await breaker.fire(operation);
  }

  getDescription() {
    return 'Prevents cascading failures by opening circuit after threshold failures';
  }
}

/**
 * Bulkhead Strategy
 */
class BulkheadStrategy extends ResilienceStrategy {
  constructor(config = {}) {
    super('bulkhead', config);
  }

  async apply(serviceName, operation) {
    logger.info('Applying Bulkhead strategy', { serviceName });

    return await bulkheadPattern.execute(serviceName, operation);
  }

  getDescription() {
    return 'Isolates resources to prevent one failure from affecting others';
  }
}

/**
 * Fallback Strategy
 */
class FallbackStrategy extends ResilienceStrategy {
  constructor(config = {}) {
    super('fallback', config);
  }

  async apply(serviceName, operation) {
    logger.info('Applying Fallback strategy', { serviceName });

    return await fallbackPattern.executeWithFallback(
      serviceName,
      operation,
      this.config.context || {}
    );
  }

  getDescription() {
    return 'Provides alternative response when service fails';
  }
}

/**
 * Retry Strategy
 */
class RetryStrategy extends ResilienceStrategy {
  constructor(config = {}) {
    super('retry', {
      maxRetries: config.maxRetries || 3,
      backoff: config.backoff || 1000,
      ...config,
    });
  }

  async apply(serviceName, operation) {
    logger.info('Applying Retry strategy', { serviceName });

    let lastError;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < this.config.maxRetries) {
          const delay = this.config.backoff * Math.pow(2, attempt - 1);
          logger.info(`Retry attempt ${attempt}`, { serviceName, delay });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  getDescription() {
    return 'Retries failed requests with exponential backoff';
  }
}

/**
 * Composite Strategy (combines multiple strategies)
 */
class CompositeStrategy extends ResilienceStrategy {
  constructor(strategies) {
    super('composite', {});
    this.strategies = strategies;
  }

  async apply(serviceName, operation) {
    logger.info('Applying Composite strategy', {
      serviceName,
      strategyCount: this.strategies.length,
    });

    let currentOperation = operation;

    // Apply strategies in reverse order (innermost first)
    for (let i = this.strategies.length - 1; i >= 0; i--) {
      const strategy = this.strategies[i];
      const prevOperation = currentOperation;
      currentOperation = async () => await strategy.apply(serviceName, prevOperation);
    }

    return await currentOperation();
  }

  getDescription() {
    return `Combines: ${this.strategies.map((s) => s.name).join(' → ')}`;
  }
}

/**
 * Resilience Strategy Factory
 */
class ResilienceStrategyFactory {
  static create(type, config = {}) {
    switch (type) {
      case 'circuit-breaker':
        return new CircuitBreakerStrategy(config);

      case 'bulkhead':
        return new BulkheadStrategy(config);

      case 'fallback':
        return new FallbackStrategy(config);

      case 'retry':
        return new RetryStrategy(config);

      case 'composite':
        return new CompositeStrategy(config.strategies || []);

      default:
        throw new Error(`Unknown resilience strategy: ${type}`);
    }
  }

  static createComposite(strategies) {
    const strategyInstances = strategies.map((s) => this.create(s.type, s.config));
    return new CompositeStrategy(strategyInstances);
  }
}

/**
 * ===========================
 * NOTIFICATION HANDLER FACTORY
 * ===========================
 */

/**
 * Base Notification Handler
 */
class NotificationHandler {
  constructor(type, config) {
    this.type = type;
    this.config = config;
  }

  async send(alert) {
    throw new Error('Method must be implemented');
  }
}

/**
 * Email Notification Handler
 */
class EmailNotificationHandler extends NotificationHandler {
  constructor(config) {
    super('email', config);
  }

  async send(alert) {
    logger.info('Sending email notification', {
      to: this.config.to,
      subject: alert.message,
    });

    // Simulate email sending
    return {
      success: true,
      type: 'email',
      recipient: this.config.to,
    };
  }
}

/**
 * Slack Notification Handler
 */
class SlackNotificationHandler extends NotificationHandler {
  constructor(config) {
    super('slack', config);
  }

  async send(alert) {
    logger.info('Sending Slack notification', {
      channel: this.config.channel,
      message: alert.message,
    });

    // Simulate Slack webhook
    return {
      success: true,
      type: 'slack',
      channel: this.config.channel,
    };
  }
}

/**
 * Webhook Notification Handler
 */
class WebhookNotificationHandler extends NotificationHandler {
  constructor(config) {
    super('webhook', config);
  }

  async send(alert) {
    logger.info('Sending webhook notification', { url: this.config.url });

    const axios = (await import('axios')).default;

    try {
      await axios.post(this.config.url, alert, { timeout: 5000 });
      return {
        success: true,
        type: 'webhook',
        url: this.config.url,
      };
    } catch (error) {
      logger.error('Webhook failed', { error: error.message });
      return {
        success: false,
        type: 'webhook',
        error: error.message,
      };
    }
  }
}

/**
 * SMS Notification Handler
 */
class SMSNotificationHandler extends NotificationHandler {
  constructor(config) {
    super('sms', config);
  }

  async send(alert) {
    logger.info('Sending SMS notification', { to: this.config.phoneNumber });

    return {
      success: true,
      type: 'sms',
      phoneNumber: this.config.phoneNumber,
    };
  }
}

/**
 * Notification Handler Factory
 */
class NotificationHandlerFactory {
  static create(type, config) {
    switch (type) {
      case 'email':
        return new EmailNotificationHandler(config);

      case 'slack':
        return new SlackNotificationHandler(config);

      case 'webhook':
        return new WebhookNotificationHandler(config);

      case 'sms':
        return new SMSNotificationHandler(config);

      default:
        throw new Error(`Unknown notification handler: ${type}`);
    }
  }

  static createMultiple(handlers) {
    return handlers.map((h) => this.create(h.type, h.config));
  }
}

/**
 * ===========================
 * HEALTH CHECK STRATEGY FACTORY
 * ===========================
 */

/**
 * Base Health Check Strategy
 */
class HealthCheckStrategy {
  constructor(type, config) {
    this.type = type;
    this.config = config;
  }

  async check(service) {
    throw new Error('Method must be implemented');
  }
}

/**
 * HTTP Health Check
 */
class HTTPHealthCheck extends HealthCheckStrategy {
  constructor(config) {
    super('http', config);
  }

  async check(service) {
    logger.debug('HTTP health check', { serviceName: service.name });

    const axios = (await import('axios')).default;

    try {
      const response = await axios.get(service.healthCheck.endpoint, {
        timeout: this.config.timeout || 5000,
      });

      return {
        healthy: response.status === 200,
        status: response.status,
        type: 'http',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        type: 'http',
      };
    }
  }
}

/**
 * TCP Health Check
 */
class TCPHealthCheck extends HealthCheckStrategy {
  constructor(config) {
    super('tcp', config);
  }

  async check(service) {
    logger.debug('TCP health check', { serviceName: service.name });

    // Simulate TCP check
    return {
      healthy: true,
      type: 'tcp',
    };
  }
}

/**
 * Ping Health Check
 */
class PingHealthCheck extends HealthCheckStrategy {
  constructor(config) {
    super('ping', config);
  }

  async check(service) {
    logger.debug('Ping health check', { serviceName: service.name });

    // Simulate ping
    return {
      healthy: true,
      type: 'ping',
      responseTime: Math.random() * 50,
    };
  }
}

/**
 * Health Check Strategy Factory
 */
class HealthCheckStrategyFactory {
  static create(type, config = {}) {
    switch (type) {
      case 'http':
        return new HTTPHealthCheck(config);

      case 'tcp':
        return new TCPHealthCheck(config);

      case 'ping':
        return new PingHealthCheck(config);

      default:
        throw new Error(`Unknown health check strategy: ${type}`);
    }
  }
}

/**
 * Example Usage:
 * 
 * // Create resilience strategies
 * const circuitBreaker = ResilienceStrategyFactory.create('circuit-breaker', {
 *   errorThresholdPercentage: 50
 * });
 * 
 * await circuitBreaker.apply('payment-service', async () => {
 *   return await makePayment();
 * });
 * 
 * // Create composite strategy
 * const composite = ResilienceStrategyFactory.createComposite([
 *   { type: 'retry', config: { maxRetries: 3 } },
 *   { type: 'circuit-breaker', config: {} },
 *   { type: 'fallback', config: { type: 'cache' } }
 * ]);
 * 
 * // Create notification handlers
 * const handlers = NotificationHandlerFactory.createMultiple([
 *   { type: 'email', config: { to: 'admin@example.com' } },
 *   { type: 'slack', config: { channel: '#alerts' } }
 * ]);
 * 
 * for (const handler of handlers) {
 *   await handler.send(alert);
 * }
 */

export {
  ResilienceStrategy,
  CircuitBreakerStrategy,
  BulkheadStrategy,
  FallbackStrategy,
  RetryStrategy,
  CompositeStrategy,
  ResilienceStrategyFactory,
  NotificationHandler,
  EmailNotificationHandler,
  SlackNotificationHandler,
  WebhookNotificationHandler,
  SMSNotificationHandler,
  NotificationHandlerFactory,
  HealthCheckStrategy,
  HTTPHealthCheck,
  TCPHealthCheck,
  PingHealthCheck,
  HealthCheckStrategyFactory,
};

