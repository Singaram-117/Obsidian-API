import mongoose from 'mongoose';

/**
 * Metric Model - Time-series data for service metrics
 */
const metricSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    metricType: {
      type: String,
      required: true,
      enum: [
        'response_time',
        'request_count',
        'error_rate',
        'cpu_usage',
        'memory_usage',
        'throughput',
        'latency_p50',
        'latency_p95',
        'latency_p99',
      ],
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: 'count',
    },
    tags: {
      type: Map,
      of: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient time-series queries
metricSchema.index({ serviceName: 1, metricType: 1, timestamp: -1 });

// TTL Index - automatically delete metrics older than 7 days
metricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

const Metric = mongoose.model('Metric', metricSchema);

export default Metric;

