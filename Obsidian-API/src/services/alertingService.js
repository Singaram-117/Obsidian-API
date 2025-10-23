import logger from '../utils/logger.js';
import { eventEmitter } from './eventService.js';
import Service from '../models/Service.js';

/**
 * Alerting Service - User-Facing Feature
 * Monitors services and sends alerts based on user-defined rules
 */
class AlertingService {
  constructor() {
    this.rules = new Map();
    this.alertHistory = [];
    this.setupEventListeners();
  }

  /**
   * Setup event listeners to trigger alerts
   */
  setupEventListeners() {
    // Circuit breaker alerts
    eventEmitter.on('circuit:open', (data) => {
      this.checkRules('circuit_opened', data);
    });

    // Service health alerts
    eventEmitter.on('service:down', (data) => {
      this.checkRules('service_down', data);
    });

    eventEmitter.on('service:degraded', (data) => {
      this.checkRules('service_degraded', data);
    });

    // Performance alerts
    eventEmitter.on('request:failure', (data) => {
      this.checkRules('request_failed', data);
    });
  }

  /**
   * Create alert rule
   */
  createRule(rule) {
    const alertRule = {
      id: rule.id || `rule_${Date.now()}`,
      name: rule.name,
      condition: rule.condition, // { type, threshold, timeWindow }
      actions: rule.actions, // [{ type: 'email'|'webhook'|'slack', config }]
      enabled: rule.enabled !== false,
      serviceName: rule.serviceName, // Optional: specific service or '*' for all
      cooldown: rule.cooldown || 300000, // 5 minutes default
      lastTriggered: null,
      triggerCount: 0,
    };

    this.rules.set(alertRule.id, alertRule);

    logger.info('Alert rule created', {
      ruleId: alertRule.id,
      name: alertRule.name,
    });

    return alertRule;
  }

  /**
   * Check if any rules should trigger
   */
  async checkRules(eventType, eventData) {
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      // Check if rule applies to this service
      if (rule.serviceName !== '*' && rule.serviceName !== eventData.serviceName) {
        continue;
      }

      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered;
        if (timeSinceLastTrigger < rule.cooldown) {
          continue; // Still in cooldown period
        }
      }

      // Evaluate condition
      if (await this.evaluateCondition(rule.condition, eventType, eventData)) {
        await this.triggerAlert(rule, eventData);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  async evaluateCondition(condition, eventType, eventData) {
    switch (condition.type) {
      case 'circuit_breaker_open':
        return eventType === 'circuit_opened';

      case 'service_down':
        return eventType === 'service_down';

      case 'error_rate_threshold':
        return await this.checkErrorRate(eventData.serviceName, condition.threshold);

      case 'response_time_threshold':
        return await this.checkResponseTime(
          eventData.serviceName,
          condition.threshold
        );

      case 'consecutive_failures':
        return await this.checkConsecutiveFailures(
          eventData.serviceName,
          condition.count
        );

      default:
        return false;
    }
  }

  /**
   * Check error rate
   */
  async checkErrorRate(serviceName, threshold) {
    const service = await Service.findOne({ name: serviceName });
    if (!service) return false;

    const errorRate =
      service.metrics.totalRequests > 0
        ? (service.metrics.failedRequests / service.metrics.totalRequests) * 100
        : 0;

    return errorRate > threshold;
  }

  /**
   * Check response time
   */
  async checkResponseTime(serviceName, threshold) {
    const service = await Service.findOne({ name: serviceName });
    if (!service) return false;

    return service.metrics.averageResponseTime > threshold;
  }

  /**
   * Check consecutive failures
   */
  async checkConsecutiveFailures(serviceName, count) {
    // Check last N events for this service
    const recentEvents = await Event.find({
      serviceName,
      type: 'request_failed',
    })
      .sort({ timestamp: -1 })
      .limit(count);

    return recentEvents.length >= count;
  }

  /**
   * Trigger alert
   */
  async triggerAlert(rule, eventData) {
    rule.lastTriggered = Date.now();
    rule.triggerCount++;

    const alert = {
      id: `alert_${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      serviceName: eventData.serviceName,
      message: this.generateAlertMessage(rule, eventData),
      severity: this.determineService(rule.condition),
      timestamp: new Date(),
      eventData,
    };

    // Store in history
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(0, 1000);
    }

    // Execute actions
    for (const action of rule.actions) {
      await this.executeAction(action, alert);
    }

    // Emit alert event for real-time updates
    eventEmitter.emit('alert:triggered', alert);

    logger.warn('Alert triggered', {
      ruleId: rule.id,
      serviceName: eventData.serviceName,
    });

    return alert;
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(rule, eventData) {
    const templates = {
      circuit_breaker_open: `🚨 Circuit breaker opened for ${eventData.serviceName}`,
      service_down: `🔴 Service ${eventData.serviceName} is DOWN`,
      service_degraded: `⚠️  Service ${eventData.serviceName} is DEGRADED`,
      error_rate_threshold: `📈 High error rate detected for ${eventData.serviceName}`,
      response_time_threshold: `⏱️  Slow response time for ${eventData.serviceName}`,
    };

    return templates[rule.condition.type] || `Alert: ${rule.name}`;
  }

  /**
   * Determine severity
   */
  determineSeverity(condition) {
    const severityMap = {
      circuit_breaker_open: 'critical',
      service_down: 'critical',
      service_degraded: 'warning',
      error_rate_threshold: 'warning',
      response_time_threshold: 'info',
    };

    return severityMap[condition.type] || 'info';
  }

  /**
   * Execute alert action
   */
  async executeAction(action, alert) {
    try {
      switch (action.type) {
        case 'log':
          logger.warn('ALERT', alert);
          break;

        case 'webhook':
          await this.sendWebhook(action.config.url, alert);
          break;

        case 'email':
          // Email integration would go here
          logger.info('Email alert', {
            to: action.config.to,
            alert: alert.message,
          });
          break;

        case 'slack':
          // Slack integration would go here
          logger.info('Slack alert', {
            channel: action.config.channel,
            alert: alert.message,
          });
          break;

        default:
          logger.warn('Unknown alert action type', { type: action.type });
      }
    } catch (error) {
      logger.error('Failed to execute alert action', {
        actionType: action.type,
        error: error.message,
      });
    }
  }

  /**
   * Send webhook
   */
  async sendWebhook(url, alert) {
    const axios = (await import('axios')).default;

    try {
      await axios.post(url, alert, {
        timeout: 5000,
      });
      logger.info('Webhook alert sent', { url });
    } catch (error) {
      logger.error('Failed to send webhook alert', {
        url,
        error: error.message,
      });
    }
  }

  /**
   * Get alert rules
   */
  getRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Update rule
   */
  updateRule(ruleId, updates) {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    Object.assign(rule, updates);

    logger.info('Alert rule updated', { ruleId });

    return rule;
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId) {
    const deleted = this.rules.delete(ruleId);

    if (deleted) {
      logger.info('Alert rule deleted', { ruleId });
    }

    return deleted;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter((r) => r.enabled).length,
      totalAlerts: this.alertHistory.length,
      recentAlerts: this.alertHistory.slice(0, 10),
    };
  }
}

// Export singleton instance
const alertingService = new AlertingService();
export default alertingService;

