# 🚀 Obsidian MROP - Quick Use Guide

## ✨ Your App is Ready! Here's How to Use It

### 🎯 What Just Got Added

1. ✅ **Global URL Monitoring** - Monitor services anywhere
2. ✅ **GitHub Integration** - Automatic repo info and README
3. ✅ **Beautiful UI** - Animations, gradients, and images
4. ✅ **Modern Design** - Glass effects, neon borders, floating icons

---

## 🚀 Start the Application

### Terminal 1: Start Backend
```bash
cd Obsidian-API
npm start
```

Wait for: `✓ Server running on port 5000`

### Terminal 2: Start Frontend
```bash
cd Obsidian-Frontend
npm run dev
```

Wait for: `Local: http://localhost:5173`

### Terminal 3 (Optional): Start Mock Service
```bash
cd Mock-Microservice
npm start
```

---

## 🌟 First Steps

### 1. Login

Open: **http://localhost:5173**

You'll see a **beautiful animated login page** with:
- Floating gradient orbs
- Glass morphism card
- Pulse effects

**Login with:**
```
Email: admin@obsidian.dev
Password: Admin@123
```

---

### 2. Explore the Dashboard

After login, you'll see:

#### ✨ **Animated Hero Section**
- Gradient border with moving colors
- Obsidian logo with pulse effect
- "System Online" indicator

#### 📊 **Stats Cards with Neon Borders**
- Total Services (blue border)
- Healthy Services (green neon glow)
- Circuit Breakers (red if any open)
- Recent Events (purple border)

#### 🚀 **Service Cards** (when you add services)
- GitHub avatars
- Repository stats
- Real-time metrics
- Status indicators

---

## 🎯 Try These Examples!

### Example 1: Register a Service with GitHub

1. Click **"Services"** in sidebar
2. Click **"Register Service"** button
3. Fill in:

```
Service Name: react-library
Service URL: http://localhost:3001
Description: React official repository
GitHub URL: https://github.com/facebook/react
Health Endpoint: http://localhost:3001/health
Interval: 30000
```

4. Click **"Register Service"**
5. **Watch the magic!** ✨

You'll see:
- ✅ Facebook's logo as avatar
- ✅ Stars: ~220k
- ✅ Forks: ~45k
- ✅ Language: JavaScript
- ✅ Topics as badges
- ✅ "View Details" button

6. Click **"View Details"** to see:
- Full README preview
- Complete repository stats
- Direct link to GitHub

---

### Example 2: Monitor a Global URL

1. Register a production API:

```
Service Name: github-api
Service URL: https://api.github.com
Description: GitHub's public API
GitHub URL: https://github.com/github
Health Endpoint: https://api.github.com/status
Interval: 60000
```

2. Obsidian will:
- ✅ Monitor the live API
- ✅ Track response times
- ✅ Show GitHub's avatar
- ✅ Display real-time status

---

### Example 3: Your Own Service

1. Register your repository:

```
Service Name: my-awesome-api
Service URL: https://api.myproject.com
Description: My production API
GitHub URL: https://github.com/yourusername/your-repo
Health Endpoint: https://api.myproject.com/health
Interval: 30000
```

2. You'll get:
- Your repo's README
- Your avatar
- Repository stats
- Live monitoring

---

## 🎨 UI Features to Explore

### 🌈 Animations

1. **Dashboard Hero**
   - Gradient border animates continuously
   - Shield icon floats up and down
   - Live indicator pulses

2. **Service Cards**
   - Hover to see lift effect
   - Neon borders glow based on status
   - Smooth transitions

3. **Sidebar**
   - Active route has neon border
   - Smooth color transitions
   - System health status

4. **Loading States**
   - Spinning gear emoji ⚙️
   - Floating search icon 🔍
   - Smooth fade-ins

### 💎 Visual Effects

1. **Glass Morphism**
   - All cards have frosted glass effect
   - Subtle transparency
   - Backdrop blur

2. **Neon Borders**
   - Green: Healthy services
   - Red: Failed services
   - Blue: Active routes

3. **Gradients**
   - Blue → Purple → Pink (hero)
   - Blue → Purple (buttons)
   - Green → Blue (success text)

4. **Background Patterns**
   - Grid overlay
   - Dot pattern
   - Subtle, non-distracting

---

## 📖 View GitHub Information

### On Service Card:
- **Avatar**: Repository owner's image
- **Stats**: ⭐ Stars, 🍴 Forks
- **Language**: Displayed as badge
- **Topics**: In details modal

### In Details Modal:
Click **"View Details"** on any GitHub-linked service:

1. **Repository Header**
   - Owner avatar (large)
   - Full repository name
   - Description
   - Topics as badges

2. **Statistics Grid**
   - Stars with yellow icon
   - Forks with blue icon
   - Primary language
   - License type

3. **README Preview**
   - First 1000 characters
   - Formatted markdown
   - Scrollable if long

4. **Actions**
   - "Open in GitHub" button
   - Direct link to repository

---

## 🎯 Features to Try

### 1. Real-time Updates
- Open Services page
- Open in two browser tabs
- Register service in one tab
- Watch it appear in the other! (5s refresh)

### 2. Circuit Breaker
- Register Mock Service (localhost:3001)
- Go to `/chaos` endpoint
- Trigger failures
- Watch circuit breaker open
- See red neon border appear!

### 3. Live Events
- Monitor the event feed on Dashboard
- Every action creates an event
- Real-time updates via Socket.IO

### 4. Metrics
- Go to Metrics page
- See beautiful charts
- Filter by service
- View response times

### 5. Alerts
- Go to Alerts page
- Create alert rules
- Get notified on failures

### 6. Admin Dashboard
- Go to Admin page
- Manage users
- View system stats
- Control access

---

## 🌐 Global URL Examples to Try

### Public APIs You Can Monitor:

```bash
# GitHub API
https://api.github.com

# JSONPlaceholder
https://jsonplaceholder.typicode.com

# Dog API
https://dog.ceo/api

# Cat Facts
https://catfact.ninja

# Your own API!
https://your-api.com
```

Just register them like any service, and Obsidian will monitor them!

---

## 📖 Popular GitHub Repos to Try

### Frontend:
```
https://github.com/facebook/react
https://github.com/vuejs/vue
https://github.com/angular/angular
https://github.com/sveltejs/svelte
```

### Backend:
```
https://github.com/expressjs/express
https://github.com/nestjs/nest
https://github.com/fastify/fastify
https://github.com/koajs/koa
```

### Your Own:
```
https://github.com/yourusername/yourproject
```

---

## 🎨 Customizing the UI

### Change Colors

Edit `Obsidian-Frontend/src/index.css`:

```css
/* Change primary gradient */
.gradient-text {
  background-image: linear-gradient(to right, 
    #your-color-1, 
    #your-color-2, 
    #your-color-3
  );
}

/* Change animation speed */
.animate-gradient {
  animation: gradient 15s ease infinite; /* Change 15s */
}

/* Change neon color */
.neon-border {
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); /* Change color */
}
```

### Add Your Own Images

Replace Unsplash URLs in components with your own images!

---

## 🐛 Troubleshooting

### Can't Login?
```bash
# Create admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@obsidian.dev",
    "password": "Admin@123",
    "role": "admin"
  }'
```

### GitHub Info Not Showing?
- Check URL format: `https://github.com/owner/repo`
- Ensure repository is public
- Check browser console for errors

### Service Not Appearing?
- Wait 5 seconds for auto-refresh
- Check backend terminal for errors
- Verify MongoDB is running

### Network Errors?
- Ensure backend is running on port 5000
- Check `.env` files are correct
- Verify CORS is working (already configured!)

---

## 🎉 Cool Things You Can Do

### 1. **Create a Dashboard for Your Team**
- Register all your microservices
- Add GitHub repos
- Monitor in real-time
- Share with your team!

### 2. **Learn Microservice Patterns**
- See circuit breakers in action
- Understand rate limiting
- Explore chaos engineering
- Study resilience patterns

### 3. **Monitor Production Services**
- Add your production APIs
- Set up health checks
- Configure alerts
- Track performance

### 4. **Showcase Open Source**
- Add popular GitHub repos
- Display README documentation
- Track repository stats
- Build a service catalog

---

## 🚀 Next Steps

1. ✅ **Register Your First Service** with GitHub
2. ✅ **Monitor a Global URL** from the internet
3. ✅ **Explore the Animated Dashboard**
4. ✅ **View GitHub Information** in service details
5. ✅ **Set Up Alerts** for your services
6. ✅ **Try Chaos Engineering** to test resilience

---

## 📚 Documentation

- **[README.md](./README.md)** - Main overview
- **[FEATURES_SUMMARY.md](./FEATURES_SUMMARY.md)** - All features
- **[GITHUB_INTEGRATION_GUIDE.md](./GITHUB_INTEGRATION_GUIDE.md)** - GitHub setup
- **[LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)** - Installation
- **[API_SETUP_COMPLETE.md](./API_SETUP_COMPLETE.md)** - Technical details

---

## 💡 Pro Tips

1. **Use GitHub Integration** - Makes services easy to identify
2. **Monitor Global URLs** - Track production APIs
3. **Hover Over Cards** - See smooth animations
4. **Check Events Feed** - Real-time system activity
5. **Explore Sidebar** - Beautiful navigation with status

---

## 🎨 What Makes the UI Beautiful?

- ✨ **Animated gradients** that move continuously
- 💎 **Glass morphism** cards with blur effects
- 🌟 **Neon borders** that glow based on status
- 🎈 **Floating animations** on icons
- 💫 **Pulse effects** for live indicators
- 🎯 **Grid patterns** in the background
- 🌈 **Gradient text** for headings
- 🎪 **Hover effects** on all interactive elements

---

**Enjoy your beautiful, powerful microservice platform!** 🚀✨

**Everything works together perfectly:**
- Beautiful UI ✅
- GitHub Integration ✅
- Global URL Support ✅
- Real-time Monitoring ✅
- Resilience Patterns ✅

**Start monitoring and have fun!** 🎉

