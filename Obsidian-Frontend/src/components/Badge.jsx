import { cn } from '../lib/utils';

const variants = {
  default: 'bg-slate-700/50 text-slate-300 border-slate-600',
  secondary: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  success: 'bg-green-500/20 text-green-400 border-green-500/50',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  danger: 'bg-red-500/20 text-red-400 border-red-500/50',
  error: 'bg-red-500/20 text-red-400 border-red-500/50',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
};

export function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;

