# Mock Microservice

A mock microservice designed to test the resilience features of Obsidian MROP.

## Features

- **Configurable Failure Rate** - Simulate random failures
- **Latency Simulation** - Add random delays to responses
- **Timeout Simulation** - Simulate requests that never respond
- **Cascade Failure Mode** - Test circuit breaker pattern
- **Multiple Endpoint Types** - Stable, flaky, slow, and always-failing endpoints

## Installation

```bash
npm install
```

## Running

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will run on `http://localhost:3001` by default.

## Endpoints

### Core Endpoints

#### `GET /`
Returns service information and available endpoints.

#### `GET /health`
Health check endpoint. Returns healthy status unless circuit breaker test mode is active.

### Data Endpoints

#### `GET /api/data`
Simulates a normal API call with configurable failures.
- Subject to configured failure rate
- Can include delays and timeouts
- Returns random data on success

#### `GET /api/users`
Returns mock user data with configurable failures.

#### `GET /api/success`
Always returns a successful response (for testing).

#### `GET /api/error`
Always returns an error response (for testing).

### Special Endpoints

#### `GET /api/slow?delay=5000`
Simulates a slow endpoint with high latency.
- Default delay: 5000ms
- Can still fail based on configured failure rate

#### `GET /api/flaky`
Very unstable endpoint with 70% failure rate.
- Perfect for testing circuit breaker behavior

#### `POST /api/cascade-failure`
Triggers cascade failure mode for 30 seconds.
- Sets failure rate to 100%
- Useful for testing circuit breaker opening
- Automatically resets after 30 seconds

### Configuration Endpoints

#### `GET /config`
Get current failure configuration.

Response:
```json
{
  "success": true,
  "config": {
    "failureRate": 0.3,
    "delayMin": 0,
    "delayMax": 0,
    "timeoutRate": 0,
    "circuitBreakerTest": false
  }
}
```

#### `POST /config`
Update failure configuration.

Request body:
```json
{
  "failureRate": 0.5,
  "delayMin": 100,
  "delayMax": 1000,
  "timeoutRate": 0.1,
  "circuitBreakerTest": false
}
```

Parameters:
- `failureRate` - Probability of failure (0-1)
- `delayMin` - Minimum delay in milliseconds
- `delayMax` - Maximum delay in milliseconds
- `timeoutRate` - Probability of timeout (0-1)
- `circuitBreakerTest` - Enable circuit breaker testing mode

#### `POST /config/reset`
Reset configuration to defaults.

## Testing Scenarios

### 1. Circuit Breaker Test

Trigger cascade failures to open the circuit breaker:

```bash
# Trigger cascade failure mode
curl -X POST http://localhost:3001/api/cascade-failure

# Monitor circuit breaker opening in Obsidian dashboard
# Circuit should open after threshold is reached
```

### 2. Rate Limiting Test

```bash
# Configure high failure rate
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d '{"failureRate": 0.8}'

# Make multiple requests to trigger rate limiting
for i in {1..50}; do
  curl http://localhost:5000/api/services/mock-service/call \
    -H "Content-Type: application/json" \
    -d '{"endpoint": "/api/data", "method": "GET"}'
done
```

### 3. Latency Test

```bash
# Configure delays
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d '{"delayMin": 1000, "delayMax": 3000}'

# Test slow responses
curl http://localhost:5000/api/services/mock-service/call \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "/api/data", "method": "GET"}'
```

### 4. Timeout Test

```bash
# Configure timeouts
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d '{"timeoutRate": 0.5}'

# Some requests will timeout
curl http://localhost:5000/api/services/mock-service/call \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "/api/data", "method": "GET"}'
```

## Integration with Obsidian

Register this mock service with Obsidian:

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mock-service",
    "url": "http://localhost:3001",
    "healthCheck": {
      "endpoint": "/health",
      "interval": 10000,
      "timeout": 5000
    }
  }'
```

## Default Configuration

- **Failure Rate**: 30%
- **Delay**: None
- **Timeout Rate**: 0%
- **Port**: 3001

## License

MIT

