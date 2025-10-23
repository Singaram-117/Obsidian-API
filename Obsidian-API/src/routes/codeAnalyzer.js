import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import codeAnalyzerService from '../services/codeAnalyzerService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   POST /api/code-analyzer/analyze
 * @desc    Analyze a GitHub repository
 * @access  Public
 */
router.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const { githubUrl } = req.body;

    if (!githubUrl) {
      return res.status(400).json({
        success: false,
        error: 'GitHub URL is required',
      });
    }

    logger.info('Analyzing repository', { githubUrl });

    const analysis = await codeAnalyzerService.analyzeRepository(githubUrl);

    res.json({
      success: true,
      data: analysis,
    });
  })
);

/**
 * @route   GET /api/code-analyzer/structure
 * @desc    Get repository structure only
 * @access  Public
 */
router.get(
  '/structure',
  asyncHandler(async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Repository URL is required',
      });
    }

    const structure = await codeAnalyzerService.fetchRepoStructure(url);

    res.json({
      success: true,
      data: structure,
    });
  })
);

export default router;

