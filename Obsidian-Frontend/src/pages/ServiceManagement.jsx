import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi, api } from '../lib/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import MagneticButton from '../components/reactbits/MagneticButton';
import AnimatedCard from '../components/reactbits/AnimatedCard';
import ElectricBorder from '../components/reactbits/ElectricBorder';
import { useSocketContext } from '../contexts/SocketContext';

export default function ServiceManagement() {
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState('endpoints'); // endpoints, rateLimit, loadBalancing, cache
  const queryClient = useQueryClient();
  const { serviceStatuses } = useSocketContext();

  console.log("Service Statuses:", serviceStatuses);

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const data = await servicesApi.getAll();
        return data?.data || data || [];
      } catch (error) {
        console.error('Failed to fetch services:', error);
        return [];
      }
    },
  });

  // Fetch service overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['service-overview', selectedService],
    queryFn: async () => {
      try {
        const response = await api.get(`/microservice/${selectedService}/overview`);
        return response.data?.data || response.data;
      } catch (error) {
        console.error('Failed to fetch overview:', error);
        return null;
      }
    },
    enabled: !!selectedService,
  });

  // Select first service by default
  useEffect(() => {
    if (services && Array.isArray(services) && services.length > 0 && !selectedService) {
      setSelectedService(services[0].name);
    }
  }, [services, selectedService]);

  // Get service status with fallback
  const getServiceStatus = (service) => {
    // Priority: Socket status > Service status > 'down'
    return serviceStatuses[service.name] || service.status || 'down';
  };

  // Ensure services is always an array
  const servicesList = Array.isArray(services) ? services : [];

  if (servicesList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-2xl font-bold mb-4 gradient-text">No Services Found</h2>
          <p className="text-slate-400 mb-6">
            Register a microservice first to manage its configuration.
          </p>
          <Button onClick={() => (window.location.href = '/app/services')}>
            Go to Services
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-3">
          Microservice Management
        </h1>
        <p className="text-slate-400 text-lg">
          Control endpoints, rate limits, load balancing, and caching
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Service Selector */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 gradient-text">Services</h2>
            <div className="space-y-2">
              {servicesList.map((service) => (
                <motion.button
                  key={service.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedService(service.name)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedService === service.name
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500'
                      : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{service.name}</span>
                    <StatusBadge status={getServiceStatus(service)} />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{service.url}</p>
                </motion.button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {overviewLoading ? (
            <Card className="p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading service details...</p>
            </Card>
          ) : overview ? (
            <>
              {/* Service Header */}
              <Card className="p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{overview.service.name}</h2>
                    <p className="text-slate-400">{overview.service.url}</p>
                  </div>
                  <div className="flex gap-3">
                    <StatusBadge status={overview.service.status} />
                    <Badge variant={overview.service.circuitStatus === 'closed' ? 'success' : 'danger'}>
                      Circuit: {overview.service.circuitStatus}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: 'endpoints', label: '📡 Endpoints', icon: '📡' },
                  { id: 'rateLimit', label: '⏱️ Rate Limiting', icon: '⏱️' },
                  { id: 'loadBalancing', label: '⚖️ Load Balancing', icon: '⚖️' },
                  { id: 'cache', label: '💾 Caching', icon: '💾' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'endpoints' && (
                  <EndpointsTab
                    key="endpoints"
                    serviceName={selectedService}
                    overview={overview}
                  />
                )}
                {activeTab === 'rateLimit' && (
                  <RateLimitTab
                    key="rateLimit"
                    serviceName={selectedService}
                    overview={overview}
                  />
                )}
                {activeTab === 'loadBalancing' && (
                  <LoadBalancingTab
                    key="loadBalancing"
                    serviceName={selectedService}
                    overview={overview}
                  />
                )}
                {activeTab === 'cache' && (
                  <CacheTab
                    key="cache"
                    serviceName={selectedService}
                    overview={overview}
                  />
                )}
              </AnimatePresence>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ENDPOINTS TAB
// ============================================
function EndpointsTab({ serviceName, overview }) {
  const queryClient = useQueryClient();

  const discoverMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/microservice/${serviceName}/discover-endpoints`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  const endpoints = overview.endpoints || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <ElectricBorder color="#3b82f6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-2">Discovered Endpoints</h3>
              <p className="text-slate-400">
                {endpoints.length} endpoints found
                {overview.endpointsDiscoveredAt && (
                  <span className="ml-2 text-xs">
                    • Last discovered: {new Date(overview.endpointsDiscoveredAt).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
            <MagneticButton
              onClick={() => discoverMutation.mutate()}
              disabled={discoverMutation.isPending}
            >
              {discoverMutation.isPending ? '🔍 Discovering...' : '🔍 Discover'}
            </MagneticButton>
          </div>

          {endpoints.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📡</div>
              <p className="text-slate-400 mb-4">No endpoints discovered yet</p>
              <Button onClick={() => discoverMutation.mutate()}>Discover Endpoints</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {endpoints.map((endpoint, index) => (
                <AnimatedCard key={index} delay={index * 0.05}>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary">{endpoint.method}</Badge>
                          <code className="text-blue-400 font-mono">{endpoint.path}</code>
                        </div>
                        {endpoint.summary && (
                          <p className="text-sm text-slate-400">{endpoint.summary}</p>
                        )}
                        {endpoint.tags && endpoint.tags.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {endpoint.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </Card>
      </ElectricBorder>
    </motion.div>
  );
}

// ============================================
// RATE LIMIT TAB
// ============================================
function RateLimitTab({ serviceName, overview }) {
  const queryClient = useQueryClient();
  const [serviceLimit, setServiceLimit] = useState({
    enabled: false,
    requestsPerMinute: 100,
  });
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [endpointLimit, setEndpointLimit] = useState({
    enabled: false,
    requestsPerMinute: 50,
  });

  useEffect(() => {
    if (overview?.rateLimit?.service) {
      setServiceLimit({
        enabled: overview.rateLimit.service.enabled,
        requestsPerMinute: overview.rateLimit.service.limit,
      });
    }
  }, [overview]);

  const updateServiceLimitMutation = useMutation({
    mutationFn: async (config) => {
      const response = await api.put(`/microservice/${serviceName}/rate-limit`, config);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  const updateEndpointLimitMutation = useMutation({
    mutationFn: async ({ endpoint, config }) => {
      const response = await api.put(`/microservice/${serviceName}/endpoint-rate-limit`, {
        endpoint,
        ...config,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  const resetLimitsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/microservice/${serviceName}/rate-limit-reset`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Service-Level Rate Limit */}
      <ElectricBorder color="#10b981">
        <Card className="p-6">
          <h3 className="text-2xl font-bold gradient-text mb-4">Service-Level Rate Limit</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
              <span className="font-semibold">Enable Rate Limiting</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceLimit.enabled}
                  onChange={(e) => setServiceLimit({ ...serviceLimit, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Requests Per Minute</label>
              <input
                type="number"
                value={serviceLimit.requestsPerMinute}
                onChange={(e) =>
                  setServiceLimit({ ...serviceLimit, requestsPerMinute: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {overview?.rateLimit?.service && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="text-sm text-blue-400">
                  <strong>Current Usage:</strong> {overview.rateLimit.service.current} /{' '}
                  {overview.rateLimit.service.limit} requests
                  {overview.rateLimit.service.resetAt && (
                    <span className="ml-2">
                      • Resets in{' '}
                      {Math.ceil((new Date(overview.rateLimit.service.resetAt) - Date.now()) / 1000)}s
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => updateServiceLimitMutation.mutate(serviceLimit)}
                disabled={updateServiceLimitMutation.isPending}
              >
                {updateServiceLimitMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                variant="danger"
                onClick={() => resetLimitsMutation.mutate()}
                disabled={resetLimitsMutation.isPending}
              >
                Reset Counters
              </Button>
            </div>
          </div>
        </Card>
      </ElectricBorder>

      {/* Endpoint-Level Rate Limit */}
      {overview?.endpoints && overview.endpoints.length > 0 && (
        <ElectricBorder color="#f59e0b">
          <Card className="p-6">
            <h3 className="text-2xl font-bold gradient-text mb-4">Endpoint-Level Rate Limit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Endpoint</label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Select an endpoint --</option>
                  {overview.endpoints.map((endpoint, index) => (
                    <option key={index} value={endpoint.path}>
                      {endpoint.method} {endpoint.path}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEndpoint && (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <span className="font-semibold">Enable for this endpoint</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={endpointLimit.enabled}
                        onChange={(e) =>
                          setEndpointLimit({ ...endpointLimit, enabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Requests Per Minute</label>
                    <input
                      type="number"
                      value={endpointLimit.requestsPerMinute}
                      onChange={(e) =>
                        setEndpointLimit({
                          ...endpointLimit,
                          requestsPerMinute: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <Button
                    onClick={() =>
                      updateEndpointLimitMutation.mutate({
                        endpoint: selectedEndpoint,
                        config: endpointLimit,
                      })
                    }
                    disabled={updateEndpointLimitMutation.isPending}
                  >
                    {updateEndpointLimitMutation.isPending ? 'Saving...' : 'Save Endpoint Limit'}
                  </Button>
                </>
              )}
            </div>
          </Card>
        </ElectricBorder>
      )}
    </motion.div>
  );
}

// ============================================
// LOAD BALANCING TAB
// ============================================
function LoadBalancingTab({ serviceName, overview }) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    enabled: false,
    strategy: 'round-robin',
    stickySession: false,
  });
  const [newInstance, setNewInstance] = useState({
    url: '',
    weight: 1,
    trafficPercentage: 100,
    isCanary: false,
  });
  const [showAddInstance, setShowAddInstance] = useState(false);

  useEffect(() => {
    if (overview?.loadBalancing?.config) {
      setConfig(overview.loadBalancing.config);
    }
  }, [overview]);

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig) => {
      const response = await api.put(`/microservice/${serviceName}/load-balancing`, newConfig);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  const addInstanceMutation = useMutation({
    mutationFn: async (instanceData) => {
      const response = await api.post(`/microservice/${serviceName}/instances`, instanceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
      setNewInstance({ url: '', weight: 1, trafficPercentage: 100, isCanary: false });
      setShowAddInstance(false);
    },
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (instanceId) => {
      const response = await api.delete(`/microservice/${serviceName}/instances/${instanceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  const updateInstanceStatusMutation = useMutation({
    mutationFn: async ({ instanceId, action }) => {
      const response = await api.put(
        `/microservice/${serviceName}/instances/${instanceId}/status`,
        { action }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  const instances = overview?.loadBalancing?.instances || [];
  const stats = overview?.loadBalancing?.stats || {};

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Load Balancing Configuration */}
      <ElectricBorder color="#8b5cf6">
        <Card className="p-6">
          <h3 className="text-2xl font-bold gradient-text mb-4">Load Balancing Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
              <span className="font-semibold">Enable Load Balancing</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Load Balancing Strategy</label>
              <select
                value={config.strategy}
                onChange={(e) => setConfig({ ...config, strategy: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="round-robin">Round Robin</option>
                <option value="least-connections">Least Connections</option>
                <option value="weighted-round-robin">Weighted Round Robin</option>
                <option value="weighted-response-time">Weighted Response Time</option>
                <option value="random">Random</option>
                <option value="ip-hash">IP Hash (Sticky Sessions)</option>
              </select>
            </div>

            <Button
              onClick={() => updateConfigMutation.mutate(config)}
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </Card>
      </ElectricBorder>

      {/* Instance Statistics */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.healthy || 0}</div>
            <div className="text-sm text-slate-400">Healthy</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-400">{stats.unhealthy || 0}</div>
            <div className="text-sm text-slate-400">Unhealthy</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.totalConnections || 0}</div>
            <div className="text-sm text-slate-400">Active Connections</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.avgResponseTime?.toFixed(0) || 0}ms</div>
            <div className="text-sm text-slate-400">Avg Response Time</div>
          </Card>
        </div>
      )}

      {/* Service Instances */}
      <ElectricBorder color="#ec4899">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold gradient-text">Service Instances</h3>
            <Button onClick={() => setShowAddInstance(!showAddInstance)}>
              {showAddInstance ? 'Cancel' : '+ Add Instance'}
            </Button>
          </div>

          {/* Add Instance Form */}
          {showAddInstance && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Instance URL</label>
                  <input
                    type="url"
                    value={newInstance.url}
                    onChange={(e) => setNewInstance({ ...newInstance, url: e.target.value })}
                    placeholder="http://localhost:3001"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Weight</label>
                    <input
                      type="number"
                      value={newInstance.weight}
                      onChange={(e) => setNewInstance({ ...newInstance, weight: parseInt(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Traffic %</label>
                    <input
                      type="number"
                      value={newInstance.trafficPercentage}
                      onChange={(e) =>
                        setNewInstance({ ...newInstance, trafficPercentage: parseInt(e.target.value) })
                      }
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newInstance.isCanary}
                    onChange={(e) => setNewInstance({ ...newInstance, isCanary: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm">Canary Deployment</label>
                </div>

                <Button
                  onClick={() => addInstanceMutation.mutate(newInstance)}
                  disabled={addInstanceMutation.isPending || !newInstance.url}
                >
                  {addInstanceMutation.isPending ? 'Adding...' : 'Add Instance'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Instance List */}
          {instances.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚖️</div>
              <p className="text-slate-400 mb-4">No instances registered</p>
              <p className="text-sm text-slate-500">Add multiple instances to enable load balancing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <AnimatedCard key={instance.instanceId}>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-blue-400 font-mono">{instance.url}</code>
                          <Badge variant={getStatusVariant(instance.status)}>
                            {instance.status}
                          </Badge>
                          {instance.isCanary && <Badge variant="warning">Canary</Badge>}
                        </div>
                        <div className="flex gap-4 text-sm text-slate-400">
                          <span>Weight: {instance.weight}</span>
                          <span>Connections: {instance.metrics?.activeConnections || 0}</span>
                          <span>Traffic: {instance.trafficPercentage}%</span>
                          <span>Avg Response: {instance.metrics?.avgResponseTime?.toFixed(0) || 0}ms</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {instance.status === 'healthy' && (
                          <button
                            onClick={() =>
                              updateInstanceStatusMutation.mutate({
                                instanceId: instance.instanceId,
                                action: 'drain',
                              })
                            }
                            className="px-3 py-1 text-sm bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30"
                          >
                            Drain
                          </button>
                        )}
                        {instance.status === 'disabled' && (
                          <button
                            onClick={() =>
                              updateInstanceStatusMutation.mutate({
                                instanceId: instance.instanceId,
                                action: 'enable',
                              })
                            }
                            className="px-3 py-1 text-sm bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30"
                          >
                            Enable
                          </button>
                        )}
                        <button
                          onClick={() => deleteInstanceMutation.mutate(instance.instanceId)}
                          className="px-3 py-1 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </Card>
      </ElectricBorder>
    </motion.div>
  );
}

// ============================================
// CACHE TAB
// ============================================
function CacheTab({ serviceName, overview }) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    enabled: false,
    ttl: 60000,
  });

  useEffect(() => {
    if (overview?.cache?.config) {
      setConfig({
        enabled: overview.cache.config.enabled,
        ttl: overview.cache.config.ttl,
      });
    }
  }, [overview]);

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig) => {
      const response = await api.put(`/microservice/${serviceName}/cache`, newConfig);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  const invalidateCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/microservice/${serviceName}/cache/invalidate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-overview', serviceName]);
    },
  });

  const cacheStats = overview?.cache?.stats || {};

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Cache Configuration */}
      <ElectricBorder color="#06b6d4">
        <Card className="p-6">
          <h3 className="text-2xl font-bold gradient-text mb-4">Cache Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
              <span className="font-semibold">Enable Response Caching</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">TTL (milliseconds)</label>
              <input
                type="number"
                value={config.ttl}
                onChange={(e) => setConfig({ ...config, ttl: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                {(config.ttl / 1000).toFixed(0)} seconds
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => updateConfigMutation.mutate(config)}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                variant="danger"
                onClick={() => invalidateCacheMutation.mutate()}
                disabled={invalidateCacheMutation.isPending}
              >
                Invalidate Cache
              </Button>
            </div>
          </div>
        </Card>
      </ElectricBorder>

      {/* Cache Statistics */}
      {cacheStats.totalEntries > 0 && (
        <ElectricBorder color="#14b8a6">
          <Card className="p-6">
            <h3 className="text-2xl font-bold gradient-text mb-4">Cache Statistics</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="text-sm text-slate-400 mb-1">Total Cached Entries</div>
                <div className="text-3xl font-bold text-cyan-400">{cacheStats.totalEntries}</div>
              </div>

              {cacheStats.entries && cacheStats.entries.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-3">Cached Endpoints</h4>
                  <div className="space-y-2">
                    {cacheStats.entries.map((entry, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-800/30 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <code className="text-sm text-blue-400">
                              {entry.method} {entry.endpoint}
                            </code>
                            <div className="text-xs text-slate-500 mt-1">
                              Hits: {entry.hits} • Age: {Math.floor(entry.age / 1000)}s • TTL:{' '}
                              {Math.ceil(entry.ttl / 1000)}s
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </ElectricBorder>
      )}
    </motion.div>
  );
}

// Helper Components
function StatusBadge({ status }) {
  const variant =
    status === 'healthy'
      ? 'success'
      : status === 'degraded'
      ? 'warning'
      : status === 'down'
      ? 'danger'
      : 'default';

  return <Badge variant={variant}>{status}</Badge>;
}

function getStatusVariant(status) {
  return status === 'healthy'
    ? 'success'
    : status === 'unhealthy'
    ? 'danger'
    : status === 'draining'
    ? 'warning'
    : 'default';
}