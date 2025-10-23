import { Kafka, logLevel } from 'kafkajs';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Kafka Service - Message Queue Integration
 * Handles event streaming and message processing
 */
class KafkaService {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.consumer = null;
    this.admin = null;
    this.isConnected = false;
    this.topics = {
      EVENTS: 'obsidian.events',
      METRICS: 'obsidian.metrics',
      ALERTS: 'obsidian.alerts',
      CIRCUIT_BREAKER: 'obsidian.circuit-breaker',
      HEALTH_CHECKS: 'obsidian.health-checks',
    };
  }

  /**
   * Initialize Kafka client
   */
  async initialize() {
    try {
      this.kafka = new Kafka({
        clientId: config.get('kafka.clientId'),
        brokers: config.get('kafka.brokers'),
        logLevel: logLevel.ERROR,
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      });

      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
      });

      this.consumer = this.kafka.consumer({
        groupId: config.get('kafka.groupId'),
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      this.admin = this.kafka.admin();

      await this.producer.connect();
      await this.consumer.connect();
      await this.admin.connect();

      // Create topics if they don't exist
      await this.createTopics();

      this.isConnected = true;
      logger.info('Kafka service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Kafka service', {
        error: error.message,
      });
      // Don't throw - allow app to run without Kafka
      this.isConnected = false;
    }
  }

  /**
   * Create Kafka topics
   */
  async createTopics() {
    try {
      const existingTopics = await this.admin.listTopics();
      const topicsToCreate = Object.values(this.topics).filter(
        (topic) => !existingTopics.includes(topic)
      );

      if (topicsToCreate.length > 0) {
        await this.admin.createTopics({
          topics: topicsToCreate.map((topic) => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
          })),
        });

        logger.info('Kafka topics created', { topics: topicsToCreate });
      }
    } catch (error) {
      logger.error('Failed to create Kafka topics', {
        error: error.message,
      });
    }
  }

  /**
   * Publish a message to Kafka
   */
  async publish(topic, message, key = null) {
    if (!this.isConnected) {
      logger.warn('Kafka not connected, skipping message publish');
      return false;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key ? String(key) : null,
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      logger.debug('Message published to Kafka', { topic, key });
      return true;
    } catch (error) {
      logger.error('Failed to publish message to Kafka', {
        error: error.message,
        topic,
      });
      return false;
    }
  }

  /**
   * Publish event
   */
  async publishEvent(event) {
    return this.publish(
      this.topics.EVENTS,
      event,
      event.serviceName
    );
  }

  /**
   * Publish metric
   */
  async publishMetric(metric) {
    return this.publish(
      this.topics.METRICS,
      metric,
      metric.serviceName
    );
  }

  /**
   * Publish alert
   */
  async publishAlert(alert) {
    return this.publish(
      this.topics.ALERTS,
      alert,
      alert.serviceName
    );
  }

  /**
   * Publish circuit breaker status change
   */
  async publishCircuitBreakerEvent(event) {
    return this.publish(
      this.topics.CIRCUIT_BREAKER,
      event,
      event.serviceName
    );
  }

  /**
   * Subscribe to a topic
   */
  async subscribe(topic, callback) {
    if (!this.isConnected) {
      logger.warn('Kafka not connected, cannot subscribe');
      return;
    }

    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = JSON.parse(message.value.toString());
            await callback(value, { topic, partition, offset: message.offset });
          } catch (error) {
            logger.error('Error processing Kafka message', {
              error: error.message,
              topic,
            });
          }
        },
      });

      logger.info('Subscribed to Kafka topic', { topic });
    } catch (error) {
      logger.error('Failed to subscribe to Kafka topic', {
        error: error.message,
        topic,
      });
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect() {
    try {
      if (this.producer) await this.producer.disconnect();
      if (this.consumer) await this.consumer.disconnect();
      if (this.admin) await this.admin.disconnect();
      
      this.isConnected = false;
      logger.info('Kafka service disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Kafka', {
        error: error.message,
      });
    }
  }
}

// Export singleton instance
const kafkaService = new KafkaService();
export default kafkaService;

