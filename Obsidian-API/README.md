# Obsidian-API

Backend API for the Obsidian Microservice Resilience & Observability Platform (MROP).

## Features

- **Circuit Breaker Pattern** - Prevents cascading failures using Opossum
- **Rate Limiting** - Protects API from being overwhelmed
- **Centralized Logging** - Winston logger with MongoDB transport
- **Real-Time Updates** - Socket.IO for live dashboard updates
- **Background Jobs** - Bull queue for async processing
- **Kafka Integration** - Event streaming and message queue
- **Health Monitoring** - Automated health checks for registered services
- **Event Tracking** - Comprehensive event system with Observer pattern
- **Metrics Collection** - Time-series metrics storage

## Design Patterns Implemented

1. **Singleton Pattern** - Configuration management
2. **Circuit Breaker Pattern** - Fault isolation
3. **Observer Pattern** - Event management system
4. **Producer-Consumer Pattern** - Job queue processing

## Prerequisites

- Node.js 18+
- MongoDB (Atlas or local)
- Redis (for Bull queue)
- Kafka (optional)

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/obsidian

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Mock Service
MOCK_SERVICE_URL=http://localhost:3001

# Frontend
FRONTEND_URL=http://localhost:8080
```

## Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Run worker (separate process)
npm run worker
```

## API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with metrics

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:name` - Get specific service
- `POST /api/services` - Register new service
- `PUT /api/services/:name` - Update service
- `DELETE /api/services/:name` - Unregister service
- `POST /api/services/:name/call` - Proxy call through circuit breaker
- `GET /api/services/:name/stats` - Get circuit breaker stats
- `POST /api/services/:name/circuit/open` - Manually open circuit
- `POST /api/services/:name/circuit/close` - Manually close circuit

### Events
- `GET /api/events` - Get recent events
- `GET /api/events/service/:serviceName` - Get events by service
- `GET /api/events/type/:type` - Get events by type
- `GET /api/events/severity/:severity` - Get events by severity
- `GET /api/events/stats` - Get event statistics

### Metrics
- `GET /api/metrics` - Get metrics with filtering
- `POST /api/metrics` - Record new metric
- `GET /api/metrics/service/:serviceName` - Get service metrics
- `GET /api/metrics/aggregate` - Get aggregated metrics

### Queue
- `GET /api/queue/stats` - Get all queue stats
- `GET /api/queue/:queueName/stats` - Get specific queue stats
- `POST /api/queue/:queueName/job` - Add job to queue
- `POST /api/queue/:queueName/pause` - Pause queue
- `POST /api/queue/:queueName/resume` - Resume queue
- `DELETE /api/queue/:queueName/clean` - Clean completed jobs

## Socket.IO Events

### Emitted by Server
- `connected` - Initial connection confirmation
- `event:new` - New event created
- `circuit:status` - Circuit breaker status change
- `service:status` - Service status change
- `request:completed` - Request completion (success/failure)
- `anomaly:alert` - Anomaly detected

### Emitted by Client
- `subscribe:service` - Subscribe to service-specific events
- `unsubscribe:service` - Unsubscribe from service events

## Architecture

```
src/
├── config/          # Configuration (Singleton pattern)
├── db/              # Database connection
├── middleware/      # Express middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── services/        # Business logic services
│   ├── circuitBreakerService.js
│   ├── eventService.js
│   ├── kafkaService.js
│   ├── queueService.js
│   └── healthCheckService.js
├── socket/          # Socket.IO handlers
├── utils/           # Utility functions
├── workers/         # Background job workers
└── server.js        # Main application entry
```

## Testing with Mock Service

Register the mock service for testing:

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mock-service",
    "url": "http://localhost:3001",
    "healthCheck": {
      "endpoint": "/health",
      "interval": 30000
    }
  }'
```

Make a call through the circuit breaker:

```bash
curl -X POST http://localhost:5000/api/services/mock-service/call \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/data",
    "method": "GET"
  }'
```

## License

MIT

