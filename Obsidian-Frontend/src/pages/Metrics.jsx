import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { servicesApi, metricsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { BarChart3, TrendingUp, Clock, Zap, Activity } from 'lucide-react';
import AnimatedCard from '../components/reactbits/AnimatedCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Metrics() {
  const [selectedService, setSelectedService] = useState('all');

  // Fetch services
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
    refetchInterval: 5000,
  });

  // Fetch aggregated metrics
  const { data: metricsData } = useQuery({
    queryKey: ['metrics-aggregate', selectedService],
    queryFn: () =>
      metricsApi.getAggregated({
        serviceName: selectedService === 'all' ? undefined : selectedService,
        interval: 'minute',
      }),
    refetchInterval: 10000,
  });

  const services = servicesData?.data || [];
  const metrics = metricsData?.data || [];

  // Calculate summary stats
  const totalRequests = services.reduce(
    (sum, s) => sum + (s.metrics?.totalRequests || 0),
    0
  );
  const totalFailures = services.reduce(
    (sum, s) => sum + (s.metrics?.failedRequests || 0),
    0
  );
  const avgResponseTime =
    services.reduce(
      (sum, s) => sum + (s.metrics?.averageResponseTime || 0),
      0
    ) / (services.length || 1);
  const successRate = totalRequests > 0 
    ? ((totalRequests - totalFailures) / totalRequests * 100).toFixed(1)
    : 100;

  // Prepare chart data
  const responseTimeData = services.map((service) => ({
    name: service.name,
    responseTime: service.metrics?.averageResponseTime || 0,
  }));

  const requestsData = services.map((service) => ({
    name: service.name,
    total: service.metrics?.totalRequests || 0,
    successful: service.metrics?.successfulRequests || 0,
    failed: service.metrics?.failedRequests || 0,
  }));

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-merriweather font-bold gradient-text flex items-center gap-3">
          <Activity className="w-10 h-10" />
          Performance Metrics
        </h1>
        <p className="mt-3 text-gray-400 font-inter text-lg">
          Monitor performance metrics and analytics across all services
        </p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <AnimatedCard delay={0}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-inter mb-2">Total Requests</p>
                <p className="text-3xl font-merriweather font-bold text-white">{totalRequests.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
        </AnimatedCard>
        
        <AnimatedCard delay={0.1}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-inter mb-2">Avg Response Time</p>
                <p className="text-3xl font-merriweather font-bold text-white">
                  {avgResponseTime.toFixed(0)}ms
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Clock className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
        </AnimatedCard>
        
        <AnimatedCard delay={0.2}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-inter mb-2">Total Failures</p>
                <p className="text-3xl font-merriweather font-bold text-white">{totalFailures.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Zap className="h-8 w-8 text-red-400" />
              </div>
            </div>
          </div>
        </AnimatedCard>
        
        <AnimatedCard delay={0.3}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-inter mb-2">Success Rate</p>
                <p className="text-3xl font-merriweather font-bold text-white">{successRate}%</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Service Filter */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-300 font-inter">
            Filter by Service:
          </label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-800/50 px-5 py-3 text-white font-inter focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all md:w-64"
          >
            <option value="all">All Services</option>
            {services.map((service) => (
              <option key={service.name} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Response Time Chart */}
        <Card className="p-8">
          <div className="pb-6 mb-6 border-b border-gray-800">
            <h2 className="text-2xl font-merriweather font-bold text-white">Average Response Time</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '12px',
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Bar dataKey="responseTime" fill="#3b82f6" name="Response Time (ms)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Requests Chart */}
        <Card className="p-8">
          <div className="pb-6 mb-6 border-b border-gray-800">
            <h2 className="text-2xl font-merriweather font-bold text-white">Request Statistics</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={requestsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '12px',
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="successful" fill="#10b981" name="Successful" radius={[8, 8, 0, 0]} />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Service Metrics Table */}
      <Card className="p-8">
        <div className="pb-6 mb-6 border-b border-gray-800">
          <h2 className="text-2xl font-merriweather font-bold text-white">Service Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 font-inter">
                  Service
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 font-inter">
                  Total
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 font-inter">
                  Success
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 font-inter">
                  Failed
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 font-inter">
                  Success Rate
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300 font-inter">
                  Avg Response
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => {
                const total = service.metrics?.totalRequests || 0;
                const successful = service.metrics?.successfulRequests || 0;
                const failed = service.metrics?.failedRequests || 0;
                const successRate = total > 0 ? (successful / total) * 100 : 0;
                const avgResponse = service.metrics?.averageResponseTime || 0;

                return (
                  <motion.tr
                    key={service.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white font-inter font-semibold">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300 font-mono">
                      {total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-green-400 font-mono font-semibold">
                      {successful.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-red-400 font-mono font-semibold">
                      {failed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300 font-mono">
                      {successRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300 font-mono">
                      {avgResponse.toFixed(0)}ms
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
