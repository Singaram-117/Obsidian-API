import mongoose from 'mongoose';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Database Connection
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.get('mongodb.uri'), {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      database: conn.connection.name,
      host: conn.connection.host,
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', {
        error: err.message,
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Close database connection
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', {
      error: error.message,
    });
    throw error;
  }
};

export default { connectDB, disconnectDB };

