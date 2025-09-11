import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Pause, 
  Play,
  Loader2
} from 'lucide-react';

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'loading' | 'paused' | 'active';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'dot' | 'icon';
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    label: 'Success'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    label: 'Error'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    label: 'Warning'
  },
  info: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    label: 'Info'
  },
  pending: {
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    label: 'Pending'
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    label: 'Loading'
  },
  paused: {
    icon: Pause,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    label: 'Paused'
  },
  active: {
    icon: Play,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    label: 'Active'
  }
};

export function StatusIndicator({
  status,
  label,
  size = 'md',
  variant = 'badge',
  className
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (variant === 'dot') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "w-2 h-2 rounded-full",
          config.bgColor
        )} />
        <span className={cn(
          sizeClasses[size],
          config.color
        )}>
          {displayLabel}
        </span>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <Icon className={cn(
        iconSizes[size],
        config.color,
        status === 'loading' && 'animate-spin',
        className
      )} />
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1",
        config.color,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(
        iconSizes[size],
        status === 'loading' && 'animate-spin'
      )} />
      {displayLabel}
    </Badge>
  );
}
