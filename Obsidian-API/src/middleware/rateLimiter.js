import rateLimit from 'express-rate-limit';
import config from '../config/config.js';
import { eventEmitter } from '../services/eventService.js';
import logger from '../utils/logger.js';

/**
 * Rate Limiter Middleware
 * Protects API from being overwhelmed
 */
export const apiLimiter = rateLimit({
  windowMs: config.get('rateLimit.windowMs'),
  max: 100||config.get('rateLimit.maxRequests'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: config.get('rateLimit.windowMs') / 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    logger.warn('Rate limit exceeded', {
      ip,
      path: req.path,
      method: req.method,
    });
    
    eventEmitter.emit('rateLimit:exceeded', {
      ip,
      path: req.path,
      method: req.method,
      timestamp: new Date(),
    });
    
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: config.get('rateLimit.windowMs') / 1000,
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests to this endpoint, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Login rate limiter
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export default { apiLimiter, strictLimiter, loginLimiter };