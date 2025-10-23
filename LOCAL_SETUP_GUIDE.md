# 🚀 Local Setup Guide - Obsidian MROP

Complete guide to run Obsidian MROP on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Redis** (v6 or higher) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/)

**Optional (for Kafka features):**
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)

---

## 🛠️ Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# If you have a git repo
git clone <your-repo-url>
cd Obsidian

# Or if starting fresh, you're already in the right directory
```

---

### Step 2: Setup MongoDB

#### Option A: Local MongoDB

1. **Install MongoDB** from [mongodb.com](https://www.mongodb.com/try/download/community)

2. **Start MongoDB:**

   **Windows:**
   ```bash
   # Start MongoDB service (Run as Administrator)
   net start MongoDB
   ```

   **macOS/Linux:**
   ```bash
   # Start MongoDB
   brew services start mongodb-community
   # OR
   sudo systemctl start mongod
   ```

3. **Verify MongoDB is running:**
   ```bash
   mongosh
   # You should see MongoDB shell
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/obsidian`)
4. Use this in your `.env` file

---

### Step 3: Setup Redis

#### Option A: Local Redis

**Windows:**
```bash
# Download Redis from GitHub
# https://github.com/microsoftarchive/redis/releases
# Or use WSL2 and follow Linux instructions
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
```

**Verify Redis:**
```bash
redis-cli ping
# Should return: PONG
```

#### Option B: Docker Redis (Easiest!)

```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

---

### Step 4: Setup Backend (Obsidian-API)

```bash
cd Obsidian-API

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your configuration
# Use your preferred text editor
code .env  # VS Code
# OR
notepad .env  # Windows
# OR
nano .env  # Linux/macOS
```

**Edit `.env` file:**
- Set `MONGODB_URI` to your MongoDB connection string
- Set `JWT_SECRET` to a strong secret key
- Other settings can use defaults for local development

**Initialize Admin User (Optional but recommended):**

After starting the server for the first time, create an admin user:

```bash
# Start MongoDB shell
mongosh

# Connect to obsidian database
use obsidian

# Create admin user
db.users.insertOne({
  email: "admin@obsidian.dev",
  password: "$2a$10$rBGSKz5Qk3bJ3mLmYXKLKuFHkPZxQXzGvHgQZ5wN8YgZ5wN8YgZ5w",  // hashed "admin123"
  name: "Admin User",
  role: "admin",
  organization: "Obsidian",
  services: [],
  isActive: true,
  permissions: {
    canCreateServices: true,
    canDeleteServices: true,
    canManageUsers: true,
    canViewMetrics: true,
    canConfigureAlerts: true,
    canRunChaos: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Or register via API after starting:**
```bash
# After server is running
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@obsidian.dev",
    "password": "admin123",
    "name": "Admin User"
  }'

# Then promote to admin in MongoDB
mongosh
use obsidian
db.users.updateOne(
  { email: "admin@obsidian.dev" },
  { $set: { role: "admin", "permissions.canManageUsers": true, "permissions.canDeleteServices": true, "permissions.canRunChaos": true } }
)
```

---

### Step 5: Setup Frontend (Obsidian-Frontend)

```bash
cd ../Obsidian-Frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed (defaults should work)
```

---

### Step 6: Setup Mock Microservice

```bash
cd ../Mock-Microservice

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed (defaults should work)
```

---

### Step 7: Start Everything! 🚀

Open **4 separate terminal windows:**

#### Terminal 1: Backend (Obsidian-API)

```bash
cd Obsidian-API
npm run dev
```

You should see:
```
✓ Connected to MongoDB
✓ Kafka producer connected
✓ Server running on http://localhost:5000
✓ Socket.IO server running
```

#### Terminal 2: Frontend (Obsidian-Frontend)

```bash
cd Obsidian-Frontend
npm run dev
```

You should see:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

#### Terminal 3: Mock Microservice

```bash
cd Mock-Microservice
npm start
```

You should see:
```
Mock Microservice running on http://localhost:3001
```

#### Terminal 4 (Optional): Worker Process

```bash
cd Obsidian-API
npm run worker
```

This runs background jobs for health checks.

---

## 🌐 Access the Application

1. **Frontend (User Interface):**
   - URL: http://localhost:5173
   - Login with: `admin@obsidian.dev` / `admin123`

2. **Backend API:**
   - URL: http://localhost:5000
   - API Docs: http://localhost:5000/api

3. **Mock Microservice:**
   - URL: http://localhost:3001
   - Test endpoint: http://localhost:3001/api/test

---

## ✅ Verify Installation

### 1. Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mongodb": "connected",
  "redis": "connected"
}
```

### 2. Test Authentication

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@obsidian.dev",
    "password": "admin123"
  }'

# You should get a token back
```

### 3. Test Frontend

1. Open http://localhost:5173
2. You should see the login page
3. Login with admin credentials
4. You should see the dashboard

---

## 🧪 Quick Test - Register a Service

### Via API:

```bash
# Get token first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@obsidian.dev","password":"admin123"}' \
  | jq -r '.token')

# Register mock service
curl -X POST http://localhost:5000/api/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mock-service",
    "url": "http://localhost:3001",
    "healthCheck": {
      "endpoint": "http://localhost:3001/health",
      "interval": 30000
    }
  }'
```

### Via Frontend:

1. Go to http://localhost:5173
2. Login
3. Click "Services" in navigation
4. Click "Register Service"
5. Fill in:
   - Name: `mock-service`
   - URL: `http://localhost:3001`
   - Health endpoint: `http://localhost:3001/health`
6. Click "Register"

---

## 🐳 Alternative: Docker Compose Setup

If you want to use Docker for MongoDB, Redis, and Kafka:

```bash
# In root directory
docker-compose up -d

# This will start:
# - MongoDB on port 27017
# - Redis on port 6379
# - Kafka on port 9092
# - Zookeeper on port 2181
```

Then update your `.env` files to use:
```
MONGODB_URI=mongodb://localhost:27017/obsidian
REDIS_HOST=localhost
KAFKA_BROKERS=localhost:9092
```

---

## 🔧 Troubleshooting

### MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# If not, start MongoDB service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

---

### Redis Connection Error

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis
# macOS: brew services start redis
# Linux: sudo systemctl start redis
# Docker: docker run -d -p 6379:6379 redis
```

---

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :5000

# macOS/Linux:
lsof -i :5000

# Kill the process or change PORT in .env
```

---

### Frontend Not Connecting to Backend

**Error:** `Network Error` or `CORS Error`

**Solution:**
1. Check `VITE_API_URL` in `Obsidian-Frontend/.env`
2. Check `FRONTEND_URL` in `Obsidian-API/.env`
3. Make sure backend is running on http://localhost:5000
4. Make sure frontend is running on http://localhost:5173

---

### JWT Token Error

**Error:** `JsonWebTokenError: invalid token`

**Solution:**
1. Make sure `JWT_SECRET` is set in `Obsidian-API/.env`
2. Make sure it's at least 32 characters
3. Clear browser localStorage and login again

---

## 📦 Package Installation Issues

If `npm install` fails:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try:
npm install --legacy-peer-deps
```

---

## 🎯 Quick Start Script

Create a script to start everything at once:

**`start-all.sh` (macOS/Linux):**
```bash
#!/bin/bash

# Start MongoDB
brew services start mongodb-community

# Start Redis
brew services start redis

# Start backend
cd Obsidian-API && npm run dev &

# Start frontend
cd Obsidian-Frontend && npm run dev &

# Start mock service
cd Mock-Microservice && npm start &

echo "✅ All services started!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"
echo "Mock Service: http://localhost:3001"
```

**`start-all.bat` (Windows):**
```batch
@echo off
echo Starting Obsidian MROP...

REM Start MongoDB
net start MongoDB

REM Start backend
start cmd /k "cd Obsidian-API && npm run dev"

REM Start frontend
start cmd /k "cd Obsidian-Frontend && npm run dev"

REM Start mock service
start cmd /k "cd Mock-Microservice && npm start"

echo All services started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo Mock Service: http://localhost:3001
```

---

## 🎓 Next Steps

1. ✅ Login to http://localhost:5173
2. ✅ Register the mock service
3. ✅ Create some alert rules
4. ✅ Run chaos experiments
5. ✅ View recommendations
6. ✅ Check metrics and events

---

## 📚 Additional Resources

- **API Documentation:** See `README.md` in Obsidian-API
- **Authentication Guide:** See `AUTH_SETUP_GUIDE.md`
- **Integration Guide:** See `INTEGRATION_GUIDE.md`
- **Design Patterns:** See `DESIGN_PATTERNS_COMPLETE.md`

---

## 🆘 Need Help?

If you encounter any issues:

1. Check this guide's troubleshooting section
2. Verify all prerequisites are installed
3. Check terminal logs for specific errors
4. Ensure all .env files are configured correctly

---

## ✅ Success Checklist

- [ ] Node.js installed (v18+)
- [ ] MongoDB installed and running
- [ ] Redis installed and running
- [ ] All dependencies installed (`npm install` in all 3 folders)
- [ ] `.env` files created from `.env.example`
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Mock service running on port 3001
- [ ] Can access http://localhost:5173
- [ ] Can login with admin credentials
- [ ] Can see dashboard

**If all checked, you're ready to go! 🚀**

