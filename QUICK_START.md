# Quick Start Guide - Obsidian MROP

Get up and running with Obsidian MROP in 5 minutes!

## 🚀 TL;DR

```bash
# 1. Start dependencies (Docker)
docker-compose up -d

# 2. Install all packages
npm install
npm run setup

# 3. Configure environment
# Edit Obsidian-API/.env with your MongoDB URI

# 4. Start all services
npm run dev

# 5. Open http://localhost:8080 and register mock-service
```

## Prerequisites

✅ **Node.js 18+** - [Download](https://nodejs.org)  
✅ **Docker** - [Download](https://docker.com/get-started) (for MongoDB & Redis)  
✅ **10 minutes** - That's it!

## Step-by-Step

### 1️⃣ Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd Obsidian

# Install root dependencies
npm install

# Install all subproject dependencies
npm run setup
```

### 2️⃣ Start Dependencies

**Option A: Using Docker (Recommended)**
```bash
# Start MongoDB + Redis
docker-compose up -d

# Verify they're running
docker ps
```

**Option B: Using Local Installation**
- See [SETUP_GUIDE.md](SETUP_GUIDE.md) for manual installation

### 3️⃣ Configure Environment

**Backend API:**
```bash
cd Obsidian-API

# Copy example environment file
cp .env.example .env

# Edit .env file
# For Docker setup, use:
# MONGODB_URI=mongodb://localhost:27017/obsidian
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

**Frontend:**
```bash
cd ../Obsidian-Frontend

# Create .env file
echo "VITE_API_URL=http://localhost:5000" > .env
```

### 4️⃣ Start the Platform

**From the root directory:**
```bash
npm run dev
```

This starts all three services simultaneously:
- 🔧 **Backend API** - http://localhost:5000
- 🎭 **Mock Service** - http://localhost:3001
- 🎨 **Frontend** - http://localhost:8080

**Alternative: Start services separately**
```bash
# Terminal 1: Backend API
cd Obsidian-API && npm run dev

# Terminal 2: Mock Service
cd Mock-Microservice && npm run dev

# Terminal 3: Frontend
cd Obsidian-Frontend && npm run dev
```

### 5️⃣ Register Mock Service

**Open http://localhost:8080 in your browser**

1. Go to **Services** page
2. Click **Register Service**
3. Fill in the form:
   ```
   Name: mock-service
   URL: http://localhost:3001
   Health Endpoint: /health
   Interval: 10000
   ```
4. Click **Register**

✅ You should see the service appear with "healthy" status!

## 🎯 Test It Out

### Test 1: View the Dashboard

- Go to the **Dashboard** page
- You should see:
  - Service count: 1
  - Service status: Healthy
  - Real-time event feed
  - System metrics

### Test 2: Make a Test Call

1. Go to **Services** page
2. Click **Test Call** on mock-service
3. Watch for success message
4. Check **Events** page for the request event

### Test 3: Run a Chaos Test

1. Go to **Chaos Engineering** page
2. Select "Cascade Failure" test
3. Click **Run on mock-service**
4. Watch the circuit breaker open on the Dashboard!

## 🐛 Troubleshooting

### MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Fix:**
```bash
# Check if MongoDB is running
docker ps | grep mongo

# If not, start it
docker-compose up -d mongodb

# Test connection
docker exec -it obsidian-mongodb mongosh
```

### Redis Connection Error

**Error:** `Redis connection refused`

**Fix:**
```bash
# Check if Redis is running
docker ps | grep redis

# If not, start it
docker-compose up -d redis

# Test connection
docker exec -it obsidian-redis redis-cli ping
```

### Port Already in Use

**Error:** `EADDRINUSE :::5000`

**Fix:**
```bash
# Find and kill process using port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### Frontend Not Connecting

**Symptoms:** Red "Disconnected" indicator

**Fix:**
1. Check if backend is running: `curl http://localhost:5000/health`
2. Check `.env` file in `Obsidian-Frontend`
3. Restart frontend: `cd Obsidian-Frontend && npm run dev`

## 📚 What's Next?

### Explore Features

1. **📊 Metrics** - View performance charts and statistics
2. **🔔 Events** - Filter and analyze system events
3. **⚡ Chaos Tests** - Test different failure scenarios

### Learn Patterns

1. **Circuit Breaker** - Watch it open/close during failures
2. **Rate Limiting** - Try making 150 requests quickly
3. **Health Monitoring** - Stop mock service and watch status change

### Customize

1. **Circuit Breaker Settings**
   ```env
   # Obsidian-API/.env
   CIRCUIT_TIMEOUT=5000
   CIRCUIT_ERROR_THRESHOLD=40
   ```

2. **Mock Service Behavior**
   ```bash
   # Set 50% failure rate
   curl -X POST http://localhost:3001/config \
     -H "Content-Type: application/json" \
     -d '{"failureRate": 0.5}'
   ```

3. **Health Check Interval**
   - Edit service in UI
   - Change interval to 5000ms for faster updates

## 🎓 Learn More

- **[Full README](README.md)** - Complete documentation
- **[Architecture](ARCHITECTURE.md)** - System design and patterns
- **[Setup Guide](SETUP_GUIDE.md)** - Detailed installation
- **[API Docs](Obsidian-API/README.md)** - Backend API reference
- **[Frontend Docs](Obsidian-Frontend/README.md)** - UI documentation

## 💡 Pro Tips

1. **Keep all terminals visible** - Watch logs in real-time
2. **Use Browser DevTools** - Monitor WebSocket events
3. **Check MongoDB** - View stored events and metrics
4. **Experiment!** - The mock service is designed for testing

## 🆘 Need Help?

1. Check logs in `Obsidian-API/logs/`
2. Check browser console for frontend errors
3. Verify all services are running: `docker ps`
4. Review [Troubleshooting](SETUP_GUIDE.md#troubleshooting)
5. Open an issue on GitHub

## ✅ Success Checklist

- [ ] Docker containers running (MongoDB, Redis)
- [ ] Backend API responds: `curl http://localhost:5000/health`
- [ ] Mock service responds: `curl http://localhost:3001/health`
- [ ] Frontend loads: http://localhost:8080
- [ ] Socket.IO connected (green dot in header)
- [ ] Mock service registered and healthy
- [ ] Dashboard shows service metrics
- [ ] Test call succeeds
- [ ] Chaos test triggers circuit breaker

**All checked?** 🎉 You're ready to explore Obsidian MROP!

---

**Having issues?** Don't worry! Check the [Setup Guide](SETUP_GUIDE.md) for detailed troubleshooting.

**Want to dive deeper?** Read the [Architecture docs](ARCHITECTURE.md) to understand how it all works.

Happy monitoring! 🚀

