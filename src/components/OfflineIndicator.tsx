import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineStatus?: boolean;
}

export function OfflineIndicator({ className, showOnlineStatus = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Don't show anything if online and not configured to show online status
  if (isOnline && !showOnlineStatus && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <Alert className={cn('border-green-200 bg-green-50/10 transition-all duration-300', className)}>
        <Wifi className="h-4 w-4 text-green-500" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span className="text-green-700 dark:text-green-300">
              You're back online! 🎉
            </span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isOnline) {
    return (
      <Alert className={cn('border-amber-200 bg-amber-50/10 sticky top-0 z-50', className)}>
        <WifiOff className="h-4 w-4 text-amber-500" />
        <AlertDescription>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-amber-900 dark:text-amber-100">
                  No Internet Connection
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You're currently offline. Some features may not work properly until you reconnect.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (showOnlineStatus) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <Wifi className="w-3 h-3 text-green-500" />
        <span>Online</span>
      </div>
    );
  }

  return null;
}

// Hook for online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for handling offline-first functionality
export function useOfflineQueue() {
  const [queuedActions, setQueuedActions] = useState<Array<() => Promise<any>>>([]);
  const isOnline = useOnlineStatus();

  const addToQueue = (action: () => Promise<any>) => {
    setQueuedActions(prev => [...prev, action]);
  };

  const processQueue = async () => {
    if (!isOnline || queuedActions.length === 0) return;

    const actions = [...queuedActions];
    setQueuedActions([]);

    for (const action of actions) {
      try {
        await action();
      } catch (error) {
        console.error('Failed to process queued action:', error);
        // Re-add failed action to queue
        setQueuedActions(prev => [...prev, action]);
      }
    }
  };

  useEffect(() => {
    if (isOnline && queuedActions.length > 0) {
      processQueue();
    }
  }, [isOnline, queuedActions.length]);

  return {
    isOnline,
    queuedActions: queuedActions.length,
    addToQueue,
    processQueue
  };
}