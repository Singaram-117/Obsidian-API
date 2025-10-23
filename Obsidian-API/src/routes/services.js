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
    
    try {
      const result = await circuitBreakerService.execute(
        service.name,
        service.url,
        endpoint,
        { method, data, headers }
      );
      
      // Update metrics
      await Service.findOneAndUpdate(
        { name },
        {
          $inc: {
            'metrics.totalRequests': 1,
            'metrics.successfulRequests': 1,
          },
          $set: {
            'metrics.lastRequestTime': new Date(),
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
      // Update metrics
      await Service.findOneAndUpdate(
        { name },
        {
          $inc: {
            'metrics.totalRequests': 1,
            'metrics.failedRequests': 1,
          },
          $set: {
            'metrics.lastRequestTime': new Date(),
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

export default router;

