import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [circuitStatuses, setCircuitStatuses] = useState({});
  const [serviceStatuses, setServiceStatuses] = useState({});

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setConnected(false);
    });

    socketInstance.on('connected', (data) => {
      console.log('Connected to Obsidian MROP:', data);
    });

    // Event listeners
    socketInstance.on('event:new', (event) => {
      setEvents((prev) => [event, ...prev].slice(0, 100)); // Keep last 100 events
    });

    socketInstance.on('circuit:status', (data) => {
      setCircuitStatuses((prev) => ({
        ...prev,
        [data.serviceName]: data.status,
      }));
    });

    socketInstance.on('service:status', (data) => {
      setServiceStatuses((prev) => ({
        ...prev,
        [data.serviceName]: data.status,
      }));
    });

    socketInstance.on('request:completed', (data) => {
      // Handle request completion
      console.log('Request completed:', data);
    });

    socketInstance.on('anomaly:alert', (data) => {
      // Handle anomaly detection
      console.warn('Anomaly detected:', data);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribeToService = (serviceName) => {
    if (socket) {
      socket.emit('subscribe:service', serviceName);
    }
  };

  const unsubscribeFromService = (serviceName) => {
    if (socket) {
      socket.emit('unsubscribe:service', serviceName);
    }
  };

  const value = {
    socket,
    connected,
    events,
    circuitStatuses,
    serviceStatuses,
    subscribeToService,
    unsubscribeFromService,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket; // Return socket directly
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context; // Return full context
}

export default SocketContext;

