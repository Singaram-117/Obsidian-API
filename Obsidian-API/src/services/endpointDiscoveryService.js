import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Endpoint Discovery Service
 * Discovers and maps all available endpoints of a microservice
 */
class EndpointDiscoveryService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Discover endpoints from OpenAPI/Swagger documentation
   */
  async discoverFromOpenAPI(serviceUrl) {
    const commonPaths = [
      '/swagger.json',
      '/api-docs',
      '/api-docs/swagger.json',
      '/v1/api-docs',
      '/openapi.json',
      '/docs/swagger.json',
    ];

    for (const path of commonPaths) {
      try {
        const response = await axios.get(`${serviceUrl}${path}`, {
          timeout: 5000,
        });

        if (response.data && response.data.paths) {
          return this.parseOpenAPISpec(response.data);
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }

    return null;
  }

  /**
   * Parse OpenAPI specification
   */
  parseOpenAPISpec(spec) {
    const endpoints = [];

    for (const [path, methods] of Object.entries(spec.paths || {})) {
      for (const [method, details] of Object.entries(methods)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: details.summary || '',
            description: details.description || '',
            operationId: details.operationId || '',
            parameters: details.parameters || [],
            tags: details.tags || [],
            responses: Object.keys(details.responses || {}),
          });
        }
      }
    }

    return {
      source: 'openapi',
      endpoints,
      version: spec.info?.version || 'unknown',
      title: spec.info?.title || 'Unknown Service',
    };
  }

  /**
   * Probe common endpoints to discover available routes
   */
  async probeCommonEndpoints(serviceUrl) {
    const commonEndpoints = [
      { path: '/', method: 'GET' },
      { path: '/health', method: 'GET' },
      { path: '/status', method: 'GET' },
      { path: '/metrics', method: 'GET' },
      { path: '/api', method: 'GET' },
      { path: '/v1', method: 'GET' },
      { path: '/docs', method: 'GET' },
    ];

    const discoveredEndpoints = [];

    for (const endpoint of commonEndpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${serviceUrl}${endpoint.path}`,
          timeout: 3000,
          validateStatus: () => true, // Accept any status
        });

        if (response.status < 500) {
          discoveredEndpoints.push({
            path: endpoint.path,
            method: endpoint.method,
            status: response.status,
            discovered: true,
            responseTime: response.headers['x-response-time'] || 'unknown',
          });
        }
      } catch (error) {
        // Endpoint not available
        continue;
      }
    }

    return {
      source: 'probe',
      endpoints: discoveredEndpoints,
    };
  }

  /**
   * Discover endpoints from Express-style route listing
   */
  async discoverFromExpressRoutes(serviceUrl) {
    try {
      // Try to get routes from common Express route listing endpoints
      const routePaths = ['/routes', '/api/routes', '/_routes'];

      for (const path of routePaths) {
        try {
          const response = await axios.get(`${serviceUrl}${path}`, {
            timeout: 3000,
          });

          if (response.data && Array.isArray(response.data)) {
            return {
              source: 'express',
              endpoints: response.data.map((route) => ({
                path: route.path || route.route,
                method: route.method || 'GET',
                middleware: route.middleware || [],
              })),
            };
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      logger.debug('Failed to discover Express routes', { error: error.message });
    }

    return null;
  }

  /**
   * Main discovery method - tries multiple strategies
   */
  async discoverEndpoints(serviceUrl, serviceName) {
    logger.info(`Discovering endpoints for ${serviceName}`, { serviceUrl });

    // Check cache first
    const cacheKey = `${serviceName}:${serviceUrl}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        // 5 minute cache
        logger.debug('Returning cached endpoint discovery', { serviceName });
        return cached.data;
      }
    }

    const results = {
      serviceName,
      serviceUrl,
      discoveredAt: new Date().toISOString(),
      endpoints: [],
      metadata: {},
    };

    // Strategy 1: OpenAPI/Swagger
    const openAPIResult = await this.discoverFromOpenAPI(serviceUrl);
    if (openAPIResult) {
      results.endpoints = openAPIResult.endpoints;
      results.metadata.source = 'openapi';
      results.metadata.version = openAPIResult.version;
      results.metadata.title = openAPIResult.title;
      logger.info(`Discovered ${results.endpoints.length} endpoints via OpenAPI`, {
        serviceName,
      });
    }

    // Strategy 2: Express routes
    if (results.endpoints.length === 0) {
      const expressResult = await this.discoverFromExpressRoutes(serviceUrl);
      if (expressResult) {
        results.endpoints = expressResult.endpoints;
        results.metadata.source = 'express';
        logger.info(`Discovered ${results.endpoints.length} endpoints via Express`, {
          serviceName,
        });
      }
    }

    // Strategy 3: Probe common endpoints
    if (results.endpoints.length === 0) {
      const probeResult = await this.probeCommonEndpoints(serviceUrl);
      results.endpoints = probeResult.endpoints;
      results.metadata.source = 'probe';
      logger.info(`Discovered ${results.endpoints.length} endpoints via probing`, {
        serviceName,
      });
    }

    // Cache the results
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: results,
    });

    return results;
  }

  /**
   * Clear cache for a service
   */
  clearCache(serviceName, serviceUrl) {
    const cacheKey = `${serviceName}:${serviceUrl}`;
    this.cache.delete(cacheKey);
    logger.debug('Cleared endpoint cache', { serviceName });
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
    logger.debug('Cleared all endpoint cache');
  }
}

export default new EndpointDiscoveryService();

