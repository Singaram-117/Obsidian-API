import express from 'express';
import apiGatewayService from '../services/apiGatewayService.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * API Gateway Routes - Proxy Pattern Implementation
 * All microservice requests go through the gateway with resilience patterns
 */

/**
 * @route   ALL /api/gateway/:serviceName/*
 * @desc    Proxy all requests to microservices through the gateway
 * @access  Public (rate limited and authenticated as needed)
 */
router.all('/:serviceName/*', asyncHandler(async (req, res) => {
  const { serviceName } = req.params;
  let endpoint = req.params[0] || '/';
  
  // Ensure endpoint starts with /
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  const method = req.method;
  const data = req.method !== 'GET' ? req.body : null;
  const headers = req.headers;

  // Extract client information for rate limiting
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    // Add API key or user info if authenticated
  };

  logger.info('Gateway request received', {
    serviceName,
    rawEndpoint: req.params[0],
    endpoint,
    method,
    clientIP: clientInfo.ip,
    fullUrl: req.originalUrl,
  });

  try {
    const response = await apiGatewayService.handleRequest(
      serviceName,
      endpoint,
      method,
      data,
      headers,
      clientInfo
    );

    // Set response headers from gateway
    Object.keys(response.headers).forEach(header => {
      res.set(header, response.headers[header]);
    });

    // Send response
    res.status(response.status).json(response.data);

  } catch (error) {
    logger.error('Gateway request failed', {
      serviceName,
      endpoint,
      method,
      error: error.message,
    });

    res.status(error.status || 500).json({
      error: 'Gateway request failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * @route   GET /api/gateway/health
 * @desc    Gateway health check
 * @access  Public
 */
router.get('/health', asyncHandler(async (req, res) => {
  const health = await apiGatewayService.healthCheck();
  res.json({
    success: true,
    data: health,
  });
}));

/**
 * @route   GET /api/gateway/services
 * @desc    List all available services through gateway
 * @access  Public
 */
router.get('/services', asyncHandler(async (req, res) => {
  // This would list services that can be accessed through the gateway
  // For now, return a placeholder
  res.json({
    success: true,
    data: {
      services: ['orders', 'booking', 'payment'],
      gateway: {
        version: '1.0',
        patterns: ['proxy', 'rate-limiting', 'load-balancing', 'caching', 'circuit-breaker'],
      },
    },
  });
}));

export default router;
