# 🚀 COMPLETE WORKING DEMO - Obsidian MROP

## ✅ **STEP 1: Start Backend & Frontend**

**Terminal 1 - Backend:**
```bash
cd Obsidian-API
npm start
```

**Terminal 2 - Frontend:**
```bash
cd Obsidian-Frontend  
npm run dev
```

**✅ Check:** 
- Backend: http://localhost:5000 (should show API info)
- Frontend: http://localhost:8080 (should show landing page)

---

## ✅ **STEP 2: Start Demo Services**

**Terminal 3 - Demo Services:**
```bash
cd Demo-Services
.\QUICK_START.bat
```

**OR Manual:**
```bash
# Install dependencies
cd Demo-Services
npm install
cd orders-service && npm install && cd ..
cd booking-service && npm install && cd ..  
cd payment-service && npm install && cd ..

# Start services (3 separate terminals)
cd orders-service && npm start
cd booking-service && npm start
cd payment-service && npm start
```

**✅ Test Services:**
```bash
cd Demo-Services
node test-services.js
```

**Expected Output:**
```
🔍 Testing Demo Services...

📊 SERVICE STATUS:
==================
✅ Orders (Port 4001): UP
✅ Booking (Port 4002): UP  
✅ Payments (Port 4003): UP

📈 Summary: 3/3 services running
```

---

## ✅ **STEP 3: Register Services in Obsidian**

1. **Open:** http://localhost:8080
2. **Login/Register** (if needed)
3. **Go to Dashboard** (`/app/dashboard`)
4. **Click "Add Service"**
5. **Register each service:**

   **Orders Service:**
   - Name: `orders`
   - URL: `http://localhost:4001`
   - Health Endpoint: `/health`
   - GitHub URL: `https://github.com/your-repo/orders-service`

   **Booking Service:**
   - Name: `booking`
   - URL: `http://localhost:4002`
   - Health Endpoint: `/health`
   - GitHub URL: `https://github.com/your-repo/booking-service`

   **Payment Service:**
   - Name: `payments`
   - URL: `http://localhost:4003`
   - Health Endpoint: `/health`
   - GitHub URL: `https://github.com/your-repo/payment-service`

---

## ✅ **STEP 4: Test All Features**

### **A. Send High Traffic**
```bash
cd Demo-Services
node traffic-generator.js
```

**Watch the Dashboard:**
- Circuit breakers opening/closing
- Rate limiting kicking in
- Load balancing distributing requests
- Real-time metrics updating

### **B. Test Rate Limiting**
1. Go to **Manage** page (`/app/manage`)
2. Select a service (e.g., `orders`)
3. Go to **Rate Limiting** tab
4. Set rate limit to `10 requests/minute`
5. Run traffic generator again
6. Watch requests get blocked

### **C. Test Load Balancing**
1. Start extra instances:
   ```bash
   cd Demo-Services
   .\START_EXTRA_INSTANCES.bat
   ```
2. Go to **Manage** → **Load Balancing** tab
3. Configure load balancing strategy
4. Send traffic and watch distribution

### **D. Test Circuit Breakers**
1. Stop one service (Ctrl+C in its terminal)
2. Watch circuit breaker open in dashboard
3. Restart service
4. Watch circuit breaker close

---

## ✅ **STEP 5: Monitor Everything**

### **Dashboard Features:**
- **Real-time metrics** (response times, success rates)
- **Circuit breaker status** (open/closed/half-open)
- **Service health** (up/down/degraded)
- **Live events** (failures, recoveries, alerts)

### **Manage Page Features:**
- **Endpoint Discovery** (auto-detect API endpoints)
- **Rate Limiting** (per-service, per-endpoint, per-client)
- **Load Balancing** (round-robin, least-connections, etc.)
- **Response Caching** (TTL-based caching)

### **Advanced Features:**
- **AI Code Analyzer** (analyze GitHub repos)
- **Alerts & Recommendations** (AI-powered insights)
- **Chaos Engineering** (intentional failure testing)

---

## 🎯 **QUICK TEST COMMANDS**

```bash
# Test individual services
curl http://localhost:4001/health
curl http://localhost:4002/health  
curl http://localhost:4003/health

# Test with failures
curl http://localhost:4001/orders/fail
curl http://localhost:4002/bookings/slow
curl http://localhost:4003/payments/error

# Send high traffic
cd Demo-Services
node traffic-generator.js

# Check service status
node test-services.js
```

---

## 🚨 **TROUBLESHOOTING**

### **Services Not Starting:**
```bash
# Check if ports are free
netstat -an | findstr "4001 4002 4003"

# Kill processes on ports
taskkill /f /im node.exe
```

### **Dashboard Not Loading:**
```bash
# Restart backend
cd Obsidian-API
npm start

# Restart frontend  
cd Obsidian-Frontend
npm run dev
```

### **Services Not Registering:**
1. Check service URLs are correct
2. Ensure services are running (`node test-services.js`)
3. Check backend logs for errors
4. Try registering with different names

---

## 🎉 **SUCCESS INDICATORS**

✅ **All 3 demo services running**  
✅ **Services registered in Obsidian**  
✅ **Dashboard showing real-time data**  
✅ **Traffic generator working**  
✅ **Circuit breakers responding**  
✅ **Rate limiting active**  
✅ **Load balancing functional**  

**You now have a fully working microservice resilience and observability platform!** 🚀
