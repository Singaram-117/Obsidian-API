# 📖 GitHub Integration Guide

## 🎯 How to Use GitHub Integration in Obsidian MROP

### What is GitHub Integration?

When you register a microservice in Obsidian, you can optionally provide a GitHub repository URL. Obsidian will automatically:

✅ Fetch repository metadata (name, description, stars, forks)  
✅ Download the README.md file  
✅ Get programming language and topics  
✅ Show repository owner's avatar  
✅ Display latest release information  
✅ Provide direct links to the GitHub repository  

---

## 🚀 Quick Start

### Step 1: Register a Service with GitHub URL

1. Navigate to **Services** page in Obsidian
2. Click **"Register Service"** button
3. Fill in the form:

```
Service Name: my-awesome-service
Service URL: https://api.example.com (or http://localhost:3001)
Description: My production API service
GitHub URL: https://github.com/username/repository ← Add this!
Health Endpoint: /health
Interval: 30000
```

4. Click **"Register Service"**

### Step 2: View GitHub Information

After registration, you'll see:

- ✅ Repository owner's **avatar** on the service card
- ✅ **Stars** (⭐), **Forks** (🍴), and **Language** stats
- ✅ Repository **topics** as badges
- ✅ **"View Details"** button

### Step 3: View Full Details

Click **"View Details"** to see:

- 📄 **README Preview** - First 1000 characters of the README
- 📊 **Complete Stats** - Stars, forks, language, license
- 🏷️ **Topics** - All repository topics
- 🔗 **GitHub Link** - Direct link to open the repository

---

## 📝 Examples

### Example 1: Register React Repository

```json
{
  "name": "react-demo",
  "url": "http://localhost:3000",
  "githubUrl": "https://github.com/facebook/react",
  "description": "React library monitoring",
  "healthCheck": {
    "endpoint": "http://localhost:3000/health",
    "interval": 30000
  }
}
```

**Result:**
- Avatar: Facebook logo
- Stars: ~220k
- Forks: ~45k
- Language: JavaScript
- README: Full React documentation preview

### Example 2: Monitor Your Own Service

```json
{
  "name": "my-api-service",
  "url": "https://api.mycompany.com",
  "githubUrl": "https://github.com/mycompany/api-service",
  "description": "Production REST API",
  "healthCheck": {
    "endpoint": "https://api.mycompany.com/health",
    "interval": 60000
  }
}
```

**Result:**
- Your repo information displayed
- README shown in service details
- Real-time monitoring of production API
- GitHub stats on service card

### Example 3: Popular Open Source Projects

Try these to see the integration in action:

```bash
# Node.js
https://github.com/nodejs/node

# Express
https://github.com/expressjs/express

# Next.js
https://github.com/vercel/next.js

# Nest.js
https://github.com/nestjs/nest

# Your own repo!
https://github.com/yourusername/yourrepo
```

---

## 🎨 What You'll See in the UI

### On the Service Card:

```
┌─────────────────────────────────────────────────┐
│  👤 [GitHub Avatar]  Service Name         ✅    │
│     JavaScript                                  │
│                                                 │
│  My awesome service description                 │
│                                                 │
│  📍 https://api.example.com                     │
│                                                 │
│  ⭐ 1,234   🍴 567   🏷️ 5 topics               │
│                                                 │
│  ┌─────────────┬─────────────┬─────────────┐   │
│  │ Requests    │ Success     │ Latency     │   │
│  │ 1,234       │ 99%         │ 45ms        │   │
│  └─────────────┴─────────────┴─────────────┘   │
│                                                 │
│  Circuit: CLOSED                                │
│                                                 │
│  [📖 View Details]  [🗑️ Delete]                │
└─────────────────────────────────────────────────┘
```

### In the Details Modal:

```
┌─────────────────────────────────────────────────┐
│  📖 Service Details                        ✕    │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 [Avatar]  username/repository               │
│     Repository description here                 │
│     [react] [javascript] [frontend] [ui]        │
│                                                 │
│  ┌───────┬───────┬──────────┬─────────┐        │
│  │ ⭐ 1.2k│ 🍴 567│ JavaScript│ MIT     │        │
│  │ Stars │ Forks │ Language │ License │        │
│  └───────┴───────┴──────────┴─────────┘        │
│                                                 │
│  📄 README Preview                              │
│  ┌───────────────────────────────────────────┐ │
│  │ # Project Name                            │ │
│  │                                           │ │
│  │ This is the README content showing the    │ │
│  │ project documentation, installation       │ │
│  │ instructions, and usage examples...       │ │
│  │                                           │ │
│  │ (First 1000 characters shown)             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [🔗 Open in GitHub]  [Close]                  │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### API Endpoints

#### Get GitHub Repository Info
```bash
GET /api/github/repo?url=https://github.com/facebook/react

Response:
{
  "success": true,
  "data": {
    "name": "react",
    "fullName": "facebook/react",
    "description": "A JavaScript library for building UIs",
    "stars": 220000,
    "forks": 45000,
    "language": "JavaScript",
    "topics": ["react", "javascript", "frontend"],
    "owner": {
      "name": "facebook",
      "avatar": "https://avatars.githubusercontent.com/u/69631"
    }
  }
}
```

#### Get README
```bash
GET /api/github/readme?url=https://github.com/facebook/react

Response:
{
  "success": true,
  "data": {
    "content": "# React\n\nA JavaScript library...",
    "type": "markdown"
  }
}
```

#### Get Complete Information
```bash
GET /api/github/complete?url=https://github.com/facebook/react

Response:
{
  "success": true,
  "data": {
    "repository": { /* repo info */ },
    "readme": { /* readme content */ },
    "contributors": [ /* top 5 contributors */ ],
    "latestRelease": { /* latest release info */ }
  }
}
```

### Frontend API Usage

```javascript
import { githubApi } from '../lib/api';

// Get repository information
const repoInfo = await githubApi.getRepoInfo('https://github.com/user/repo');

// Get README
const readme = await githubApi.getReadme('https://github.com/user/repo');

// Get everything
const completeInfo = await githubApi.getCompleteInfo('https://github.com/user/repo');
```

---

## 💡 Pro Tips

### 1. **Monitor Open Source Projects**
Register popular open source projects to see how Obsidian tracks external services:

```bash
# Example: Monitor Express.js
Name: express-js
URL: https://expressjs.com
GitHub: https://github.com/expressjs/express
```

### 2. **Track Your Own Services**
Link your private repositories (if you have a GitHub token configured):

```bash
Name: my-private-service
URL: https://api.internal.company.com
GitHub: https://github.com/mycompany/private-repo
```

### 3. **Use for Documentation**
The README preview serves as inline documentation for your services:

- Quick reference without leaving Obsidian
- See setup instructions
- View API documentation
- Check version information

### 4. **Combine with Global URLs**
Perfect combination for production services:

```javascript
{
  name: "production-api",
  url: "https://api.production.com",      // Global URL
  githubUrl: "https://github.com/you/api" // Source code
}
```

Now you can:
- Monitor the live production API
- View the source code documentation
- See deployment information
- Track repository updates

---

## 🐛 Troubleshooting

### GitHub URL Not Working?

**Problem:** Repository info not showing

**Solutions:**
1. Check URL format: `https://github.com/owner/repo`
2. Ensure repository is public
3. Check internet connection
4. View browser console for errors

### README Not Displaying?

**Problem:** README preview is empty

**Solutions:**
1. Verify repository has a README.md file
2. Check if README is in root directory
3. Ensure it's a markdown file
4. Try refreshing the service

### Avatar Not Loading?

**Problem:** GitHub avatar not showing

**Solutions:**
1. Check GitHub is accessible
2. Verify repository owner exists
3. Clear browser cache
4. Check image permissions

---

## 🎯 Best Practices

### ✅ DO:
- Use GitHub URLs for all services when possible
- Keep README files updated in your repositories
- Add descriptive repository descriptions
- Use topics/tags for better categorization
- Link production URLs with their source repositories

### ❌ DON'T:
- Use invalid GitHub URLs
- Forget to update service info when repo changes
- Link unrelated repositories
- Use private repos without proper authentication

---

## 📊 What Information is Fetched?

| Data | Source | Display Location |
|------|--------|-----------------|
| Repository Name | GitHub API | Service Card Title |
| Description | GitHub API | Service Card Body |
| Stars | GitHub API | Service Card Stats |
| Forks | GitHub API | Service Card Stats |
| Language | GitHub API | Badge on Card |
| Topics | GitHub API | Badges in Details |
| Owner Avatar | GitHub API | Service Card Image |
| README | GitHub API | Details Modal |
| Latest Release | GitHub API | Details Modal |
| License | GitHub API | Details Modal |

---

## 🚀 Advanced Usage

### Custom GitHub Token (Optional)

For higher rate limits and private repositories, you can add a GitHub token:

```javascript
// In Obsidian-API/src/services/githubService.js
// Add to axios config:

headers: {
  'Accept': 'application/vnd.github.v3+json',
  'Authorization': `token ${process.env.GITHUB_TOKEN}` // Add this
}
```

Then in `.env`:
```
GITHUB_TOKEN=your_github_personal_access_token
```

### Rate Limits

GitHub API rate limits:
- **Without token:** 60 requests/hour
- **With token:** 5000 requests/hour

Obsidian caches repository information to minimize API calls.

---

## 🎉 Try It Now!

1. Go to Services page
2. Click "Register Service"
3. Add a GitHub URL to any service
4. Watch the magic happen! ✨

**Happy Monitoring!** 🚀

