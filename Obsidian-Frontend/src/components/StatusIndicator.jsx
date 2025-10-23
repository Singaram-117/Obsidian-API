import { Circle } from 'lucide-react';
import { cn, getStatusColor } from '../lib/utils';

export function StatusIndicator({ status, showLabel = true, className }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Circle
        className={cn('h-2 w-2 fill-current', getStatusColor(status))}
      />
      {showLabel && (
        <span className={cn('text-sm font-medium capitalize', getStatusColor(status))}>
          {status}
        </span>
      )}
    </div>
  );
}

