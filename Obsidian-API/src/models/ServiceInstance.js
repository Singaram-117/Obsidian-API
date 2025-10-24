import mongoose from 'mongoose';

/**
 * Service Instance Schema
 * Represents individual instances of a microservice for load balancing
 */
const serviceInstanceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    instanceId: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      default: 1,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['healthy', 'unhealthy', 'draining', 'disabled'],
      default: 'healthy',
    },
    metadata: {
      region: String,
      zone: String,
      version: String,
      environment: String,
      tags: [String],
    },
    metrics: {
      activeConnections: {
        type: Number,
        default: 0,
      },
      totalRequests: {
        type: Number,
        default: 0,
      },
      failedRequests: {
        type: Number,
        default: 0,
      },
      avgResponseTime: {
        type: Number,
        default: 0,
      },
      lastResponseTime: Number,
    },
    health: {
      lastCheck: Date,
      lastSuccess: Date,
      consecutiveFailures: {
        type: Number,
        default: 0,
      },
      uptime: Number,
    },
    rateLimit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      requestsPerMinute: Number,
      currentRequests: {
        type: Number,
        default: 0,
      },
      resetAt: Date,
    },
    // For canary/blue-green deployments
    trafficPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    isCanary: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
serviceInstanceSchema.index({ serviceName: 1, status: 1 });
serviceInstanceSchema.index({ status: 1 });
serviceInstanceSchema.index({ 'health.lastCheck': 1 });

// Compound index for efficient load balancing queries
serviceInstanceSchema.index({
  serviceName: 1,
  status: 1,
  weight: -1,
});

// Methods
serviceInstanceSchema.methods.incrementConnections = function () {
  this.metrics.activeConnections += 1;
  return this.save();
};

serviceInstanceSchema.methods.decrementConnections = function () {
  this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  return this.save();
};

serviceInstanceSchema.methods.recordRequest = function (responseTime, success = true) {
  this.metrics.totalRequests += 1;
  if (!success) {
    this.metrics.failedRequests += 1;
  }
  this.metrics.lastResponseTime = responseTime;
  // Calculate rolling average
  this.metrics.avgResponseTime =
    (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
    this.metrics.totalRequests;
  return this.save();
};

serviceInstanceSchema.methods.updateHealth = function (isHealthy) {
  this.health.lastCheck = new Date();
  if (isHealthy) {
    this.health.lastSuccess = new Date();
    this.health.consecutiveFailures = 0;
    if (this.status === 'unhealthy') {
      this.status = 'healthy';
    }
  } else {
    this.health.consecutiveFailures += 1;
    if (this.health.consecutiveFailures >= 3) {
      this.status = 'unhealthy';
    }
  }
  return this.save();
};

const ServiceInstance = mongoose.model('ServiceInstance', serviceInstanceSchema);

export default ServiceInstance;

