import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { useAuthContext } from '@/contexts/AuthContext';

// Hook for tracking page views automatically
export function usePageTracking() {
  const location = useLocation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    // Only track if path has actually changed
    if (location.pathname !== previousPath.current) {
      analytics.page({
        path: location.pathname,
        page: document.title,
        referrer: previousPath.current || undefined
      });

      previousPath.current = location.pathname;
    }
  }, [location.pathname]);
}

// Hook for tracking user authentication events
export function useAuthTracking() {
  const { user, isAuthenticated } = useAuthContext();
  const wasAuthenticated = useRef<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && user && !wasAuthenticated.current) {
      // User logged in
      analytics.identify(user.id, {
        username: user.username,
        email: user.email,
        joinDate: user.createdAt || user.joinedAt,
        hasAvatar: !!user.avatar,
        hasLocation: !!user.location,
        hasCompletedOnboarding: user.onboardingCompleted,
        emailVerified: user.emailVerified
      });

      analytics.track('user_login', {
        method: 'email', // Could be extended for other auth methods
        isNewSession: true
      });

      wasAuthenticated.current = true;
    } else if (!isAuthenticated && wasAuthenticated.current) {
      // User logged out
      analytics.track('user_logout');
      wasAuthenticated.current = false;
    }
  }, [isAuthenticated, user]);

  // Track profile updates
  const trackProfileUpdate = useCallback((changes: Record<string, any>) => {
    analytics.track('profile_updated', {
      changes: Object.keys(changes),
      ...changes
    });
  }, []);

  return { trackProfileUpdate };
}

// Hook for tracking quest interactions
export function useQuestTracking() {
  const trackQuestView = useCallback((questId: string, questData?: any) => {
    analytics.trackQuestEvent('view', questId, {
      category: questData?.category,
      difficulty: questData?.difficulty,
      isFeatured: questData?.isFeatured,
      isEpic: questData?.isEpic
    });
  }, []);

  const trackQuestStart = useCallback((questId: string, questData?: any) => {
    analytics.trackQuestEvent('start', questId, {
      category: questData?.category,
      difficulty: questData?.difficulty,
      estimatedTime: questData?.estimatedTime
    });
  }, []);

  const trackQuestComplete = useCallback((questId: string, submissionData?: any) => {
    analytics.trackQuestEvent('complete', questId, {
      submissionType: submissionData?.type,
      hasMedia: !!(submissionData?.mediaUrls?.length),
      privacy: submissionData?.privacy,
      completionTime: submissionData?.completionTime
    });
  }, []);

  const trackQuestShare = useCallback((questId: string, platform?: string) => {
    analytics.trackQuestEvent('share', questId, {
      platform,
      timestamp: Date.now()
    });
  }, []);

  const trackQuestGeneration = useCallback((params: any, result?: any) => {
    analytics.track('quest_generation', {
      mode: params.mode,
      difficulty: params.difficulty,
      category: params.category,
      count: params.count,
      success: !!result,
      generatedCount: result?.length || 0
    });
  }, []);

  return {
    trackQuestView,
    trackQuestStart,
    trackQuestComplete,
    trackQuestShare,
    trackQuestGeneration
  };
}

// Hook for tracking form interactions
export function useFormTracking() {
  const trackFormStart = useCallback((formName: string, formData?: any) => {
    analytics.track('form_start', {
      form: formName,
      fieldCount: formData ? Object.keys(formData).length : undefined
    });
  }, []);

  const trackFormError = useCallback((formName: string, errors: any) => {
    analytics.track('form_error', {
      form: formName,
      errors: Object.keys(errors),
      errorCount: Object.keys(errors).length
    });
  }, []);

  const trackFormSubmit = useCallback((formName: string, success: boolean, data?: any) => {
    analytics.trackFormSubmit(formName, {
      success,
      fieldCount: data ? Object.keys(data).length : undefined,
      timestamp: Date.now()
    });
  }, []);

  const trackFieldFocus = useCallback((formName: string, fieldName: string) => {
    analytics.track('form_field_focus', {
      form: formName,
      field: fieldName
    });
  }, []);

  return {
    trackFormStart,
    trackFormError,
    trackFormSubmit,
    trackFieldFocus
  };
}

// Hook for tracking feature usage
export function useFeatureTracking() {
  const trackFeatureUsage = useCallback((feature: string, action: string, properties?: any) => {
    analytics.track('feature_usage', {
      feature,
      action,
      ...properties
    });
  }, []);

  const trackButtonClick = useCallback((buttonName: string, context?: string) => {
    analytics.trackClick(buttonName, {
      context,
      timestamp: Date.now()
    });
  }, []);

  const trackNavigation = useCallback((from: string, to: string, method: 'click' | 'swipe' | 'keyboard' = 'click') => {
    analytics.track('navigation', {
      from,
      to,
      method,
      timestamp: Date.now()
    });
  }, []);

  const trackSearch = useCallback((query: string, results?: number, filters?: any) => {
    analytics.track('search', {
      query: query.substring(0, 100), // Limit length for privacy
      queryLength: query.length,
      resultCount: results,
      hasFilters: !!filters,
      filters: filters ? Object.keys(filters) : undefined
    });
  }, []);

  const trackFilter = useCallback((filterType: string, filterValue: string, resultCount?: number) => {
    analytics.track('filter_applied', {
      filterType,
      filterValue,
      resultCount
    });
  }, []);

  return {
    trackFeatureUsage,
    trackButtonClick,
    trackNavigation,
    trackSearch,
    trackFilter
  };
}

// Hook for tracking performance and errors
export function usePerformanceTracking() {
  const trackLoadTime = useCallback((component: string, loadTime: number) => {
    analytics.track('component_load_time', {
      component,
      loadTime,
      timestamp: Date.now()
    });
  }, []);

  const trackApiCall = useCallback((endpoint: string, method: string, duration: number, success: boolean, statusCode?: number) => {
    analytics.track('api_call', {
      endpoint,
      method,
      duration,
      success,
      statusCode,
      timestamp: Date.now()
    });
  }, []);

  const trackComponentError = useCallback((component: string, error: Error, props?: any) => {
    analytics.trackError(error, {
      component,
      props: props ? Object.keys(props) : undefined,
      propsCount: props ? Object.keys(props).length : 0
    });
  }, []);

  const trackUserFlow = useCallback((flowName: string, step: string, success: boolean, duration?: number) => {
    analytics.track('user_flow', {
      flow: flowName,
      step,
      success,
      duration,
      timestamp: Date.now()
    });
  }, []);

  return {
    trackLoadTime,
    trackApiCall,
    trackComponentError,
    trackUserFlow
  };
}

// Hook for tracking engagement metrics
export function useEngagementTracking() {
  const sessionStartTime = useRef<number>(Date.now());
  const pageStartTime = useRef<number>(Date.now());
  const location = useLocation();

  // Track session duration on unmount
  useEffect(() => {
    return () => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      analytics.track('session_end', {
        duration: sessionDuration,
        timestamp: Date.now()
      });
    };
  }, []);

  // Track page time on route change
  useEffect(() => {
    const pageDuration = Date.now() - pageStartTime.current;

    if (pageDuration > 1000) { // Only track if more than 1 second
      analytics.track('page_time', {
        page: location.pathname,
        duration: pageDuration,
        timestamp: Date.now()
      });
    }

    pageStartTime.current = Date.now();
  }, [location.pathname]);

  const trackTimeSpent = useCallback((component: string, startTime: number) => {
    const duration = Date.now() - startTime;
    analytics.track('time_spent', {
      component,
      duration,
      timestamp: Date.now()
    });
  }, []);

  const trackScrollDepth = useCallback((depth: number, maxDepth: number) => {
    analytics.track('scroll_depth', {
      depth,
      maxDepth,
      percentage: Math.round((depth / maxDepth) * 100),
      timestamp: Date.now()
    });
  }, []);

  const trackVideoPlay = useCallback((videoId: string, position: number) => {
    analytics.track('video_play', {
      videoId,
      position,
      timestamp: Date.now()
    });
  }, []);

  const trackVideoPause = useCallback((videoId: string, position: number, duration: number) => {
    analytics.track('video_pause', {
      videoId,
      position,
      duration,
      timestamp: Date.now()
    });
  }, []);

  return {
    trackTimeSpent,
    trackScrollDepth,
    trackVideoPlay,
    trackVideoPause
  };
}

// Hook for A/B testing and feature flags
export function useExperimentTracking() {
  const trackExperimentView = useCallback((experimentName: string, variant: string) => {
    analytics.track('experiment_view', {
      experiment: experimentName,
      variant,
      timestamp: Date.now()
    });
  }, []);

  const trackExperimentConversion = useCallback((experimentName: string, variant: string, conversionType: string) => {
    analytics.track('experiment_conversion', {
      experiment: experimentName,
      variant,
      conversionType,
      timestamp: Date.now()
    });
  }, []);

  const trackFeatureFlag = useCallback((flagName: string, enabled: boolean, variant?: string) => {
    analytics.track('feature_flag', {
      flag: flagName,
      enabled,
      variant,
      timestamp: Date.now()
    });
  }, []);

  return {
    trackExperimentView,
    trackExperimentConversion,
    trackFeatureFlag
  };
}