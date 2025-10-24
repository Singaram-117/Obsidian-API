const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4002;
const INSTANCE_ID = process.env.INSTANCE_ID || '1';

app.use(cors());
app.use(express.json());

// In-memory bookings
let bookings = [];
let bookingIdCounter = 1;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'booking-service',
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString(),
  });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
  // Simulate some processing time
  setTimeout(() => {
    res.json({
      success: true,
      instance: INSTANCE_ID,
      total: bookings.length,
      data: bookings,
    });
  }, Math.random() * 150 + 100); // 100-250ms (slower than orders)
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

app.listen(PORT, () => {
  console.log(`🚀 Booking Service (Instance ${INSTANCE_ID}) running on port ${PORT}`);
});

