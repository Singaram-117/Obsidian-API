import Card from './Card';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className = '',
  loading = false 
}) {
  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      {/* Value */}
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-20"></div>
        </div>
      ) : (
        <div className="text-3xl font-bold text-white mb-2">
          {value ?? '0'}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
      )}

      {/* Trend */}
      {trend && (
        <div className="text-sm font-semibold text-green-400">
          ↗ {trend}
        </div>
      )}
    </Card>
  );
}
