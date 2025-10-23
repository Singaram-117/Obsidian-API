import { Server } from 'socket.io';
import { eventEmitter } from '../services/eventService.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Socket.IO Handler
 * Provides real-time updates to connected clients
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true, // Allow all origins for development
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Track connected clients
  let connectedClients = 0;

  io.on('connection', (socket) => {
    connectedClients++;
    logger.info('Client connected to Socket.IO', {
      socketId: socket.id,
      totalClients: connectedClients,
    });

    // Send initial connection message
    socket.emit('connected', {
      message: 'Connected to Obsidian MROP',
      timestamp: new Date(),
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
      connectedClients--;
      logger.info('Client disconnected from Socket.IO', {
        socketId: socket.id,
        totalClients: connectedClients,
      });
    });

    // Handle custom events from clients
    socket.on('subscribe:service', (serviceName) => {
      socket.join(`service:${serviceName}`);
      logger.debug('Client subscribed to service', {
        socketId: socket.id,
        serviceName,
      });
    });

    socket.on('unsubscribe:service', (serviceName) => {
      socket.leave(`service:${serviceName}`);
      logger.debug('Client unsubscribed from service', {
        socketId: socket.id,
        serviceName,
      });
    });
  });

  // Listen to event emitter and broadcast to clients
  eventEmitter.on('event:created', (event) => {
    io.emit('event:new', event);
    
    // Also emit to service-specific room
    if (event.serviceName) {
      io.to(`service:${event.serviceName}`).emit('service:event', event);
    }
  });

  eventEmitter.on('circuit:open', (data) => {
    io.emit('circuit:status', {
      ...data,
      status: 'open',
    });
  });

  eventEmitter.on('circuit:halfOpen', (data) => {
    io.emit('circuit:status', {
      ...data,
      status: 'half-open',
    });
  });

  eventEmitter.on('circuit:close', (data) => {
    io.emit('circuit:status', {
      ...data,
      status: 'closed',
    });
  });

  eventEmitter.on('service:up', (data) => {
    io.emit('service:status', {
      ...data,
      status: 'healthy',
    });
  });

  eventEmitter.on('service:down', (data) => {
    io.emit('service:status', {
      ...data,
      status: 'down',
    });
  });

  eventEmitter.on('service:degraded', (data) => {
    io.emit('service:status', {
      ...data,
      status: 'degraded',
    });
  });

  eventEmitter.on('request:success', (data) => {
    io.emit('request:completed', {
      ...data,
      success: true,
    });
  });

  eventEmitter.on('request:failure', (data) => {
    io.emit('request:completed', {
      ...data,
      success: false,
    });
  });

  eventEmitter.on('anomaly:detected', (data) => {
    io.emit('anomaly:alert', data);
  });

  logger.info('Socket.IO initialized');

  return io;
};

export default initializeSocket;

