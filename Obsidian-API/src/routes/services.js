import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import healthCheckService from '../services/healthCheckService.js';
import circuitBreakerService from '../services/circuitBreakerService.js';
import githubService from '../services/githubService.js';
import Service from '../models/Service.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /api/services
 * @desc    Get all registered services
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const services = await healthCheckService.getAllServicesHealth();
    
    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  })
);

/**
 * @route   GET /api/services/:name
 * @desc    Get a specific service
 * @access  Public
 */
router.get(
  '/:name',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const service = await healthCheckService.getServiceHealth(name);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }
    
    res.json({
      success: true,
      data: service,
    });
  })
);

/**
 * @route   POST /api/services
 * @desc    Register a new service
 * @access  Public
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const serviceData = req.body;
    
    // If GitHub URL provided, fetch repository information
    if (serviceData.githubUrl) {
      try {
        const githubInfo = await githubService.getCompleteInfo(serviceData.githubUrl);
        serviceData.github = {
          url: serviceData.githubUrl,
          repository: githubInfo.repository,
          readme: githubInfo.readme.content,
          latestRelease: githubInfo.latestRelease,
        };
      } catch (error) {
        logger.warn('Failed to fetch GitHub info, continuing without it', {
          error: error.message,
        });
      }
    }
    
    const service = await healthCheckService.registerService(serviceData);
    
    res.status(201).json({
      success: true,
      message: 'Service registered successfully',
      data: service,
    });
  })
);

/**
 * @route   PUT /api/services/:name
 * @desc    Update a service
 * @access  Public
 */
router.put(
  '/:name',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const updates = req.body;
    
    const service = await Service.findOneAndUpdate(
      { name },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  })
);

/**
 * @route   DELETE /api/services/:name
 * @desc    Unregister a service
 * @access  Public
 */
router.delete(
  '/:name',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    await healthCheckService.unregisterService(name);
    
    res.json({
      success: true,
      message: 'Service unregistered successfully',
    });
  })
);

/**
 * @route   POST /api/services/:name/call
 * @desc    Make a proxied call to a service through circuit breaker
 * @access  Public
 */
router.post(
  '/:name/call',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { endpoint, method, data, headers } = req.body;
    
    const service = await Service.findOne({ name });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }
    
    const startTime = Date.now();
    
    try {
      const result = await circuitBreakerService.execute(
        service.name,
        service.url,
        endpoint,
        { method, data, headers }
      );
      
      const responseTime = Date.now() - startTime;
      const currentAvg = service.metrics?.averageResponseTime || 0;
      const totalRequests = (service.metrics?.totalRequests || 0) + 1;
      const newAvg = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;

      await Service.findOneAndUpdate(
        { name },
        {
          $inc: {
            'metrics.totalRequests': 1,
            'metrics.successfulRequests': 1,
          },
          $set: {
            'metrics.lastRequestTime': new Date(),
            'metrics.averageResponseTime': Math.round(newAvg),
          },
        }
      );
      
      res.json({
        success: true,
        data: result.data,
        responseTime: result.responseTime,
        status: result.status,
      });
    } catch (error) {
      // Update metrics for failed requests
      const responseTime = Date.now() - startTime;
      const currentAvg = service.metrics?.averageResponseTime || 0;
      const totalRequests = (service.metrics?.totalRequests || 0) + 1;
      const newAvg = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;

      await Service.findOneAndUpdate(
        { name },
        {
          $inc: {
            'metrics.totalRequests': 1,
            'metrics.failedRequests': 1,
          },
          $set: {
            'metrics.lastRequestTime': new Date(),
            'metrics.averageResponseTime': Math.round(newAvg),
          },
        }
      );
      
      throw error;
    }
  })
);

/**
 * @route   GET /api/services/:name/stats
 * @desc    Get circuit breaker statistics for a service
 * @access  Public
 */
router.get(
  '/:name/stats',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    const stats = circuitBreakerService.getStats(name);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Circuit breaker not found for this service',
      });
    }
    
    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   POST /api/services/:name/circuit/open
 * @desc    Manually open circuit breaker (for testing)
 * @access  Public
 */
router.post(
  '/:name/circuit/open',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    const result = circuitBreakerService.openCircuit(name);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Circuit breaker not found for this service',
      });
    }
    
    res.json({
      success: true,
      message: `Circuit breaker opened for ${name}`,
    });
  })
);

/**
 * @route   POST /api/services/:name/circuit/close
 * @desc    Manually close circuit breaker (for testing)
 * @access  Public
 */
router.post(
  '/:name/circuit/close',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    
    const result = circuitBreakerService.closeCircuit(name);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Circuit breaker not found for this service',
      });
    }
    
    res.json({
      success: true,
      message: `Circuit breaker closed for ${name}`,
    });
  })
);

/**
 * @route   POST /api/services/:name/heartbeat
 * @desc    Receive heartbeat from service instance
 * @access  Public
 */
router.post(
  '/:name/heartbeat',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { instanceId, metrics, timestamp } = req.body;
    
    // Update service status and last seen time
    await Service.findOneAndUpdate(
      { name },
      {
        $set: {
          status: 'healthy',
          'healthCheck.lastCheck': new Date(),
        },
      }
    );
    
    // Update metrics if provided
    if (metrics) {
      await Service.findOneAndUpdate(
        { name },
        {
          $set: {
            'metrics.totalRequests': metrics.requestCount || 0,
            'metrics.failedRequests': metrics.errorCount || 0,
            'metrics.averageResponseTime': metrics.averageResponseTime || 0,
            'metrics.lastRequestTime': new Date(),
          },
        }
      );
    }
    
    res.json({
      success: true,
      message: 'Heartbeat received',
    });
  })
);

/**
 * @route   POST /api/services/:name/metrics
 * @desc    Receive metrics from service instance
 * @access  Public
 */
router.post(
  '/:name/metrics',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { instanceId, endpoint, method, statusCode, responseTime, success, timestamp } = req.body;
    
    // Update service metrics
    await Service.findOneAndUpdate(
      { name },
      {
        $inc: {
          'metrics.totalRequests': 1,
          ...(success ? { 'metrics.successfulRequests': 1 } : { 'metrics.failedRequests': 1 }),
        },
        $set: {
          'metrics.lastRequestTime': new Date(),
        },
      }
    );
    
    // Update rolling average response time
    const service = await Service.findOne({ name });
    if (service?.metrics) {
      const currentAvg = service.metrics.averageResponseTime || 0;
      const totalRequests = service.metrics.totalRequests + 1;
      const newAvg = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;

      await Service.updateOne(
        { name },
        { $set: { 'metrics.averageResponseTime': Math.round(newAvg) } }
      );
    }
    
    res.json({
      success: true,
      message: 'Metrics received',
    });
  })
);

export default router;