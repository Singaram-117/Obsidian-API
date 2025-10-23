import mongoose from 'mongoose';

/**
 * Event Model - Tracks all system events for observability
 */
const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'circuit_opened',
        'circuit_closed',
        'circuit_half_open',
        'service_down',
        'service_up',
        'service_degraded',
        'rate_limit_exceeded',
        'request_timeout',
        'request_failed',
        'request_succeeded',
        'health_check_failed',
        'health_check_succeeded',
        'anomaly_detected',
        'chaos_test_started',
        'chaos_test_completed',
      ],
    },
    serviceName: {
      type: String,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index - automatically delete events older than 30 days
eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

const Event = mongoose.model('Event', eventSchema);

export default Event;

