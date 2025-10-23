import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import serviceDiscoveryService from '../services/serviceDiscoveryService.js';
import gitIntegrationService from '../services/gitIntegrationService.js';

const router = express.Router();

/**
 * @route   POST /api/integrations/discovery/consul
 * @desc    Discover and register services from Consul
 * @access  Public
 */
router.post(
  '/discovery/consul',
  asyncHandler(async (req, res) => {
    const { consulUrl, periodic, interval } = req.body;

    const services = await serviceDiscoveryService.discoverFromConsul(consulUrl);

    if (periodic) {
      await serviceDiscoveryService.startPeriodicDiscovery(
        'consul',
        consulUrl,
        interval
      );
    }

    res.json({
      success: true,
      message: 'Services discovered from Consul',
      count: services.length,
      data: services,
    });
  })
);

/**
 * @route   POST /api/integrations/discovery/eureka
 * @desc    Discover and register services from Eureka
 * @access  Public
 */
router.post(
  '/discovery/eureka',
  asyncHandler(async (req, res) => {
    const { eurekaUrl, periodic, interval } = req.body;

    const services = await serviceDiscoveryService.discoverFromEureka(eurekaUrl);

    if (periodic) {
      await serviceDiscoveryService.startPeriodicDiscovery(
        'eureka',
        eurekaUrl,
        interval
      );
    }

    res.json({
      success: true,
      message: 'Services discovered from Eureka',
      count: services.length,
      data: services,
    });
  })
);

/**
 * @route   POST /api/integrations/discovery/kubernetes
 * @desc    Discover and register services from Kubernetes
 * @access  Public
 */
router.post(
  '/discovery/kubernetes',
  asyncHandler(async (req, res) => {
    const services = await serviceDiscoveryService.discoverFromKubernetes();

    res.json({
      success: true,
      message: 'Services discovered from Kubernetes',
      count: services.length,
      data: services,
    });
  })
);

/**
 * @route   POST /api/integrations/discovery/docker
 * @desc    Discover and register services from Docker
 * @access  Public
 */
router.post(
  '/discovery/docker',
  asyncHandler(async (req, res) => {
    const services = await serviceDiscoveryService.discoverFromDocker();

    res.json({
      success: true,
      message: 'Services discovered from Docker',
      count: services.length,
      data: services,
    });
  })
);

/**
 * @route   POST /api/integrations/git/register
 * @desc    Register service from Git repository
 * @access  Public
 */
router.post(
  '/git/register',
  asyncHandler(async (req, res) => {
    const gitConfig = req.body;

    const service = await gitIntegrationService.registerFromGit(gitConfig);

    res.status(201).json({
      success: true,
      message: 'Service registered from Git',
      data: service,
    });
  })
);

/**
 * @route   POST /api/integrations/git/webhook
 * @desc    Handle Git webhook for auto-deployment
 * @access  Public
 */
router.post(
  '/git/webhook',
  asyncHandler(async (req, res) => {
    const payload = req.body;

    await gitIntegrationService.handleWebhook(payload);

    res.json({
      success: true,
      message: 'Webhook processed',
    });
  })
);

/**
 * @route   GET /api/integrations/git/deployments
 * @desc    Get all Git deployments
 * @access  Public
 */
router.get(
  '/git/deployments',
  asyncHandler(async (req, res) => {
    const deployments = gitIntegrationService.getAllDeployments();

    res.json({
      success: true,
      data: deployments,
    });
  })
);

/**
 * @route   GET /api/integrations/git/deployments/:name
 * @desc    Get deployment status
 * @access  Public
 */
router.get(
  '/git/deployments/:name',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const deployment = gitIntegrationService.getDeploymentStatus(name);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found',
      });
    }

    res.json({
      success: true,
      data: deployment,
    });
  })
);

/**
 * @route   POST /api/integrations/git/deployments/:name/redeploy
 * @desc    Redeploy service
 * @access  Public
 */
router.post(
  '/git/deployments/:name/redeploy',
  asyncHandler(async (req, res) => {
    const { name } = req.params;

    await gitIntegrationService.redeployService(name);

    res.json({
      success: true,
      message: `Service ${name} redeployed successfully`,
    });
  })
);

/**
 * @route   DELETE /api/integrations/git/deployments/:name
 * @desc    Stop and remove deployment
 * @access  Public
 */
router.delete(
  '/git/deployments/:name',
  asyncHandler(async (req, res) => {
    const { name } = req.params;

    await gitIntegrationService.stopService(name);

    res.json({
      success: true,
      message: `Service ${name} stopped`,
    });
  })
);

/**
 * @route   POST /api/services/:name/heartbeat
 * @desc    Receive heartbeat from agent
 * @access  Public
 */
router.post(
  '/:name/heartbeat',
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { timestamp, metrics } = req.body;

    // Update service metadata with heartbeat info
    // This could be stored or used for health calculations

    res.json({
      success: true,
      message: 'Heartbeat received',
    });
  })
);

export default router;

