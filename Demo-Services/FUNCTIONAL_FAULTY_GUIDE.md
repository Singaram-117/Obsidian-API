# 🎯 FUNCTIONAL vs FAULTY MICROSERVICE DEMO

## 📋 **DEMO SCENARIO OVERVIEW**

### **✅ FUNCTIONAL Services:**
- **Orders Service** (Port 4001) - Fully operational
- **Payment Service** (Port 4003) - Stable and reliable

### **❌ FAULTY Service:**
- **Booking Service** (Port 4002) - Intermittent failures, slow responses

---

## 🚀 **QUICK START**

### **One-Command Setup:**
```bash
cd Demo-Services
.\SETUP_FUNCTIONAL_FAULTY.bat
```

**This will:**
1. Start all 3 services
2. Set Orders & Payments to functional mode
3. Set Booking to faulty mode
4. Run comprehensive demo
5. Show resilience patterns in action

---

## 🎯 **DEMONSTRATION SCENARIOS**

### **Scenario 1: Circuit Breaker Pattern**
```bash
# Run the demo
node functional-faulty-demo.js

# Expected Results:
# ✅ Orders Service: Circuit CLOSED (healthy)
# ❌ Booking Service: Circuit OPEN (failing)
# ✅ Payments Service: Circuit CLOSED (healthy)
```

### **Scenario 2: Traffic Load Testing**
```bash
# The demo automatically sends 20 requests to each service
# Expected Results:
# - Orders: ~100% success rate
# - Booking: ~0% success rate (failing)
# - Payments: ~100% success rate
```

### **Scenario 3: Real-time Monitoring**
```bash
# Open Obsidian Dashboard: http://localhost:8080
# Watch in real-time:
# - Service health indicators
# - Circuit breaker states
# - Response time metrics
# - Error rates
# - Live event feed
```

---

## 🔧 **MANUAL SETUP**

### **Step 1: Start Services**
```bash
# Terminal 1 - Orders (Functional)
cd orders-service
npm start

# Terminal 2 - Booking (Faulty)
cd booking-service  
npm start

# Terminal 3 - Payments (Functional)
cd payment-service
npm start
```

### **Step 2: Configure Service States**
```bash
# Make Orders functional
curl -X POST http://localhost:4001/orders/recover

# Make Booking faulty
curl -X POST http://localhost:4002/bookings/fail

# Make Payments functional
curl -X POST http://localhost:4003/payments/recover
```

### **Step 3: Run Demo**
```bash
node functional-faulty-demo.js
```

---

## 📊 **EXPECTED BEHAVIOR**

### **✅ FUNCTIONAL Services (Orders & Payments):**
- **Health Status**: Healthy
- **Response Time**: 50-600ms (normal)
- **Success Rate**: ~100%
- **Circuit Breaker**: Closed
- **Error Rate**: ~0%

### **❌ FAULTY Service (Booking):**
- **Health Status**: Unhealthy
- **Response Time**: Timeout or very slow
- **Success Rate**: ~0%
- **Circuit Breaker**: Open
- **Error Rate**: ~100%

---

## 🛡️ **RESILIENCE PATTERNS DEMONSTRATED**

### **1. Circuit Breaker Pattern**
- **Functional Services**: Circuit stays closed
- **Faulty Service**: Circuit opens after failures
- **Protection**: Prevents cascading failures

### **2. Health Monitoring**
- **Real-time Status**: Live health checks
- **Performance Metrics**: Response times, success rates
- **Alert Generation**: Automatic failure detection

### **3. Load Balancing**
- **Traffic Distribution**: Routes away from faulty service
- **Instance Health**: Monitors individual service instances
- **Failover**: Automatic switching to healthy services

### **4. Rate Limiting**
- **Request Throttling**: Protects against overload
- **Service Isolation**: Prevents faulty service from affecting others
- **Graceful Degradation**: Maintains partial functionality

---

## 🎮 **INTERACTIVE TESTING**

### **Test Individual Services:**
```bash
# Test Orders (should work)
curl http://localhost:4001/health
curl http://localhost:4001/api/orders

# Test Booking (should fail)
curl http://localhost:4002/health
curl http://localhost:4002/api/bookings

# Test Payments (should work)
curl http://localhost:4003/health
curl http://localhost:4003/api/payments
```

### **Simulate Recovery:**
```bash
# Recover Booking service
curl -X POST http://localhost:4002/bookings/recover

# Test again (should now work)
curl http://localhost:4002/health
```

### **Simulate More Failures:**
```bash
# Make Booking slow
curl -X POST http://localhost:4002/bookings/slow

# Make Booking overloaded
curl -X POST http://localhost:4002/bookings/overload
```

---

## 📈 **MONITORING DASHBOARD**

### **Real-time Metrics:**
- **Service Health**: Green (functional) vs Red (faulty)
- **Circuit Breaker Status**: Open/Closed states
- **Response Times**: Historical and current
- **Success Rates**: Percentage calculations
- **Error Rates**: Failure tracking

### **Event Feed:**
- **Service Events**: Up/down transitions
- **Circuit Breaker Events**: Open/close actions
- **Performance Events**: Slow response alerts
- **Recovery Events**: Service restoration

### **Alerts & Recommendations:**
- **Health Alerts**: Service down notifications
- **Performance Alerts**: Slow response warnings
- **Capacity Alerts**: Overload notifications
- **AI Recommendations**: Optimization suggestions

---

## 🎓 **EXAM DEMONSTRATION POINTS**

### **✅ System Resilience:**
- **Fault Tolerance**: System continues with partial failures
- **Graceful Degradation**: Maintains core functionality
- **Automatic Recovery**: Self-healing capabilities
- **Monitoring**: Real-time observability

### **✅ Design Patterns:**
- **Circuit Breaker**: Prevents cascading failures
- **Observer**: Real-time monitoring updates
- **Strategy**: Different handling for functional vs faulty
- **Proxy**: Request interception and routing

### **✅ Microservices Architecture:**
- **Service Independence**: Isolated failures
- **Service Discovery**: Automatic health detection
- **Load Balancing**: Traffic distribution
- **API Gateway**: Centralized request handling

---

## 🚀 **SUCCESS INDICATORS**

### **✅ Demo Working Correctly:**
- Orders service responding normally
- Booking service failing consistently
- Payments service responding normally
- Circuit breakers opening/closing appropriately
- Dashboard showing real-time status
- Traffic being routed correctly
- Alerts being generated
- Recovery procedures working

### **✅ Resilience Patterns Active:**
- Circuit breaker protecting system
- Rate limiting preventing overload
- Load balancing distributing traffic
- Health monitoring detecting issues
- Event tracking recording changes
- Alerting notifying of problems
- Recovery mechanisms functioning

---

## 🎯 **QUICK REFERENCE**

### **Service URLs:**
- **Orders (Functional)**: http://localhost:4001
- **Booking (Faulty)**: http://localhost:4002
- **Payments (Functional)**: http://localhost:4003
- **Obsidian Dashboard**: http://localhost:8080

### **Key Commands:**
```bash
# Setup demo
.\SETUP_FUNCTIONAL_FAULTY.bat

# Run demo
node functional-faulty-demo.js

# Test services
curl http://localhost:4001/health  # Should work
curl http://localhost:4002/health  # Should fail
curl http://localhost:4003/health  # Should work
```

---

**🎉 Perfect for demonstrating microservices resilience, circuit breakers, and fault tolerance in your exam!**

**The system shows how a well-designed microservices architecture can handle partial failures gracefully while maintaining overall system functionality.** 🚀
