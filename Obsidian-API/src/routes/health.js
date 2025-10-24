import express from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler.js';
import circuitBreakerService from '../services/circuitBreakerService.js';
import kafkaService from '../services/kafkaService.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.use(apiLimiter);

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: 'up',
        mongodb: mongoose.connection.readyState === 1 ? 'up' : 'down',
        kafka: kafkaService.isConnected ? 'up' : 'down',
      },
    };

    // Check if any critical service is down
    if (health.services.mongodb === 'down') {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  })
);

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with metrics
 * @access  Public
 */
router.get(
  '/detailed',
  asyncHandler(async (req, res) => {
    const circuitStats = circuitBreakerService.getAllStats();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      system: {
        memory: {
          total: process.memoryUsage().heapTotal,
          used: process.memoryUsage().heapUsed,
          percentage: (
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100
          ).toFixed(2),
        },
        cpu: process.cpuUsage(),
        node: process.version,
        platform: process.platform,
      },
      services: {
        api: 'up',
        mongodb: {
          status: mongoose.connection.readyState === 1 ? 'up' : 'down',
          readyState: mongoose.connection.readyState,
        },
        kafka: {
          status: kafkaService.isConnected ? 'up' : 'down',
          connected: kafkaService.isConnected,
        },
      },
      circuitBreakers: circuitStats,
    };

    if (health.services.mongodb.status === 'down') {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  })
);

export default router;

