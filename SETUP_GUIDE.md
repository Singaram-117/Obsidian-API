# Obsidian MROP - Complete Setup Guide

This guide will walk you through setting up the entire Obsidian MROP platform from scratch.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installing Dependencies](#installing-dependencies)
3. [Setting Up Services](#setting-up-services)
4. [Configuration](#configuration)
5. [Running the Platform](#running-the-platform)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Required
- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **MongoDB** (Atlas or local instance)
- **Redis** 6.0 or higher

### Optional
- **Kafka** 2.8 or higher (for event streaming)
- **Docker** (for containerized dependencies)

## Installing Dependencies

### 1. Install Node.js

**Windows:**
```bash
# Using winget
winget install OpenJS.NodeJS

# Or download from https://nodejs.org
```

**macOS:**
```bash
# Using Homebrew
brew install node
```

**Linux:**
```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install MongoDB

**Option A: MongoDB Atlas (Recommended)**

1. Go to https://cloud.mongodb.com
2. Create a free account
3. Create a new cluster (Free M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Save for later use

**Option B: Local MongoDB with Docker**

```bash
# Pull and run MongoDB
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest

# Connection string: mongodb://localhost:27017/obsidian
```

**Option C: Local MongoDB Installation**

**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Run the installer
# Add to PATH: C:\Program Files\MongoDB\Server\{version}\bin
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 3. Install Redis

**With Docker (Recommended):**
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest
```

**Without Docker:**

**Windows:**
```bash
# Download from https://github.com/microsoftarchive/redis/releases
# Or use Windows Subsystem for Linux (WSL)
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 4. Install Kafka (Optional)

**With Docker:**
```bash
# Using Docker Compose
docker-compose up -d

# Or manually
docker run -d \
  --name zookeeper \
  -p 2181:2181 \
  zookeeper:latest

docker run -d \
  --name kafka \
  -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  confluentinc/cp-kafka:latest
```

## Setting Up Services

### 1. Backend API Setup

```bash
# Navigate to API directory
cd Obsidian-API

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required Environment Variables:**

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/obsidian

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Services
MOCK_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:8080
```

**Create logs directory:**
```bash
mkdir -p logs
```

### 2. Mock Microservice Setup

```bash
# Navigate to Mock Service directory
cd ../Mock-Microservice

# Install dependencies
npm install

# Optional: Create .env file
echo "PORT=3001" > .env
```

### 3. Frontend Setup

```bash
# Navigate to Frontend directory
cd ../Obsidian-Frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000" > .env
```

## Configuration

### Backend Configuration

Edit `Obsidian-API/.env`:

```env
# Circuit Breaker Settings
CIRCUIT_TIMEOUT=3000
CIRCUIT_ERROR_THRESHOLD=50
CIRCUIT_RESET_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Kafka (if using)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=obsidian-api
KAFKA_GROUP_ID=obsidian-group
```

### Mock Service Configuration

The mock service can be configured at runtime via API calls:

```bash
# Set failure rate to 30%
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d '{"failureRate": 0.3}'

# Add delays (1-2 seconds)
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d '{"delayMin": 1000, "delayMax": 2000}'

# Reset to defaults
curl -X POST http://localhost:3001/config/reset
```

## Running the Platform

### Start All Services

**Terminal 1: Backend API**
```bash
cd Obsidian-API
npm run dev
```

Expected output:
```
MongoDB Connected: cluster.mongodb.net
Kafka service initialized successfully
Job worker started successfully
Obsidian MROP API running on port 5000
```

**Terminal 2: Mock Microservice**
```bash
cd Mock-Microservice
npm run dev
```

Expected output:
```
🚀 Mock Microservice running on port 3001
```

**Terminal 3: Frontend**
```bash
cd Obsidian-Frontend
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

**Terminal 4: Background Worker (Optional)**
```bash
cd Obsidian-API
npm run worker
```

### Using Process Managers (Production)

**PM2:**
```bash
# Install PM2
npm install -g pm2

# Start all services
pm2 start Obsidian-API/src/server.js --name obsidian-api
pm2 start Obsidian-API/src/workers/jobWorker.js --name obsidian-worker
pm2 start Mock-Microservice/src/server.js --name mock-service

# Monitor
pm2 monit

# View logs
pm2 logs
```

## Verification

### 1. Check Backend Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "services": {
    "api": "up",
    "mongodb": "up",
    "kafka": "up"
  }
}
```

### 2. Check Mock Service

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Check Frontend

Open http://localhost:8080 in your browser. You should see:
- Obsidian MROP Dashboard
- "Connected" status indicator (green dot)

### 4. Register Mock Service

Via Frontend:
1. Go to **Services** page
2. Click **Register Service**
3. Fill in:
   - Name: `mock-service`
   - URL: `http://localhost:3001`
   - Health Endpoint: `/health`
   - Interval: `10000`
4. Click **Register**

Via API:
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

### 5. Test Circuit Breaker

```bash
# Trigger cascade failure
curl -X POST http://localhost:3001/api/cascade-failure

# Make requests through circuit breaker
for i in {1..20}; do
  curl -X POST http://localhost:5000/api/services/mock-service/call \
    -H "Content-Type: application/json" \
    -d '{"endpoint": "/api/data", "method": "GET"}'
  echo ""
  sleep 0.5
done
```

Watch the Dashboard - the circuit should open after several failures.

## Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoServerError: Authentication failed`

**Solution:**
1. Check username and password in connection string
2. Ensure database user has read/write permissions
3. Check if IP address is whitelisted (MongoDB Atlas)

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
1. Check if MongoDB is running: `docker ps` or `systemctl status mongodb`
2. Verify connection string and port
3. Check firewall settings

### Redis Connection Issues

**Error:** `Error: Redis connection to localhost:6379 failed`

**Solution:**
1. Check if Redis is running: `docker ps` or `systemctl status redis`
2. Verify Redis host and port in .env
3. Test connection: `redis-cli ping` (should return PONG)

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Frontend Not Connecting to Backend

**Symptoms:**
- Red "Disconnected" status
- No data loading

**Solution:**
1. Check if backend is running on port 5000
2. Verify `VITE_API_URL` in `.env`
3. Check browser console for CORS errors
4. Ensure `FRONTEND_URL` is set correctly in backend `.env`

### Kafka Not Starting (Optional)

**Error:** `Kafka initialization failed`

**Solution:**
1. Kafka is optional - the app will continue without it
2. To fix: Check if Kafka and Zookeeper are running
3. Verify `KAFKA_BROKERS` in .env
4. Test connection: `kafka-topics.sh --list --bootstrap-server localhost:9092`

### npm Install Fails

**Error:** `ERESOLVE unable to resolve dependency tree`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try with legacy peer deps
npm install --legacy-peer-deps

# Or use yarn
npm install -g yarn
yarn install
```

## Next Steps

Once everything is running:

1. **Explore the Dashboard** - View services and metrics
2. **Run Chaos Tests** - Test resilience patterns
3. **Monitor Events** - Watch real-time event feed
4. **View Metrics** - Analyze performance charts
5. **Customize Configuration** - Adjust circuit breaker and rate limiting settings

## Additional Resources

- [Main README](README.md)
- [Backend API Documentation](Obsidian-API/README.md)
- [Frontend Documentation](Obsidian-Frontend/README.md)
- [Mock Service Documentation](Mock-Microservice/README.md)

## Getting Help

If you encounter issues:

1. Check the logs:
   - Backend: `Obsidian-API/logs/`
   - Browser console for frontend issues
2. Review environment variables
3. Verify all services are running
4. Check the Troubleshooting section above
5. Open an issue on GitHub

Happy monitoring! 🚀

