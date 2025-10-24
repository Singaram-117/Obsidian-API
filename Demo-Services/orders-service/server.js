const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4001;
const INSTANCE_ID = process.env.INSTANCE_ID || '1';

// Simulate different failure scenarios
let failureMode = 'normal';
let requestCount = 0;
let isOverloaded = false;

app.use(cors());
app.use(express.json());

// In-memory orders
let orders = [];
let orderIdCounter = 1;

// Health check with failure simulation
app.get('/health', (req, res) => {
  requestCount++;
  
  // Simulate different failure modes
  if (failureMode === 'fail') {
    return res.status(500).json({
      service: 'orders',
      status: 'unhealthy',
      error: 'Service intentionally failing',
      instance: INSTANCE_ID
    });
  }
  
  if (failureMode === 'slow') {
    setTimeout(() => {
      res.json({
        service: 'orders',
        status: 'degraded',
        responseTime: 'slow',
        instance: INSTANCE_ID
      });
    }, 3000);
    return;
  }
  
  if (isOverloaded) {
    return res.status(503).json({
      service: 'orders',
      status: 'overloaded',
      error: 'Service under heavy load',
      instance: INSTANCE_ID
    });
  }
  
  res.json({
    service: 'orders',
    status: 'healthy',
    requestCount,
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString()
  });
});

// Get all orders with comprehensive failure simulation
app.get('/api/orders', (req, res) => {
  requestCount++;
  
  // Simulate different failure scenarios
  if (failureMode === 'fail') {
    const errorTypes = [
      { status: 500, message: 'Database connection failed' },
      { status: 503, message: 'Service temporarily unavailable' },
      { status: 502, message: 'Bad gateway - upstream service error' },
      { status: 504, message: 'Gateway timeout' }
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
    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    setTimeout(() => {
      res.json({
        success: true,
        instance: INSTANCE_ID,
        total: orders.length,
        data: orders,
        warning: `Slow response (${Math.round(delay)}ms) due to high load`,
        responseTime: delay
      });
    }, delay);
    return;
  }
  
  if (isOverloaded) {
    return res.status(503).json({
      success: false,
      error: 'Service overloaded - too many requests',
      instance: INSTANCE_ID,
      retryAfter: 30
    });
  }
  
  // Normal operation with realistic processing time
  const processingTime = Math.random() * 200 + 50; // 50-250ms
  setTimeout(() => {
    res.json({
      success: true,
      instance: INSTANCE_ID,
      total: orders.length,
      data: orders,
      requestCount,
      responseTime: processingTime,
      timestamp: new Date().toISOString()
    });
  }, processingTime);
});

// Get order by ID with failure simulation
app.get('/api/orders/:id', (req, res) => {
  requestCount++;
  
  // Simulate failures
  if (failureMode === 'fail' && Math.random() < 0.4) {
    return res.status(500).json({
      success: false,
      error: 'Database query failed',
      instance: INSTANCE_ID
    });
  }
  
  if (failureMode === 'slow') {
    setTimeout(() => {
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
        warning: 'Slow response due to database load'
      });
    }, 1500);
    return;
  }
  
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

// Create order with failure simulation
app.post('/api/orders', (req, res) => {
  requestCount++;
  
  // Simulate failures
  if (failureMode === 'fail' && Math.random() < 0.2) {
    return res.status(500).json({
      success: false,
      error: 'Order creation failed - database write error',
      instance: INSTANCE_ID
    });
  }
  
  if (failureMode === 'slow') {
    setTimeout(() => {
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
        message: 'Order created successfully (slow response)',
        data: order,
        warning: 'Slow database write operation'
      });
    }, 2000);
    return;
  }
  
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

// Failure simulation endpoints
app.post('/orders/fail', (req, res) => {
  failureMode = 'fail';
  res.json({ message: 'Orders service set to fail mode', instance: INSTANCE_ID });
});

app.post('/orders/slow', (req, res) => {
  failureMode = 'slow';
  res.json({ message: 'Orders service set to slow mode', instance: INSTANCE_ID });
});

app.post('/orders/overload', (req, res) => {
  isOverloaded = true;
  res.json({ message: 'Orders service set to overload mode', instance: INSTANCE_ID });
});

app.post('/orders/recover', (req, res) => {
  failureMode = 'normal';
  isOverloaded = false;
  res.json({ message: 'Orders service recovered', instance: INSTANCE_ID });
});

app.get('/orders/status', (req, res) => {
  res.json({
    failureMode,
    isOverloaded,
    requestCount,
    instance: INSTANCE_ID
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Orders Service (Instance ${INSTANCE_ID}) running on port ${PORT}`);
  console.log(`📊 Failure simulation endpoints:`);
  console.log(`   POST /orders/fail - Simulate failures`);
  console.log(`   POST /orders/slow - Simulate slow responses`);
  console.log(`   POST /orders/overload - Simulate overload`);
  console.log(`   POST /orders/recover - Recover from failures`);
});

