import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import endpointDiscoveryService from '../services/endpointDiscoveryService.js';
import rateLimitService from '../services/rateLimitService.js';
import loadBalancerService from '../services/loadBalancerService.js';
import responseCacheService from '../services/responseCacheService.js';
import Service from '../models/Service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================
// ENDPOINT DISCOVERY
// ============================================

/**
 * @route   POST /api/microservice/:serviceName/discover-endpoints
 * @desc    Discover all endpoints of a microservice
 * @access  Public
 */
router.post(
  '/:serviceName/discover-endpoints',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;

    const service = await Service.findOne({ name: serviceName });
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    const discovery = await endpointDiscoveryService.discoverEndpoints(
      service.url,
      serviceName
    );

    // Save discovered endpoints
    service.endpoints = discovery.endpoints;
    service.endpointsDiscoveredAt = new Date();
    await service.save();

    res.json({
      success: true,
      data: discovery,
    });
  })
);

/**
 * @route   GET /api/microservice/:serviceName/endpoints
 * @desc    Get discovered endpoints for a service
 * @access  Public
 */
router.get(
  '/:serviceName/endpoints',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;

    const service = await Service.findOne({ name: serviceName });
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    res.json({
      success: true,
      data: {
        endpoints: service.endpoints || [],
        discoveredAt: service.endpointsDiscoveredAt,
      },
    });
  })
);

// ============================================
// RATE LIMITING
// ============================================

/**
 * @route   PUT /api/microservice/:serviceName/rate-limit
 * @desc    Update service-level rate limit
 * @access  Public
 */
router.put(
  '/:serviceName/rate-limit',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { enabled, requestsPerMinute } = req.body;

    const config = await rateLimitService.updateServiceRateLimit(serviceName, {
      enabled,
      requestsPerMinute,
    });

    res.json({
      success: true,
      message: 'Service rate limit updated',
      data: config,
    });
  })
);

/**
 * @route   PUT /api/microservice/:serviceName/endpoint-rate-limit
 * @desc    Update endpoint-level rate limit
 * @access  Public
 */
router.put(
  '/:serviceName/endpoint-rate-limit',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { endpoint, enabled, requestsPerMinute } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint path is required',
      });
    }

    const config = await rateLimitService.updateEndpointRateLimit(
      serviceName,
      endpoint,
      {
        enabled,
        requestsPerMinute,
      }
    );

    res.json({
      success: true,
      message: 'Endpoint rate limit updated',
      data: config,
    });
  })
);

/**
 * @route   PUT /api/microservice/:serviceName/client-rate-limit
 * @desc    Update client-level rate limit
 * @access  Public
 */
router.put(
  '/:serviceName/client-rate-limit',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { enabled, requestsPerMinute } = req.body;

    const config = await rateLimitService.updateClientRateLimit(serviceName, {
      enabled,
      requestsPerMinute,
    });

    res.json({
      success: true,
      message: 'Client rate limit updated',
      data: config,
    });
  })
);

/**
 * @route   GET /api/microservice/:serviceName/rate-limit-status
 * @desc    Get rate limit status for a service
 * @access  Public
 */
router.get(
  '/:serviceName/rate-limit-status',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;

    const status = await rateLimitService.getRateLimitStatus(serviceName);

    res.json({
      success: true,
      data: status,
    });
  })
);

/**
 * @route   POST /api/microservice/:serviceName/rate-limit-reset
 * @desc    Reset rate limit buckets for a service
 * @access  Public
 */
router.post(
  '/:serviceName/rate-limit-reset',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;

    const result = await rateLimitService.resetServiceLimits(serviceName);

    res.json({
      success: true,
      message: 'Rate limits reset',
      data: result,
    });
  })
);

// ============================================
// LOAD BALANCING
// ============================================

/**
 * @route   POST /api/microservice/:serviceName/instances
 * @desc    Register a new service instance
 * @access  Public
 */
router.post(
  '/:serviceName/instances',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { url, weight, metadata, trafficPercentage, isCanary } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Instance URL is required',
      });
    }

    // Enable load balancing for the service
    const service = await Service.findOne({ name: serviceName });
    if (service && !service.loadBalancing?.enabled) {
      service.loadBalancing = {
        enabled: true,
        strategy: 'round-robin',
        stickySession: false,
      };
      await service.save();
    }

    const instance = await loadBalancerService.registerInstance({
      serviceName,
      url,
      weight,
      metadata,
      trafficPercentage,
      isCanary,
    });

    res.status(201).json({
      success: true,
      message: 'Service instance registered',
      data: instance,
    });
  })
);

/**
 * @route   GET /api/microservice/:serviceName/instances
 * @desc    Get all instances for a service
 * @access  Public
 */
router.get(
  '/:serviceName/instances',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;

    const instances = await loadBalancerService.getAllInstances(serviceName);

    res.json({
      success: true,
      data: instances,
    });
  })
);

/**
 * @route   DELETE /api/microservice/:serviceName/instances/:instanceId
 * @desc    Deregister a service instance
 * @access  Public
 */
router.delete(
  '/:serviceName/instances/:instanceId',
  asyncHandler(async (req, res) => {
    const { instanceId } = req.params;

    const instance = await loadBalancerService.deregisterInstance(instanceId);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    res.json({
      success: true,
      message: 'Service instance deregistered',
      data: instance,
    });
  })
);

/**
 * @route   PUT /api/microservice/:serviceName/instances/:instanceId/status
 * @desc    Update instance status (enable, disable, drain)
 * @access  Public
 */
router.put(
  '/:serviceName/instances/:instanceId/status',
  asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    const { action } = req.body; // enable, disable, drain

    let instance;

    switch (action) {
      case 'enable':
        instance = await loadBalancerService.enableInstance(instanceId);
        break;
      case 'disable':
        instance = await loadBalancerService.disableInstance(instanceId);
        break;
      case 'drain':
        instance = await loadBalancerService.drainInstance(instanceId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use: enable, disable, or drain',
        });
    }

    res.json({
      success: true,
      message: `Instance ${action}d`,
      data: instance,
    });
  })
);

/**
 * @route   PUT /api/microservice/:serviceName/load-balancing
 * @desc    Update load balancing configuration
 * @access  Public
 */
router.put(
  '/:serviceName/load-balancing',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { enabled, strategy, stickySession } = req.body;

    const service = await Service.findOne({ name: serviceName });
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    service.loadBalancing = {
      enabled: enabled !== undefined ? enabled : service.loadBalancing?.enabled || false,
      strategy: strategy || service.loadBalancing?.strategy || 'round-robin',
      stickySession:
        stickySession !== undefined
          ? stickySession
          : service.loadBalancing?.stickySession || false,
    };

    await service.save();

    res.json({
      success: true,
      message: 'Load balancing configuration updated',
      data: service.loadBalancing,
    });
  })
);

/**
 * @route   GET /api/microservice/:serviceName/instances/stats
 * @desc    Get instance statistics
 * @access  Public
 */
router.get(
  '/:serviceName/instances/stats',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;

    const stats = await loadBalancerService.getInstanceStats(serviceName);

    res.json({
      success: true,
      data: stats,
    });
  })
);

// ============================================
// CACHING
// ============================================

/**
 * @route   PUT /api/microservice/:serviceName/cache
 * @desc    Update cache configuration
 * @access  Public
 */
router.put(
  '/:serviceName/cache',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { enabled, ttl, endpoints } = req.body;

    const service = await Service.findOne({ name: serviceName });
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    service.cache = {
      enabled: enabled !== undefined ? enabled : service.cache?.enabled || false,
      ttl: ttl || service.cache?.ttl || 60000,
      endpoints: endpoints || service.cache?.endpoints || new Map(),
    };

    await service.save();

    res.json({
      success: true,
      message: 'Cache configuration updated',
      data: service.cache,
    });
  })
);

/**
 * @route   GET /api/microservice/:serviceName/cache/stats
 * @desc    Get cache statistics
 * @access  Public
 */
router.get(
  '/:serviceName/cache/stats',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;

    const stats = responseCacheService.getServiceStats(serviceName);

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   POST /api/microservice/:serviceName/cache/invalidate
 * @desc    Invalidate cache for a service
 * @access  Public
 */
router.post(
  '/:serviceName/cache/invalidate',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { endpoint } = req.body;

    let result;

    if (endpoint) {
      result = responseCacheService.invalidateEndpoint(serviceName, endpoint);
    } else {
      result = responseCacheService.invalidateService(serviceName);
    }

    res.json({
      success: true,
      message: 'Cache invalidated',
      data: result,
    });
  })
);

/**
 * @route   GET /api/microservice/cache/stats
 * @desc    Get global cache statistics
 * @access  Public
 */
router.get(
  '/cache/stats',
  asyncHandler(async (req, res) => {
    const stats = responseCacheService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// ============================================
// COMPREHENSIVE SERVICE MANAGEMENT
// ============================================

/**
 * @route   GET /api/microservice/:serviceName/overview
 * @desc    Get comprehensive overview of a service
 * @access  Public
 */
router.get(
  '/:serviceName/overview',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;

    const service = await Service.findOne({ name: serviceName });
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Get all related data
    const [instances, instanceStats, rateLimitStatus, cacheStats] = await Promise.all([
      loadBalancerService.getAllInstances(serviceName),
      loadBalancerService.getInstanceStats(serviceName),
      rateLimitService.getRateLimitStatus(serviceName),
      responseCacheService.getServiceStats(serviceName),
    ]);

    res.json({
      success: true,
      data: {
        service: {
          name: service.name,
          url: service.url,
          status: service.status,
          circuitStatus: service.circuitStatus,
          description: service.description,
          github: service.github,
        },
        endpoints: service.endpoints || [],
        endpointsDiscoveredAt: service.endpointsDiscoveredAt,
        metrics: service.metrics,
        rateLimit: rateLimitStatus,
        cache: {
          config: service.cache,
          stats: cacheStats,
        },
        loadBalancing: {
          config: service.loadBalancing,
          instances,
          stats: instanceStats,
        },
      },
    });
  })
);

export default router;

