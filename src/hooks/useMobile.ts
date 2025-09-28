import { useState, useEffect, useCallback, useRef } from 'react';

// Hook for detecting mobile devices and screen sizes
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });

      // Breakpoints
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);

      // Orientation
      setOrientation(width < height ? 'portrait' : 'landscape');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  const isPortrait = orientation === 'portrait';
  const isLandscape = orientation === 'landscape';

  return {
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    isPortrait,
    isLandscape,
    screenSize
  };
}

// Hook for touch gestures
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Minimum distance for a swipe
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX: Math.abs(distanceX),
      distanceY: Math.abs(distanceY)
    };
  }, [touchStart, touchEnd, minSwipeDistance]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchStart,
    touchEnd
  };
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold: number = 80) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only trigger if we're at the top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || startY.current === null) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(deltaY, threshold * 1.5));
    }
  }, [isPulling, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    startY.current = null;
    currentY.current = null;
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowRefreshIndicator = isPulling && pullDistance > 20;

  return {
    isRefreshing,
    isPulling,
    pullDistance,
    refreshProgress,
    shouldShowRefreshIndicator
  };
}

// Hook for safe area insets (for devices with notches)
export function useSafeAreaInsets() {
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateSafeAreaInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);

      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0')
      });
    };

    // Set CSS custom properties for safe area insets
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --sat: env(safe-area-inset-top);
        --sar: env(safe-area-inset-right);
        --sab: env(safe-area-inset-bottom);
        --sal: env(safe-area-inset-left);
      }
    `;
    document.head.appendChild(style);

    updateSafeAreaInsets();

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return safeAreaInsets;
}

// Hook for viewport height (handles mobile browser address bar)
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);

      // Set CSS custom property for actual viewport height
      document.documentElement.style.setProperty(
        '--vh',
        `${window.innerHeight * 0.01}px`
      );
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return viewportHeight;
}

// Hook for haptic feedback
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const vibrateSuccess = useCallback(() => {
    vibrate([50, 25, 50]);
  }, [vibrate]);

  const vibrateError = useCallback(() => {
    vibrate([100, 50, 100, 50, 100]);
  }, [vibrate]);

  const vibrateSelection = useCallback(() => {
    vibrate(25);
  }, [vibrate]);

  return {
    vibrate,
    vibrateSuccess,
    vibrateError,
    vibrateSelection
  };
}

// Hook for preventing zoom on double tap
export function usePreventZoom() {
  useEffect(() => {
    let lastTouchEnd = 0;

    const handleTouchEnd = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
}

// Hook for scroll restoration
export function useScrollRestoration() {
  const scrollPositions = useRef<Map<string, number>>(new Map());

  const saveScrollPosition = useCallback((key: string) => {
    scrollPositions.current.set(key, window.scrollY);
  }, []);

  const restoreScrollPosition = useCallback((key: string) => {
    const position = scrollPositions.current.get(key);
    if (position !== undefined) {
      window.scrollTo(0, position);
    }
  }, []);

  const clearScrollPosition = useCallback((key: string) => {
    scrollPositions.current.delete(key);
  }, []);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition
  };
}