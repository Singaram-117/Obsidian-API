# 🎛️ Microservice Management System - Complete Guide

## 🌟 Overview

The **Microservice Management System** is a comprehensive control center for managing all aspects of your microservices in the Obsidian MROP platform. It provides real-time visibility and control over:

- 📡 **Endpoint Discovery** - Automatically detect and map all API endpoints
- ⏱️ **Rate Limiting** - Control request rates at service, endpoint, and client levels
- ⚖️ **Load Balancing** - Distribute traffic across multiple instances with various strategies
- 💾 **Response Caching** - Improve performance with intelligent caching

---

## 📡 Endpoint Discovery

### What It Does

Automatically discovers and documents all endpoints of your microservices using multiple strategies:

1. **OpenAPI/Swagger** - Parses Swagger documentation if available
2. **Express Routes** - Detects routes from Express-based services
3. **Probing** - Tests common endpoint patterns to discover available routes

### API Endpoints

```javascript
// Discover all endpoints
POST /api/microservice/:serviceName/discover-endpoints

// Get discovered endpoints
GET /api/microservice/:serviceName/endpoints
```

### Frontend Usage

Navigate to **Manage** → Select a service → **Endpoints** tab → Click **Discover**

### Response Format

```json
{
  "success": true,
  "data": {
    "serviceName": "my-service",
    "serviceUrl": "http://localhost:3001",
    "discoveredAt": "2025-10-23T20:30:00.000Z",
    "endpoints": [
      {
        "path": "/api/users",
        "method": "GET",
        "summary": "Get all users",
        "description": "Retrieves a list of all users",
        "tags": ["users"],
        "parameters": [],
        "responses": ["200", "500"]
      }
    ],
    "metadata": {
      "source": "openapi",
      "version": "1.0.0",
      "title": "My Service API"
    }
  }
}
```

---

## ⏱️ Rate Limiting

### What It Does

Protects your microservices from overload by limiting request rates at three levels:

1. **Service-Level** - Overall limit for the entire service
2. **Endpoint-Level** - Individual limits per endpoint
3. **Client-Level** - Per-client rate limits

### How It Works

- Uses **token bucket** algorithm
- In-memory storage for high performance
- Automatic cleanup of expired buckets
- Real-time usage tracking

### API Endpoints

```javascript
// Service-level rate limit
PUT /api/microservice/:serviceName/rate-limit
{
  "enabled": true,
  "requestsPerMinute": 100
}

// Endpoint-level rate limit
PUT /api/microservice/:serviceName/endpoint-rate-limit
{
  "endpoint": "/api/users",
  "enabled": true,
  "requestsPerMinute": 50
}

// Client-level rate limit
PUT /api/microservice/:serviceName/client-rate-limit
{
  "enabled": true,
  "requestsPerMinute": 60
}

// Get rate limit status
GET /api/microservice/:serviceName/rate-limit-status

// Reset rate limit counters
POST /api/microservice/:serviceName/rate-limit-reset
```

### Frontend Usage

1. Navigate to **Manage** → Select a service → **Rate Limiting** tab
2. **Service-Level**: Toggle to enable, set requests per minute, save
3. **Endpoint-Level**: Select endpoint, configure limit, save
4. Monitor current usage in real-time

### Rate Limit Response

When a rate limit is exceeded, the API returns:

```json
{
  "allowed": false,
  "reason": "service_limit_exceeded",
  "limit": 100,
  "resetAt": "2025-10-23T20:31:00.000Z",
  "retryAfter": 45
}
```

---

## ⚖️ Load Balancing

### What It Does

Distributes traffic across multiple instances of the same microservice using various strategies.

### Supported Strategies

1. **Round Robin** - Distributes requests evenly across all instances
2. **Least Connections** - Routes to instance with fewest active connections
3. **Weighted Round Robin** - Distributes based on instance weights
4. **Weighted Response Time** - Favors faster instances
5. **Random** - Random selection
6. **IP Hash** - Consistent routing based on client IP (sticky sessions)

### Instance States

- **Healthy** - Actively receiving traffic
- **Unhealthy** - Temporarily removed from rotation after health check failures
- **Draining** - No new traffic, existing connections allowed to complete
- **Disabled** - Manually disabled, no traffic

### API Endpoints

```javascript
// Register a new instance
POST /api/microservice/:serviceName/instances
{
  "url": "http://localhost:3002",
  "weight": 1,
  "trafficPercentage": 100,
  "isCanary": false,
  "metadata": {
    "region": "us-east-1",
    "zone": "a",
    "version": "1.2.0"
  }
}

// Get all instances
GET /api/microservice/:serviceName/instances

// Update load balancing strategy
PUT /api/microservice/:serviceName/load-balancing
{
  "enabled": true,
  "strategy": "least-connections",
  "stickySession": false
}

// Deregister an instance
DELETE /api/microservice/:serviceName/instances/:instanceId

// Update instance status
PUT /api/microservice/:serviceName/instances/:instanceId/status
{
  "action": "drain" // or "enable", "disable"
}

// Get instance statistics
GET /api/microservice/:serviceName/instances/stats
```

### Frontend Usage

1. Navigate to **Manage** → Select a service → **Load Balancing** tab
2. **Configuration**:
   - Enable load balancing
   - Select strategy
   - Save configuration
3. **Add Instance**:
   - Click "Add Instance"
   - Enter URL, weight, traffic percentage
   - Optionally mark as canary
   - Save
4. **Manage Instances**:
   - View all instances with stats
   - Enable/Disable/Drain instances
   - Remove instances

### Instance Stats

```json
{
  "total": 3,
  "healthy": 2,
  "unhealthy": 0,
  "draining": 1,
  "disabled": 0,
  "totalConnections": 45,
  "totalRequests": 1250,
  "avgResponseTime": 127.5
}
```

---

## 💾 Response Caching

### What It Does

Caches responses from microservices to reduce load and improve performance.

### Features

- Automatic cache key generation based on service, endpoint, method, and parameters
- Configurable TTL (Time To Live)
- Per-service and per-endpoint cache control
- Hit/miss tracking
- Cache invalidation
- Automatic cleanup of expired entries

### API Endpoints

```javascript
// Update cache configuration
PUT /api/microservice/:serviceName/cache
{
  "enabled": true,
  "ttl": 60000, // milliseconds
  "endpoints": {
    "/api/users": { "enabled": true, "ttl": 120000 }
  }
}

// Get cache statistics
GET /api/microservice/:serviceName/cache/stats

// Invalidate cache
POST /api/microservice/:serviceName/cache/invalidate
{
  "endpoint": "/api/users" // optional, omit to clear all
}

// Global cache stats
GET /api/microservice/cache/stats
```

### Frontend Usage

1. Navigate to **Manage** → Select a service → **Caching** tab
2. Toggle to enable caching
3. Set TTL (in milliseconds)
4. Save configuration
5. Monitor cache statistics
6. Invalidate cache when needed

### Cache Statistics

```json
{
  "hits": 1250,
  "misses": 180,
  "sets": 180,
  "evictions": 45,
  "hitRate": "87.41%",
  "size": 135,
  "entries": [
    {
      "serviceName": "my-service",
      "endpoint": "/api/users",
      "method": "GET",
      "hits": 45,
      "age": 15000,
      "ttl": 45000
    }
  ]
}
```

---

## 🎯 Complete Service Overview

Get a comprehensive view of a service with all its configurations and statistics:

```javascript
GET /api/microservice/:serviceName/overview
```

### Response

```json
{
  "success": true,
  "data": {
    "service": {
      "name": "my-service",
      "url": "http://localhost:3001",
      "status": "healthy",
      "circuitStatus": "closed",
      "description": "My microservice",
      "github": { /* ... */ }
    },
    "endpoints": [ /* discovered endpoints */ ],
    "endpointsDiscoveredAt": "2025-10-23T20:30:00.000Z",
    "metrics": {
      "totalRequests": 5000,
      "successfulRequests": 4850,
      "failedRequests": 150,
      "averageResponseTime": 125
    },
    "rateLimit": {
      "service": {
        "enabled": true,
        "limit": 100,
        "current": 45,
        "resetAt": "2025-10-23T20:31:00.000Z"
      },
      "endpoints": { /* ... */ },
      "client": { /* ... */ }
    },
    "cache": {
      "config": { /* ... */ },
      "stats": { /* ... */ }
    },
    "loadBalancing": {
      "config": {
        "enabled": true,
        "strategy": "round-robin",
        "stickySession": false
      },
      "instances": [ /* ... */ ],
      "stats": { /* ... */ }
    }
  }
}
```

---

## 📊 Usage Examples

### Example 1: Horizontal Scaling with Load Balancing

```javascript
// 1. Register your main service
POST /api/services
{
  "name": "user-service",
  "url": "http://localhost:3001",
  "description": "User management service"
}

// 2. Enable load balancing
PUT /api/microservice/user-service/load-balancing
{
  "enabled": true,
  "strategy": "least-connections"
}

// 3. Add multiple instances
POST /api/microservice/user-service/instances
{
  "url": "http://localhost:3001",
  "weight": 1
}

POST /api/microservice/user-service/instances
{
  "url": "http://localhost:3002",
  "weight": 1
}

POST /api/microservice/user-service/instances
{
  "url": "http://localhost:3003",
  "weight": 2  // Higher weight = more traffic
}

// 4. Traffic will now be distributed across all 3 instances
```

### Example 2: Canary Deployment

```javascript
// 1. Add a canary instance with new version
POST /api/microservice/user-service/instances
{
  "url": "http://localhost:3004",
  "weight": 1,
  "trafficPercentage": 10,  // Only 10% of traffic
  "isCanary": true,
  "metadata": {
    "version": "2.0.0"
  }
}

// 2. Monitor the canary instance
GET /api/microservice/user-service/instances/stats

// 3. If successful, gradually increase traffic
PUT /api/microservice/user-service/instances/:instanceId/status
{
  "trafficPercentage": 50
}

// 4. Eventually replace old instances
```

### Example 3: Rate Limiting for API Protection

```javascript
// 1. Set service-wide rate limit
PUT /api/microservice/api-gateway/rate-limit
{
  "enabled": true,
  "requestsPerMinute": 1000
}

// 2. Set stricter limits on expensive endpoints
PUT /api/microservice/api-gateway/endpoint-rate-limit
{
  "endpoint": "/api/search",
  "enabled": true,
  "requestsPerMinute": 100
}

// 3. Set per-client limits
PUT /api/microservice/api-gateway/client-rate-limit
{
  "enabled": true,
  "requestsPerMinute": 60
}

// 4. Monitor usage
GET /api/microservice/api-gateway/rate-limit-status
```

### Example 4: Performance Optimization with Caching

```javascript
// 1. Enable caching for read-heavy endpoints
PUT /api/microservice/user-service/cache
{
  "enabled": true,
  "ttl": 300000,  // 5 minutes
  "endpoints": {
    "/api/users": { "enabled": true, "ttl": 600000 },  // 10 min
    "/api/posts": { "enabled": true, "ttl": 120000 }   // 2 min
  }
}

// 2. Monitor cache performance
GET /api/microservice/user-service/cache/stats

// 3. Invalidate cache when data changes
POST /api/microservice/user-service/cache/invalidate
{
  "endpoint": "/api/users"
}
```

---

## 🎨 Frontend Features

### Service Management Dashboard

The **Manage** page provides a comprehensive interface for all management features:

#### Navigation
- **Service Selector** - Left sidebar with all registered services
- **Tab System** - Easy switching between Endpoints, Rate Limiting, Load Balancing, and Caching

#### Visual Feedback
- **Real-time Stats** - Live updates using React Query
- **Color-coded Status** - Green (healthy), Yellow (warning), Red (error)
- **Animated Cards** - Smooth animations for better UX
- **Electric Borders** - Visual indicators for different sections

#### Interactive Controls
- **Toggle Switches** - Easy enable/disable
- **Magnetic Buttons** - Engaging interaction
- **Live Metrics** - Real-time usage display
- **Instant Updates** - Changes reflected immediately

---

## 🔧 Technical Implementation

### Backend Architecture

```
Obsidian-API/
├── src/
│   ├── models/
│   │   ├── Service.js              # Extended with management fields
│   │   └── ServiceInstance.js      # Load balancing instances
│   ├── services/
│   │   ├── endpointDiscoveryService.js
│   │   ├── rateLimitService.js
│   │   ├── loadBalancerService.js
│   │   └── responseCacheService.js
│   └── routes/
│       └── microserviceManagement.js
```

### Frontend Architecture

```
Obsidian-Frontend/
└── src/
    ├── pages/
    │   └── ServiceManagement.jsx    # Main management UI
    └── lib/
        └── api.js                   # microserviceApi exports
```

---

## 🚀 Getting Started

### 1. Register a Service

First, register your microservice in the Services page:

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-service",
    "url": "http://localhost:3001",
    "description": "My awesome service"
  }'
```

### 2. Navigate to Management

Go to **Dashboard** → **Manage** → Select your service

### 3. Discover Endpoints

Click the **Endpoints** tab → **Discover** button

### 4. Configure Features

Use the tabs to configure:
- Rate Limiting
- Load Balancing (add multiple instances)
- Caching

### 5. Monitor in Real-Time

Watch the stats update live as your service receives traffic!

---

## 📈 Best Practices

### Rate Limiting
- Start conservative, increase gradually
- Set endpoint-specific limits for expensive operations
- Use client limits to prevent abuse

### Load Balancing
- Use **Least Connections** for variable request times
- Use **Round Robin** for uniform workloads
- Use **IP Hash** when session persistence is needed
- Set up health checks for automatic failover

### Caching
- Cache GET requests, not POST/PUT/DELETE
- Use shorter TTLs for dynamic data
- Invalidate cache when data is updated
- Monitor hit rate, aim for >80%

### Instance Management
- Use **Draining** for graceful shutdowns
- Mark instances as **Canary** for gradual rollouts
- Use **Weights** to handle different instance sizes
- Monitor response times and adjust weights

---

## 🎯 Summary

The Microservice Management System provides:

✅ **Complete Visibility** - See all endpoints, metrics, and configurations  
✅ **Fine-grained Control** - Configure rate limits, caching, and load balancing  
✅ **Real-time Monitoring** - Live stats and metrics  
✅ **Production-ready** - Battle-tested patterns and algorithms  
✅ **Beautiful UI** - Modern, responsive, and intuitive interface  
✅ **Zero Downtime** - Graceful instance management and traffic shifting  

**You now have enterprise-grade microservice management at your fingertips! 🚀**

