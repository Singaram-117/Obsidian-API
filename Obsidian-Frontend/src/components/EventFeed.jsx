import Badge from './Badge';

export default function EventFeed({ events = [], loading = false }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin-slow text-4xl">⚙️</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2 animate-float">📡</div>
        <p className="text-gray-500 text-sm">No events yet</p>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-500/20 text-blue-300';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'error':
        return 'bg-red-500/20 text-red-300';
      case 'critical':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'critical':
        return '🚨';
      default:
        return '📌';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {events.slice(0, 10).map((event, index) => (
        <div
          key={event._id || index}
          className="glass p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="text-xl">
              {getSeverityIcon(event.severity)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                  {event.severity || 'info'}
                </span>
                
                {event.serviceName && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300">
                    {event.serviceName}
                  </span>
                )}
                
                <span className="text-xs text-gray-500 ml-auto">
                  {formatTime(event.timestamp)}
                </span>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-300 mb-1">
                {event.message || event.type || 'Event occurred'}
              </p>

              {/* Type */}
              {event.type && event.message && (
                <p className="text-xs text-gray-500">
                  Type: {event.type}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
