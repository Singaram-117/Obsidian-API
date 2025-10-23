import express from 'express';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Event from '../models/Event.js';
import Metric from '../models/Metric.js';
import { authenticate, authorize, requirePermission } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import circuitBreakerService from '../services/circuitBreakerService.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard stats
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalServices,
      healthyServices,
      totalEvents,
      totalMetrics,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Service.countDocuments(),
      Service.countDocuments({ status: 'healthy' }),
      Event.countDocuments(),
      Metric.countDocuments(),
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    const recentEvents = await Event.find()
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        services: {
          total: totalServices,
          healthy: healthyServices,
          unhealthy: totalServices - healthyServices,
        },
        events: {
          total: totalEvents,
        },
        metrics: {
          total: totalMetrics,
        },
      },
      recentUsers,
      recentEvents,
    });
  } catch (error) {
    logger.error('Failed to get admin dashboard', { error: error.message });
    res.status(500).json({
      error: 'Failed to get dashboard',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      users,
      total: users.length,
    });
  } catch (error) {
    logger.error('Failed to get users', { error: error.message });
    res.status(500).json({
      error: 'Failed to get users',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create new user (admin)
 */
router.post('/users', async (req, res) => {
  try {
    const { email, password, name, role, organization, permissions } = req.body;

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'user',
      organization: organization || '',
      permissions: permissions || {},
    });

    logger.info('User created by admin', {
      adminId: req.user._id,
      userId: user._id,
    });

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    logger.error('Failed to create user', { error: error.message });
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Don't allow password updates through this endpoint
    delete updates.password;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    logger.info('User updated by admin', {
      adminId: req.user._id,
      userId: user._id,
    });

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    logger.error('Failed to update user', { error: error.message });
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    logger.info('User deleted by admin', {
      adminId: req.user._id,
      userId: user._id,
    });

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete user', { error: error.message });
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/admin/users/:userId/toggle-active
 * @desc    Toggle user active status
 */
router.post('/users/:userId/toggle-active', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info('User status toggled', {
      adminId: req.user._id,
      userId: user._id,
      isActive: user.isActive,
    });

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    logger.error('Failed to toggle user status', { error: error.message });
    res.status(500).json({
      error: 'Failed to toggle user status',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/admin/services
 * @desc    Get all services (admin view)
 */
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    const servicesWithStats = services.map((service) => {
      const breaker = circuitBreakerService.getBreaker(service.name);

      return {
        ...service.toObject(),
        circuitBreaker: breaker
          ? {
              state: breaker.opened ? 'open' : 'closed',
              stats: breaker.stats,
            }
          : null,
      };
    });

    res.json({
      services: servicesWithStats,
      total: services.length,
    });
  } catch (error) {
    logger.error('Failed to get services', { error: error.message });
    res.status(500).json({
      error: 'Failed to get services',
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/admin/services/:serviceName
 * @desc    Delete service
 */
router.delete('/services/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;

    const service = await Service.findOneAndDelete({ name: serviceName });

    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
      });
    }

    logger.info('Service deleted by admin', {
      adminId: req.user._id,
      serviceName,
    });

    res.json({
      message: 'Service deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete service', { error: error.message });
    res.status(500).json({
      error: 'Failed to delete service',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/admin/system-health
 * @desc    Get system health metrics
 */
router.get('/system-health', async (req, res) => {
  try {
    const services = await Service.find();

    const openCircuits = services.filter((s) => {
      const breaker = circuitBreakerService.getBreaker(s.name);
      return breaker && breaker.opened;
    }).length;

    const avgResponseTime =
      services.reduce((sum, s) => sum + (s.metrics.averageResponseTime || 0), 0) /
      (services.length || 1);

    const totalRequests = services.reduce(
      (sum, s) => sum + (s.metrics.totalRequests || 0),
      0
    );

    const totalFailures = services.reduce(
      (sum, s) => sum + (s.metrics.failedRequests || 0),
      0
    );

    const errorRate = totalRequests > 0 ? (totalFailures / totalRequests) * 100 : 0;

    res.json({
      health: {
        status: openCircuits === 0 && errorRate < 5 ? 'healthy' : 'degraded',
        services: {
          total: services.length,
          healthy: services.filter((s) => s.status === 'healthy').length,
          degraded: services.filter((s) => s.status === 'degraded').length,
          down: services.filter((s) => s.status === 'down').length,
        },
        circuits: {
          open: openCircuits,
          closed: services.length - openCircuits,
        },
        metrics: {
          avgResponseTime: avgResponseTime.toFixed(2),
          totalRequests,
          errorRate: errorRate.toFixed(2) + '%',
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get system health', { error: error.message });
    res.status(500).json({
      error: 'Failed to get system health',
      message: error.message,
    });
  }
});

export default router;

