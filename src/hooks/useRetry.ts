import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
  retryCondition?: (error: Error) => boolean;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: Error | null;
}

export function useRetry<T = any>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) {
  const { toast } = useToast();
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached,
    retryCondition = (error) => !error.message.includes('401') && !error.message.includes('403')
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null
  });

  const execute = useCallback(async (): Promise<T> => {
    setRetryState(prev => ({ ...prev, isRetrying: true }));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({ ...prev, attempt }));

        const result = await operation();

        // Success - reset state
        setRetryState({
          isRetrying: false,
          attempt: 0,
          lastError: null
        });

        return result;

      } catch (error) {
        const err = error as Error;
        setRetryState(prev => ({ ...prev, lastError: err }));

        // Check if we should retry this error
        if (!retryCondition(err)) {
          setRetryState(prev => ({ ...prev, isRetrying: false }));
          throw err;
        }

        // If this is not the last attempt, wait and retry
        if (attempt < maxAttempts) {
          onRetry?.(attempt, err);

          // Calculate delay with exponential backoff
          const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));

          continue;
        }

        // Max attempts reached
        setRetryState(prev => ({ ...prev, isRetrying: false }));
        onMaxRetriesReached?.(err);
        throw err;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected end of retry loop');
  }, [operation, maxAttempts, delayMs, backoffMultiplier, onRetry, onMaxRetriesReached, retryCondition]);

  const reset = useCallback(() => {
    setRetryState({
      isRetrying: false,
      attempt: 0,
      lastError: null
    });
  }, []);

  return {
    execute,
    reset,
    ...retryState
  };
}

// Specialized hook for API calls with common retry patterns
export function useApiRetry<T = any>(
  apiCall: () => Promise<T>,
  options: Omit<RetryOptions, 'retryCondition'> & {
    showToast?: boolean;
    retryOnNetworkError?: boolean;
    retryOnServerError?: boolean;
  } = {}
) {
  const { toast } = useToast();
  const {
    showToast = true,
    retryOnNetworkError = true,
    retryOnServerError = true,
    ...retryOptions
  } = options;

  const retryCondition = useCallback((error: Error): boolean => {
    const message = error.message.toLowerCase();

    // Don't retry client errors (4xx)
    if (message.includes('401') || message.includes('403') || message.includes('404')) {
      return false;
    }

    // Retry network errors if enabled
    if (retryOnNetworkError && (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    )) {
      return true;
    }

    // Retry server errors if enabled
    if (retryOnServerError && (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    )) {
      return true;
    }

    return false;
  }, [retryOnNetworkError, retryOnServerError]);

  const onRetry = useCallback((attempt: number, error: Error) => {
    if (showToast) {
      toast({
        title: "Retrying...",
        description: `Attempt ${attempt + 1}. ${error.message}`,
        variant: "default",
      });
    }
  }, [showToast, toast]);

  const onMaxRetriesReached = useCallback((error: Error) => {
    if (showToast) {
      toast({
        title: "Operation Failed",
        description: `Unable to complete the request after multiple attempts: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [showToast, toast]);

  return useRetry(apiCall, {
    ...retryOptions,
    retryCondition,
    onRetry,
    onMaxRetriesReached
  });
}

// Hook for retrying with exponential backoff and jitter
export function useExponentialRetry<T = any>(
  operation: () => Promise<T>,
  options: RetryOptions & {
    jitter?: boolean;
    maxDelayMs?: number;
  } = {}
) {
  const {
    jitter = true,
    maxDelayMs = 30000, // 30 seconds max
    delayMs = 1000,
    backoffMultiplier = 2,
    ...otherOptions
  } = options;

  const calculateDelay = useCallback((attempt: number): number => {
    let delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

    // Apply maximum delay
    delay = Math.min(delay, maxDelayMs);

    // Apply jitter to prevent thundering herd
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return delay;
  }, [delayMs, backoffMultiplier, maxDelayMs, jitter]);

  const executeWithBackoff = useCallback(async (): Promise<T> => {
    const { maxAttempts = 3, onRetry, onMaxRetriesReached, retryCondition } = otherOptions;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const err = error as Error;

        if (!retryCondition?.(err) || attempt === maxAttempts) {
          if (attempt === maxAttempts) {
            onMaxRetriesReached?.(err);
          }
          throw err;
        }

        onRetry?.(attempt, err);

        const delay = calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected end of retry loop');
  }, [operation, calculateDelay, otherOptions]);

  return useRetry(executeWithBackoff, {
    maxAttempts: 1, // We handle retries internally
    ...otherOptions
  });
}