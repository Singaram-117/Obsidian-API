import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Return the full response so we can access response.data
    return response;
  },
  (error) => {
    console.error('API Error:', error.response || error);
    
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on login/register pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Services API
export const servicesApi = {
  getAll: async () => {
    const response = await api.get('/services');
    return response.data.data || response.data || [];
  },
  getOne: async (name) => {
    const response = await api.get(`/services/${name}`);
    return response.data;
  },
  register: async (data) => {
    const response = await api.post('/services', data);
    return response.data;
  },
  update: async (name, data) => {
    const response = await api.put(`/services/${name}`, data);
    return response.data;
  },
  delete: async (name) => {
    const response = await api.delete(`/services/${name}`);
    return response.data;
  },
  call: async (name, data) => {
    const response = await api.post(`/services/${name}/call`, data);
    return response.data;
  },
  getStats: async (name) => {
    const response = await api.get(`/services/${name}/stats`);
    return response.data;
  },
  openCircuit: async (name) => {
    const response = await api.post(`/services/${name}/circuit/open`);
    return response.data;
  },
  closeCircuit: async (name) => {
    const response = await api.post(`/services/${name}/circuit/close`);
    return response.data;
  },
};

// Events API
export const eventsApi = {
  getAll: async (params) => {
    const response = await api.get('/events', { params });
    return response.data;
  },
  getByService: async (serviceName, params) => {
    const response = await api.get(`/events/service/${serviceName}`, { params });
    return response.data;
  },
  getByType: async (type, params) => {
    const response = await api.get(`/events/type/${type}`, { params });
    return response.data;
  },
  getBySeverity: async (severity, params) => {
    const response = await api.get(`/events/severity/${severity}`, { params });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/events/stats');
    return response.data;
  },
};

// Metrics API
export const metricsApi = {
  getAll: async (params) => {
    const response = await api.get('/metrics', { params });
    return response.data;
  },
  record: async (data) => {
    const response = await api.post('/metrics', data);
    return response.data;
  },
  getByService: async (serviceName, params) => {
    const response = await api.get(`/metrics/service/${serviceName}`, { params });
    return response.data;
  },
  getAggregated: async (params) => {
    const response = await api.get('/metrics/aggregate', { params });
    return response.data;
  },
};

// Queue API
export const queueApi = {
  getAllStats: async () => {
    const response = await api.get('/queue/stats');
    return response.data;
  },
  getStats: async (queueName) => {
    const response = await api.get(`/queue/${queueName}/stats`);
    return response.data;
  },
  addJob: async (queueName, data) => {
    const response = await api.post(`/queue/${queueName}/job`, data);
    return response.data;
  },
  pause: async (queueName) => {
    const response = await api.post(`/queue/${queueName}/pause`);
    return response.data;
  },
  resume: async (queueName) => {
    const response = await api.post(`/queue/${queueName}/resume`);
    return response.data;
  },
  clean: async (queueName, grace) => {
    const response = await api.delete(`/queue/${queueName}/clean`, { params: { grace } });
    return response.data;
  },
};

// Health API
export const healthApi = {
  check: async () => {
    try {
      // Health endpoint is at /health, not /api/health
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
  detailed: async () => {
    try {
      const response = await axios.get(`${API_URL}/health/detailed`);
      return response.data;
    } catch (error) {
      console.error('Detailed health check failed:', error);
      throw error;
    }
  },
};

// GitHub API
export const githubApi = {
  getRepoInfo: async (url) => {
    const response = await api.get('/github/repo', { params: { url } });
    return response.data;
  },
  getReadme: async (url) => {
    const response = await api.get('/github/readme', { params: { url } });
    return response.data;
  },
  getCompleteInfo: async (url) => {
    const response = await api.get('/github/complete', { params: { url } });
    return response.data;
  },
};

// Microservice Management API
export const microserviceApi = {
  // Endpoints
  discoverEndpoints: async (serviceName) => {
    const response = await api.post(`/microservice/${serviceName}/discover-endpoints`);
    return response.data;
  },
  getEndpoints: async (serviceName) => {
    const response = await api.get(`/microservice/${serviceName}/endpoints`);
    return response.data;
  },
  
  // Rate Limiting
  updateServiceRateLimit: async (serviceName, config) => {
    const response = await api.put(`/microservice/${serviceName}/rate-limit`, config);
    return response.data;
  },
  updateEndpointRateLimit: async (serviceName, endpoint, config) => {
    const response = await api.put(`/microservice/${serviceName}/endpoint-rate-limit`, {
      endpoint,
      ...config,
    });
    return response.data;
  },
  updateClientRateLimit: async (serviceName, config) => {
    const response = await api.put(`/microservice/${serviceName}/client-rate-limit`, config);
    return response.data;
  },
  getRateLimitStatus: async (serviceName) => {
    const response = await api.get(`/microservice/${serviceName}/rate-limit-status`);
    return response.data;
  },
  resetRateLimits: async (serviceName) => {
    const response = await api.post(`/microservice/${serviceName}/rate-limit-reset`);
    return response.data;
  },
  
  // Load Balancing
  registerInstance: async (serviceName, instanceData) => {
    const response = await api.post(`/microservice/${serviceName}/instances`, instanceData);
    return response.data;
  },
  getInstances: async (serviceName) => {
    const response = await api.get(`/microservice/${serviceName}/instances`);
    return response.data;
  },
  deleteInstance: async (serviceName, instanceId) => {
    const response = await api.delete(`/microservice/${serviceName}/instances/${instanceId}`);
    return response.data;
  },
  updateInstanceStatus: async (serviceName, instanceId, action) => {
    const response = await api.put(`/microservice/${serviceName}/instances/${instanceId}/status`, {
      action,
    });
    return response.data;
  },
  updateLoadBalancing: async (serviceName, config) => {
    const response = await api.put(`/microservice/${serviceName}/load-balancing`, config);
    return response.data;
  },
  getInstanceStats: async (serviceName) => {
    const response = await api.get(`/microservice/${serviceName}/instances/stats`);
    return response.data;
  },
  
  // Caching
  updateCache: async (serviceName, config) => {
    const response = await api.put(`/microservice/${serviceName}/cache`, config);
    return response.data;
  },
  getCacheStats: async (serviceName) => {
    const response = await api.get(`/microservice/${serviceName}/cache/stats`);
    return response.data;
  },
  invalidateCache: async (serviceName, endpoint = null) => {
    const response = await api.post(`/microservice/${serviceName}/cache/invalidate`, {
      endpoint,
    });
    return response.data;
  },
  
  // Overview
  getOverview: async (serviceName) => {
    const response = await api.get(`/microservice/${serviceName}/overview`);
    return response.data;
  },
};

export default api;