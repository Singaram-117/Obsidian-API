import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Initialize database with default data
 */
async function initDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.get('database.url'));
    logger.info('Connected to MongoDB');

    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@obsidian.dev' });
    
    if (!adminUser) {
      // Create default admin user
      const admin = new User({
        email: 'admin@obsidian.dev',
        password: 'Admin@123',
        name: 'Obsidian Admin',
        role: 'admin',
        organization: 'Obsidian MROP',
        permissions: {
          canCreateServices: true,
          canDeleteServices: true,
          canManageUsers: true,
          canViewMetrics: true,
          canConfigureAlerts: true,
          canRunChaos: true,
        },
      });

      await admin.save();
      logger.info('Default admin user created: admin@obsidian.dev / Admin@123');
    } else {
      logger.info('Admin user already exists');
    }

    // Create demo services if they don't exist
    const demoServices = [
      {
        name: 'orders',
        url: 'http://localhost:4001',
        description: 'Orders microservice for managing customer orders',
        status: 'healthy',
        healthCheckUrl: 'http://localhost:4001/health',
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
        },
        loadBalancing: {
          strategy: 'round-robin',
          instances: [
            {
              instanceId: 'orders-1',
              url: 'http://localhost:4001',
              status: 'healthy',
            },
          ],
        },
        cache: {
          enabled: true,
          ttl: 300,
        },
        rateLimit: {
          enabled: true,
          requestsPerMinute: 100,
        },
      },
      {
        name: 'booking',
        url: 'http://localhost:4002',
        description: 'Booking microservice for managing reservations',
        status: 'healthy',
        healthCheckUrl: 'http://localhost:4002/health',
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
        },
        loadBalancing: {
          strategy: 'round-robin',
          instances: [
            {
              instanceId: 'booking-1',
              url: 'http://localhost:4002',
              status: 'healthy',
            },
          ],
        },
        cache: {
          enabled: true,
          ttl: 300,
        },
        rateLimit: {
          enabled: true,
          requestsPerMinute: 100,
        },
      },
      {
        name: 'payment',
        url: 'http://localhost:4003',
        description: 'Payment microservice for processing transactions',
        status: 'healthy',
        healthCheckUrl: 'http://localhost:4003/health',
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
        },
        loadBalancing: {
          strategy: 'round-robin',
          instances: [
            {
              instanceId: 'payment-1',
              url: 'http://localhost:4003',
              status: 'healthy',
            },
          ],
        },
        cache: {
          enabled: true,
          ttl: 300,
        },
        rateLimit: {
          enabled: true,
          requestsPerMinute: 100,
        },
      },
    ];

    for (const serviceData of demoServices) {
      const existingService = await Service.findOne({ name: serviceData.name });
      if (!existingService) {
        const service = new Service(serviceData);
        await service.save();
        logger.info(`Demo service created: ${serviceData.name}`);
      } else {
        logger.info(`Demo service already exists: ${serviceData.name}`);
      }
    }

    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
}

export { initDatabase };
