// Analytics and monitoring system for Real Life Adventures

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

interface UserProperties {
  userId?: string;
  email?: string;
  username?: string;
  plan?: string;
  joinDate?: string;
  [key: string]: any;
}

interface PageViewEvent {
  page: string;
  title?: string;
  path: string;
  referrer?: string;
  timestamp?: number;
}

interface PerformanceMetrics {
  pageLoadTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  memoryUsage?: number;
  connectionSpeed?: string;
}

class Analytics {
  private userId: string | null = null;
  private sessionId: string;
  private isEnabled: boolean = true;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline: boolean = navigator.onLine;
  private userProperties: UserProperties = {};

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupOnlineListener();
    this.loadUserProperties();

    // Process any queued events on startup
    this.processEventQueue();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processEventQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private loadUserProperties(): void {
    try {
      const stored = localStorage.getItem('analytics_user_properties');
      if (stored) {
        this.userProperties = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load user properties:', error);
    }
  }

  private saveUserProperties(): void {
    try {
      localStorage.setItem('analytics_user_properties', JSON.stringify(this.userProperties));
    } catch (error) {
      console.warn('Failed to save user properties:', error);
    }
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('analytics_enabled', enabled.toString());
  }

  getEnabled(): boolean {
    const stored = localStorage.getItem('analytics_enabled');
    return stored === null ? true : stored === 'true';
  }

  // User identification
  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;

    if (properties) {
      this.userProperties = { ...this.userProperties, ...properties, userId };
      this.saveUserProperties();
    }

    this.track('user_identified', {
      userId,
      ...properties
    });
  }

  // Update user properties
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
    this.saveUserProperties();
  }

  // Track events
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...this.userProperties
      },
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId
    };

    if (this.isOnline) {
      this.sendEvent(event);
    } else {
      this.queueEvent(event);
    }
  }

  // Track page views
  page(pageData: Partial<PageViewEvent>): void {
    if (!this.isEnabled) return;

    const event: PageViewEvent = {
      page: pageData.page || document.title,
      title: pageData.title || document.title,
      path: pageData.path || window.location.pathname,
      referrer: pageData.referrer || document.referrer,
      timestamp: Date.now()
    };

    this.track('page_view', event);
  }

  // Track performance metrics
  trackPerformance(): void {
    if (!this.isEnabled || !('performance' in window)) return;

    // Wait for page load to complete
    if (document.readyState === 'complete') {
      this.collectPerformanceMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.collectPerformanceMetrics(), 1000);
      });
    }
  }

  private collectPerformanceMetrics(): void {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const metrics: PerformanceMetrics = {
        pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : undefined,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        connectionSpeed: (navigator as any).connection?.effectiveType
      };

      // Get LCP if available
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.largestContentfulPaint = lastEntry.startTime;
            this.track('performance_metrics', metrics);
            observer.disconnect();
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch {
          // Fallback if LCP is not supported
          this.track('performance_metrics', metrics);
        }
      } else {
        this.track('performance_metrics', metrics);
      }
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
    }
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  // Track user interactions
  trackClick(element: string, properties?: Record<string, any>): void {
    this.track('click', {
      element,
      ...properties
    });
  }

  trackFormSubmit(formName: string, properties?: Record<string, any>): void {
    this.track('form_submit', {
      form: formName,
      ...properties
    });
  }

  trackQuestEvent(action: string, questId: string, properties?: Record<string, any>): void {
    this.track('quest_event', {
      action,
      questId,
      ...properties
    });
  }

  // Send event to analytics service
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // TODO: Replace with actual analytics service endpoint
      // Examples: Google Analytics, Mixpanel, Amplitude, PostHog

      // For now, log to console in development
      if (import.meta.env.DEV) {
        console.log('📊 Analytics Event:', event);
      }

      // Example implementation for a custom analytics endpoint:
      /*
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      */

      // Example for Google Analytics 4:
      /*
      if (typeof gtag !== 'undefined') {
        gtag('event', event.name, {
          ...event.properties,
          custom_parameter_user_id: this.userId,
          custom_parameter_session_id: this.sessionId
        });
      }
      */

    } catch (error) {
      console.warn('Failed to send analytics event:', error);
      this.queueEvent(event);
    }
  }

  private queueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    // Limit queue size to prevent memory issues
    if (this.eventQueue.length > 100) {
      this.eventQueue = this.eventQueue.slice(-50);
    }

    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem('analytics_queue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.warn('Failed to save analytics queue:', error);
    }
  }

  private async processEventQueue(): Promise<void> {
    if (!this.isOnline || this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send events in batches
      const batchSize = 10;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await Promise.all(batch.map(event => this.sendEvent(event)));
      }

      // Clear persisted queue
      localStorage.removeItem('analytics_queue');
    } catch (error) {
      console.warn('Failed to process event queue:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...events);
    }
  }

  // Load queued events from localStorage
  private loadEventQueue(): void {
    try {
      const stored = localStorage.getItem('analytics_queue');
      if (stored) {
        this.eventQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics queue:', error);
      localStorage.removeItem('analytics_queue');
    }
  }

  // Get analytics data for debugging
  getDebugInfo(): object {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      isEnabled: this.isEnabled,
      isOnline: this.isOnline,
      queueLength: this.eventQueue.length,
      userProperties: this.userProperties
    };
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Auto-track page views for SPAs
let currentPath = window.location.pathname;

const trackPageView = () => {
  const newPath = window.location.pathname;
  if (newPath !== currentPath) {
    currentPath = newPath;
    analytics.page({
      path: newPath,
      page: document.title
    });
  }
};

// Listen for navigation changes
window.addEventListener('popstate', trackPageView);

// Override pushState and replaceState to track programmatic navigation
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(history, args);
  setTimeout(trackPageView, 0);
};

history.replaceState = function(...args) {
  originalReplaceState.apply(history, args);
  setTimeout(trackPageView, 0);
};

// Track initial page view
analytics.page({
  path: window.location.pathname,
  page: document.title
});

// Track performance metrics
analytics.trackPerformance();

// Track unhandled errors
window.addEventListener('error', (event) => {
  analytics.trackError(new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  analytics.trackError(new Error(event.reason), {
    type: 'unhandled_promise_rejection'
  });
});

export default analytics;