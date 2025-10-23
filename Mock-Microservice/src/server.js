import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration for failure simulation
let failureConfig = {
  failureRate: 0.3, // 30% failure rate by default
  delayMin: 0,
  delayMax: 0,
  timeoutRate: 0,
  circuitBreakerTest: false,
};

/**
 * Helper function to simulate random failures
 */
const shouldFail = () => {
  return Math.random() < failureConfig.failureRate;
};

/**
 * Helper function to simulate random timeout
 */
const shouldTimeout = () => {
  return Math.random() < failureConfig.timeoutRate;
};

/**
 * Helper function to add random delay
 */
const addDelay = async () => {
  if (failureConfig.delayMax > 0) {
    const delay =
      Math.random() * (failureConfig.delayMax - failureConfig.delayMin) +
      failureConfig.delayMin;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

/**
 * Logging middleware
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * @route   GET /
 * @desc    Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Mock Microservice',
    version: '1.0.0',
    description: 'A mock service for testing Obsidian MROP resilience features',
    endpoints: [
      '/health',
      '/api/data',
      '/api/users',
      '/api/slow',
      '/api/flaky',
      '/api/cascade-failure',
      '/config',
    ],
  });
});

/**
 * @route   GET /health
 * @desc    Health check endpoint - always succeeds unless configured otherwise
 */
app.get('/health', async (req, res) => {
  if (failureConfig.circuitBreakerTest && shouldFail()) {
    return res.status(503).json({
      status: 'unhealthy',
      message: 'Service is experiencing issues',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/data
 * @desc    Simulates a normal API call with configurable failures
 */
app.get('/api/data', async (req, res) => {
  await addDelay();

  if (shouldTimeout()) {
    // Simulate timeout by never responding
    console.log('Simulating timeout - request will hang');
    return;
  }

  if (shouldFail()) {
    const errorTypes = [
      { status: 500, message: 'Internal Server Error' },
      { status: 503, message: 'Service Unavailable' },
      { status: 504, message: 'Gateway Timeout' },
      { status: 429, message: 'Too Many Requests' },
    ];

    const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];

    console.log(`Simulating failure: ${error.status} - ${error.message}`);

    return res.status(error.status).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Success response
  res.json({
    success: true,
    data: {
      id: Math.floor(Math.random() * 1000),
      message: 'Data retrieved successfully',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * @route   GET /api/users
 * @desc    Returns mock user data with failures
 */
app.get('/api/users', async (req, res) => {
  await addDelay();

  if (shouldFail()) {
    return res.status(500).json({
      error: 'Failed to fetch users',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
      { id: 3, name: 'Charlie', email: 'charlie@example.com' },
    ],
  });
});

/**
 * @route   GET /api/slow
 * @desc    Always slow endpoint (simulates high latency)
 */
app.get('/api/slow', async (req, res) => {
  const delay = req.query.delay || 5000;
  console.log(`Simulating slow response: ${delay}ms`);

  await new Promise((resolve) => setTimeout(resolve, parseInt(delay)));

  if (shouldFail()) {
    return res.status(500).json({
      error: 'Request failed after delay',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: 'Slow response completed',
    delay: parseInt(delay),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/flaky
 * @desc    Very unstable endpoint (70% failure rate)
 */
app.get('/api/flaky', async (req, res) => {
  await addDelay();

  if (Math.random() < 0.7) {
    return res.status(500).json({
      error: 'Flaky endpoint failed',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: 'Flaky endpoint succeeded',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   POST /api/cascade-failure
 * @desc    Triggers a cascade of failures to test circuit breaker
 */
app.post('/api/cascade-failure', (req, res) => {
  console.log('Triggering cascade failure mode');
  
  failureConfig.failureRate = 1.0; // 100% failure
  failureConfig.circuitBreakerTest = true;

  // Reset after 30 seconds
  setTimeout(() => {
    console.log('Resetting failure mode');
    failureConfig.failureRate = 0.3;
    failureConfig.circuitBreakerTest = false;
  }, 30000);

  res.json({
    success: true,
    message: 'Cascade failure mode activated for 30 seconds',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /config
 * @desc    Get current failure configuration
 */
app.get('/config', (req, res) => {
  res.json({
    success: true,
    config: failureConfig,
  });
});

/**
 * @route   POST /config
 * @desc    Update failure configuration
 */
app.post('/config', (req, res) => {
  const {
    failureRate,
    delayMin,
    delayMax,
    timeoutRate,
    circuitBreakerTest,
  } = req.body;

  if (failureRate !== undefined) failureConfig.failureRate = failureRate;
  if (delayMin !== undefined) failureConfig.delayMin = delayMin;
  if (delayMax !== undefined) failureConfig.delayMax = delayMax;
  if (timeoutRate !== undefined) failureConfig.timeoutRate = timeoutRate;
  if (circuitBreakerTest !== undefined)
    failureConfig.circuitBreakerTest = circuitBreakerTest;

  console.log('Failure configuration updated:', failureConfig);

  res.json({
    success: true,
    message: 'Configuration updated',
    config: failureConfig,
  });
});

/**
 * @route   POST /config/reset
 * @desc    Reset failure configuration to defaults
 */
app.post('/config/reset', (req, res) => {
  failureConfig = {
    failureRate: 0.3,
    delayMin: 0,
    delayMax: 0,
    timeoutRate: 0,
    circuitBreakerTest: false,
  };

  console.log('Failure configuration reset to defaults');

  res.json({
    success: true,
    message: 'Configuration reset to defaults',
    config: failureConfig,
  });
});

/**
 * @route   GET /api/success
 * @desc    Always succeeds (for testing)
 */
app.get('/api/success', (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint always succeeds',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/error
 * @desc    Always fails (for testing)
 */
app.get('/api/error', (req, res) => {
  res.status(500).json({
    error: 'This endpoint always fails',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Start server
 */
app.listen(port, () => {
  console.log(`\n🚀 Mock Microservice running on port ${port}`);
  console.log(`\nConfiguration:`);
  console.log(`  - Failure Rate: ${failureConfig.failureRate * 100}%`);
  console.log(`  - Delay Range: ${failureConfig.delayMin}ms - ${failureConfig.delayMax}ms`);
  console.log(`  - Timeout Rate: ${failureConfig.timeoutRate * 100}%`);
  console.log(`\nEndpoints:`);
  console.log(`  - GET  http://localhost:${port}/`);
  console.log(`  - GET  http://localhost:${port}/health`);
  console.log(`  - GET  http://localhost:${port}/api/data`);
  console.log(`  - GET  http://localhost:${port}/api/users`);
  console.log(`  - GET  http://localhost:${port}/api/slow`);
  console.log(`  - GET  http://localhost:${port}/api/flaky`);
  console.log(`  - POST http://localhost:${port}/api/cascade-failure`);
  console.log(`  - GET  http://localhost:${port}/config`);
  console.log(`  - POST http://localhost:${port}/config`);
  console.log(`\n`);
});

export default app;

