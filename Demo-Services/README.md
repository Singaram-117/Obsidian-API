# 🎯 Demo Services for Obsidian MROP

Three production-ready microservices to demonstrate the full power of Obsidian MROP!

## 📦 **Services Included**

### 1. **Orders Service** (Port 4001)
- Manages orders and order processing
- Endpoints: GET, POST, PATCH, DELETE
- In-memory order storage
- Response time: 50-150ms

### 2. **Booking Service** (Port 4002)
- Handles bookings and reservations
- Availability checking
- Conflict detection
- Response time: 100-250ms

### 3. **Payment Service** (Port 4003)
- Processes payments and refunds
- Simulates payment gateway (10% failure rate)
- Transaction tracking
- Response time: 150-350ms

---

## 🚀 **Quick Start**

### **Option 1: Use Batch Scripts (Windows)**

```bash
# Start all services at once
.\START_ALL.bat

# Start extra instances for load balancing
.\START_EXTRA_INSTANCES.bat

# Generate traffic
node traffic-generator.js
```

### **Option 2: Manual Start**

#### **Install Dependencies:**
```bash
cd orders-service && npm install && cd ..
cd booking-service && npm install && cd ..
cd payment-service && npm install && cd ..
```

#### **Start Services:**
```bash
# Terminal 1 - Orders
cd orders-service
set PORT=4001
set INSTANCE_ID=1
npm start

# Terminal 2 - Booking
cd booking-service
set PORT=4002
set INSTANCE_ID=1
npm start

# Terminal 3 - Payment
cd payment-service
set PORT=4003
set INSTANCE_ID=1
npm start
```

---

## 🔌 **API Endpoints**

### **Orders Service (4001)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:id` | Get order by ID |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/:id/status` | Update order status |
| DELETE | `/api/orders/:id` | Delete order |
| GET | `/api/orders/stats/summary` | Get order statistics |

### **Booking Service (4002)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/bookings` | Get all bookings |
| GET | `/api/bookings/:id` | Get booking by ID |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/bookings/availability/:resourceId` | Check availability |
| GET | `/api/bookings/stats/summary` | Get booking statistics |

### **Payment Service (4003)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/payments` | Get all payments |
| GET | `/api/payments/:id` | Get payment by ID |
| POST | `/api/payments/process` | Process payment |
| POST | `/api/payments/:id/refund` | Refund payment |
| GET | `/api/payments/:id/verify` | Verify payment |
| GET | `/api/payments/stats/summary` | Get payment statistics |

---

## 🧪 **Example Requests**

### **Create Order:**
```bash
curl -X POST http://localhost:4001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 123,
    "items": [{"id": 1, "quantity": 2}],
    "totalAmount": 99.99
  }'
```

### **Create Booking:**
```bash
curl -X POST http://localhost:4002/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 123,
    "resourceType": "hotel",
    "resourceId": "RES001",
    "startDate": "2025-11-01",
    "endDate": "2025-11-03"
  }'
```

### **Process Payment:**
```bash
curl -X POST http://localhost:4003/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 123,
    "amount": 99.99,
    "method": "credit_card"
  }'
```

---

## 📊 **Traffic Generator**

Generate high traffic to test rate limiting and load balancing:

```bash
node traffic-generator.js
```

**Configuration:**
- **Requests/sec**: 50 per service (configurable)
- **Duration**: 60 seconds (configurable)
- **Mix**: 70% GET, 30% POST requests
- **Real-time stats**: Updates every second

**Output:**
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
```

---

## 🎛️ **Running Multiple Instances**

To demonstrate load balancing, run multiple instances on different ports:

```bash
# Orders Instance 2
cd orders-service
set PORT=4011
set INSTANCE_ID=2
npm start

# Booking Instance 2
cd booking-service
set PORT=4012
set INSTANCE_ID=2
npm start

# Payment Instance 2
cd payment-service
set PORT=4013
set INSTANCE_ID=2
npm start
```

Or use the batch script:
```bash
.\START_EXTRA_INSTANCES.bat
```

---

## 🔧 **Configuration**

### **Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4001/4002/4003 | Service port |
| `INSTANCE_ID` | 1 | Instance identifier |

### **Traffic Generator Config:**

Edit `traffic-generator.js`:
```javascript
const CONFIG = {
  ordersService: 'http://localhost:4001',
  bookingService: 'http://localhost:4002',
  paymentService: 'http://localhost:4003',
  requestsPerSecond: 50,  // Adjust this
  duration: 60,           // Adjust this
};
```

---

## 📈 **What to Demonstrate**

1. **Rate Limiting**
   - Configure in Obsidian Manage page
   - Run traffic generator
   - Watch requests get limited

2. **Load Balancing**
   - Start multiple instances
   - Register in Obsidian
   - Watch traffic distribute

3. **Caching**
   - Enable in Obsidian
   - Send GET requests
   - Watch cache hit rate increase

4. **Circuit Breaker**
   - Stop one instance
   - Watch circuit open
   - See other instances handle traffic

5. **Monitoring**
   - Dashboard shows all metrics
   - Events page logs everything
   - Metrics page shows charts

---

## ✅ **Success Criteria**

After setup, you should have:

- ✅ 3 services running
- ✅ All services registered in Obsidian
- ✅ Health checks passing
- ✅ Traffic generator sending requests
- ✅ Rate limiting configured
- ✅ Load balancing working
- ✅ Real-time monitoring active

---

## 📚 **Next Steps**

1. Register services in Obsidian: `http://localhost:8080/app/services`
2. Configure features: `http://localhost:8080/app/manage`
3. Run traffic generator: `node traffic-generator.js`
4. Watch dashboard: `http://localhost:8080/app/dashboard`

**For complete instructions, see `COMPLETE_DEMO_GUIDE.md`**

