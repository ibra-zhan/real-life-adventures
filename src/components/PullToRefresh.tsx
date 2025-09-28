import React from 'react';
import { usePullToRefresh } from '@/hooks/useMobile';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className,
  disabled = false
}: PullToRefreshProps) {
  const {
    isRefreshing,
    isPulling,
    pullDistance,
    refreshProgress,
    shouldShowRefreshIndicator
  } = usePullToRefresh(disabled ? async () => {} : onRefresh, threshold);

  const indicatorStyle = {
    transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
    transition: isPulling ? 'none' : 'transform 0.3s ease-out'
  };

  const iconRotation = refreshProgress * 360;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Pull to refresh indicator */}
      {shouldShowRefreshIndicator && (
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center"
          style={{
            ...indicatorStyle,
            marginTop: -threshold
          }}
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg">
            {isRefreshing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            ) : pullDistance >= threshold ? (
              <RefreshCw className="w-6 h-6 text-primary" />
            ) : (
              <ArrowDown
                className="w-6 h-6 text-muted-foreground transition-transform"
                style={{ transform: `rotate(${iconRotation}deg)` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Content area */}
      <div
        style={shouldShowRefreshIndicator ? indicatorStyle : undefined}
        className="relative"
      >
        {children}
      </div>

      {/* Loading overlay when refreshing */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 overflow-hidden">
          <div className="h-full bg-primary animate-pulse" />
        </div>
      )}
    </div>
  );
}

// Higher-order component for easy wrapping
export function withPullToRefresh<P extends object>(
  Component: React.ComponentType<P>,
  onRefresh: () => Promise<void> | void,
  options?: { threshold?: number; disabled?: boolean }
) {
  const WrappedComponent = (props: P) => (
    <PullToRefresh
      onRefresh={onRefresh}
      threshold={options?.threshold}
      disabled={options?.disabled}
    >
      <Component {...props} />
    </PullToRefresh>
  );

  WrappedComponent.displayName = `withPullToRefresh(${Component.displayName || Component.name})`;
  return WrappedComponent;
}