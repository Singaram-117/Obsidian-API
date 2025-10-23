import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import logger from '../utils/logger.js';
import healthCheckService from './healthCheckService.js';

const execAsync = promisify(exec);

/**
 * Git Integration Service
 * Handles Git-based service deployment and monitoring
 */
class GitIntegrationService {
  constructor() {
    this.repoDirectory = process.env.REPOS_DIR || './repos';
    this.deployments = new Map();
  }

  /**
   * Initialize repository directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.repoDirectory, { recursive: true });
      logger.info('Git integration service initialized', {
        repoDirectory: this.repoDirectory,
      });
    } catch (error) {
      logger.error('Failed to initialize Git integration', {
        error: error.message,
      });
    }
  }

  /**
   * Register service from Git repository
   */
  async registerFromGit(gitConfig) {
    const {
      name,
      repoUrl,
      branch = 'main',
      buildCommand = 'npm install',
      startCommand = 'npm start',
      port,
      healthEndpoint = '/health',
      envVars = {},
    } = gitConfig;

    try {
      logger.info('Registering service from Git', { name, repoUrl });

      // Clone repository
      const repoPath = path.join(this.repoDirectory, name);
      await this.cloneOrPullRepo(repoUrl, repoPath, branch);

      // Read obsidian.config.json if exists
      const config = await this.readObsidianConfig(repoPath);

      // Build the service
      await this.buildService(repoPath, config?.buildCommand || buildCommand);

      // Start the service
      const serviceUrl = await this.startService(
        name,
        repoPath,
        config?.startCommand || startCommand,
        config?.port || port,
        { ...config?.envVars, ...envVars }
      );

      // Register with health check service
      const service = await healthCheckService.registerService({
        name,
        url: serviceUrl,
        metadata: {
          repoUrl,
          branch,
          deploymentMethod: 'git',
          configPath: repoPath,
        },
        healthCheck: {
          endpoint: config?.healthEndpoint || healthEndpoint,
          interval: 30000,
          timeout: 5000,
        },
      });

      this.deployments.set(name, {
        repoPath,
        repoUrl,
        branch,
        serviceUrl,
        pid: this.deployments.get(name)?.pid,
      });

      logger.info('Service registered from Git successfully', { name });

      return service;
    } catch (error) {
      logger.error('Failed to register service from Git', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Clone or pull repository
   */
  async cloneOrPullRepo(repoUrl, repoPath, branch) {
    try {
      // Check if repo already exists
      const exists = await fs
        .access(repoPath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        logger.info('Pulling latest changes', { repoPath });
        await execAsync(`cd ${repoPath} && git pull origin ${branch}`);
      } else {
        logger.info('Cloning repository', { repoUrl, repoPath });
        await execAsync(`git clone -b ${branch} ${repoUrl} ${repoPath}`);
      }
    } catch (error) {
      logger.error('Git operation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Read obsidian.config.json from repository
   */
  async readObsidianConfig(repoPath) {
    try {
      const configPath = path.join(repoPath, 'obsidian.config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      // Config file is optional
      return null;
    }
  }

  /**
   * Build service
   */
  async buildService(repoPath, buildCommand) {
    try {
      logger.info('Building service', { repoPath, buildCommand });
      const { stdout, stderr } = await execAsync(`cd ${repoPath} && ${buildCommand}`);
      
      if (stderr) {
        logger.warn('Build warnings', { stderr });
      }
      
      logger.info('Service built successfully', { repoPath });
    } catch (error) {
      logger.error('Build failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Start service
   */
  async startService(name, repoPath, startCommand, port, envVars = {}) {
    try {
      logger.info('Starting service', { name, repoPath, startCommand });

      // Prepare environment variables
      const env = {
        ...process.env,
        ...envVars,
        PORT: port || 0,
      };

      // Start service in background
      const child = exec(`cd ${repoPath} && ${startCommand}`, { env });

      // Store process info
      const deployment = this.deployments.get(name) || {};
      deployment.pid = child.pid;
      this.deployments.set(name, deployment);

      logger.info('Service started', { name, pid: child.pid });

      // Capture logs
      child.stdout.on('data', (data) => {
        logger.debug(`[${name}] ${data.toString()}`);
      });

      child.stderr.on('data', (data) => {
        logger.error(`[${name}] ${data.toString()}`);
      });

      // Wait for service to be ready
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const serviceUrl = `http://localhost:${port}`;
      return serviceUrl;
    } catch (error) {
      logger.error('Failed to start service', { name, error: error.message });
      throw error;
    }
  }

  /**
   * Stop service
   */
  async stopService(name) {
    try {
      const deployment = this.deployments.get(name);

      if (!deployment || !deployment.pid) {
        throw new Error(`Service ${name} not found or not running`);
      }

      logger.info('Stopping service', { name, pid: deployment.pid });

      // Kill process
      process.kill(deployment.pid, 'SIGTERM');

      // Remove from deployments
      this.deployments.delete(name);

      logger.info('Service stopped', { name });
    } catch (error) {
      logger.error('Failed to stop service', { name, error: error.message });
      throw error;
    }
  }

  /**
   * Redeploy service
   */
  async redeployService(name) {
    try {
      const deployment = this.deployments.get(name);

      if (!deployment) {
        throw new Error(`Service ${name} not found`);
      }

      logger.info('Redeploying service', { name });

      // Stop service
      await this.stopService(name);

      // Pull latest changes
      await this.cloneOrPullRepo(
        deployment.repoUrl,
        deployment.repoPath,
        deployment.branch
      );

      // Re-register (will rebuild and restart)
      await this.registerFromGit({
        name,
        repoUrl: deployment.repoUrl,
        branch: deployment.branch,
      });

      logger.info('Service redeployed successfully', { name });
    } catch (error) {
      logger.error('Failed to redeploy service', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle Git webhook
   */
  async handleWebhook(payload) {
    try {
      const { repository, ref } = payload;
      const repoUrl =
        repository?.clone_url || repository?.git_url || repository?.url;
      const branch = ref?.split('/').pop();

      logger.info('Git webhook received', { repoUrl, branch });

      // Find service by repo URL
      for (const [name, deployment] of this.deployments) {
        if (deployment.repoUrl === repoUrl && deployment.branch === branch) {
          logger.info('Triggering auto-redeploy', { name });
          await this.redeployService(name);
        }
      }
    } catch (error) {
      logger.error('Failed to handle webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(name) {
    const deployment = this.deployments.get(name);
    
    if (!deployment) {
      return null;
    }

    return {
      name,
      repoUrl: deployment.repoUrl,
      branch: deployment.branch,
      repoPath: deployment.repoPath,
      serviceUrl: deployment.serviceUrl,
      pid: deployment.pid,
      running: deployment.pid ? true : false,
    };
  }

  /**
   * Get all deployments
   */
  getAllDeployments() {
    const deployments = [];
    
    for (const [name] of this.deployments) {
      deployments.push(this.getDeploymentStatus(name));
    }
    
    return deployments;
  }
}

// Export singleton instance
const gitIntegrationService = new GitIntegrationService();
export default gitIntegrationService;

