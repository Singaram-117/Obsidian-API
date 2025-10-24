import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import config from './config/config.js';
import logger from './utils/logger.js';
import { connectDB } from './db/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import initializeSocket from './socket/socketHandler.js';
import kafkaService from './services/kafkaService.js';
import healthCheckService from './services/healthCheckService.js';

// Import routes
import healthRoutes from './routes/health.js';
import servicesRoutes from './routes/services.js';
import eventsRoutes from './routes/events.js';
import metricsRoutes from './routes/metrics.js';
import queueRoutes from './routes/queue.js';
import integrationsRoutes from './routes/integrations.js';
import alertsRoutes from './routes/alerts.js';
import recommendationsRoutes from './routes/recommendations.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import githubRoutes from './routes/github.js';
import codeAnalyzerRoutes from './routes/codeAnalyzer.js';
import microserviceManagementRoutes from './routes/microserviceManagement.js';

/**
 * Initialize Express App
 */
const app = express();
const httpServer = createServer(app);

/**
 * Middleware
 */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

/**
 * Routes
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Obsidian MROP API',
    version: '1.0.0',
    description: 'Microservice Resilience & Observability Platform',
    status: 'running',
  });
});

// Health check routes (no rate limiting)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/code-analyzer', codeAnalyzerRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/microservice', microserviceManagementRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Initialize Socket.IO
 */
const io = initializeSocket(httpServer);

/**
 * Graceful Shutdown Handler
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    // Stop health checks
    healthCheckService.stopAllHealthChecks();
    
    // Close HTTP server
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });
    
    // Close Socket.IO
    io.close(() => {
      logger.info('Socket.IO closed');
    });
    
    // Disconnect from Kafka
    await kafkaService.disconnect();
    
    // Close database connection
    const { disconnectDB } = await import('./db/database.js');
    await disconnectDB();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      error: error.message,
    });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise,
  });
});

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Kafka (don't throw if it fails)
    try {
      await kafkaService.initialize();
    } catch (error) {
      logger.warn('Kafka initialization failed, continuing without Kafka', {
        error: error.message,
      });
    }
    
    // Start health checks
    await healthCheckService.startHealthChecks();
    
    // Start HTTP server
    const port = config.get('server.port');
    httpServer.listen(port, () => {
      logger.info(`Obsidian MROP API running on port ${port}`, {
        port,
        env: config.get('server.env'),
      });
      
      logger.info('Available endpoints:', {
        endpoints: [
          `http://localhost:${port}/`,
          `http://localhost:${port}/health`,
          `http://localhost:${port}/api/services`,
          `http://localhost:${port}/api/events`,
          `http://localhost:${port}/api/metrics`,
          `http://localhost:${port}/api/queue`,
        ],
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, httpServer, io };

