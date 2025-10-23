import express from 'express';
import githubService from '../services/githubService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /api/github/repo
 * @desc    Get GitHub repository information
 */
router.get('/repo', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'GitHub URL is required',
      });
    }

    const repoInfo = await githubService.getRepoInfo(url);

    res.json({
      success: true,
      data: repoInfo,
    });
  } catch (error) {
    logger.error('Failed to fetch GitHub repo', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch repository information',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/github/readme
 * @desc    Get README content
 */
router.get('/readme', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'GitHub URL is required',
      });
    }

    const readme = await githubService.getReadme(url);

    res.json({
      success: true,
      data: readme,
    });
  } catch (error) {
    logger.error('Failed to fetch README', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch README',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/github/complete
 * @desc    Get complete GitHub information
 */
router.get('/complete', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'GitHub URL is required',
      });
    }

    const info = await githubService.getCompleteInfo(url);

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    logger.error('Failed to fetch GitHub info', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch GitHub information',
      message: error.message,
    });
  }
});

export default router;

