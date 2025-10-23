import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import config from '../config/config.js';

/**
 * JWT Authentication Middleware
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.get('jwt.secret'));

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or inactive',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error.message });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: error.message,
    });
  }
};

/**
 * API Key Authentication (for SDK and external integrations)
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        error: 'No API key provided',
        message: 'X-API-Key header required',
      });
    }

    const user = await User.findOne({ apiKey, isActive: true });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'API key not found or inactive',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('API key authentication failed', { error: error.message });
    return res.status(500).json({
      error: 'Authentication error',
      message: error.message,
    });
  }
};

/**
 * Role-based Authorization
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Please authenticate first',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user._id,
        requiredRoles: roles,
        userRole: req.user.role,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: `Required roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Permission-based Authorization
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    if (!req.user.permissions[permission]) {
      logger.warn('Permission denied', {
        userId: req.user._id,
        permission,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission required: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Service Access Control
 * Ensures user can only access their own services
 */
export const authorizeServiceAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Admins can access all services
  if (req.user.role === 'admin') {
    return next();
  }

  const serviceName = req.params.serviceName || req.body.serviceName;

  if (!serviceName) {
    return next(); // No specific service check needed
  }

  // Check if user has access to this service
  if (!req.user.services.includes(serviceName)) {
    logger.warn('Service access denied', {
      userId: req.user._id,
      serviceName,
    });

    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this service',
    });
  }

  next();
};

/**
 * Generate JWT token
 */
export const generateToken = (userId, expiresIn = '24h') => {
  return jwt.sign({ userId }, config.get('jwt.secret'), {
    expiresIn,
  });
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.get('jwt.secret'));
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore errors, authentication is optional
  }

  next();
};

