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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
serviceSchema.index({ status: 1, circuitStatus: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;

