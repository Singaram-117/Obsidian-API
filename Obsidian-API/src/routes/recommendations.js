import express from 'express';
import recommendationService from '../services/recommendationService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /api/recommendations/:serviceName
 * @desc    Get recommendations for a specific service
 */
router.get('/:serviceName', async (req, res) => {
  try {
    const recommendations = await recommendationService.generateRecommendations(
      req.params.serviceName
    );
    res.json(recommendations);
  } catch (error) {
    logger.error('Failed to get recommendations', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/recommendations
 * @desc    Get system-wide recommendations
 */
router.get('/', async (req, res) => {
  try {
    const recommendations = await recommendationService.getSystemRecommendations();
    res.json(recommendations);
  } catch (error) {
    logger.error('Failed to get system recommendations', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/recommendations/quick-wins
 * @desc    Get quick win recommendations
 */
router.get('/quick-wins/list', async (req, res) => {
  try {
    const quickWins = await recommendationService.getQuickWins();
    res.json(quickWins);
  } catch (error) {
    logger.error('Failed to get quick wins', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;

