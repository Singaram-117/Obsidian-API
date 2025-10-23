import express from 'express';
import alertingService from '../services/alertingService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /api/alerts/rules
 * @desc    Get all alert rules
 */
router.get('/rules', (req, res) => {
  try {
    const rules = alertingService.getRules();
    res.json(rules);
  } catch (error) {
    logger.error('Failed to get alert rules', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/alerts/rules
 * @desc    Create new alert rule
 */
router.post('/rules', (req, res) => {
  try {
    const rule = alertingService.createRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    logger.error('Failed to create alert rule', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/alerts/rules/:ruleId
 * @desc    Update alert rule
 */
router.put('/rules/:ruleId', (req, res) => {
  try {
    const rule = alertingService.updateRule(req.params.ruleId, req.body);
    res.json(rule);
  } catch (error) {
    logger.error('Failed to update alert rule', { error: error.message });
    res.status(404).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/alerts/rules/:ruleId
 * @desc    Delete alert rule
 */
router.delete('/rules/:ruleId', (req, res) => {
  try {
    const deleted = alertingService.deleteRule(req.params.ruleId);
    if (deleted) {
      res.json({ message: 'Rule deleted successfully' });
    } else {
      res.status(404).json({ error: 'Rule not found' });
    }
  } catch (error) {
    logger.error('Failed to delete alert rule', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/alerts/history
 * @desc    Get alert history
 */
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = alertingService.getAlertHistory(limit);
    res.json(history);
  } catch (error) {
    logger.error('Failed to get alert history', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/alerts/stats
 * @desc    Get alerting statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = alertingService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get alert stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;

