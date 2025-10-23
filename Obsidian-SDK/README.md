# @obsidian/agent

Official Obsidian MROP Agent - Drop-in library for automatic service registration and monitoring.

## Installation

```bash
npm install @obsidian/agent
```

## Quick Start

### Method 1: Auto-Configuration

```javascript
import { createAgent } from '@obsidian/agent';

// Auto-detect service name and URL
const agent = createAgent({
  obsidianUrl: 'http://localhost:5000'
});

// That's it! Your service is now monitored.
```

### Method 2: Manual Configuration

```javascript
import ObsidianAgent from '@obsidian/agent';

const agent = new ObsidianAgent({
  obsidianUrl: 'http://localhost:5000',
  serviceName: 'my-awesome-service',
  serviceUrl: 'http://localhost:3000',
  healthEndpoint: '/health',
  healthInterval: 30000,
  metadata: {
    version: '1.0.0',
    environment: 'production'
  }
});

await agent.initialize();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `obsidianUrl` | string | `http://localhost:5000` | Obsidian API URL |
| `serviceName` | string | Auto-detected | Service name |
| `serviceUrl` | string | Auto-detected | Service URL |
| `healthEndpoint` | string | `/health` | Health check endpoint |
| `healthInterval` | number | `30000` | Health check interval (ms) |
| `heartbeatInterval` | number | `60000` | Heartbeat interval (ms) |
| `autoRegister` | boolean | `true` | Auto-register on start |
| `metadata` | object | `{}` | Custom metadata |

## Environment Variables

The agent automatically reads configuration from environment variables:

```bash
OBSIDIAN_URL=http://localhost:5000
SERVICE_NAME=my-service
SERVICE_URL=http://localhost:3000
PORT=3000
HOST=localhost
```

## Express Integration

```javascript
import express from 'express';
import { createAgent } from '@obsidian/agent';

const app = express();
const agent = createAgent();

// Add automatic request tracking
app.use(agent.expressMiddleware());

// Your routes...
app.get('/api/data', (req, res) => {
  res.json({ data: 'Hello World' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Custom Metrics

```javascript
// Send custom metric
await agent.sendMetric({
  metricType: 'business_metric',
  value: 42,
  unit: 'count',
  tags: {
    category: 'sales'
  }
});
```

## Custom Events

```javascript
// Send custom event
await agent.sendEvent({
  type: 'custom_event',
  severity: 'info',
  message: 'User signed up',
  metadata: {
    userId: '123',
    email: 'user@example.com'
  }
});
```

## Complete Example

```javascript
import express from 'express';
import { createAgent } from '@obsidian/agent';

const app = express();

// Initialize Obsidian Agent
const agent = createAgent({
  obsidianUrl: process.env.OBSIDIAN_URL || 'http://localhost:5000',
  serviceName: 'user-service',
  metadata: {
    version: '1.0.0',
    environment: process.env.NODE_ENV
  }
});

// Add request tracking
app.use(agent.expressMiddleware());

// Health endpoint (required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Your API routes
app.get('/api/users', async (req, res) => {
  // Your logic here
  res.json({ users: [] });
});

app.post('/api/users', async (req, res) => {
  // Your logic here
  
  // Send custom event
  await agent.sendEvent({
    type: 'user_created',
    severity: 'info',
    message: 'New user created'
  });
  
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Docker Integration

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy app
COPY . .

# Environment variables
ENV OBSIDIAN_URL=http://obsidian-api:5000
ENV SERVICE_NAME=my-service
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  my-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      OBSIDIAN_URL: http://obsidian-api:5000
      SERVICE_NAME: my-service
    depends_on:
      - obsidian-api
```

## Kubernetes Integration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-service
  template:
    metadata:
      labels:
        app: my-service
    spec:
      containers:
      - name: my-service
        image: my-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: OBSIDIAN_URL
          value: "http://obsidian-api:5000"
        - name: SERVICE_NAME
          value: "my-service"
        - name: PORT
          value: "3000"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Features

✅ **Auto-Registration** - Automatically register service on startup  
✅ **Health Monitoring** - Periodic health checks  
✅ **Heartbeat** - Keep-alive signals  
✅ **Request Tracking** - Automatic endpoint monitoring  
✅ **Custom Metrics** - Send business metrics  
✅ **Custom Events** - Track important events  
✅ **Graceful Shutdown** - Auto-unregister on shutdown  
✅ **Zero Configuration** - Works out of the box  
✅ **Framework Agnostic** - Works with any Node.js framework  

## API Reference

### `createAgent(config)`

Factory function to create and initialize an agent.

**Parameters:**
- `config` (object) - Configuration options

**Returns:** `ObsidianAgent` instance

### `ObsidianAgent`

Main agent class.

#### Methods

- `initialize()` - Initialize and register the agent
- `register()` - Manually register service
- `unregister()` - Manually unregister service
- `sendHeartbeat()` - Send heartbeat signal
- `sendMetric(metric)` - Send custom metric
- `sendEvent(event)` - Send custom event
- `expressMiddleware()` - Express middleware for request tracking
- `shutdown()` - Graceful shutdown

## Troubleshooting

### Agent not registering

1. Check Obsidian URL is correct
2. Ensure Obsidian API is running
3. Check network connectivity
4. Review console logs

### Health checks failing

1. Ensure `/health` endpoint exists
2. Check health endpoint returns 200 status
3. Verify service is accessible from Obsidian

### Metrics not appearing

1. Check service is registered
2. Verify Obsidian API is receiving requests
3. Review agent configuration

## License

MIT

