# Authentication Setup Guide

## 🔐 JWT Authentication in Obsidian MROP

Obsidian MROP uses JWT (JSON Web Token) authentication for secure access control.

---

## 📋 Features

- ✅ **User Registration** - Create new accounts
- ✅ **Login with JWT** - Secure token-based authentication
- ✅ **Role-Based Access** - Admin and User roles
- ✅ **Permission System** - Granular permissions per user
- ✅ **API Key Generation** - For SDK and external integrations
- ✅ **Password Hashing** - bcrypt for secure password storage
- ✅ **Service-Level Access** - Users can only access their own services

---

## 🚀 Quick Start

### 1. Create Admin Account

First, create an admin account using the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@obsidian.dev",
    "password": "admin123",
    "name": "Admin User"
  }'
```

Then promote to admin in MongoDB:

```javascript
// Connect to MongoDB
use obsidian;

// Promote user to admin
db.users.updateOne(
  { email: "admin@obsidian.dev" },
  { 
    $set: { 
      role: "admin",
      "permissions.canManageUsers": true,
      "permissions.canDeleteServices": true,
      "permissions.canRunChaos": true
    }
  }
);
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@obsidian.dev",
    "password": "admin123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "admin@obsidian.dev",
    "name": "Admin User",
    "role": "admin",
    "permissions": {
      "canCreateServices": true,
      "canDeleteServices": true,
      "canManageUsers": true,
      ...
    }
  }
}
```

### 3. Use Token in Requests

```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎭 Roles & Permissions

### Admin Role
- ✅ Manage all users
- ✅ View all services
- ✅ Delete services
- ✅ Run chaos experiments
- ✅ View system health
- ✅ Full platform access

### User Role
- ✅ Create their own services
- ✅ View their own services only
- ✅ Configure alerts for their services
- ✅ View metrics for their services
- ❌ Cannot delete services (by default)
- ❌ Cannot manage users
- ❌ Cannot run chaos experiments

### Permission System

```javascript
{
  canCreateServices: true,      // Can register new services
  canDeleteServices: false,     // Can delete services (admin only)
  canManageUsers: false,        // Can manage users (admin only)
  canViewMetrics: true,         // Can view service metrics
  canConfigureAlerts: true,     // Can create alert rules
  canRunChaos: false           // Can run chaos engineering (admin only)
}
```

---

## 📡 API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "organization": "ACME Corp"  // Optional
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Generate API Key
```http
POST /api/auth/api-key
Authorization: Bearer <token>
```

Response:
```json
{
  "message": "API key generated successfully",
  "apiKey": "obsidian_a1b2c3d4e5f6..."
}
```

#### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "old123",
  "newPassword": "new456"
}
```

---

### Admin Endpoints

All admin endpoints require **admin role**.

#### Get Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <admin-token>
```

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

#### Create User
```http
POST /api/admin/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "user",
  "permissions": {
    "canDeleteServices": true
  }
}
```

#### Update User
```http
PUT /api/admin/users/:userId
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "admin",
  "permissions": {
    "canManageUsers": true
  }
}
```

#### Delete User
```http
DELETE /api/admin/users/:userId
Authorization: Bearer <admin-token>
```

#### Toggle User Status
```http
POST /api/admin/users/:userId/toggle-active
Authorization: Bearer <admin-token>
```

#### Get System Health
```http
GET /api/admin/system-health
Authorization: Bearer <admin-token>
```

---

## 🔑 API Key Authentication

For SDK and external integrations, use API key instead of JWT:

### Generate API Key

```bash
curl -X POST http://localhost:5000/api/auth/api-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Use API Key

```bash
curl -X GET http://localhost:5000/api/services \
  -H "X-API-Key: obsidian_a1b2c3d4e5f6..."
```

### In SDK

```javascript
import { createAgent } from '@obsidian/agent';

createAgent({
  obsidianUrl: 'http://localhost:5000',
  apiKey: 'obsidian_a1b2c3d4e5f6...'
});
```

---

## 🎨 Frontend Integration

### Login Flow

```javascript
import { api } from './lib/api';
import { useNavigate } from 'react-router-dom';

const handleLogin = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  
  // Store token
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  // Redirect based on role
  if (response.data.user.role === 'admin') {
    navigate('/admin');
  } else {
    navigate('/dashboard');
  }
};
```

### Protected API Calls

```javascript
// api.js automatically adds token to requests
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api };
```

### Check User Role

```javascript
const user = JSON.parse(localStorage.getItem('user'));

if (user.role === 'admin') {
  // Show admin features
}

if (user.permissions.canRunChaos) {
  // Show chaos engineering tab
}
```

---

## 🔒 Security Best Practices

### 1. Change JWT Secret

In production, set a strong JWT secret:

```bash
# .env
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=24h
```

### 2. Use HTTPS

Always use HTTPS in production to protect tokens in transit.

### 3. Token Expiration

Tokens expire after 24 hours by default. Users need to login again.

### 4. Logout

```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate('/login');
};
```

### 5. Refresh Tokens (Future Enhancement)

Consider implementing refresh tokens for better security:
- Short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days)
- Automatic token refresh

---

## 🧪 Testing

### Create Test Users

```javascript
// Admin user
{
  email: "admin@obsidian.dev",
  password: "admin123",
  name: "Admin User",
  role: "admin"
}

// Regular user
{
  email: "user@obsidian.dev",
  password: "user123",
  name: "Regular User",
  role: "user"
}
```

### Test Authorization

```bash
# Should succeed (admin)
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer <admin-token>"

# Should fail (user)
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer <user-token>"
```

---

## 📊 User Model

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  role: 'admin' | 'user',
  organization: String,
  services: [String],  // Service names user can access
  isActive: Boolean,
  lastLogin: Date,
  apiKey: String (unique),
  permissions: {
    canCreateServices: Boolean,
    canDeleteServices: Boolean,
    canManageUsers: Boolean,
    canViewMetrics: Boolean,
    canConfigureAlerts: Boolean,
    canRunChaos: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Summary

- **JWT tokens** for web authentication
- **API keys** for SDK and external integrations
- **Role-based** access (admin/user)
- **Permission-based** fine-grained control
- **Service-level** access control
- **bcrypt** password hashing
- **24-hour** token expiration
- **Beautiful** login/register UI

Ready to secure your microservices! 🚀

