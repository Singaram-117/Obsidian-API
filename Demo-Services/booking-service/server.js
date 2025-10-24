const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4002;
const INSTANCE_ID = process.env.INSTANCE_ID || '1';

// Simulate different failure scenarios
let failureMode = 'normal';
let requestCount = 0;
let isOverloaded = false;

app.use(cors());
app.use(express.json());

// In-memory bookings
let bookings = [];
let bookingIdCounter = 1;

// Health check with failure simulation
app.get('/health', (req, res) => {
  requestCount++;
  
  if (failureMode === 'fail') {
    return res.status(500).json({
      service: 'booking',
      status: 'unhealthy',
      error: 'Booking service failing',
      instance: INSTANCE_ID
    });
  }
  
  if (failureMode === 'slow') {
    setTimeout(() => {
      res.json({
        service: 'booking',
        status: 'degraded',
        responseTime: 'slow',
        instance: INSTANCE_ID
      });
    }, 4000);
    return;
  }
  
  if (isOverloaded) {
    return res.status(503).json({
      service: 'booking',
      status: 'overloaded',
      error: 'Booking service under heavy load',
      instance: INSTANCE_ID
    });
  }
  
  res.json({
    service: 'booking',
    status: 'healthy',
    requestCount,
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString()
  });
});

// Get all bookings with comprehensive failure simulation
app.get('/api/bookings', (req, res) => {
  requestCount++;
  
  // Simulate different failure scenarios
  if (failureMode === 'fail') {
    const errorTypes = [
      { status: 500, message: 'Booking database unavailable' },
      { status: 503, message: 'Booking service temporarily down' },
      { status: 502, message: 'External booking API error' },
      { status: 504, message: 'Booking service timeout' }
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
    const delay = Math.random() * 4000 + 3000; // 3-7 seconds
    setTimeout(() => {
      res.json({
        success: true,
        instance: INSTANCE_ID,
        total: bookings.length,
        data: bookings,
        warning: `Slow booking response (${Math.round(delay)}ms) - high load`,
        responseTime: delay
      });
    }, delay);
    return;
  }
  
  if (isOverloaded) {
    return res.status(503).json({
      success: false,
      error: 'Booking service overloaded - too many requests',
      instance: INSTANCE_ID,
      retryAfter: 60
    });
  }
  
  // Normal operation with realistic processing time
  const processingTime = Math.random() * 300 + 100; // 100-400ms
  setTimeout(() => {
    res.json({
      success: true,
      instance: INSTANCE_ID,
      total: bookings.length,
      data: bookings,
      requestCount,
      responseTime: processingTime,
      timestamp: new Date().toISOString()
    });
  }, processingTime);
});

// Get booking by ID
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find((b) => b.id === parseInt(req.params.id));

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: 'Booking not found',
      instance: INSTANCE_ID,
    });
  }

  res.json({
    success: true,
    instance: INSTANCE_ID,
    data: booking,
  });
});

// Create booking
app.post('/api/bookings', (req, res) => {
  const { customerId, resourceType, resourceId, startDate, endDate } = req.body;

  if (!customerId || !resourceType || !resourceId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      instance: INSTANCE_ID,
    });
  }

  // Simulate checking availability (20% chance of conflict)
  if (Math.random() < 0.2) {
    return res.status(409).json({
      success: false,
      error: 'Resource not available for the selected dates',
      instance: INSTANCE_ID,
    });
  }

  const booking = {
    id: bookingIdCounter++,
    customerId,
    resourceType,
    resourceId,
    startDate,
    endDate,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);

  res.status(201).json({
    success: true,
    instance: INSTANCE_ID,
    message: 'Booking created successfully',
    data: booking,
  });
});

// Cancel booking
app.patch('/api/bookings/:id/cancel', (req, res) => {
  const booking = bookings.find((b) => b.id === parseInt(req.params.id));

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: 'Booking not found',
      instance: INSTANCE_ID,
    });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      error: 'Booking already cancelled',
      instance: INSTANCE_ID,
    });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();

  res.json({
    success: true,
    instance: INSTANCE_ID,
    message: 'Booking cancelled successfully',
    data: booking,
  });
});

// Check availability
app.get('/api/bookings/availability/:resourceId', (req, res) => {
  const { resourceId } = req.params;
  const { startDate, endDate } = req.query;

  // Simple availability check
  const conflictingBookings = bookings.filter(
    (b) =>
      b.resourceId === resourceId &&
      b.status !== 'cancelled' &&
      new Date(b.startDate) <= new Date(endDate) &&
      new Date(b.endDate) >= new Date(startDate)
  );

  res.json({
    success: true,
    instance: INSTANCE_ID,
    available: conflictingBookings.length === 0,
    conflicts: conflictingBookings.length,
  });
});

// Stats endpoint
app.get('/api/bookings/stats/summary', (req, res) => {
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  res.json({
    success: true,
    instance: INSTANCE_ID,
    data: stats,
  });
});

// Failure simulation endpoints
app.post('/bookings/fail', (req, res) => {
  failureMode = 'fail';
  res.json({ message: 'Booking service set to fail mode', instance: INSTANCE_ID });
});

app.post('/bookings/slow', (req, res) => {
  failureMode = 'slow';
  res.json({ message: 'Booking service set to slow mode', instance: INSTANCE_ID });
});

app.post('/bookings/overload', (req, res) => {
  isOverloaded = true;
  res.json({ message: 'Booking service set to overload mode', instance: INSTANCE_ID });
});

app.post('/bookings/recover', (req, res) => {
  failureMode = 'normal';
  isOverloaded = false;
  res.json({ message: 'Booking service recovered', instance: INSTANCE_ID });
});

app.get('/bookings/status', (req, res) => {
  res.json({
    failureMode,
    isOverloaded,
    requestCount,
    instance: INSTANCE_ID
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Booking Service (Instance ${INSTANCE_ID}) running on port ${PORT}`);
  console.log(`📊 Failure simulation endpoints:`);
  console.log(`   POST /bookings/fail - Simulate failures`);
  console.log(`   POST /bookings/slow - Simulate slow responses`);
  console.log(`   POST /bookings/overload - Simulate overload`);
  console.log(`   POST /bookings/recover - Recover from failures`);
});

