import axios from 'axios';
import logger from '../utils/logger.js';
import healthCheckService from './healthCheckService.js';

/**
 * Service Discovery Service
 * Integrates with service registries (Consul, Eureka, Kubernetes)
 */
class ServiceDiscoveryService {
  constructor() {
    this.discoveryProviders = {
      consul: this.discoverFromConsul.bind(this),
      eureka: this.discoverFromEureka.bind(this),
      kubernetes: this.discoverFromKubernetes.bind(this),
    };
  }

  /**
   * Discover services from Consul
   */
  async discoverFromConsul(consulUrl = 'http://localhost:8500') {
    try {
      logger.info('Discovering services from Consul', { consulUrl });

      const response = await axios.get(`${consulUrl}/v1/catalog/services`);
      const services = response.data;

      const discoveredServices = [];

      for (const [serviceName, tags] of Object.entries(services)) {
        // Get service details
        const serviceDetails = await axios.get(
          `${consulUrl}/v1/catalog/service/${serviceName}`
        );

        for (const instance of serviceDetails.data) {
          const service = {
            name: serviceName,
            url: `http://${instance.ServiceAddress}:${instance.ServicePort}`,
            metadata: {
              tags: tags,
              datacenter: instance.Datacenter,
              node: instance.Node,
              discoveryMethod: 'consul',
            },
            healthCheck: {
              endpoint: '/health',
              interval: 30000,
              timeout: 5000,
            },
          };

          discoveredServices.push(service);

          // Auto-register
          await healthCheckService.registerService(service);
          logger.info('Auto-registered service from Consul', { serviceName });
        }
      }

      return discoveredServices;
    } catch (error) {
      logger.error('Failed to discover services from Consul', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Discover services from Eureka
   */
  async discoverFromEureka(eurekaUrl = 'http://localhost:8761/eureka') {
    try {
      logger.info('Discovering services from Eureka', { eurekaUrl });

      const response = await axios.get(`${eurekaUrl}/apps`, {
        headers: { Accept: 'application/json' },
      });

      const applications = response.data.applications?.application || [];
      const discoveredServices = [];

      for (const app of applications) {
        const instances = Array.isArray(app.instance)
          ? app.instance
          : [app.instance];

        for (const instance of instances) {
          if (instance.status === 'UP') {
            const service = {
              name: app.name.toLowerCase(),
              url: instance.homePageUrl || instance.statusPageUrl,
              metadata: {
                instanceId: instance.instanceId,
                vipAddress: instance.vipAddress,
                discoveryMethod: 'eureka',
              },
              healthCheck: {
                endpoint: instance.healthCheckUrl || '/health',
                interval: 30000,
                timeout: 5000,
              },
            };

            discoveredServices.push(service);

            // Auto-register
            await healthCheckService.registerService(service);
            logger.info('Auto-registered service from Eureka', {
              serviceName: service.name,
            });
          }
        }
      }

      return discoveredServices;
    } catch (error) {
      logger.error('Failed to discover services from Eureka', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Discover services from Kubernetes
   */
  async discoverFromKubernetes() {
    try {
      logger.info('Discovering services from Kubernetes');

      // Use Kubernetes API (requires proper authentication)
      const k8sApiUrl = process.env.KUBERNETES_SERVICE_HOST
        ? `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT}`
        : 'http://localhost:8001'; // kubectl proxy

      const token = process.env.KUBERNETES_TOKEN || '';
      const namespace = process.env.KUBERNETES_NAMESPACE || 'default';

      const response = await axios.get(
        `${k8sApiUrl}/api/v1/namespaces/${namespace}/services`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          httpsAgent: new (await import('https')).Agent({
            rejectUnauthorized: false,
          }),
        }
      );

      const services = response.data.items || [];
      const discoveredServices = [];

      for (const k8sService of services) {
        // Skip kubernetes system services
        if (k8sService.metadata.name === 'kubernetes') continue;

        const serviceName = k8sService.metadata.name;
        const clusterIP = k8sService.spec.clusterIP;
        const ports = k8sService.spec.ports || [];

        for (const port of ports) {
          const service = {
            name: serviceName,
            url: `http://${clusterIP}:${port.port}`,
            metadata: {
              namespace: k8sService.metadata.namespace,
              labels: k8sService.metadata.labels,
              annotations: k8sService.metadata.annotations,
              discoveryMethod: 'kubernetes',
              port: port.port,
              targetPort: port.targetPort,
            },
            healthCheck: {
              endpoint: '/health',
              interval: 30000,
              timeout: 5000,
            },
          };

          discoveredServices.push(service);

          // Auto-register
          await healthCheckService.registerService(service);
          logger.info('Auto-registered service from Kubernetes', {
            serviceName,
          });
        }
      }

      return discoveredServices;
    } catch (error) {
      logger.error('Failed to discover services from Kubernetes', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Discover services from Docker
   */
  async discoverFromDocker() {
    try {
      logger.info('Discovering services from Docker');

      // Docker API (requires Docker socket access)
      const dockerUrl = process.env.DOCKER_HOST || '/var/run/docker.sock';
      const isSocket = dockerUrl.startsWith('/');

      const baseUrl = isSocket
        ? 'http://localhost'
        : dockerUrl.replace('tcp://', 'http://');

      const response = await axios.get(`${baseUrl}/containers/json`, {
        socketPath: isSocket ? dockerUrl : undefined,
      });

      const containers = response.data || [];
      const discoveredServices = [];

      for (const container of containers) {
        if (container.State !== 'running') continue;

        const name =
          container.Names[0]?.replace('/', '') || container.Id.substring(0, 12);
        const labels = container.Labels || {};

        // Check for obsidian labels
        if (labels['obsidian.enabled'] !== 'true') continue;

        const ports = container.Ports || [];
        const exposedPort = ports.find((p) => p.PublicPort);

        if (exposedPort) {
          const service = {
            name: labels['obsidian.service.name'] || name,
            url: `http://localhost:${exposedPort.PublicPort}`,
            metadata: {
              containerId: container.Id,
              image: container.Image,
              labels: labels,
              discoveryMethod: 'docker',
            },
            healthCheck: {
              endpoint: labels['obsidian.health.endpoint'] || '/health',
              interval: parseInt(labels['obsidian.health.interval']) || 30000,
              timeout: parseInt(labels['obsidian.health.timeout']) || 5000,
            },
          };

          discoveredServices.push(service);

          // Auto-register
          await healthCheckService.registerService(service);
          logger.info('Auto-registered service from Docker', { name });
        }
      }

      return discoveredServices;
    } catch (error) {
      logger.error('Failed to discover services from Docker', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Periodic service discovery
   */
  async startPeriodicDiscovery(provider, url, interval = 60000) {
    const discoveryFunction = this.discoveryProviders[provider];

    if (!discoveryFunction) {
      throw new Error(`Unknown discovery provider: ${provider}`);
    }

    logger.info('Starting periodic service discovery', { provider, interval });

    const discover = async () => {
      try {
        await discoveryFunction(url);
      } catch (error) {
        logger.error('Periodic discovery failed', {
          provider,
          error: error.message,
        });
      }
    };

    // Initial discovery
    await discover();

    // Periodic discovery
    const intervalId = setInterval(discover, interval);

    return intervalId;
  }
}

// Export singleton instance
const serviceDiscoveryService = new ServiceDiscoveryService();
export default serviceDiscoveryService;

