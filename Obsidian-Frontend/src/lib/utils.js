import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

export function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function getStatusColor(status) {
  const colors = {
    healthy: 'text-green-500',
    degraded: 'text-yellow-500',
    down: 'text-red-500',
    unknown: 'text-gray-500',
    closed: 'text-green-500',
    open: 'text-red-500',
    'half-open': 'text-yellow-500',
  };
  return colors[status] || 'text-gray-500';
}

export function getStatusBgColor(status) {
  const colors = {
    healthy: 'bg-green-500/20 border-green-500/50',
    degraded: 'bg-yellow-500/20 border-yellow-500/50',
    down: 'bg-red-500/20 border-red-500/50',
    unknown: 'bg-gray-500/20 border-gray-500/50',
    closed: 'bg-green-500/20 border-green-500/50',
    open: 'bg-red-500/20 border-red-500/50',
    'half-open': 'bg-yellow-500/20 border-yellow-500/50',
  };
  return colors[status] || 'bg-gray-500/20 border-gray-500/50';
}

export function getSeverityColor(severity) {
  const colors = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    error: 'text-orange-500',
    critical: 'text-red-500',
  };
  return colors[severity] || 'text-gray-500';
}

export function getSeverityBgColor(severity) {
  const colors = {
    info: 'bg-blue-500/20 border-blue-500/50',
    warning: 'bg-yellow-500/20 border-yellow-500/50',
    error: 'bg-orange-500/20 border-orange-500/50',
    critical: 'bg-red-500/20 border-red-500/50',
  };
  return colors[severity] || 'bg-gray-500/20 border-gray-500/50';
}

