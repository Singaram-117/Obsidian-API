import { cn } from '../lib/utils';

const variants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-700 text-white hover:bg-gray-600',
  outline:
    'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'default',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-500 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

