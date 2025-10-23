import logger from '../utils/logger.js';
import { eventEmitter } from '../services/eventService.js';

/**
 * Enhanced Observer Pattern Implementation
 * Defines subscription mechanism to notify multiple objects about events
 * 
 * Use Case: Real-time monitoring, alerting, dashboard updates, audit logging
 * Based on: https://refactoring.guru/design-patterns/observer
 */

/**
 * Subject (Observable)
 */
class Subject {
  constructor(name) {
    this.name = name;
    this.observers = [];
    this.state = null;
  }

  attach(observer) {
    const isExist = this.observers.includes(observer);
    if (isExist) {
      logger.warn('Observer already attached', { subject: this.name });
      return;
    }

    this.observers.push(observer);
    logger.info('Observer attached', {
      subject: this.name,
      observer: observer.name,
    });
  }

  detach(observer) {
    const observerIndex = this.observers.indexOf(observer);
    if (observerIndex === -1) {
      logger.warn('Observer not found', { subject: this.name });
      return;
    }

    this.observers.splice(observerIndex, 1);
    logger.info('Observer detached', {
      subject: this.name,
      observer: observer.name,
    });
  }

  notify(event) {
    logger.info('Notifying observers', {
      subject: this.name,
      observerCount: this.observers.length,
    });

    for (const observer of this.observers) {
      observer.update(this, event);
    }
  }

  setState(state) {
    this.state = state;
    this.notify({ type: 'state-change', state });
  }

  getState() {
    return this.state;
  }
}

/**
 * Observer Interface
 */
class Observer {
  constructor(name) {
    this.name = name;
  }

  update(subject, event) {
    throw new Error('Method must be implemented');
  }
}

/**
 * ===========================
 * CONCRETE OBSERVERS
 * ===========================
 */

/**
 * Dashboard Observer
 * Updates real-time dashboard
 */
class DashboardObserver extends Observer {
  constructor(socketIO) {
    super('Dashboard');
    this.socketIO = socketIO;
  }

  update(subject, event) {
    logger.info('Dashboard observer updating', { event: event.type });

    // Emit to all connected clients
    if (this.socketIO) {
      this.socketIO.emit('dashboard:update', {
        subject: subject.name,
        event,
        timestamp: new Date(),
      });
    }
  }
}

/**
 * Logging Observer
 * Logs all events to database
 */
class LoggingObserver extends Observer {
  constructor() {
    super('Logging');
  }

  async update(subject, event) {
    logger.info('Logging observer recording event', {
      subject: subject.name,
      event: event.type,
    });

    const Event = (await import('../models/Event.js')).default;

    await Event.create({
      type: event.type,
      serviceName: subject.name,
      data: event,
      timestamp: new Date(),
    });
  }
}

/**
 * Metrics Observer
 * Collects and aggregates metrics
 */
class MetricsObserver extends Observer {
  constructor() {
    super('Metrics');
  }

  async update(subject, event) {
    if (event.type === 'request-completed') {
      logger.debug('Metrics observer recording request', {
        subject: subject.name,
      });

      const Metric = (await import('../models/Metric.js')).default;

      await Metric.create({
        serviceName: subject.name,
        name: 'request',
        value: event.duration,
        metadata: {
          success: event.success,
          status: event.status,
        },
        timestamp: new Date(),
      });
    }
  }
}

/**
 * Alerting Observer
 * Triggers alerts based on events
 */
class AlertingObserver extends Observer {
  constructor(alertingService) {
    super('Alerting');
    this.alertingService = alertingService;
  }

  update(subject, event) {
    logger.info('Alerting observer checking rules', {
      subject: subject.name,
      event: event.type,
    });

    // Check if any alert rules should trigger
    this.alertingService.checkRules(event.type, {
      serviceName: subject.name,
      ...event,
    });
  }
}

/**
 * Audit Observer
 * Records audit trail for compliance
 */
class AuditObserver extends Observer {
  constructor() {
    super('Audit');
    this.auditLog = [];
  }

  update(subject, event) {
    const auditEntry = {
      timestamp: new Date(),
      subject: subject.name,
      event: event.type,
      data: event,
    };

    this.auditLog.push(auditEntry);

    logger.info('Audit trail recorded', {
      subject: subject.name,
      event: event.type,
    });

    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog.shift();
    }
  }

  getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }
}

/**
 * Analytics Observer
 * Performs real-time analytics
 */
class AnalyticsObserver extends Observer {
  constructor() {
    super('Analytics');
    this.stats = new Map();
  }

  update(subject, event) {
    const key = `${subject.name}:${event.type}`;

    if (!this.stats.has(key)) {
      this.stats.set(key, {
        count: 0,
        firstSeen: new Date(),
        lastSeen: null,
      });
    }

    const stat = this.stats.get(key);
    stat.count++;
    stat.lastSeen = new Date();

    logger.debug('Analytics updated', {
      key,
      count: stat.count,
    });
  }

  getStats() {
    const result = [];
    for (const [key, stat] of this.stats) {
      result.push({ key, ...stat });
    }
    return result;
  }
}

/**
 * ===========================
 * SERVICE MONITORING SUBJECT
 * ===========================
 */

/**
 * Service Monitor (Concrete Subject)
 * Monitors a specific service and notifies observers
 */
class ServiceMonitor extends Subject {
  constructor(serviceName) {
    super(serviceName);
    this.status = 'unknown';
    this.circuitState = 'closed';
    this.lastRequest = null;
  }

  recordRequest(request) {
    this.lastRequest = request;

    this.notify({
      type: 'request-completed',
      ...request,
    });
  }

  setCircuitState(state) {
    const previousState = this.circuitState;
    this.circuitState = state;

    if (previousState !== state) {
      this.notify({
        type: 'circuit-state-changed',
        previousState,
        newState: state,
      });
    }
  }

  setStatus(status) {
    const previousStatus = this.status;
    this.status = status;

    if (previousStatus !== status) {
      this.notify({
        type: 'status-changed',
        previousStatus,
        newStatus: status,
      });
    }
  }

  reportFailure(error) {
    this.notify({
      type: 'request-failed',
      error: error.message,
      timestamp: new Date(),
    });
  }
}

/**
 * ===========================
 * OBSERVABLE EVENT BUS
 * ===========================
 */

/**
 * Event Bus with Observer Pattern
 * Central hub for all system events
 */
class ObservableEventBus {
  constructor() {
    this.observers = new Map(); // eventType -> Set of observers
  }

  subscribe(eventType, observer) {
    if (!this.observers.has(eventType)) {
      this.observers.set(eventType, new Set());
    }

    this.observers.get(eventType).add(observer);

    logger.info('Observer subscribed to event', {
      eventType,
      observer: observer.name,
    });
  }

  unsubscribe(eventType, observer) {
    if (this.observers.has(eventType)) {
      this.observers.get(eventType).delete(observer);

      logger.info('Observer unsubscribed from event', {
        eventType,
        observer: observer.name,
      });
    }
  }

  publish(eventType, data) {
    logger.debug('Publishing event', { eventType });

    if (this.observers.has(eventType)) {
      const observers = this.observers.get(eventType);

      for (const observer of observers) {
        try {
          observer.update({ name: eventType }, { type: eventType, ...data });
        } catch (error) {
          logger.error('Observer update failed', {
            observer: observer.name,
            error: error.message,
          });
        }
      }
    }

    // Also emit to global event emitter for backward compatibility
    eventEmitter.emit(eventType, data);
  }

  getSubscriberCount(eventType) {
    return this.observers.has(eventType) ? this.observers.get(eventType).size : 0;
  }

  getAllSubscribers() {
    const result = {};
    for (const [eventType, observers] of this.observers) {
      result[eventType] = Array.from(observers).map((o) => o.name);
    }
    return result;
  }
}

/**
 * Global Event Bus Instance
 */
const eventBus = new ObservableEventBus();

/**
 * Example Usage:
 * 
 * // Create service monitor
 * const paymentMonitor = new ServiceMonitor('payment-service');
 * 
 * // Create observers
 * const dashboardObserver = new DashboardObserver(io);
 * const loggingObserver = new LoggingObserver();
 * const metricsObserver = new MetricsObserver();
 * const alertingObserver = new AlertingObserver(alertingService);
 * 
 * // Attach observers
 * paymentMonitor.attach(dashboardObserver);
 * paymentMonitor.attach(loggingObserver);
 * paymentMonitor.attach(metricsObserver);
 * paymentMonitor.attach(alertingObserver);
 * 
 * // Events automatically notify all observers
 * paymentMonitor.recordRequest({
 *   duration: 250,
 *   success: true,
 *   status: 200
 * });
 * 
 * paymentMonitor.setCircuitState('open');
 * 
 * // Or use event bus
 * eventBus.subscribe('circuit:open', alertingObserver);
 * eventBus.publish('circuit:open', { serviceName: 'payment-service' });
 */

export {
  Subject,
  Observer,
  DashboardObserver,
  LoggingObserver,
  MetricsObserver,
  AlertingObserver,
  AuditObserver,
  AnalyticsObserver,
  ServiceMonitor,
  ObservableEventBus,
  eventBus,
};

