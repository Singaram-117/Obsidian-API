import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Activity, Shield, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import StatCard from '../components/StatCard';

/**
 * Admin Dashboard
 * Manage users, services, and view platform statistics
 */
export default function AdminDashboard() {
  const queryClient = useQueryClient();

  // Fetch admin dashboard data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch users
  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch services
  const { data: servicesData } = useQuery({
    queryKey: ['adminServices'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/services', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Toggle user active status
  const toggleUserMutation = useMutation({
    mutationFn: async (userId) => {
      const token = localStorage.getItem('token');
      await api.post(`/admin/users/${userId}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['adminDashboard']);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-600">Manage Obsidian MROP platform</p>
      </div>

      {/* Statistics */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={dashboard.stats.users.total}
            subtitle={`${dashboard.stats.users.active} active`}
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Total Services"
            value={dashboard.stats.services.total}
            subtitle={`${dashboard.stats.services.healthy} healthy`}
            icon={Activity}
            trend="neutral"
          />
          <StatCard
            title="Total Events"
            value={dashboard.stats.events.total}
            subtitle="All time"
            icon={Activity}
          />
          <StatCard
            title="Total Metrics"
            value={dashboard.stats.metrics.total}
            subtitle="Collected"
            icon={Activity}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Management */}
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({usersData?.total || 0})
            </h2>
          </div>
          <div className="p-6">
            {usersData && usersData.users.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {usersData.users.map((user) => (
                  <div
                    key={user._id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          <Badge
                            variant={
                              user.role === 'admin' ? 'error' : 'info'
                            }
                          >
                            {user.role}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.organization && (
                          <p className="text-xs text-gray-500 mt-1">
                            {user.organization}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Services: {user.services.length}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleUserMutation.mutate(user._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteUserMutation.mutate(user._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users yet
              </div>
            )}
          </div>
        </Card>

        {/* Services Overview */}
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Services ({servicesData?.total || 0})
            </h2>
          </div>
          <div className="p-6">
            {servicesData && servicesData.services.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {servicesData.services.map((service) => (
                  <div
                    key={service._id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{service.name}</h3>
                          <Badge
                            variant={
                              service.status === 'healthy'
                                ? 'success'
                                : service.status === 'degraded'
                                ? 'warning'
                                : 'error'
                            }
                          >
                            {service.status}
                          </Badge>
                          {service.circuitBreaker?.state === 'open' && (
                            <Badge variant="error">Circuit Open</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {service.url || 'No URL configured'}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          <div>
                            Requests: {service.metrics.totalRequests || 0}
                          </div>
                          <div>
                            Avg Response:{' '}
                            {service.metrics.averageResponseTime?.toFixed(0) || 0}ms
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No services registered
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Events */}
      {dashboard && dashboard.recentEvents && (
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Events</h2>
          </div>
          <div className="p-6">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboard.recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <span className="font-semibold text-sm">{event.type}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {event.serviceName}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

