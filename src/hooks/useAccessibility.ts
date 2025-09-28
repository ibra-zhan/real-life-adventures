import { useState, useEffect, useCallback, useRef } from 'react';

// Hook for managing focus
export function useFocusManagement() {
  const focusableElements = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusable = container.querySelectorAll(focusableElements);
    const firstFocusable = focusable[0] as HTMLElement;
    const lastFocusable = focusable[focusable.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus the first element
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [focusableElements]);

  const returnFocus = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  }, []);

  const getNextFocusableElement = useCallback((direction: 'next' | 'prev' = 'next') => {
    const focusable = Array.from(document.querySelectorAll(focusableElements)) as HTMLElement[];
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);

    if (direction === 'next') {
      return focusable[currentIndex + 1] || focusable[0];
    } else {
      return focusable[currentIndex - 1] || focusable[focusable.length - 1];
    }
  }, [focusableElements]);

  return {
    trapFocus,
    returnFocus,
    getNextFocusableElement
  };
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback((
    e: KeyboardEvent,
    items: any[],
    onSelect?: (index: number) => void,
    onEscape?: () => void
  ) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setCurrentIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Home':
        e.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(currentIndex);
        break;
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
    }
  }, [currentIndex]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
    reset
  };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) {
      // Create announcement element if it doesn't exist
      const element = document.createElement('div');
      element.setAttribute('aria-live', priority);
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      element.style.position = 'absolute';
      element.style.left = '-10000px';
      element.style.width = '1px';
      element.style.height = '1px';
      element.style.overflow = 'hidden';
      document.body.appendChild(element);
      announceRef.current = element;
    }

    const element = announceRef.current;
    element.setAttribute('aria-live', priority);

    // Clear and then set the message to ensure it's announced
    element.textContent = '';
    setTimeout(() => {
      element.textContent = message;
    }, 100);
  }, []);

  const announceNavigation = useCallback((page: string) => {
    announce(`Navigated to ${page} page`);
  }, [announce]);

  const announceAction = useCallback((action: string) => {
    announce(action, 'assertive');
  }, [announce]);

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'assertive');
  }, [announce]);

  return {
    announce,
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess
  };
}

// Hook for high contrast mode detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    setIsHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isHighContrast;
}

// Hook for reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

// Hook for managing ARIA attributes
export function useAriaAttributes() {
  const generateId = useCallback((prefix: string = 'aria') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const createAriaLabel = useCallback((base: string, additional?: string) => {
    return additional ? `${base}, ${additional}` : base;
  }, []);

  const createAriaDescription = useCallback((description: string, error?: string) => {
    return error ? `${description}. Error: ${error}` : description;
  }, []);

  return {
    generateId,
    createAriaLabel,
    createAriaDescription
  };
}

// Hook for managing skip links
export function useSkipLinks() {
  const [skipLinks, setSkipLinks] = useState<Array<{ id: string; label: string }>>([]);

  const addSkipLink = useCallback((id: string, label: string) => {
    setSkipLinks(prev => {
      const exists = prev.find(link => link.id === id);
      if (exists) return prev;
      return [...prev, { id, label }];
    });
  }, []);

  const removeSkipLink = useCallback((id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  }, []);

  const skipTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink,
    skipTo
  };
}

// Hook for managing landmark regions
export function useLandmarks() {
  const [landmarks, setLandmarks] = useState<Array<{ id: string; role: string; label: string }>>([]);

  const addLandmark = useCallback((id: string, role: string, label: string) => {
    setLandmarks(prev => {
      const exists = prev.find(landmark => landmark.id === id);
      if (exists) return prev;
      return [...prev, { id, role, label }];
    });
  }, []);

  const removeLandmark = useCallback((id: string) => {
    setLandmarks(prev => prev.filter(landmark => landmark.id !== id));
  }, []);

  return {
    landmarks,
    addLandmark,
    removeLandmark
  };
}

// Custom hook for comprehensive accessibility features
export function useAccessibility() {
  const focusManagement = useFocusManagement();
  const keyboardNav = useKeyboardNavigation();
  const screenReader = useScreenReader();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const ariaAttributes = useAriaAttributes();
  const skipLinks = useSkipLinks();
  const landmarks = useLandmarks();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip to main content (Alt + M)
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        skipLinks.skipTo('main-content');
      }

      // Skip to navigation (Alt + N)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        skipLinks.skipTo('main-navigation');
      }

      // Show help (Alt + H)
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        screenReader.announce('Help: Use Alt+M for main content, Alt+N for navigation. Use Tab to navigate, Enter or Space to activate.');
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [skipLinks.skipTo, screenReader.announce]);

  return {
    focusManagement,
    keyboardNav,
    screenReader,
    isHighContrast,
    prefersReducedMotion,
    ariaAttributes,
    skipLinks,
    landmarks
  };
}