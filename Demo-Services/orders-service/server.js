const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4001;
const INSTANCE_ID = process.env.INSTANCE_ID || '1';

app.use(cors());
app.use(express.json());

// In-memory orders
let orders = [];
let orderIdCounter = 1;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'orders-service',
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString(),
  });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  // Simulate some processing time
  setTimeout(() => {
    res.json({
      success: true,
      instance: INSTANCE_ID,
      total: orders.length,
      data: orders,
    });
  }, Math.random() * 100 + 50); // 50-150ms
});

// Get order by ID
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found',
      instance: INSTANCE_ID,
    });
  }

  res.json({
    success: true,
    instance: INSTANCE_ID,
    data: order,
  });
});

// Create order
app.post('/api/orders', (req, res) => {
  const { customerId, items, totalAmount } = req.body;

  if (!customerId || !items || !totalAmount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      instance: INSTANCE_ID,
    });
  }

  const order = {
    id: orderIdCounter++,
    customerId,
    items,
    totalAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  orders.push(order);

  res.status(201).json({
    success: true,
    instance: INSTANCE_ID,
    message: 'Order created successfully',
    data: order,
  });
});

// Update order status
app.patch('/api/orders/:id/status', (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found',
      instance: INSTANCE_ID,
    });
  }

  order.status = req.body.status || order.status;
  order.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    instance: INSTANCE_ID,
    message: 'Order status updated',
    data: order,
  });
});

// Delete order
app.delete('/api/orders/:id', (req, res) => {
  const index = orders.findIndex((o) => o.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Order not found',
      instance: INSTANCE_ID,
    });
  }

  orders.splice(index, 1);

  res.json({
    success: true,
    instance: INSTANCE_ID,
    message: 'Order deleted successfully',
  });
});

// Stats endpoint
app.get('/api/orders/stats/summary', (req, res) => {
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
  };

  res.json({
    success: true,
    instance: INSTANCE_ID,
    data: stats,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Orders Service (Instance ${INSTANCE_ID}) running on port ${PORT}`);
});

