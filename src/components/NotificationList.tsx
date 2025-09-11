import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  CheckCircle2, 
  Filter, 
  MoreHorizontal,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  useNotifications, 
  useUnreadNotifications, 
  useMarkAllNotificationsRead 
} from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/NotificationItem';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

interface NotificationListProps {
  className?: string;
  onNotificationAction?: (action: string, notification: Notification) => void;
}

export function NotificationList({ 
  className, 
  onNotificationAction 
}: NotificationListProps) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  
  const { 
    data: notifications, 
    isLoading, 
    error 
  } = useNotifications(page, 20);
  
  const { data: unreadNotifications } = useUnreadNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationAction = (action: string, notification: Notification) => {
    onNotificationAction?.(action, notification);
  };

  const filteredNotifications = notifications?.notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  }) || [];

  const unreadCount = unreadNotifications?.length || 0;

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Failed to load notifications</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending || unreadCount === 0}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilter('quest_completed')}
        >
          Quests
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilter('badge_earned')}
        >
          Badges
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilter('system_update')}
        >
          System
        </Button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'unread' 
                ? 'You\'re all caught up!' 
                : 'Notifications will appear here when you receive them'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onAction={handleNotificationAction}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {notifications && notifications.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage(prev => prev + 1)}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MoreHorizontal className="w-4 h-4 mr-2" />
            )}
            Load More
          </Button>
        </div>
      )}

      {/* Stats */}
      {notifications && (
        <div className="text-xs text-muted-foreground text-center">
          Showing {filteredNotifications.length} of {notifications.total} notifications
        </div>
      )}
    </div>
  );
}
