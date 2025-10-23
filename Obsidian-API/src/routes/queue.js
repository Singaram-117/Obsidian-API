import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import queueService from '../services/queueService.js';

const router = express.Router();

/**
 * @route   GET /api/queue/stats
 * @desc    Get all queue statistics
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await queueService.getAllQueueStats();
    
    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   GET /api/queue/:queueName/stats
 * @desc    Get statistics for a specific queue
 * @access  Public
 */
router.get(
  '/:queueName/stats',
  asyncHandler(async (req, res) => {
    const { queueName } = req.params;
    
    const stats = await queueService.getQueueStats(queueName);
    
    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   POST /api/queue/:queueName/job
 * @desc    Add a job to a queue
 * @access  Public
 */
router.post(
  '/:queueName/job',
  asyncHandler(async (req, res) => {
    const { queueName } = req.params;
    const jobData = req.body;
    
    const job = await queueService.addJob(queueName, jobData);
    
    res.status(202).json({
      success: true,
      message: 'Job added to queue',
      data: {
        jobId: job.id,
        queueName,
      },
    });
  })
);

/**
 * @route   POST /api/queue/:queueName/pause
 * @desc    Pause a queue
 * @access  Public
 */
router.post(
  '/:queueName/pause',
  asyncHandler(async (req, res) => {
    const { queueName } = req.params;
    
    await queueService.pauseQueue(queueName);
    
    res.json({
      success: true,
      message: `Queue ${queueName} paused`,
    });
  })
);

/**
 * @route   POST /api/queue/:queueName/resume
 * @desc    Resume a queue
 * @access  Public
 */
router.post(
  '/:queueName/resume',
  asyncHandler(async (req, res) => {
    const { queueName } = req.params;
    
    await queueService.resumeQueue(queueName);
    
    res.json({
      success: true,
      message: `Queue ${queueName} resumed`,
    });
  })
);

/**
 * @route   DELETE /api/queue/:queueName/clean
 * @desc    Clean completed jobs from a queue
 * @access  Public
 */
router.delete(
  '/:queueName/clean',
  asyncHandler(async (req, res) => {
    const { queueName } = req.params;
    const { grace = 1000 } = req.query;
    
    await queueService.cleanQueue(queueName, parseInt(grace));
    
    res.json({
      success: true,
      message: `Queue ${queueName} cleaned`,
    });
  })
);

export default router;

