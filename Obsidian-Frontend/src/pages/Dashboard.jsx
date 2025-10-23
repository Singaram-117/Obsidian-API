import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { servicesApi, eventsApi } from '../lib/api';
import StatCard from '../components/StatCard';
import EventFeed from '../components/EventFeed';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Dashboard() {
  const [realtimeStats, setRealtimeStats] = useState({
    totalServices: 0,
    healthyServices: 0,
    activeCircuits: 0,
    totalEvents: 0,
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const response = await servicesApi.getAll();
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch services:', error);
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const services = servicesData || [];

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['recent-events'],
    queryFn: async () => {
      try {
        const response = await eventsApi.getAll({ limit: 10 });
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch events:', error);
        return [];
      }
    },
    refetchInterval: 3000,
  });

  const recentEvents = eventsData || [];

  useEffect(() => {
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const openCircuits = services.filter(s => s.circuitStatus === 'open').length;

    setRealtimeStats({
      totalServices: services.length,
      healthyServices: healthyCount,
      activeCircuits: openCircuits,
      totalEvents: recentEvents.length,
    });
  }, [services, recentEvents]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1 animate-gradient">
        <div className="bg-gray-900 rounded-xl p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid opacity-20"></div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-merriweather font-bold mb-2 gradient-text">
                🌑 Obsidian MROP
              </h1>
              <p className="text-gray-300 text-lg font-inter">
                Microservice Resilience & Observability Platform
              </p>
              <p className="text-gray-400 mt-2 font-inter">
                Monitor, protect, and optimize your distributed systems in real-time
              </p>
            </div>
            
            {/* Animated Icon */}
            <div className="hidden md:block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
                <span className="text-6xl animate-float">🛡️</span>
              </div>
            </div>
          </div>

          {/* Live Status Indicator */}
          <div className="mt-6 flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300 font-inter">System Online - All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Services"
          value={realtimeStats.totalServices}
          icon="🎯"
          trend="+12%"
          loading={servicesLoading}
          className="glass-dark border-blue-500/20 card-hover"
        />
        <StatCard
          title="Healthy Services"
          value={realtimeStats.healthyServices}
          icon="✅"
          trend="+5%"
          loading={servicesLoading}
          className="glass-dark border-green-500/20 card-hover neon-border-green"
        />
        <StatCard
          title="Circuit Breakers"
          value={realtimeStats.activeCircuits}
          icon="⚡"
          subtitle="Open Circuits"
          loading={servicesLoading}
          className={`glass-dark card-hover ${
            realtimeStats.activeCircuits > 0 ? 'neon-border-red border-red-500/20' : 'border-gray-500/20'
          }`}
        />
        <StatCard
          title="Recent Events"
          value={realtimeStats.totalEvents}
          icon="📊"
          subtitle="Last 10 events"
          loading={eventsLoading}
          className="glass-dark border-purple-500/20 card-hover"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Overview */}
        <div className="lg:col-span-2">
          <Card className="glass-dark h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-merriweather font-bold gradient-text-green">
                🚀 Active Services
              </h2>
              <span className="px-4 py-2 bg-blue-500/20 rounded-full text-sm font-semibold text-blue-300 font-inter">
                {services.length} Running
              </span>
            </div>

            {servicesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin-slow text-6xl">⚙️</div>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-float">🔍</div>
                <p className="text-gray-400 text-lg font-inter">No services registered yet</p>
                <p className="text-gray-500 mt-2 font-inter">Start monitoring your microservices!</p>
                <Button
                  onClick={() => window.location.href = '/app/services'}
                  className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  Register First Service
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service, idx) => (
                  <div
                    key={service.name}
                    className={`p-4 rounded-lg glass transition-all duration-300 card-hover ${
                      service.status === 'healthy'
                        ? 'border-l-4 border-green-500'
                        : service.status === 'degraded'
                        ? 'border-l-4 border-yellow-500'
                        : 'border-l-4 border-red-500'
                    }`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Service Icon */}
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                          {service.github?.repository?.owner?.avatar ? (
                            <img src={service.github.repository.owner.avatar} alt="" className="w-full h-full rounded-lg" />
                          ) : (
                            service.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-merriweather font-semibold text-lg text-white">{service.name}</h3>
                          <p className="text-sm text-gray-400 font-inter">{service.url}</p>
                          {service.github?.repository && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">⭐ {service.github.repository.stars}</span>
                              <span className="text-xs text-gray-500">🍴 {service.github.repository.forks}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Status */}
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold font-inter ${
                          service.status === 'healthy'
                            ? 'bg-green-500/20 text-green-300'
                            : service.status === 'degraded'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {service.status}
                        </div>

                        {/* Circuit Status */}
                        {service.circuitStatus === 'open' && (
                          <div className="px-3 py-1 bg-red-500/20 rounded-full text-xs font-semibold text-red-300 font-inter">
                            🔴 Circuit Open
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="mt-3 grid grid-cols-3 gap-4 pt-3 border-t border-gray-700/50">
                      <div>
                        <p className="text-xs text-gray-500 font-inter">Requests</p>
                        <p className="text-sm font-semibold text-white font-inter">{service.metrics?.totalRequests || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-inter">Success Rate</p>
                        <p className="text-sm font-semibold text-green-400 font-inter">
                          {service.metrics?.totalRequests > 0
                            ? Math.round((service.metrics.successfulRequests / service.metrics.totalRequests) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-inter">Avg Response</p>
                        <p className="text-sm font-semibold text-blue-400 font-inter">
                          {service.metrics?.averageResponseTime?.toFixed(0) || 0}ms
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Event Feed */}
        <div className="lg:col-span-1">
          <Card className="glass-dark h-full">
            <h2 className="text-2xl font-merriweather font-bold mb-6 gradient-text-red">
              📡 Live Events
            </h2>
            <EventFeed events={recentEvents} loading={eventsLoading} />
          </Card>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-dark border-blue-500/20 card-hover">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-float">🛡️</div>
            <h3 className="text-xl font-merriweather font-bold mb-2 text-white">Circuit Breakers</h3>
            <p className="text-gray-400 text-sm font-inter">
              Automatic fault isolation prevents cascading failures across your services
            </p>
          </div>
        </Card>

        <Card className="glass-dark border-purple-500/20 card-hover">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-float" style={{ animationDelay: '0.5s' }}>📊</div>
            <h3 className="text-xl font-merriweather font-bold mb-2 text-white">Real-time Monitoring</h3>
            <p className="text-gray-400 text-sm font-inter">
              Track metrics, logs, and events with live updates and intelligent alerts
            </p>
          </div>
        </Card>

        <Card className="glass-dark border-green-500/20 card-hover">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-float" style={{ animationDelay: '1s' }}>🔧</div>
            <h3 className="text-xl font-merriweather font-bold mb-2 text-white">Chaos Engineering</h3>
            <p className="text-gray-400 text-sm font-inter">
              Test resilience with built-in failure simulation and recovery testing
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
