import { EventEmitter } from 'events';
import Event from '../models/Event.js';
import logger from '../utils/logger.js';

/**
 * Event Service - Implements Observer Pattern
 * Centralized event management system for the entire platform
 */
class EventService extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Circuit Breaker Events
    this.on('circuit:open', async (data) => {
      await this.recordEvent({
        type: 'circuit_opened',
        serviceName: data.serviceName,
        severity: 'error',
        message: `Circuit breaker opened for ${data.serviceName}`,
        metadata: data,
      });
    });

    this.on('circuit:halfOpen', async (data) => {
      await this.recordEvent({
        type: 'circuit_half_open',
        serviceName: data.serviceName,
        severity: 'warning',
        message: `Circuit breaker half-open for ${data.serviceName}`,
        metadata: data,
      });
    });

    this.on('circuit:close', async (data) => {
      await this.recordEvent({
        type: 'circuit_closed',
        serviceName: data.serviceName,
        severity: 'info',
        message: `Circuit breaker closed for ${data.serviceName}`,
        metadata: data,
      });
    });

    // Request Events
    this.on('request:success', async (data) => {
      await this.recordEvent({
        type: 'request_succeeded',
        serviceName: data.serviceName,
        severity: 'info',
        message: `Request succeeded for ${data.serviceName}`,
        metadata: data,
      });
    });

    this.on('request:failure', async (data) => {
      await this.recordEvent({
        type: 'request_failed',
        serviceName: data.serviceName,
        severity: 'error',
        message: `Request failed for ${data.serviceName}`,
        metadata: data,
      });
    });

    // Service Health Events
    this.on('service:up', async (data) => {
      await this.recordEvent({
        type: 'service_up',
        serviceName: data.serviceName,
        severity: 'info',
        message: `Service ${data.serviceName} is healthy`,
        metadata: data,
      });
    });

    this.on('service:down', async (data) => {
      await this.recordEvent({
        type: 'service_down',
        serviceName: data.serviceName,
        severity: 'critical',
        message: `Service ${data.serviceName} is down`,
        metadata: data,
      });
    });

    this.on('service:degraded', async (data) => {
      await this.recordEvent({
        type: 'service_degraded',
        serviceName: data.serviceName,
        severity: 'warning',
        message: `Service ${data.serviceName} is degraded`,
        metadata: data,
      });
    });

    // Rate Limit Events
    this.on('rateLimit:exceeded', async (data) => {
      const serviceName = data.serviceName || 'api';
      const endpointSuffix = data.endpoint ? ` (${data.endpoint})` : '';

      await this.recordEvent({
        type: 'rate_limit_exceeded',
        serviceName,
        severity: 'warning',
        message: `Rate limit exceeded for ${serviceName}${endpointSuffix}`,
        metadata: {
          ...data,
          clientId: data.clientId || data.ip,
        },
      });
    });

    // Anomaly Detection Events
    this.on('anomaly:detected', async (data) => {
      await this.recordEvent({
        type: 'anomaly_detected',
        serviceName: data.serviceName,
        severity: 'warning',
        message: `Anomaly detected for ${data.serviceName}: ${data.anomalyType}`,
        metadata: data,
      });
    });

    // Chaos Engineering Events
    this.on('chaos:started', async (data) => {
      await this.recordEvent({
        type: 'chaos_test_started',
        serviceName: data.serviceName,
        severity: 'info',
        message: `Chaos test started: ${data.testType}`,
        metadata: data,
      });
    });

    this.on('chaos:completed', async (data) => {
      await this.recordEvent({
        type: 'chaos_test_completed',
        serviceName: data.serviceName,
        severity: 'info',
        message: `Chaos test completed: ${data.testType}`,
        metadata: data,
      });
    });
  }

  /**
   * Record an event to the database
   */
  async recordEvent(eventData) {
    try {
      const event = new Event(eventData);
      await event.save();
      
      // Emit to Socket.io for real-time updates
      this.emit('event:created', event);
      
      logger.debug('Event recorded', {
        type: eventData.type,
        serviceName: eventData.serviceName,
      });
    } catch (error) {
      logger.error('Failed to record event', {
        error: error.message,
        eventData,
      });
    }
  }

  /**
   * Get recent events
   */
  async getRecentEvents(limit = 100, filter = {}) {
    try {
      const events = await Event.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      return events;
    } catch (error) {
      logger.error('Failed to fetch events', { error: error.message });
      throw error;
    }
  }

  /**
   * Get events by service
   */
  async getEventsByService(serviceName, limit = 100) {
    return this.getRecentEvents(limit, { serviceName });
  }

  /**
   * Get events by type
   */
  async getEventsByType(type, limit = 100) {
    return this.getRecentEvents(limit, { type });
  }

  /**
   * Get events by severity
   */
  async getEventsBySeverity(severity, limit = 100) {
    return this.getRecentEvents(limit, { severity });
  }
}

// Export singleton instance
export const eventEmitter = new EventService();
export default eventEmitter;

