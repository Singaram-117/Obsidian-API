import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Trash2, Edit, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useSocket } from '../contexts/SocketContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import AnimatedCard from '../components/reactbits/AnimatedCard';

export default function Alerts() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch alert rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['alertRules'],
    queryFn: async () => {
      const response = await api.get('/alerts/rules');
      return response.data;
    },
  });

  // Fetch alert history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['alertHistory'],
    queryFn: async () => {
      const response = await api.get('/alerts/history?limit=50');
      return response.data;
    },
  });

  // Fetch alert stats
  const { data: stats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: async () => {
      const response = await api.get('/alerts/stats');
      return response.data;
    },
    refetchInterval: 10000,
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId) => {
      await api.delete(`/alerts/rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alertRules']);
    },
  });

  // Listen for real-time alerts
  useEffect(() => {
    if (!socket) return;

    socket.on('alert:triggered', (alert) => {
      queryClient.invalidateQueries(['alertHistory']);
      queryClient.invalidateQueries(['alertStats']);
      console.log('🚨 Alert:', alert.message);
    });

    return () => {
      socket.off('alert:triggered');
    };
  }, [socket, queryClient]);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getConditionTypeLabel = (type) => {
    const labels = {
      circuit_breaker_open: 'Circuit Breaker Open',
      service_down: 'Service Down',
      service_degraded: 'Service Degraded',
      error_rate_threshold: 'Error Rate',
      response_time_threshold: 'Response Time',
      consecutive_failures: 'Consecutive Failures',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-merriweather font-bold gradient-text flex items-center gap-3">
            <Bell className="w-10 h-10" />
            Alert Management
          </h1>
          <p className="mt-3 text-gray-400 font-inter text-lg">
            Configure alert rules and monitor notifications across your services
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="px-6 py-3">
          <Plus className="w-5 h-5 mr-2" />
          Create Rule
        </Button>
      </motion.div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnimatedCard delay={0}>
            <div className="p-6">
              <div className="text-sm font-inter text-gray-400 mb-2">Total Rules</div>
              <div className="text-4xl font-merriweather font-bold text-white">{stats.totalRules}</div>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.1}>
            <div className="p-6">
              <div className="text-sm font-inter text-gray-400 mb-2">Enabled Rules</div>
              <div className="text-4xl font-merriweather font-bold text-green-400">
                {stats.enabledRules}
              </div>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <div className="p-6">
              <div className="text-sm font-inter text-gray-400 mb-2">Total Alerts</div>
              <div className="text-4xl font-merriweather font-bold text-white">{stats.totalAlerts}</div>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.3}>
            <div className="p-6">
              <div className="text-sm font-inter text-gray-400 mb-2">Recent Alerts</div>
              <div className="text-4xl font-merriweather font-bold text-orange-400">
                {stats.recentAlerts?.length || 0}
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alert Rules */}
        <Card className="p-8">
          <div className="pb-6 mb-6 border-b border-gray-800">
            <h2 className="text-2xl font-merriweather font-bold text-white">Alert Rules</h2>
          </div>
          <div>
            {rulesLoading ? (
              <div className="text-center py-12 text-gray-400 font-inter">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 font-inter text-lg mb-4">No alert rules configured</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create First Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-800 rounded-xl p-5 hover:bg-gray-800/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-white font-inter text-lg">{rule.name}</h3>
                          {rule.enabled ? (
                            <Badge variant="success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-400 font-inter">
                          <div>
                            <strong className="text-gray-300">Condition:</strong>{' '}
                            {getConditionTypeLabel(rule.condition.type)}
                          </div>
                          {rule.serviceName && (
                            <div>
                              <strong className="text-gray-300">Service:</strong> {rule.serviceName}
                            </div>
                          )}
                          <div>
                            <strong className="text-gray-300">Actions:</strong>{' '}
                            {rule.actions.map((a) => a.type).join(', ')}
                          </div>
                          <div className="text-xs text-gray-500 mt-3">
                            Triggered {rule.triggerCount} times
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button className="text-blue-400 hover:text-blue-300 p-2">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300 p-2"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Alert History */}
        <Card className="p-8">
          <div className="pb-6 mb-6 border-b border-gray-800">
            <h2 className="text-2xl font-merriweather font-bold text-white">Recent Alerts</h2>
          </div>
          <div>
            {historyLoading ? (
              <div className="text-center py-12 text-gray-400 font-inter">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 font-inter text-lg">No alerts triggered yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {history.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-l-4 border border-gray-800 rounded-xl p-5"
                    style={{
                      borderLeftColor:
                        alert.severity === 'critical'
                          ? '#ef4444'
                          : alert.severity === 'warning'
                          ? '#eab308'
                          : '#3b82f6',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${getSeverityColor(
                              alert.severity
                            )}`}
                          />
                          <span className="font-semibold text-white font-inter">{alert.ruleName}</span>
                        </div>
                        <p className="text-sm text-gray-300 font-inter mb-3">{alert.message}</p>
                        <div className="text-xs text-gray-500 font-inter">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <CreateRuleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['alertRules']);
          }}
        />
      )}
    </div>
  );
}

// Simple Create Rule Modal
function CreateRuleModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    serviceName: '*',
    conditionType: 'circuit_breaker_open',
    actionType: 'log',
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data) => {
      await api.post('/alerts/rules', {
        name: data.name,
        serviceName: data.serviceName,
        condition: {
          type: data.conditionType,
          threshold: 80,
        },
        actions: [
          {
            type: data.actionType,
            config: {},
          },
        ],
        enabled: true,
      });
    },
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <Card className="w-full max-w-lg p-8">
        <h2 className="text-3xl font-merriweather font-bold text-white mb-6">Create Alert Rule</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
              Rule Name
            </label>
            <input
              type="text"
              className="w-full px-5 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-inter focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="High Error Rate Alert"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
              Service Name
            </label>
            <input
              type="text"
              className="w-full px-5 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-inter focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.serviceName}
              onChange={(e) =>
                setFormData({ ...formData, serviceName: e.target.value })
              }
              placeholder="* for all services"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
              Condition Type
            </label>
            <select
              className="w-full px-5 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-inter focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.conditionType}
              onChange={(e) =>
                setFormData({ ...formData, conditionType: e.target.value })
              }
            >
              <option value="circuit_breaker_open">Circuit Breaker Open</option>
              <option value="service_down">Service Down</option>
              <option value="error_rate_threshold">High Error Rate</option>
              <option value="response_time_threshold">Slow Response</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 font-inter">
              Action Type
            </label>
            <select
              className="w-full px-5 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-inter focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.actionType}
              onChange={(e) =>
                setFormData({ ...formData, actionType: e.target.value })
              }
            >
              <option value="log">Log</option>
              <option value="webhook">Webhook</option>
              <option value="email">Email</option>
              <option value="slack">Slack</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Button
            className="flex-1 py-3"
            onClick={() => createRuleMutation.mutate(formData)}
            disabled={!formData.name}
          >
            Create Rule
          </Button>
          <Button variant="secondary" className="flex-1 py-3" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
