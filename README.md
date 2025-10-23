# 🌑 Obsidian MROP

<div align="center">

![Obsidian MROP Banner](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=400&fit=crop&q=80)

### Microservice Resilience & Observability Platform

**Monitor · Protect · Optimize Your Distributed Systems**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo)

</div>

---

## 🎯 What is Obsidian MROP?

Obsidian is a **next-generation microservice management platform** that acts as an intelligent protective layer for your distributed systems. It prevents cascading failures, provides real-time observability, and helps you build resilient architectures with industry-standard design patterns.

### Why Obsidian?

- 🛡️ **Prevent Cascading Failures** - Circuit breakers and bulkhead patterns protect your entire system
- 🌐 **Monitor Global Services** - Track microservices anywhere, from localhost to production
- 📖 **GitHub Integration** - Automatically fetch README, stats, and metadata
- 🎨 **Beautiful UI** - Modern, animated dashboard with real-time updates
- 🔌 **7 Integration Methods** - URL, SDK, Git, Consul, Eureka, Docker, Kubernetes
- 🧠 **AI Recommendations** - Intelligent suggestions to improve system resilience
- 💣 **Chaos Engineering** - Built-in failure simulation toolkit

---

## ✨ Features

### 🛡️ Resilience Patterns

<table>
<tr>
<td width="50%">

#### Circuit Breaker
Automatically isolate failing services to prevent cascade failures

```javascript
const breaker = circuitBreakerService
  .getBreaker('my-service');
const result = await breaker.fire(requestData);
```

</td>
<td width="50%">

![Circuit Breaker](https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&h=250&fit=crop&q=80)

</td>
</tr>

<tr>
<td width="50%">

![Rate Limiting](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&q=80)

</td>
<td width="50%">

#### Rate Limiting
Protect services from overload with intelligent throttling

```javascript
app.use('/api', rateLimiter({
  windowMs: 60000,
  max: 100
}));
```

</td>
</tr>

<tr>
<td width="50%">

#### Load Balancing
Distribute requests across multiple service instances

```javascript
const loadBalancer = new LoadBalancer({
  strategy: 'round-robin',
  servers: ['server1', 'server2']
});
```

</td>
<td width="50%">

![Load Balancing](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop&q=80)

</td>
</tr>
</table>

**All Implemented Patterns:**
- ✅ Circuit Breaker (Opossum)
- ✅ Rate Limiting
- ✅ Bulkhead Isolation
- ✅ Fallback Handlers
- ✅ Cache-Aside
- ✅ Saga Pattern (Distributed Transactions)
- ✅ Load Balancer (Round Robin, Least Connections, Weighted)
- ✅ Timeout Handling
- ✅ Retry with Exponential Backoff

### 📊 Observability

<div align="center">

![Dashboard](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&q=80)

</div>

**Real-time Monitoring:**
- 📡 Live event streams via Socket.IO
- 📈 Metrics aggregation and visualization
- 📝 Centralized logging (Winston + MongoDB)
- 🔔 Intelligent alerting system
- 💡 AI-powered recommendations
- ⚡ Health check orchestration

### 🎨 Design Patterns

Obsidian implements **15+ industry-standard design patterns**:

| Pattern | Purpose | Implementation |
|---------|---------|----------------|
| **Observer** | Event-driven architecture | 6 concrete observers (Dashboard, Logging, Metrics, Alerting, Audit, Analytics) |
| **Factory** | Create resilience strategies | Strategy factory for Circuit Breaker, Rate Limiter, etc. |
| **Singleton** | Single instance services | Config, Logger, Database connections |
| **Decorator** | Enhance requests | Add logging, metrics, authentication |
| **Chain of Responsibility** | Request pipeline | Authentication → Validation → Rate Limiting → Processing |
| **Proxy** | Transparent resilience | Intercept and protect service calls |
| **Facade** | Simplified API | Single interface to complex resilience features |
| **Adapter** | External integrations | Prometheus, Grafana, Datadog adapters |

[View Full Pattern Documentation →](./DESIGN_PATTERNS_COMPLETE.md)

---

## 🌐 Global URL & GitHub Integration

### Monitor Any Service, Anywhere

```javascript
// Register a production API
{
  "name": "production-api",
  "url": "https://api.mycompany.com",
  "githubUrl": "https://github.com/mycompany/production-api",
  "healthCheck": {
    "endpoint": "https://api.mycompany.com/health",
    "interval": 30000
  }
}
```

### Automatic GitHub Integration

When you provide a GitHub URL, Obsidian automatically:
- 📖 Fetches the README
- ⭐ Shows stars and forks
- 🏷️ Displays topics and language
- 👤 Shows repository owner avatar
- 🚀 Gets latest release information
- 🔗 Provides direct GitHub links

<div align="center">

![GitHub Integration](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&h=400&fit=crop&q=80)

</div>

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis 6+
- Git

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/Obsidian.git
cd Obsidian
```

### 2️⃣ Setup Backend

```bash
cd Obsidian-API
npm install

# Create .env file
cat > .env << EOL
PORT=5000
MONGODB_URI=mongodb://localhost:27017/obsidian
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=obsidian-mrop-super-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
EOL

# Start the server
npm start
```

### 3️⃣ Setup Frontend

```bash
cd Obsidian-Frontend
npm install

# Create .env file
cat > .env << EOL
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
EOL

# Start the dev server
npm run dev
```

### 4️⃣ Create Admin User

```bash
# Using the API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@obsidian.dev",
    "password": "Admin@123",
    "role": "admin"
  }'
```

### 5️⃣ Login and Explore! 🎉

Open [http://localhost:5173](http://localhost:5173) and login with your credentials!

---

## 📖 Documentation

### Complete Guides

- 📘 [Local Setup Guide](./LOCAL_SETUP_GUIDE.md) - Step-by-step installation
- 🔧 [Integration Methods](./INTEGRATION_GUIDE.md) - All 7 integration options
- 🏗️ [System Architecture](./ARCHITECTURE.md) - Technical architecture
- 🎨 [Design Patterns](./DESIGN_PATTERNS_COMPLETE.md) - All implemented patterns
- 🛡️ [Resilience Patterns](./RESILIENCE_PATTERNS_IMPLEMENTED.md) - Fault tolerance
- 🔐 [Authentication Setup](./AUTH_SETUP_GUIDE.md) - JWT and user management
- ⚡ [Activity Tracking](./HOW_IT_WORKS.md) - How monitoring works
- 🎯 [Quick Reference](./QUICK_START.md) - Fast commands

### API Documentation

#### Register a Service

```bash
POST /api/services
{
  "name": "my-service",
  "url": "https://api.example.com",
  "description": "My awesome service",
  "githubUrl": "https://github.com/user/repo",
  "healthCheck": {
    "endpoint": "https://api.example.com/health",
    "interval": 30000
  }
}
```

#### Get All Services

```bash
GET /api/services
```

#### View Events

```bash
GET /api/events?limit=50&severity=error
```

#### Get Metrics

```bash
GET /api/metrics/service/my-service
```

---

## 🎨 Beautiful UI

<div align="center">

### Animated Dashboard with Real-time Updates

![Dashboard Preview](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&h=600&fit=crop&q=80)

### Service Management with GitHub Integration

![Services Page](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1000&h=600&fit=crop&q=80)

### Modern Login with Floating Animations

![Login Page](https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1000&h=600&fit=crop&q=80)

</div>

### UI Features

- ✨ **Gradient Backgrounds** - Animated color transitions
- 💎 **Glass Morphism** - Frosted glass effects with backdrop blur
- 🌟 **Neon Borders** - Glowing borders for status indicators
- 🎈 **Floating Animations** - Smooth motion effects
- 💫 **Pulse Effects** - Live indicators with rhythmic glow
- 🎯 **Grid & Dot Patterns** - Subtle background textures
- 🎪 **Card Hover Effects** - Interactive lift and shadow
- 🌈 **Gradient Text** - Multi-color text effects

---

## 🔌 Integration Methods

Obsidian supports **7 different ways** to integrate your microservices:

### 1. **Manual URL Registration** 🌐
Register any service by URL (local or global)

### 2. **SDK/Agent** 📦
Drop-in library for automatic registration
```bash
npm install obsidian-sdk
```

### 3. **Git Repository** 📂
Auto-deploy from GitHub/GitLab repositories

### 4. **Service Discovery** 🔍
- Consul integration
- Eureka integration

### 5. **Container Orchestration** 🐳
- Docker container discovery
- Kubernetes pod monitoring

### 6. **GitHub API** 📖
Fetch repository info, README, and stats

### 7. **Webhooks** 🪝
Push-based updates from CI/CD

[Learn More →](./INTEGRATION_GUIDE.md)

---

## 💣 Chaos Engineering

Test your system's resilience with built-in chaos tools:

- 🔥 **Failure Injection** - Simulate service failures
- ⏱️ **Latency Injection** - Add artificial delays
- 💥 **Error Rate Manipulation** - Increase error rates
- 🔌 **Network Partitioning** - Simulate network splits
- 📊 **Real-time Results** - See impact immediately

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Obsidian MROP                            │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Frontend   │◄────►│   Backend    │                    │
│  │  (React +    │      │ (Node.js +   │                    │
│  │   Vite)      │      │  Express)    │                    │
│  └──────────────┘      └──────┬───────┘                    │
│                               │                             │
│                    ┌──────────┼──────────┐                 │
│                    ▼          ▼          ▼                 │
│              ┌─────────┐ ┌────────┐ ┌────────┐            │
│              │ MongoDB │ │ Redis  │ │ Kafka  │            │
│              └─────────┘ └────────┘ └────────┘            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │     Your Microservices              │
        │  ┌─────────┐  ┌─────────┐          │
        │  │Service A│  │Service B│  ...     │
        │  └─────────┘  └─────────┘          │
        └─────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database (Atlas supported)
- **Mongoose** - ODM
- **Redis** - Caching & queues
- **Kafka** - Message streaming
- **Bull** - Background jobs
- **Opossum** - Circuit breakers
- **Winston** - Logging
- **Socket.IO** - Real-time updates
- **JWT** - Authentication

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Query** - Data fetching
- **React Router** - Navigation
- **Socket.IO Client** - Real-time
- **Axios** - HTTP client

---

## 📊 What's Included

- ✅ **3 Repositories** - Frontend, API, Mock Service
- ✅ **15+ Design Patterns** - Industry-standard implementations
- ✅ **9 Resilience Patterns** - Production-ready fault tolerance
- ✅ **7 Integration Methods** - Flexible service onboarding
- ✅ **Real-time Dashboard** - Beautiful UI with live updates
- ✅ **GitHub Integration** - Automatic repo information fetching
- ✅ **Global URL Support** - Monitor services anywhere
- ✅ **JWT Authentication** - Secure user management
- ✅ **Admin Dashboard** - User and system management
- ✅ **Chaos Engineering** - Built-in failure simulation
- ✅ **AI Recommendations** - Intelligent optimization suggestions
- ✅ **Complete Documentation** - Extensive guides and examples

---

## 🎯 Use Cases

### For Software Developers
- Learn microservice design patterns
- Build resilient distributed systems
- Practice chaos engineering
- Understand observability

### For DevOps Engineers
- Monitor production microservices
- Implement circuit breakers
- Set up intelligent alerting
- Track service health

### For System Architects
- Design fault-tolerant systems
- Implement proven patterns
- Analyze service dependencies
- Optimize system performance

---

## 📈 Roadmap

- [ ] GraphQL API support
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Custom dashboard widgets
- [ ] Multi-tenant support
- [ ] Mobile app
- [ ] Slack/Discord integrations
- [ ] Advanced analytics with ML
- [ ] Auto-scaling recommendations

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **GeeksforGeeks** - Resilience patterns reference
- **Refactoring Guru** - Design patterns catalog
- **ReactBits.dev** - Component inspiration
- **Unsplash** - Beautiful imagery

---

## 📞 Support

- 📧 Email: support@obsidian-mrop.dev
- 💬 Discord: [Join our community](https://discord.gg/obsidian)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/Obsidian/issues)
- 📖 Docs: [Full Documentation](https://docs.obsidian-mrop.dev)

---

<div align="center">

### ⭐ Star us on GitHub if you find this useful!

**Built with ❤️ for the microservice community**

[Get Started](#-quick-start) • [View Demo](#) • [Read Docs](#-documentation)

</div>
