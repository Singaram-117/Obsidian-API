import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import Metric from '../models/Metric.js';

const router = express.Router();

/**
 * @route   GET /api/metrics
 * @desc    Get metrics with filtering
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      serviceName,
      metricType,
      startTime,
      endTime,
      limit = 1000,
    } = req.query;
    
    const filter = {};
    if (serviceName) filter.serviceName = serviceName;
    if (metricType) filter.metricType = metricType;
    
    if (startTime || endTime) {
      filter.timestamp = {};
      if (startTime) filter.timestamp.$gte = new Date(startTime);
      if (endTime) filter.timestamp.$lte = new Date(endTime);
    }
    
    const metrics = await Metric.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      count: metrics.length,
      data: metrics,
    });
  })
);

/**
 * @route   POST /api/metrics
 * @desc    Record a new metric
 * @access  Public
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const metricData = req.body;
    
    const metric = new Metric(metricData);
    await metric.save();
    
    res.status(201).json({
      success: true,
      message: 'Metric recorded successfully',
      data: metric,
    });
  })
);

/**
 * @route   GET /api/metrics/service/:serviceName
 * @desc    Get metrics for a specific service
 * @access  Public
 */
router.get(
  '/service/:serviceName',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { metricType, limit = 1000 } = req.query;
    
    const filter = { serviceName };
    if (metricType) filter.metricType = metricType;
    
    const metrics = await Metric.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      count: metrics.length,
      data: metrics,
    });
  })
);

/**
 * @route   GET /api/metrics/aggregate
 * @desc    Get aggregated metrics
 * @access  Public
 */
router.get(
  '/aggregate',
  asyncHandler(async (req, res) => {
    const { serviceName, metricType, interval = 'minute' } = req.query;
    
    const match = {};
    if (serviceName) match.serviceName = serviceName;
    if (metricType) match.metricType = metricType;
    
    // Define time grouping based on interval
    const timeGroup = {
      minute: {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' },
        minute: { $minute: '$timestamp' },
      },
      hour: {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' },
      },
      day: {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
      },
    };
    
    const aggregation = await Metric.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            ...timeGroup[interval],
            serviceName: '$serviceName',
            metricType: '$metricType',
          },
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 100 },
    ]);
    
    res.json({
      success: true,
      data: aggregation,
    });
  })
);

export default router;

