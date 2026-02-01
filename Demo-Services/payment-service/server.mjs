import express from 'express';
import cors from 'cors';
import { createAgent } from '../../Obsidian-SDK/src/index.js';

const app = express();
const PORT = process.env.PORT || 4003;
const INSTANCE_ID = process.env.INSTANCE_ID || 'payment-1';

// Simulate different failure scenarios
let failureMode = 'normal';
let requestCount = 0;
let isOverloaded = false;

app.use(cors());
app.use(express.json());

// In-memory payments
let payments = [];
let paymentIdCounter = 1;

// Initialize Obsidian SDK - Observer Pattern Integration
const obsidianSDK = createAgent({
  serviceName: 'payment',
  instanceId: INSTANCE_ID,
  serviceUrl: `http://localhost:${PORT}`,
  obsidianUrl: 'http://localhost:5000',
  description: 'Payment microservice for processing transactions',
  port: PORT,
});

// Register with Obsidian and start tracking
obsidianSDK.register().then(() => {
  console.log('Payment service registered with Obsidian MROP');
}).catch(err => {
  console.error('Failed to register with Obsidian:', err.message);
});

// Add SDK tracking middleware
app.use(obsidianSDK.createTrackingMiddleware());

// Health check with failure simulation (SDK enhanced)
app.get('/health', obsidianSDK.createHealthEndpoint());

// Alternative health endpoint with failure simulation
app.get('/health-alt', (req, res) => {
  requestCount++;
  
  if (failureMode === 'fail') {
    return res.status(500).json({
      service: 'payments',
      status: 'unhealthy',
      error: 'Payment service failing',
      instance: INSTANCE_ID
    });
  }
  
  if (failureMode === 'slow') {
    setTimeout(() => {
      res.json({
        service: 'payments',
        status: 'degraded',
        responseTime: 'slow',
        instance: INSTANCE_ID
      });
    }, 5000);
    return;
  }
  
  if (isOverloaded) {
    return res.status(503).json({
      service: 'payments',
      status: 'overloaded',
      error: 'Payment service under heavy load',
      instance: INSTANCE_ID
    });
  }
  
  res.json({
    service: 'payments',
    status: 'healthy',
    requestCount,
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString()
  });
});

// Get all payments with comprehensive failure simulation
app.get('/api/payments', (req, res) => {
  requestCount++;
  
  // Simulate different failure scenarios
  if (failureMode === 'fail') {
    const errorTypes = [
      { status: 500, message: 'Payment gateway connection failed' },
      { status: 503, message: 'Payment service unavailable' },
      { status: 502, message: 'External payment processor error' },
      { status: 504, message: 'Payment gateway timeout' },
      { status: 402, message: 'Payment processing failed' }
    ];
    
    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    return res.status(randomError.status).json({
      success: false,
      error: randomError.message,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  }
  
  if (failureMode === 'slow') {
    const delay = Math.random() * 5000 + 4000; // 4-9 seconds (slowest)
    setTimeout(() => {
      res.json({
        success: true,
        instance: INSTANCE_ID,
        total: payments.length,
        data: payments,
        warning: `Very slow payment response (${Math.round(delay)}ms) - processing delay`,
        responseTime: delay
      });
    }, delay);
    return;
  }
  
  if (isOverloaded) {
    return res.status(503).json({
      success: false,
      error: 'Payment service overloaded - too many transactions',
      instance: INSTANCE_ID,
      retryAfter: 120
    });
  }
  
  // Normal operation with realistic processing time (slowest service)
  const processingTime = Math.random() * 400 + 200; // 200-600ms
  setTimeout(() => {
    res.json({
      success: true,
      instance: INSTANCE_ID,
      total: payments.length,
      data: payments,
      requestCount,
      responseTime: processingTime,
      timestamp: new Date().toISOString()
    });
  }, processingTime);
});

// Get payment by ID
app.get('/api/payments/:id', (req, res) => {
  const payment = payments.find((p) => p.id === parseInt(req.params.id));

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found',
      instance: INSTANCE_ID,
    });
  }

  res.json({
    success: true,
    instance: INSTANCE_ID,
    data: payment,
  });
});

// Process payment
app.post('/api/payments/process', (req, res) => {
  const { orderId, amount, method, cardNumber } = req.body;

  if (!orderId || !amount || !method) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      instance: INSTANCE_ID,
    });
  }

  // Simulate payment processing (10% failure rate)
  const isSuccess = Math.random() > 0.1;

  const payment = {
    id: paymentIdCounter++,
    orderId,
    amount,
    method,
    status: isSuccess ? 'completed' : 'failed',
    transactionId: isSuccess ? `TXN${Date.now()}${Math.floor(Math.random() * 1000)}` : null,
    errorMessage: isSuccess ? null : 'Payment declined by bank',
    createdAt: new Date().toISOString(),
  };

  payments.push(payment);

  if (!isSuccess) {
    return res.status(402).json({
      success: false,
      instance: INSTANCE_ID,
      error: 'Payment failed',
      data: payment,
    });
  }

  res.status(201).json({
    success: true,
    instance: INSTANCE_ID,
    message: 'Payment processed successfully',
    data: payment,
  });
});

// Refund payment
app.post('/api/payments/:id/refund', (req, res) => {
  const payment = payments.find((p) => p.id === parseInt(req.params.id));

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found',
      instance: INSTANCE_ID,
    });
  }

  if (payment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      error: 'Only completed payments can be refunded',
      instance: INSTANCE_ID,
    });
  }

  payment.status = 'refunded';
  payment.refundedAt = new Date().toISOString();

  res.json({
    success: true,
    instance: INSTANCE_ID,
    message: 'Payment refunded successfully',
    data: payment,
  });
});

// Verify payment
app.get('/api/payments/:id/verify', (req, res) => {
  const payment = payments.find((p) => p.id === parseInt(req.params.id));

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'Payment not found',
      instance: INSTANCE_ID,
    });
  }

  res.json({
    success: true,
    instance: INSTANCE_ID,
    verified: payment.status === 'completed',
    data: payment,
  });
});

// Stats endpoint
app.get('/api/payments/stats/summary', (req, res) => {
  const stats = {
    total: payments.length,
    completed: payments.filter((p) => p.status === 'completed').length,
    failed: payments.filter((p) => p.status === 'failed').length,
    refunded: payments.filter((p) => p.status === 'refunded').length,
    totalProcessed: payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    totalRefunded: payments
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  res.json({
    success: true,
    instance: INSTANCE_ID,
    data: stats,
  });
});

// Failure simulation endpoints
app.post('/payments/fail', (req, res) => {
  failureMode = 'fail';
  res.json({ message: 'Payment service set to fail mode', instance: INSTANCE_ID });
});

app.post('/payments/slow', (req, res) => {
  failureMode = 'slow';
  res.json({ message: 'Payment service set to slow mode', instance: INSTANCE_ID });
});

app.post('/payments/overload', (req, res) => {
  isOverloaded = true;
  res.json({ message: 'Payment service set to overload mode', instance: INSTANCE_ID });
});

app.post('/payments/recover', (req, res) => {
  failureMode = 'normal';
  isOverloaded = false;
  res.json({ message: 'Payment service recovered', instance: INSTANCE_ID });
});

app.get('/payments/status', (req, res) => {
  res.json({
    failureMode,
    isOverloaded,
    requestCount,
    instance: INSTANCE_ID
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  obsidianSDK.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  obsidianSDK.destroy();
  process.exit(0);
});

app.listen(PORT, async () => {
  console.log(`🚀 Payment Service (Instance ${INSTANCE_ID}) running on port ${PORT}`);
  console.log(`📊 Obsidian SDK integrated - Observer pattern active`);
  console.log(`📊 Failure simulation endpoints:`);
  console.log(`   POST /payments/fail - Simulate failures`);
  console.log(`   POST /payments/slow - Simulate slow responses`);
  console.log(`   POST /payments/overload - Simulate overload`);
  console.log(`   POST /payments/recover - Recover from failures`);

  // Try to register with Obsidian
  try {
    await obsidianSDK.register();
    console.log(`✅ Successfully registered with Obsidian MROP`);
  } catch (error) {
    console.log(`⚠️  Could not register with Obsidian: ${error.message}`);
    console.log(`   Service will still work but metrics won't be tracked`);
  }
});

