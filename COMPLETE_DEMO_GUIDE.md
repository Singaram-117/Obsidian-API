# 🎯 Complete Demo Guide - Obsidian MROP

## 📋 **What You'll Demonstrate**

✅ **3 Microservices**: Orders, Booking, Payment  
✅ **High Traffic**: 50+ requests/second per service  
✅ **Rate Limiting**: Protect services from overload  
✅ **Load Balancing**: Multiple instances with different strategies  
✅ **Real-time Monitoring**: Watch everything in the dashboard  
✅ **Circuit Breakers**: Automatic failure isolation  

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Install Dependencies for Demo Services**

```bash
# Orders Service
cd Demo-Services/orders-service
npm install

# Booking Service
cd ../booking-service
npm install

# Payment Service
cd ../payment-service
npm install

cd ../..
```

---

### **Step 2: Start All Services**

Open **4 separate terminals**:

#### **Terminal 1: Orders Service (Instance 1)**
```bash
cd Demo-Services/orders-service
set PORT=4001
set INSTANCE_ID=1
npm start
```

#### **Terminal 2: Booking Service (Instance 1)**
```bash
cd Demo-Services/booking-service
set PORT=4002
set INSTANCE_ID=1
npm start
```

#### **Terminal 3: Payment Service (Instance 1)**
```bash
cd Demo-Services/payment-service
set PORT=4003
set INSTANCE_ID=1
npm start
```

You should see:
```
🚀 Orders Service (Instance 1) running on port 4001
🚀 Booking Service (Instance 1) running on port 4002
🚀 Payment Service (Instance 1) running on port 4003
```

---

### **Step 3: Register Services in Obsidian**

Open your browser and go to `http://localhost:8080/app/services`

#### **Register Orders Service:**
```json
{
  "name": "orders-service",
  "url": "http://localhost:4001",
  "description": "Handles order management and processing"
}
```

#### **Register Booking Service:**
```json
{
  "name": "booking-service",
  "url": "http://localhost:4002",
  "description": "Manages bookings and reservations"
}
```

#### **Register Payment Service:**
```json
{
  "name": "payment-service",
  "url": "http://localhost:4003",
  "description": "Processes payments and transactions"
}
```

---

### **Step 4: Configure Rate Limiting**

Go to `http://localhost:8080/app/manage`

#### **For Orders Service:**
1. Select "orders-service"
2. Go to **Rate Limiting** tab
3. **Service-Level**:
   - Enable: ✅ ON
   - Requests/min: `100`
   - Save
4. **Endpoint-Level**:
   - Select `/api/orders` (POST)
   - Enable: ✅ ON
   - Requests/min: `30`
   - Save

#### **For Booking Service:**
1. Select "booking-service"
2. Go to **Rate Limiting** tab
3. **Service-Level**:
   - Enable: ✅ ON
   - Requests/min: `80`
   - Save

#### **For Payment Service:**
1. Select "payment-service"
2. Go to **Rate Limiting** tab
3. **Service-Level**:
   - Enable: ✅ ON
   - Requests/min: `60`
   - Save
4. **Endpoint-Level**:
   - Select `/api/payments/process` (POST)
   - Enable: ✅ ON
   - Requests/min: `20` (strict for payment processing)
   - Save

---

### **Step 5: Add Multiple Instances for Load Balancing**

Let's add more instances to demonstrate load balancing!

#### **Start Additional Instances:**

Open **3 more terminals**:

#### **Terminal 4: Orders Service (Instance 2)**
```bash
cd Demo-Services/orders-service
set PORT=4011
set INSTANCE_ID=2
npm start
```

#### **Terminal 5: Booking Service (Instance 2)**
```bash
cd Demo-Services/booking-service
set PORT=4012
set INSTANCE_ID=2
npm start
```

#### **Terminal 6: Payment Service (Instance 2)**
```bash
cd Demo-Services/payment-service
set PORT=4013
set INSTANCE_ID=2
npm start
```

#### **Register Instances in Obsidian:**

Go to `http://localhost:8080/app/manage`

##### **Orders Service - Add Instances:**
1. Select "orders-service"
2. Go to **Load Balancing** tab
3. **Enable Load Balancing**: ✅ ON
4. **Strategy**: Select "Least Connections"
5. **Add Instance 1**:
   - URL: `http://localhost:4001`
   - Weight: `1`
   - Traffic %: `100`
   - Save
6. **Add Instance 2**:
   - URL: `http://localhost:4011`
   - Weight: `1`
   - Traffic %: `100`
   - Save

##### **Booking Service - Add Instances:**
1. Select "booking-service"
2. Go to **Load Balancing** tab
3. **Enable Load Balancing**: ✅ ON
4. **Strategy**: Select "Round Robin"
5. Add both instances (ports 4002, 4012)

##### **Payment Service - Add Instances:**
1. Select "payment-service"
2. Go to **Load Balancing** tab
3. **Enable Load Balancing**: ✅ ON
4. **Strategy**: Select "Weighted Response Time"
5. Add both instances (ports 4003, 4013)

---

### **Step 6: Enable Caching**

Go to `http://localhost:8080/app/manage`

#### **For All Services:**
1. Select service
2. Go to **Caching** tab
3. **Enable**: ✅ ON
4. **TTL**: `60000` (1 minute)
5. Save

This will cache GET requests for better performance!

---

### **Step 7: Generate High Traffic**

Open a **new terminal**:

```bash
node Demo-Services/traffic-generator.js
```

You'll see:
```
🚀 OBSIDIAN MROP - Traffic Generator
============================================================
Target: 50 req/s per service
============================================================

📊 ORDERS
   Total:   2500
   Success: 2480 (99.2%)
   Failed:  20

📊 BOOKINGS
   Total:   2500
   Success: 2465 (98.6%)
   Failed:  35

📊 PAYMENTS
   Total:   2500
   Success: 2450 (98.0%)
   Failed:  50

============================================================
TOTAL: 7500 requests | 7395 success | 105 failed
============================================================
```

---

## 🎬 **What to Watch in the Dashboard**

### **Dashboard (`/app/dashboard`)**
- ✅ Service status cards updating
- 📊 Success rates
- 🔴 Circuit breakers opening if services fail
- 📡 Live events feed

### **Manage Page (`/app/manage`)**

#### **Endpoints Tab:**
- Click "Discover" to see all API endpoints
- View methods, paths, and parameters

#### **Rate Limiting Tab:**
- Watch current usage vs. limits
- See counters increase in real-time
- Notice requests being rejected when limits hit

#### **Load Balancing Tab:**
- See instance statistics
- Active connections per instance
- Response times
- Watch traffic distribute across instances

#### **Caching Tab:**
- Cache hit rate increasing
- Number of cached entries
- Hits per endpoint

### **Events Page (`/app/events`)**
- See all requests logged
- Filter by service, type, severity
- Watch rate limit events
- Circuit breaker events

### **Metrics Page (`/app/metrics`)**
- Request counts
- Response times
- Success rates
- Charts and graphs

### **Alerts Page (`/app/alerts`)**
- High traffic alerts
- Rate limit alerts
- Service degradation alerts

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Rate Limiting in Action**

**Test:**
```bash
# Send 200 requests quickly
node Demo-Services/traffic-generator.js
```

**What to Watch:**
- Go to `/app/manage` → Select service → Rate Limiting tab
- Watch counters hit the limit
- See "Rate Limit Exceeded" events in Events page
- Notice HTTP 429 errors in traffic generator

**Result:** ✅ Services protected from overload!

---

### **Scenario 2: Load Balancing Distribution**

**Test:**
```bash
# Send moderate traffic
node Demo-Services/traffic-generator.js
```

**What to Watch:**
- Go to `/app/manage` → Select service → Load Balancing tab
- Watch active connections on each instance
- Notice traffic distributing based on strategy
- See instance response times

**Result:** ✅ Traffic evenly distributed across instances!

---

### **Scenario 3: Cache Performance**

**Test:**
```bash
# Modify traffic generator to do more GET requests
# Run traffic generator
node Demo-Services/traffic-generator.js
```

**What to Watch:**
- Go to `/app/manage` → Select service → Caching tab
- Watch cache hit rate increase
- See cached entries growing
- Notice response times decreasing

**Result:** ✅ Faster responses with caching!

---

### **Scenario 4: Circuit Breaker Protection**

**Test:**
```bash
# Stop one service instance (Ctrl+C in its terminal)
# Keep sending traffic
node Demo-Services/traffic-generator.js
```

**What to Watch:**
- Go to `/app/dashboard`
- Watch circuit breaker open for the failed service
- See service status turn RED
- Notice other instances still working
- Check Events page for circuit_opened events

**Result:** ✅ Automatic failure isolation prevents cascading failures!

---

## 📊 **How to Send Individual Requests**

### **Using cURL:**

#### **Orders Service:**
```bash
# Get all orders
curl http://localhost:4001/api/orders

# Create order
curl -X POST http://localhost:4001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":123,"items":[{"id":1,"quantity":2}],"totalAmount":99.99}'

# Get order stats
curl http://localhost:4001/api/orders/stats/summary
```

#### **Booking Service:**
```bash
# Get all bookings
curl http://localhost:4002/api/bookings

# Create booking
curl -X POST http://localhost:4002/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"customerId":123,"resourceType":"hotel","resourceId":"RES001","startDate":"2025-11-01","endDate":"2025-11-03"}'

# Check availability
curl "http://localhost:4002/api/bookings/availability/RES001?startDate=2025-11-01&endDate=2025-11-03"
```

#### **Payment Service:**
```bash
# Get all payments
curl http://localhost:4003/api/payments

# Process payment
curl -X POST http://localhost:4003/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{"orderId":123,"amount":99.99,"method":"credit_card","cardNumber":"**** **** **** 1234"}'

# Get payment stats
curl http://localhost:4003/api/payments/stats/summary
```

### **Using Postman:**

1. Import the endpoints
2. Create a collection for each service
3. Add requests to the collection
4. Run collection to send multiple requests

### **Using JavaScript (Browser Console):**

```javascript
// Orders
fetch('http://localhost:4001/api/orders')
  .then(res => res.json())
  .then(data => console.log(data));

// Bookings
fetch('http://localhost:4002/api/bookings')
  .then(res => res.json())
  .then(data => console.log(data));

// Payments
fetch('http://localhost:4003/api/payments')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🎯 **Demo Checklist**

Use this checklist during your demonstration:

### **Setup Phase:**
- [ ] All 3 services running (orders, booking, payment)
- [ ] Services registered in Obsidian
- [ ] Rate limiting configured
- [ ] Multiple instances running
- [ ] Load balancing enabled
- [ ] Caching enabled

### **Demonstration Phase:**
- [ ] Show Dashboard with all services healthy
- [ ] Navigate to Manage page
- [ ] Discover endpoints for each service
- [ ] Show rate limiting configuration
- [ ] Show load balancing instances
- [ ] Start traffic generator
- [ ] Point out rate limiting in action
- [ ] Show load balancing distribution
- [ ] Display cache hit rates
- [ ] Stop one instance to show circuit breaker
- [ ] Show Events page with all activities
- [ ] Show Metrics page with charts

### **Key Points to Highlight:**
- [ ] Real-time updates across all pages
- [ ] Automatic health checks
- [ ] Circuit breaker protecting from failures
- [ ] Rate limiting preventing overload
- [ ] Load balancing distributing traffic
- [ ] Caching improving performance
- [ ] Centralized monitoring and control

---

## 🔧 **Troubleshooting**

### **Service won't start:**
```bash
# Check if port is in use
netstat -ano | findstr :4001

# Kill process if needed
taskkill /F /PID <PID>
```

### **Services not showing in dashboard:**
- Check if Obsidian-API is running
- Verify CORS is enabled
- Check service URLs are correct

### **Rate limiting not working:**
- Verify it's enabled in Manage page
- Check if limits are being hit
- Look at Events page for rate_limit events

### **Load balancing not distributing:**
- Verify multiple instances registered
- Check load balancing strategy
- Ensure all instances are healthy

---

## 📈 **Expected Results**

After following this guide, you should see:

✅ **3 services** registered and healthy  
✅ **6 instances** total (2 per service)  
✅ **Rate limits** protecting services  
✅ **Load balancing** distributing traffic  
✅ **Caching** improving response times  
✅ **Real-time monitoring** showing everything  
✅ **Circuit breakers** preventing cascading failures  
✅ **7,500+ requests/minute** handled smoothly  

---

## 🎓 **Key Concepts Demonstrated**

1. **Microservices Architecture** - Independent, scalable services
2. **Resilience Patterns** - Circuit breaker, rate limiting, caching
3. **Load Balancing** - Multiple strategies, health checks
4. **Observability** - Real-time monitoring, logging, metrics
5. **System Design** - Production-ready patterns and practices

---

## 🚀 **Next Steps**

1. **Modify Traffic**: Edit `traffic-generator.js` to change request rates
2. **Add More Instances**: Scale up to 3-4 instances per service
3. **Test Failures**: Stop services, simulate network issues
4. **Custom Scenarios**: Create your own traffic patterns
5. **Optimize**: Adjust rate limits, caching TTLs, load balancing strategies

---

**You now have a complete, production-ready microservice resilience and observability platform!** 🎉

