import mongoose from 'mongoose';

/**
 * Service Model - Tracks registered microservices
 */
const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    github: {
      url: String,
      repository: {
        name: String,
        fullName: String,
        description: String,
        stars: Number,
        forks: Number,
        language: String,
        topics: [String],
        owner: {
          name: String,
          avatar: String,
        },
      },
      readme: String,
      latestRelease: {
        tagName: String,
        name: String,
        publishedAt: Date,
      },
    },
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'down', 'unknown'],
      default: 'unknown',
    },
    circuitStatus: {
      type: String,
      enum: ['closed', 'open', 'half-open'],
      default: 'closed',
    },
    metrics: {
      totalRequests: {
        type: Number,
        default: 0,
      },
      successfulRequests: {
        type: Number,
        default: 0,
      },
      failedRequests: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
      lastRequestTime: {
        type: Date,
      },
    },
    healthCheck: {
      endpoint: {
        type: String,
        default: '/health',
      },
      interval: {
        type: Number,
        default: 30000, // 30 seconds
      },
      timeout: {
        type: Number,
        default: 5000, // 5 seconds
      },
      lastCheck: {
        type: Date,
      },
    },
    metadata: {
      type: Map,
      of: String,
    },
    // Discovered endpoints
    endpoints: [
      {
        path: String,
        method: String,
        summary: String,
        description: String,
        tags: [String],
        parameters: Array,
        responses: [String],
      },
    ],
    endpointsDiscoveredAt: Date,
    // Rate limiting configuration
    rateLimit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      requestsPerMinute: {
        type: Number,
        default: 100,
      },
    },
    endpointRateLimits: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    clientRateLimit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      requestsPerMinute: {
        type: Number,
        default: 60,
      },
    },
    // Caching configuration
    cache: {
      enabled: {
        type: Boolean,
        default: false,
      },
      ttl: {
        type: Number,
        default: 60000, // 1 minute
      },
      endpoints: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
    },
    // Load balancing configuration
    loadBalancing: {
      enabled: {
        type: Boolean,
        default: false,
      },
      strategy: {
        type: String,
        enum: [
          'round-robin',
          'least-connections',
          'weighted-round-robin',
          'weighted-response-time',
          'random',
          'ip-hash',
        ],
        default: 'round-robin',
      },
      stickySession: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
serviceSchema.index({ status: 1, circuitStatus: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;

