const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4003;
const INSTANCE_ID = process.env.INSTANCE_ID || '1';

app.use(cors());
app.use(express.json());

// In-memory payments
let payments = [];
let paymentIdCounter = 1;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString(),
  });
});

// Get all payments
app.get('/api/payments', (req, res) => {
  // Simulate some processing time
  setTimeout(() => {
    res.json({
      success: true,
      instance: INSTANCE_ID,
      total: payments.length,
      data: payments,
    });
  }, Math.random() * 200 + 150); // 150-350ms (slowest service)
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

app.listen(PORT, () => {
  console.log(`🚀 Payment Service (Instance ${INSTANCE_ID}) running on port ${PORT}`);
});

