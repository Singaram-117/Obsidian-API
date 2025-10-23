import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { eventEmitter } from '../services/eventService.js';
import Event from '../models/Event.js';

const router = express.Router();

/**
 * @route   GET /api/events
 * @desc    Get recent events
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit = 100, type, severity, serviceName } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (serviceName) filter.serviceName = serviceName;
    
    const events = await eventEmitter.getRecentEvents(parseInt(limit), filter);
    
    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  })
);

/**
 * @route   GET /api/events/service/:serviceName
 * @desc    Get events for a specific service
 * @access  Public
 */
router.get(
  '/service/:serviceName',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { limit = 100 } = req.query;
    
    const events = await eventEmitter.getEventsByService(
      serviceName,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  })
);

/**
 * @route   GET /api/events/type/:type
 * @desc    Get events by type
 * @access  Public
 */
router.get(
  '/type/:type',
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { limit = 100 } = req.query;
    
    const events = await eventEmitter.getEventsByType(type, parseInt(limit));
    
    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  })
);

/**
 * @route   GET /api/events/severity/:severity
 * @desc    Get events by severity
 * @access  Public
 */
router.get(
  '/severity/:severity',
  asyncHandler(async (req, res) => {
    const { severity } = req.params;
    const { limit = 100 } = req.query;
    
    const events = await eventEmitter.getEventsBySeverity(
      severity,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  })
);

/**
 * @route   GET /api/events/stats
 * @desc    Get event statistics
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await Event.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            severity: '$severity',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    
    const totalEvents = await Event.countDocuments();
    
    res.json({
      success: true,
      data: {
        total: totalEvents,
        breakdown: stats,
      },
    });
  })
);

export default router;

