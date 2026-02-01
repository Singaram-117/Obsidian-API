import queueService from '../services/queueService.js';
import logger from '../utils/logger.js';
import { connectDB } from '../db/database.js';

/**
 * Job Worker - Processes background jobs
 */

const processors = {
  // Health check job processor
  healthCheck: async (job) => {
    logger.info('Processing health check job', { jobId: job.id });
    
    const { serviceName, url, endpoint } = job.data;
    
    try {
      // Perform health check logic here
      logger.info('Health check completed', {
        serviceName,
        jobId: job.id,
      });
      
      return { success: true, serviceName };
    } catch (error) {
      logger.error('Health check job failed', {
        serviceName,
        error: error.message,
      });
      throw error;
    }
  },
  
  // Metric aggregation job processor
  metricAggregation: async (job) => {
    logger.info('Processing metric aggregation job', { jobId: job.id });
    
    try {
      // Perform metric aggregation logic here
      logger.info('Metric aggregation completed', {
        jobId: job.id,
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Metric aggregation job failed', {
        error: error.message,
      });
      throw error;
    }
  },
  
  // Alert notification job processor
  alertNotification: async (job) => {
    logger.info('Processing alert notification job', { jobId: job.id });
    
    const { alertType, message, serviceName } = job.data;
    
    try {
      // Send alert notification (email, Slack, etc.)
      logger.info('Alert notification sent', {
        alertType,
        serviceName,
        jobId: job.id,
      });
      
      return { success: true, alertType };
    } catch (error) {
      logger.error('Alert notification job failed', {
        error: error.message,
      });
      throw error;
    }
  },
};

/**
 * Initialize worker
 */
const startWorker = async () => {
  try {
    // Connect to database
    await connectDB();
    
    logger.info('Job worker starting...');
    
    // Register queue processors
    for (const [queueName, processor] of Object.entries(processors)) {
      await queueService.processQueue(queueName, processor);
      logger.info(`Processor registered for queue: ${queueName}`);
    }
    
    logger.info('Job worker started successfully');
  } catch (error) {
    logger.error('Failed to start job worker', {
      error: error.message,
    });
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down job worker...');
  
  try {
    await queueService.closeAll();
    
    const { disconnectDB } = await import('../db/database.js');
    await disconnectDB();
    
    logger.info('Job worker shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during worker shutdown', {
      error: error.message,
    });
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the worker
startWorker();

