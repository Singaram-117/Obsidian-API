import express from 'express';
import User from '../models/User.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, organization } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, password, and name are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'An account with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      organization: organization || '',
      role: 'user',
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info('User registered', {
      userId: user._id,
      email: user.email,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({
      error: 'Registration failed',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required',
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info('User logged in', {
      userId: user._id,
      email: user.email,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(500).json({
      error: 'Login failed',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        organization: req.user.organization,
        services: req.user.services,
        permissions: req.user.permissions,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    logger.error('Failed to get user', { error: error.message });
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/api-key
 * @desc    Generate API key
 */
router.post('/api-key', authenticate, async (req, res) => {
  try {
    const apiKey = req.user.generateApiKey();
    await req.user.save();

    logger.info('API key generated', { userId: req.user._id });

    res.json({
      message: 'API key generated successfully',
      apiKey,
    });
  } catch (error) {
    logger.error('Failed to generate API key', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate API key',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 */
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Current and new password are required',
      });
    }

    // Verify current password
    const isValid = await req.user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Current password is incorrect',
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    logger.info('Password changed', { userId: req.user._id });

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Failed to change password', { error: error.message });
    res.status(500).json({
      error: 'Failed to change password',
      message: error.message,
    });
  }
});

export default router;

