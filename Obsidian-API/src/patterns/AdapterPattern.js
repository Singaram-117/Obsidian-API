import logger from '../utils/logger.js';

/**
 * Adapter Pattern Implementation
 * Allows incompatible interfaces to work together
 * 
 * Use Case: Integrate different monitoring systems (Prometheus, Grafana, Datadog) with unified interface
 * Based on: https://refactoring.guru/design-patterns/adapter
 */

/**
 * Target Interface
 * The interface that Obsidian MROP expects
 */
class MetricsInterface {
  async getMetrics(serviceName, timeRange) {
    throw new Error('Method must be implemented');
  }

  async recordMetric(serviceName, metric) {
    throw new Error('Method must be implemented');
  }

  async getServiceHealth(serviceName) {
    throw new Error('Method must be implemented');
  }
}

/**
 * Prometheus Client (Adaptee)
 * External service with different interface
 */
class PrometheusClient {
  async query(promQL, start, end) {
    logger.debug('Prometheus query', { promQL, start, end });

    // Simulate Prometheus API response
    return {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: { __name__: 'http_requests_total' },
            values: [[Date.now() / 1000, '100']],
          },
        ],
      },
    };
  }

  async push(jobName, metrics) {
    logger.debug('Prometheus push', { jobName, metrics });
    return { success: true };
  }
}

/**
 * Prometheus Adapter
 * Adapts Prometheus to Obsidian's interface
 */
class PrometheusAdapter extends MetricsInterface {
  constructor() {
    super();
    this.client = new PrometheusClient();
  }

  async getMetrics(serviceName, timeRange) {
    logger.info('PrometheusAdapter getting metrics', { serviceName, timeRange });

    const start = Date.now() - timeRange;
    const end = Date.now();

    const promQL = `http_requests_total{service="${serviceName}"}`;
    const result = await this.client.query(promQL, start, end);

    // Transform Prometheus format to Obsidian format
    return {
      serviceName,
      metrics: result.data.result.map((r) => ({
        name: r.metric.__name__,
        value: parseFloat(r.values[0][1]),
        timestamp: new Date(r.values[0][0] * 1000),
      })),
      source: 'prometheus',
    };
  }

  async recordMetric(serviceName, metric) {
    logger.info('PrometheusAdapter recording metric', { serviceName, metric });

    await this.client.push(serviceName, [
      {
        name: metric.name,
        value: metric.value,
        labels: { service: serviceName },
      },
    ]);

    return { success: true, source: 'prometheus' };
  }

  async getServiceHealth(serviceName) {
    const promQL = `up{service="${serviceName}"}`;
    const result = await this.client.query(promQL, Date.now() - 60000, Date.now());

    const isUp = result.data.result.length > 0 && result.data.result[0].values[0][1] === '1';

    return {
      serviceName,
      healthy: isUp,
      source: 'prometheus',
    };
  }
}

/**
 * Datadog Client (Adaptee)
 */
class DatadogClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async timeseries(query) {
    logger.debug('Datadog timeseries query', { query });

    return {
      series: [
        {
          metric: 'system.cpu.idle',
          points: [[Date.now(), 50.5]],
          tags: ['service:api'],
        },
      ],
    };
  }

  async submitMetrics(metrics) {
    logger.debug('Datadog submit metrics', { metrics });
    return { status: 'ok' };
  }
}

/**
 * Datadog Adapter
 */
class DatadogAdapter extends MetricsInterface {
  constructor(apiKey) {
    super();
    this.client = new DatadogClient(apiKey);
  }

  async getMetrics(serviceName, timeRange) {
    logger.info('DatadogAdapter getting metrics', { serviceName, timeRange });

    const query = `avg:system.cpu.idle{service:${serviceName}}`;
    const result = await this.client.timeseries(query);

    return {
      serviceName,
      metrics: result.series.map((s) => ({
        name: s.metric,
        value: s.points[0][1],
        timestamp: new Date(s.points[0][0]),
      })),
      source: 'datadog',
    };
  }

  async recordMetric(serviceName, metric) {
    logger.info('DatadogAdapter recording metric', { serviceName, metric });

    await this.client.submitMetrics([
      {
        metric: metric.name,
        points: [[Date.now(), metric.value]],
        tags: [`service:${serviceName}`],
      },
    ]);

    return { success: true, source: 'datadog' };
  }

  async getServiceHealth(serviceName) {
    const query = `avg:service.health{service:${serviceName}}`;
    const result = await this.client.timeseries(query);

    const isHealthy = result.series.length > 0 && result.series[0].points[0][1] > 0;

    return {
      serviceName,
      healthy: isHealthy,
      source: 'datadog',
    };
  }
}

/**
 * Grafana Client (Adaptee)
 */
class GrafanaClient {
  async datasourceQuery(datasourceId, query) {
    logger.debug('Grafana datasource query', { datasourceId, query });

    return {
      results: {
        A: {
          frames: [
            {
              schema: {
                fields: [
                  { name: 'Time', type: 'time' },
                  { name: 'Value', type: 'number' },
                ],
              },
              data: {
                values: [[Date.now()], [75.3]],
              },
            },
          ],
        },
      },
    };
  }
}

/**
 * Grafana Adapter
 */
class GrafanaAdapter extends MetricsInterface {
  constructor(datasourceId) {
    super();
    this.client = new GrafanaClient();
    this.datasourceId = datasourceId;
  }

  async getMetrics(serviceName, timeRange) {
    logger.info('GrafanaAdapter getting metrics', { serviceName, timeRange });

    const query = {
      targets: [
        {
          target: `service.${serviceName}.requests`,
        },
      ],
    };

    const result = await this.client.datasourceQuery(this.datasourceId, query);

    const frame = result.results.A.frames[0];
    const times = frame.data.values[0];
    const values = frame.data.values[1];

    return {
      serviceName,
      metrics: times.map((time, index) => ({
        name: 'requests',
        value: values[index],
        timestamp: new Date(time),
      })),
      source: 'grafana',
    };
  }

  async recordMetric(serviceName, metric) {
    logger.info('GrafanaAdapter recording metric', { serviceName, metric });

    // Grafana is typically read-only, but we can log the attempt
    return {
      success: false,
      message: 'Grafana is read-only',
      source: 'grafana',
    };
  }

  async getServiceHealth(serviceName) {
    return {
      serviceName,
      healthy: true,
      source: 'grafana',
    };
  }
}

/**
 * Obsidian Native Metrics (Already compatible)
 */
class ObsidianMetrics extends MetricsInterface {
  async getMetrics(serviceName, timeRange) {
    logger.info('ObsidianMetrics getting metrics', { serviceName, timeRange });

    // Direct access to Obsidian's metrics
    const Metric = (await import('../models/Metric.js')).default;

    const metrics = await Metric.find({
      serviceName,
      timestamp: { $gte: new Date(Date.now() - timeRange) },
    });

    return {
      serviceName,
      metrics: metrics.map((m) => ({
        name: m.name,
        value: m.value,
        timestamp: m.timestamp,
      })),
      source: 'obsidian',
    };
  }

  async recordMetric(serviceName, metric) {
    logger.info('ObsidianMetrics recording metric', { serviceName, metric });

    const Metric = (await import('../models/Metric.js')).default;

    await Metric.create({
      serviceName,
      ...metric,
    });

    return { success: true, source: 'obsidian' };
  }

  async getServiceHealth(serviceName) {
    const Service = (await import('../models/Service.js')).default;

    const service = await Service.findOne({ name: serviceName });

    return {
      serviceName,
      healthy: service?.status === 'healthy',
      source: 'obsidian',
    };
  }
}

/**
 * Metrics Adapter Factory
 * Creates appropriate adapter based on source type
 */
class MetricsAdapterFactory {
  static create(source, config = {}) {
    switch (source) {
      case 'prometheus':
        return new PrometheusAdapter();

      case 'datadog':
        return new DatadogAdapter(config.apiKey);

      case 'grafana':
        return new GrafanaAdapter(config.datasourceId);

      case 'obsidian':
        return new ObsidianMetrics();

      default:
        throw new Error(`Unknown metrics source: ${source}`);
    }
  }
}

/**
 * Unified Metrics Service
 * Uses adapters to provide unified interface across all sources
 */
class UnifiedMetricsService {
  constructor() {
    this.adapters = new Map();
  }

  registerSource(name, source, config = {}) {
    const adapter = MetricsAdapterFactory.create(source, config);
    this.adapters.set(name, adapter);

    logger.info('Metrics source registered', { name, source });
  }

  async getMetrics(sourceName, serviceName, timeRange) {
    const adapter = this.adapters.get(sourceName);

    if (!adapter) {
      throw new Error(`Metrics source not found: ${sourceName}`);
    }

    return await adapter.getMetrics(serviceName, timeRange);
  }

  async recordMetric(sourceName, serviceName, metric) {
    const adapter = this.adapters.get(sourceName);

    if (!adapter) {
      throw new Error(`Metrics source not found: ${sourceName}`);
    }

    return await adapter.recordMetric(serviceName, metric);
  }

  async getServiceHealth(sourceName, serviceName) {
    const adapter = this.adapters.get(sourceName);

    if (!adapter) {
      throw new Error(`Metrics source not found: ${sourceName}`);
    }

    return await adapter.getServiceHealth(serviceName);
  }

  /**
   * Get metrics from all sources
   */
  async getAllMetrics(serviceName, timeRange) {
    const results = [];

    for (const [name, adapter] of this.adapters) {
      try {
        const metrics = await adapter.getMetrics(serviceName, timeRange);
        results.push(metrics);
      } catch (error) {
        logger.error(`Failed to get metrics from ${name}`, {
          error: error.message,
        });
      }
    }

    return results;
  }
}

/**
 * Example Usage:
 * 
 * // Setup unified metrics service
 * const metricsService = new UnifiedMetricsService();
 * 
 * // Register multiple sources
 * metricsService.registerSource('obsidian', 'obsidian');
 * metricsService.registerSource('prom', 'prometheus');
 * metricsService.registerSource('datadog', 'datadog', { apiKey: 'xxx' });
 * 
 * // Get metrics from specific source
 * const metrics = await metricsService.getMetrics('prom', 'api-service', 3600000);
 * 
 * // Get metrics from all sources
 * const allMetrics = await metricsService.getAllMetrics('api-service', 3600000);
 */

export {
  MetricsInterface,
  PrometheusAdapter,
  DatadogAdapter,
  GrafanaAdapter,
  ObsidianMetrics,
  MetricsAdapterFactory,
  UnifiedMetricsService,
};

