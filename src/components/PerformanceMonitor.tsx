import React, { useEffect, useRef, useState } from 'react';
import { analytics } from '@/lib/analytics';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  memoryUsage?: number;
  jsHeapSize?: number;
  connectionType?: string;
  effectiveType?: string;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  reportInterval?: number; // ms
  thresholds?: {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  };
}

export function PerformanceMonitor({
  enabled = true,
  reportInterval = 30000, // 30 seconds
  thresholds = {
    fcp: 1800, // 1.8s
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1   // 0.1
  }
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const observersRef = useRef<PerformanceObserver[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    initializePerformanceObservers();
    startPeriodicReporting();

    return () => {
      cleanup();
    };
  }, [enabled, reportInterval]);

  const initializePerformanceObservers = () => {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // Observe paint metrics (FCP)
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            reportMetric('first-contentful-paint', entry.startTime, thresholds.fcp);
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      observersRef.current.push(paintObserver);
    } catch (error) {
      console.warn('Failed to observe paint metrics:', error);
    }

    // Observe LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        reportMetric('largest-contentful-paint', lastEntry.startTime, thresholds.lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observersRef.current.push(lcpObserver);
    } catch (error) {
      console.warn('Failed to observe LCP:', error);
    }

    // Observe FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          reportMetric('first-input-delay', entry.processingStart - entry.startTime, thresholds.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observersRef.current.push(fidObserver);
    } catch (error) {
      console.warn('Failed to observe FID:', error);
    }

    // Observe CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        setMetrics(prev => ({ ...prev, cls: clsValue }));
        reportMetric('cumulative-layout-shift', clsValue, thresholds.cls);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observersRef.current.push(clsObserver);
    } catch (error) {
      console.warn('Failed to observe CLS:', error);
    }

    // Observe navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const ttfb = entry.responseStart - entry.requestStart;
          setMetrics(prev => ({ ...prev, ttfb }));
          reportMetric('time-to-first-byte', ttfb);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      observersRef.current.push(navigationObserver);
    } catch (error) {
      console.warn('Failed to observe navigation timing:', error);
    }
  };

  const collectMemoryInfo = () => {
    const memory = (performance as any).memory;
    if (memory) {
      const memoryUsage = memory.usedJSHeapSize;
      const jsHeapSize = memory.totalJSHeapSize;
      setMetrics(prev => ({ ...prev, memoryUsage, jsHeapSize }));

      // Report high memory usage
      if (memoryUsage > 50 * 1024 * 1024) { // 50MB threshold
        analytics.track('high_memory_usage', {
          memoryUsage,
          jsHeapSize,
          timestamp: Date.now()
        });
      }
    }
  };

  const collectConnectionInfo = () => {
    const connection = (navigator as any).connection;
    if (connection) {
      setMetrics(prev => ({
        ...prev,
        connectionType: connection.type,
        effectiveType: connection.effectiveType
      }));
    }
  };

  const reportMetric = (name: string, value: number, threshold?: number) => {
    const isGood = threshold ? value <= threshold : true;
    const rating = getPerformanceRating(name, value);

    analytics.track('performance_metric', {
      metric: name,
      value,
      rating,
      isGood,
      threshold,
      timestamp: Date.now()
    });

    // Report poor performance
    if (!isGood) {
      analytics.track('poor_performance', {
        metric: name,
        value,
        threshold,
        rating,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });
    }
  };

  const getPerformanceRating = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      'first-contentful-paint': { good: 1800, poor: 3000 },
      'largest-contentful-paint': { good: 2500, poor: 4000 },
      'first-input-delay': { good: 100, poor: 300 },
      'cumulative-layout-shift': { good: 0.1, poor: 0.25 },
      'time-to-first-byte': { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const startPeriodicReporting = () => {
    intervalRef.current = setInterval(() => {
      collectMemoryInfo();
      collectConnectionInfo();

      // Report current metrics
      analytics.track('performance_snapshot', {
        ...metrics,
        timestamp: Date.now(),
        url: window.location.href
      });
    }, reportInterval);
  };

  const cleanup = () => {
    observersRef.current.forEach(observer => {
      observer.disconnect();
    });
    observersRef.current = [];

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Development-only metrics display
  if (import.meta.env.DEV) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50 max-w-xs">
        <div className="font-bold mb-1">Performance Metrics</div>
        {metrics.fcp && (
          <div className={`${metrics.fcp <= 1800 ? 'text-green-400' : metrics.fcp <= 3000 ? 'text-yellow-400' : 'text-red-400'}`}>
            FCP: {Math.round(metrics.fcp)}ms
          </div>
        )}
        {metrics.lcp && (
          <div className={`${metrics.lcp <= 2500 ? 'text-green-400' : metrics.lcp <= 4000 ? 'text-yellow-400' : 'text-red-400'}`}>
            LCP: {Math.round(metrics.lcp)}ms
          </div>
        )}
        {metrics.fid && (
          <div className={`${metrics.fid <= 100 ? 'text-green-400' : metrics.fid <= 300 ? 'text-yellow-400' : 'text-red-400'}`}>
            FID: {Math.round(metrics.fid)}ms
          </div>
        )}
        {metrics.cls !== undefined && (
          <div className={`${metrics.cls <= 0.1 ? 'text-green-400' : metrics.cls <= 0.25 ? 'text-yellow-400' : 'text-red-400'}`}>
            CLS: {metrics.cls.toFixed(3)}
          </div>
        )}
        {metrics.memoryUsage && (
          <div>
            Memory: {Math.round(metrics.memoryUsage / 1024 / 1024)}MB
          </div>
        )}
        {metrics.effectiveType && (
          <div>
            Connection: {metrics.effectiveType}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Hook for component-specific performance tracking
export function useComponentPerformance(componentName: string) {
  const startTime = useRef<number>(Date.now());
  const mounted = useRef<boolean>(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const mountTime = Date.now() - startTime.current;

      analytics.track('component_mount_time', {
        component: componentName,
        mountTime,
        timestamp: Date.now()
      });
    }

    return () => {
      const unmountTime = Date.now();
      const lifespan = unmountTime - startTime.current;

      analytics.track('component_unmount', {
        component: componentName,
        lifespan,
        timestamp: unmountTime
      });
    };
  }, [componentName]);

  const trackAction = (action: string, duration?: number) => {
    analytics.track('component_action', {
      component: componentName,
      action,
      duration,
      timestamp: Date.now()
    });
  };

  const trackRender = (renderTime: number, props?: any) => {
    analytics.track('component_render', {
      component: componentName,
      renderTime,
      propsCount: props ? Object.keys(props).length : 0,
      timestamp: Date.now()
    });
  };

  return { trackAction, trackRender };
}

// Error boundary with performance tracking
interface PerformanceErrorBoundaryProps {
  children: React.ReactNode;
  componentName: string;
}

interface PerformanceErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PerformanceErrorBoundary extends React.Component<
  PerformanceErrorBoundaryProps,
  PerformanceErrorBoundaryState
> {
  constructor(props: PerformanceErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PerformanceErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    analytics.track('component_error', {
      component: this.props.componentName,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <h3 className="text-red-800 font-semibold">Component Error</h3>
          <p className="text-red-600 text-sm">
            {this.props.componentName} failed to render
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}