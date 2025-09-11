import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  X, 
  ExternalLink, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  useMarkNotificationRead, 
  useDeleteNotification 
} from '@/hooks/useNotifications';
import { 
  NOTIFICATION_TYPE_ICONS, 
  NOTIFICATION_TYPE_COLORS, 
  NOTIFICATION_PRIORITY_COLORS,
  NOTIFICATION_CHANNEL_ICONS 
} from '@/types';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onAction?: (action: string, notification: Notification) => void;
  className?: string;
}

export function NotificationItem({ 
  notification, 
  onAction, 
  className 
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const markAsRead = useMarkNotificationRead();
  const deleteNotification = useDeleteNotification();

  const handleMarkAsRead = async () => {
    if (!notification.read) {
      try {
        await markAsRead.mutateAsync(notification.id);
        onAction?.('read', notification);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNotification.mutateAsync(notification.id);
      onAction?.('delete', notification);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleAction = () => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    if (!notification.read) {
      handleMarkAsRead();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const isExpired = notification.expiresAt && new Date(notification.expiresAt) < new Date();

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        !notification.read && "border-l-4 border-l-primary bg-primary/5",
        isExpired && "opacity-60",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "text-2xl",
            NOTIFICATION_TYPE_COLORS[notification.type]
          )}>
            {NOTIFICATION_TYPE_ICONS[notification.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold text-sm",
                  !notification.read && "font-bold"
                )}>
                  {notification.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-1">
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
                {isExpired && (
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(notification.createdAt)}</span>
              </div>
              
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  NOTIFICATION_PRIORITY_COLORS[notification.priority]
                )}
              >
                {notification.priority}
              </Badge>

              <div className="flex items-center gap-1">
                {NOTIFICATION_CHANNEL_ICONS[notification.channel]}
                <span className="capitalize">{notification.channel}</span>
              </div>
            </div>

            {/* Action Button */}
            {notification.actionUrl && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAction}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {notification.actionText || 'View'}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                disabled={markAsRead.isPending}
                className="h-8 w-8 p-0"
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteNotification.isPending}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
