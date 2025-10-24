# ⚡ Quick Demo Start - 5 Minutes

Get everything running in under 5 minutes!

## 🚀 **Super Quick Start**

### **1. Install Dependencies (One Time)**
```bash
cd Demo-Services
.\INSTALL_ALL.bat
```
⏱️ *Takes 2-3 minutes*

### **2. Start All Services**
```bash
.\START_ALL.bat
```
⏱️ *Takes 10 seconds*

You should see 3 terminal windows open:
- 🛒 Orders Service (Port 4001)
- 📅 Booking Service (Port 4002)
- 💳 Payment Service (Port 4003)

### **3. Register Services**

Open browser: `http://localhost:8080/app/services`

Click **"+ Register Service"** three times:

**Service 1:**
```
Name: orders-service
URL: http://localhost:4001
Description: Handles orders
```

**Service 2:**
```
Name: booking-service  
URL: http://localhost:4002
Description: Manages bookings
```

**Service 3:**
```
Name: payment-service
URL: http://localhost:4003
Description: Processes payments
```

### **4. Configure Rate Limiting (Optional but Recommended)**

Go to: `http://localhost:8080/app/manage`

For each service:
1. Select service
2. Go to **Rate Limiting** tab
3. Enable service-level rate limit
4. Set to 100 requests/min
5. Save

⏱️ *Takes 1 minute total*

### **5. Send Traffic**

```bash
cd Demo-Services
node traffic-generator.js
```

Watch the magic! 🎉

---

## 📊 **What You'll See**

### **Dashboard** (`/app/dashboard`)
- ✅ 3 services showing as "healthy"
- 📈 Metrics updating in real-time
- 🔥 Requests flowing through

### **Manage Page** (`/app/manage`)
- 📡 Click "Discover" on each service to see endpoints
- ⏱️ Watch rate limit counters increase
- 📊 See live stats

### **Events Page** (`/app/events`)
- 📝 All requests logged
- 🚨 Rate limit events (if you hit the limits)
- 🔄 Real-time feed

---

## 🎯 **Testing Scenarios**

### **Test Rate Limiting (30 seconds)**
1. Go to Manage page
2. Select "orders-service"
3. Set rate limit to 50 req/min
4. Run traffic generator
5. Watch requests get blocked

### **Test Load Balancing (2 minutes)**
1. Run: `.\START_EXTRA_INSTANCES.bat`
2. Go to Manage → orders-service → Load Balancing tab
3. Enable load balancing
4. Add instance: `http://localhost:4011`
5. Run traffic generator
6. Watch traffic split between instances

---

## ✅ **Success Checklist**

- [ ] 3 services running (check terminal windows)
- [ ] Services registered in Obsidian (shows in dashboard)
- [ ] Dashboard shows all services as "healthy"
- [ ] Traffic generator running and showing stats
- [ ] Dashboard metrics updating
- [ ] Events page showing activity

---

## 🆘 **Troubleshooting**

### **Services won't start:**
```bash
# Kill any existing processes
taskkill /F /IM node.exe
# Try again
.\START_ALL.bat
```

### **Can't access dashboard:**
Make sure Obsidian-API and Frontend are running!

### **Services not showing:**
Check CORS is working - backend should show API calls in console

---

## 📚 **Full Documentation**

For complete details, see:
- **`COMPLETE_DEMO_GUIDE.md`** - Complete step-by-step guide
- **`Demo-Services/README.md`** - API documentation
- **`MICROSERVICE_MANAGEMENT_GUIDE.md`** - Feature documentation

---

## 🎉 **You're Done!**

You now have:
✅ 3 microservices running  
✅ Complete monitoring and observability  
✅ Rate limiting configured  
✅ Real-time dashboard  
✅ Traffic flowing through the system  

**Time to show off your MROP! 🚀**

