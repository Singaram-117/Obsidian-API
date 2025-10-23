import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../lib/api';
import { useSocketContext } from '../contexts/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import {
  AlertCircle,
  Info,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { formatTimestamp, getSeverityColor } from '../lib/utils';

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  critical: AlertCircle,
};

const severityVariants = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  critical: 'error',
};

export default function Events() {
  const { events: liveEvents = [] } = useSocketContext();
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    serviceName: '',
    limit: 100,
  });

  // Fetch historical events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventsApi.getAll(filters),
    refetchInterval: 10000,
  });

  // Fetch event stats
  const { data: statsData } = useQuery({
    queryKey: ['event-stats'],
    queryFn: eventsApi.getStats,
    refetchInterval: 10000,
  });

  // Combine live and historical events
  const historicalEvents = eventsData?.data || [];
  const allEvents = [...liveEvents, ...historicalEvents].slice(0, filters.limit);

  // Remove duplicates by ID
  const uniqueEvents = allEvents.filter(
    (event, index, self) =>
      index === self.findIndex((e) => e._id === event._id)
  );

  const stats = statsData?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Events</h1>
        <p className="mt-2 text-slate-400">
          View and analyze system events in real-time
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Info className="mx-auto h-8 w-8 text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats.breakdown?.find((s) => s._id.severity === 'info')?.count || 0}
              </p>
              <p className="text-sm text-slate-400">Info</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats.breakdown?.find((s) => s._id.severity === 'warning')?.count || 0}
              </p>
              <p className="text-sm text-slate-400">Warnings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats.breakdown?.find((s) => s._id.severity === 'error')?.count || 0}
              </p>
              <p className="text-sm text-slate-400">Errors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-2xl font-bold text-white">
                {stats.breakdown?.find((s) => s._id.severity === 'critical')?.count || 0}
              </p>
              <p className="text-sm text-slate-400">Critical</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) =>
                  setFilters({ ...filters, severity: e.target.value })
                }
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-obsidian-500 focus:outline-none focus:ring-1 focus:ring-obsidian-500"
              >
                <option value="">All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-obsidian-500 focus:outline-none focus:ring-1 focus:ring-obsidian-500"
              >
                <option value="">All</option>
                <option value="circuit_opened">Circuit Opened</option>
                <option value="circuit_closed">Circuit Closed</option>
                <option value="service_down">Service Down</option>
                <option value="service_up">Service Up</option>
                <option value="request_failed">Request Failed</option>
                <option value="anomaly_detected">Anomaly Detected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Service
              </label>
              <input
                type="text"
                value={filters.serviceName}
                onChange={(e) =>
                  setFilters({ ...filters, serviceName: e.target.value })
                }
                placeholder="All services"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-obsidian-500 focus:outline-none focus:ring-1 focus:ring-obsidian-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Limit
              </label>
              <select
                value={filters.limit}
                onChange={(e) =>
                  setFilters({ ...filters, limit: parseInt(e.target.value) })
                }
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-obsidian-500 focus:outline-none focus:ring-1 focus:ring-obsidian-500"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setFilters({
                  type: '',
                  severity: '',
                  serviceName: '',
                  limit: 100,
                })
              }
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Event Log ({uniqueEvents.length} events)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">
              Loading events...
            </div>
          ) : uniqueEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Info className="mx-auto h-8 w-8 mb-2" />
              <p>No events found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {uniqueEvents.map((event, index) => {
                const Icon = severityIcons[event.severity] || Info;
                return (
                  <div
                    key={event._id || index}
                    className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:bg-slate-900/50"
                  >
                    <Icon
                      className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getSeverityColor(
                        event.severity
                      )}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={severityVariants[event.severity]}>
                          {event.severity}
                        </Badge>
                        <Badge variant="default">{event.serviceName}</Badge>
                        <Badge variant="default">{event.type}</Badge>
                        <span className="text-xs text-slate-500">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{event.message}</p>
                      {event.metadata && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-slate-500 hover:text-slate-400">
                            View metadata
                          </summary>
                          <pre className="mt-2 rounded bg-slate-950 p-2 text-slate-400 overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

