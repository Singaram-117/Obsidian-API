import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../lib/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function Services() {
  const queryClient = useQueryClient();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showGithubInfo, setShowGithubInfo] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await servicesApi.getAll();
      return response.data || [];
    },
    refetchInterval: 5000,
  });

  const registerMutation = useMutation({
    mutationFn: servicesApi.register,
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
      setShowRegisterModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
    },
  });

  const handleRegister = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      url: formData.get('url'),
      description: formData.get('description'),
      githubUrl: formData.get('githubUrl') || undefined,
      healthCheck: {
        endpoint: formData.get('healthEndpoint') || `${formData.get('url')}/health`,
        interval: parseInt(formData.get('interval')) || 30000,
      },
    };
    registerMutation.mutate(data);
  };

  const viewServiceDetails = (service) => {
    setSelectedService(service);
    setShowGithubInfo(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-1">
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                🎯 Service Registry
              </h1>
              <p className="text-gray-400">
                Manage and monitor your microservices with global URL support and GitHub integration
              </p>
            </div>
            <Button
              onClick={() => setShowRegisterModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 neon-border"
            >
              ➕ Register Service
            </Button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin-slow text-6xl">⚙️</div>
        </div>
      ) : services.length === 0 ? (
        <Card className="glass-dark text-center py-16">
          <div className="text-6xl mb-4 animate-float">🌐</div>
          <h3 className="text-2xl font-bold mb-2">No Services Yet</h3>
          <p className="text-gray-400 mb-6">
            Register your first microservice to start monitoring
          </p>
          <Button
            onClick={() => setShowRegisterModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600"
          >
            Register First Service
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service, idx) => (
            <Card
              key={service.name}
              className={`glass-dark card-hover relative overflow-hidden ${
                service.status === 'healthy' ? 'neon-border-green' : 
                service.status === 'degraded' ? 'border-yellow-500/50' : 
                'neon-border-red'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Background Gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
                service.status === 'healthy' ? 'bg-green-500' :
                service.status === 'degraded' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Avatar with GitHub integration */}
                    {service.github?.repository?.owner?.avatar ? (
                      <img
                        src={service.github.repository.owner.avatar}
                        alt={service.name}
                        className="w-14 h-14 rounded-lg border-2 border-blue-500/50"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                        {service.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-bold text-xl text-white">{service.name}</h3>
                      {service.github?.repository?.language && (
                        <Badge variant="secondary" className="mt-1">
                          {service.github.repository.language}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={
                      service.status === 'healthy' ? 'success' :
                      service.status === 'degraded' ? 'warning' : 'danger'
                    }
                    className="animate-pulse"
                  >
                    {service.status}
                  </Badge>
                </div>

                {/* Description */}
                {(service.description || service.github?.repository?.description) && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {service.description || service.github.repository.description}
                  </p>
                )}

                {/* URL */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Service URL</p>
                  <code className="text-sm text-blue-400 bg-gray-800/50 px-2 py-1 rounded">
                    {service.url}
                  </code>
                </div>

                {/* GitHub Stats */}
                {service.github?.repository && (
                  <div className="flex items-center space-x-4 mb-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <span>⭐</span>
                      <span className="text-gray-400">{service.github.repository.stars}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>🍴</span>
                      <span className="text-gray-400">{service.github.repository.forks}</span>
                    </div>
                    {service.github.repository.topics?.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span>🏷️</span>
                        <span className="text-gray-400">{service.github.repository.topics.length} topics</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Requests</p>
                    <p className="text-lg font-bold text-white">
                      {service.metrics?.totalRequests || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Success</p>
                    <p className="text-lg font-bold text-green-400">
                      {service.metrics?.totalRequests > 0
                        ? Math.round((service.metrics.successfulRequests / service.metrics.totalRequests) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Latency</p>
                    <p className="text-lg font-bold text-blue-400">
                      {service.metrics?.averageResponseTime?.toFixed(0) || 0}ms
                    </p>
                  </div>
                </div>

                {/* Circuit Breaker Status */}
                {service.circuitStatus && (
                  <div className={`mb-4 p-2 rounded-lg text-center ${
                    service.circuitStatus === 'closed' ? 'bg-green-500/20 text-green-300' :
                    service.circuitStatus === 'half-open' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    <span className="text-sm font-semibold">
                      Circuit: {service.circuitStatus.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {service.github?.url && (
                    <Button
                      onClick={() => viewServiceDetails(service)}
                      variant="secondary"
                      className="flex-1"
                    >
                      📖 View Details
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      if (confirm(`Delete service "${service.name}"?`)) {
                        deleteMutation.mutate(service.name);
                      }
                    }}
                    variant="danger"
                    className="flex-1"
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="glass-dark max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">🚀 Register New Service</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="my-awesome-service"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service URL * (Can be global URL)
                </label>
                <input
                  type="url"
                  name="url"
                  required
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="https://my-service.example.com or http://localhost:3001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="Brief description of your service..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub Repository URL (Optional)
                </label>
                <input
                  type="url"
                  name="githubUrl"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="https://github.com/username/repo"
                />
                <p className="mt-1 text-xs text-gray-500">
                  We'll fetch README, stars, and other metadata automatically
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Health Check Endpoint
                </label>
                <input
                  type="text"
                  name="healthEndpoint"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="/health (defaults to /health)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Health Check Interval (ms)
                </label>
                <input
                  type="number"
                  name="interval"
                  defaultValue={30000}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 neon-border"
                >
                  {registerMutation.isPending ? '⏳ Registering...' : '✅ Register Service'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Service Details Modal */}
      {showGithubInfo && selectedService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="glass-dark max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">📖 Service Details</h2>
              <button
                onClick={() => setShowGithubInfo(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* GitHub Info */}
            {selectedService.github?.repository && (
              <div className="space-y-6">
                {/* Repo Header */}
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedService.github.repository.owner.avatar}
                    alt={selectedService.github.repository.owner.name}
                    className="w-20 h-20 rounded-lg border-2 border-blue-500/50"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {selectedService.github.repository.fullName}
                    </h3>
                    <p className="text-gray-300 mb-3">
                      {selectedService.github.repository.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedService.github.repository.topics?.map((topic) => (
                        <Badge key={topic} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800/30 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      ⭐ {selectedService.github.repository.stars}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Stars</p>
                  </div>
                  <div className="bg-gray-800/30 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      🍴 {selectedService.github.repository.forks}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Forks</p>
                  </div>
                  <div className="bg-gray-800/30 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {selectedService.github.repository.language}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Language</p>
                  </div>
                  <div className="bg-gray-800/30 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {selectedService.github.repository.license || 'None'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">License</p>
                  </div>
                </div>

                {/* README Preview */}
                {selectedService.github.readme && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3">📄 README Preview</h4>
                    <div className="bg-gray-800/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        {selectedService.github.readme.substring(0, 1000)}
                        {selectedService.github.readme.length > 1000 && '...'}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.open(selectedService.github.url, '_blank')}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    🔗 Open in GitHub
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowGithubInfo(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
