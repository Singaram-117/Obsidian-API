import Queue from 'bull';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Queue Service - Asynchronous Job Processing
 * Implements Producer-Consumer Pattern using Bull
 */
class QueueService {
  constructor() {
    this.queues = new Map();
    this.redisConfig = {
      host: config.get('redis.host'),
      port: config.get('redis.port'),
      password: config.get('redis.password'),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }

  /**
   * Create or get a queue
   */
  getQueue(queueName) {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        redis: this.redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      // Event listeners for monitoring
      queue.on('error', (error) => {
        logger.error(`Queue ${queueName} error`, {
          queueName,
          error: error.message,
        });
      });

      queue.on('failed', (job, error) => {
        logger.error(`Job ${job.id} failed in queue ${queueName}`, {
          queueName,
          jobId: job.id,
          error: error.message,
          data: job.data,
        });
      });

      queue.on('completed', (job) => {
        logger.debug(`Job ${job.id} completed in queue ${queueName}`, {
          queueName,
          jobId: job.id,
        });
      });

      this.queues.set(queueName, queue);
      logger.info(`Queue created: ${queueName}`);
    }

    return this.queues.get(queueName);
  }

  /**
   * Add a job to a queue
   */
  async addJob(queueName, jobData, options = {}) {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.add(jobData, options);
      
      logger.debug(`Job added to queue ${queueName}`, {
        queueName,
        jobId: job.id,
      });
      
      return job;
    } catch (error) {
      logger.error(`Failed to add job to queue ${queueName}`, {
        queueName,
        error: error.message,
        jobData,
      });
      throw error;
    }
  }

  /**
   * Process jobs from a queue
   */
  async processQueue(queueName, processor, concurrency = 5) {
    try {
      const queue = this.getQueue(queueName);
      
      queue.process(concurrency, async (job) => {
        logger.debug(`Processing job ${job.id} from queue ${queueName}`, {
          queueName,
          jobId: job.id,
          data: job.data,
        });
        
        return await processor(job);
      });
      
      logger.info(`Queue processor registered for ${queueName}`, {
        queueName,
        concurrency,
      });
    } catch (error) {
      logger.error(`Failed to process queue ${queueName}`, {
        queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    try {
      const queue = this.getQueue(queueName);
      
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);
      
      return {
        queueName,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    } catch (error) {
      logger.error(`Failed to get queue stats for ${queueName}`, {
        queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all queues statistics
   */
  async getAllQueueStats() {
    const stats = [];
    
    for (const [queueName] of this.queues) {
      const queueStats = await this.getQueueStats(queueName);
      stats.push(queueStats);
    }
    
    return stats;
  }

  /**
   * Clean completed jobs from a queue
   */
  async cleanQueue(queueName, grace = 1000) {
    try {
      const queue = this.getQueue(queueName);
      
      await queue.clean(grace, 'completed');
      await queue.clean(grace, 'failed');
      
      logger.info(`Queue ${queueName} cleaned`, { queueName, grace });
    } catch (error) {
      logger.error(`Failed to clean queue ${queueName}`, {
        queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName) {
    try {
      const queue = this.getQueue(queueName);
      await queue.pause();
      
      logger.info(`Queue ${queueName} paused`, { queueName });
    } catch (error) {
      logger.error(`Failed to pause queue ${queueName}`, {
        queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName) {
    try {
      const queue = this.getQueue(queueName);
      await queue.resume();
      
      logger.info(`Queue ${queueName} resumed`, { queueName });
    } catch (error) {
      logger.error(`Failed to resume queue ${queueName}`, {
        queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Close all queues
   */
  async closeAll() {
    try {
      const closePromises = [];
      
      for (const [queueName, queue] of this.queues) {
        closePromises.push(queue.close());
        logger.debug(`Closing queue ${queueName}`);
      }
      
      await Promise.all(closePromises);
      this.queues.clear();
      
      logger.info('All queues closed');
    } catch (error) {
      logger.error('Failed to close all queues', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
const queueService = new QueueService();
export default queueService;

