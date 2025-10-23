import Service from '../models/Service.js';
import Event from '../models/Event.js';
import logger from '../utils/logger.js';

/**
 * Recommendation Service - User-Facing Feature
 * Provides intelligent recommendations to improve system resilience
 */
class RecommendationService {
  /**
   * Generate recommendations for a service
   */
  async generateRecommendations(serviceName) {
    const service = await Service.findOne({ name: serviceName });

    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const recommendations = [];

    // Analyze metrics and generate recommendations
    recommendations.push(...(await this.analyzePerformance(service)));
    recommendations.push(...(await this.analyzeReliability(service)));
    recommendations.push(...(await this.analyzeCircuitBreaker(service)));
    recommendations.push(...(await this.analyzeHealthChecks(service)));

    logger.info('Recommendations generated', {
      serviceName,
      count: recommendations.length,
    });

    return recommendations;
  }

  /**
   * Analyze performance metrics
   */
  async analyzePerformance(service) {
    const recommendations = [];

    // Check response time
    if (service.metrics.averageResponseTime > 1000) {
      recommendations.push({
        type: 'performance',
        severity: 'warning',
        title: 'High Response Time',
        description: `Average response time is ${service.metrics.averageResponseTime}ms`,
        suggestion: 'Consider implementing caching or optimizing database queries',
        actions: [
          'Enable Cache-Aside pattern',
          'Review database indexes',
          'Implement response compression',
        ],
      });
    }

    // Check for timeout issues
    const timeoutEvents = await Event.countDocuments({
      serviceName: service.name,
      type: 'request_timeout',
      timestamp: { $gte: new Date(Date.now() - 3600000) }, // Last hour
    });

    if (timeoutEvents > 10) {
      recommendations.push({
        type: 'performance',
        severity: 'critical',
        title: 'Frequent Timeouts',
        description: `${timeoutEvents} timeout events in the last hour`,
        suggestion: 'Increase timeout threshold or optimize service performance',
        actions: [
          'Adjust circuit breaker timeout',
          'Scale service horizontally',
          'Implement async processing',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Analyze reliability metrics
   */
  async analyzeReliability(service) {
    const recommendations = [];

    // Check error rate
    const errorRate =
      service.metrics.totalRequests > 0
        ? (service.metrics.failedRequests / service.metrics.totalRequests) * 100
        : 0;

    if (errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        severity: errorRate > 10 ? 'critical' : 'warning',
        title: 'High Error Rate',
        description: `Error rate is ${errorRate.toFixed(2)}%`,
        suggestion: 'Implement retry logic and fallback mechanisms',
        actions: [
          'Enable Retry Pattern with exponential backoff',
          'Implement Fallback Pattern for graceful degradation',
          'Add request validation',
        ],
      });
    }

    // Check service downtime
    if (service.status === 'down') {
      recommendations.push({
        type: 'reliability',
        severity: 'critical',
        title: 'Service is Down',
        description: 'Service is currently unavailable',
        suggestion: 'Check service logs and restart if necessary',
        actions: [
          'Review service logs',
          'Implement health check auto-restart',
          'Set up redundant instances',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Analyze circuit breaker configuration
   */
  async analyzeCircuitBreaker(service) {
    const recommendations = [];

    // Check if circuit breaker opens frequently
    const circuitOpenEvents = await Event.countDocuments({
      serviceName: service.name,
      type: 'circuit_opened',
      timestamp: { $gte: new Date(Date.now() - 86400000) }, // Last 24 hours
    });

    if (circuitOpenEvents > 5) {
      recommendations.push({
        type: 'circuit-breaker',
        severity: 'warning',
        title: 'Frequent Circuit Breaker Activation',
        description: `Circuit breaker opened ${circuitOpenEvents} times in the last 24 hours`,
        suggestion: 'Review and adjust circuit breaker thresholds',
        actions: [
          'Increase error threshold percentage',
          'Increase reset timeout duration',
          'Implement bulkhead pattern for resource isolation',
        ],
      });
    }

    // Check if circuit is currently open
    if (service.circuitStatus === 'open') {
      recommendations.push({
        type: 'circuit-breaker',
        severity: 'critical',
        title: 'Circuit Breaker is Open',
        description: 'Service requests are being blocked',
        suggestion: 'Investigate and fix underlying service issues',
        actions: [
          'Check service dependencies',
          'Review recent deployments',
          'Implement fallback responses',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Analyze health check configuration
   */
  async analyzeHealthChecks(service) {
    const recommendations = [];

    // Check health check interval
    if (service.healthCheck.interval > 60000) {
      recommendations.push({
        type: 'monitoring',
        severity: 'info',
        title: 'Long Health Check Interval',
        description: `Health checks run every ${service.healthCheck.interval / 1000}s`,
        suggestion: 'Consider reducing interval for faster failure detection',
        actions: [
          'Reduce health check interval to 30s',
          'Implement heartbeat mechanism for real-time monitoring',
        ],
      });
    }

    // Check last health check time
    if (service.healthCheck.lastCheck) {
      const timeSinceCheck = Date.now() - service.healthCheck.lastCheck.getTime();

      if (timeSinceCheck > service.healthCheck.interval * 2) {
        recommendations.push({
          type: 'monitoring',
          severity: 'warning',
          title: 'Health Checks Not Running',
          description: `Last health check was ${Math.floor(timeSinceCheck / 1000)}s ago`,
          suggestion: 'Verify health check scheduler is running',
          actions: [
            'Restart health check service',
            'Check service accessibility',
          ],
        });
      }
    }

    return recommendations;
  }

  /**
   * Get system-wide recommendations
   */
  async getSystemRecommendations() {
    const services = await Service.find();
    const recommendations = [];

    // Check overall system health
    const downServices = services.filter((s) => s.status === 'down').length;
    const totalServices = services.length;

    if (downServices > 0) {
      recommendations.push({
        type: 'system',
        severity: 'critical',
        title: 'Services Down',
        description: `${downServices} out of ${totalServices} services are down`,
        suggestion: 'Investigate and restore services',
        actions: [
          'Review system logs',
          'Check infrastructure health',
          'Implement auto-scaling',
        ],
      });
    }

    // Check for services without monitoring
    const unmonitoredServices = services.filter(
      (s) => s.metrics.totalRequests === 0
    );

    if (unmonitoredServices.length > 0) {
      recommendations.push({
        type: 'monitoring',
        severity: 'info',
        title: 'Unmonitored Services',
        description: `${unmonitoredServices.length} services have no request data`,
        suggestion: 'Ensure all services are properly integrated',
        actions: [
          'Install @obsidian/agent on services',
          'Configure health checks',
          'Route traffic through Obsidian',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Get quick wins - easy improvements with high impact
   */
  async getQuickWins() {
    const services = await Service.find();
    const quickWins = [];

    for (const service of services) {
      // Quick win: Enable caching for slow services
      if (service.metrics.averageResponseTime > 500) {
        quickWins.push({
          serviceName: service.name,
          title: 'Enable Caching',
          impact: 'high',
          effort: 'low',
          description: 'Reduce response time by up to 80% with caching',
          estimatedImprovement: '80% faster response time',
        });
      }

      // Quick win: Add health checks
      if (!service.healthCheck.lastCheck) {
        quickWins.push({
          serviceName: service.name,
          title: 'Configure Health Checks',
          impact: 'high',
          effort: 'low',
          description: 'Detect failures faster with automated health checks',
          estimatedImprovement: 'Faster failure detection',
        });
      }

      // Quick win: Install SDK
      if (service.metrics.totalRequests === 0) {
        quickWins.push({
          serviceName: service.name,
          title: 'Install Obsidian SDK',
          impact: 'high',
          effort: 'low',
          description: 'Get complete visibility with 2 lines of code',
          estimatedImprovement: 'Full request tracking',
        });
      }
    }

    return quickWins.slice(0, 10); // Top 10 quick wins
  }
}

// Export singleton instance
const recommendationService = new RecommendationService();
export default recommendationService;

