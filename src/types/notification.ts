// Notification Types for SideQuest Frontend

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: NotificationPriority;
  channel: NotificationChannel;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
}

export type NotificationType = 
  | 'quest_completed'
  | 'quest_approved'
  | 'quest_rejected'
  | 'badge_earned'
  | 'level_up'
  | 'achievement_unlocked'
  | 'friend_request'
  | 'friend_accepted'
  | 'quest_shared'
  | 'comment_received'
  | 'like_received'
  | 'system_update'
  | 'maintenance'
  | 'promotion'
  | 'reminder';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface NotificationSettings {
  userId: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  types: {
    [key in NotificationType]: {
      inApp: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  digest: boolean;
  digestTime: string; // HH:MM format
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  variables: string[];
  channels: NotificationChannel[];
  priority: NotificationPriority;
  expiresAfter?: number; // hours
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  byPriority: Record<NotificationPriority, number>;
  readRate: number;
  clickRate: number;
  lastWeek: number;
  lastMonth: number;
}

export interface NotificationPreferences {
  userId: string;
  settings: NotificationSettings;
  templates: NotificationTemplate[];
  stats: NotificationStats;
}

export interface NotificationAction {
  id: string;
  notificationId: string;
  type: 'click' | 'dismiss' | 'mark_read' | 'mark_unread' | 'archive';
  timestamp: string;
  metadata?: any;
}

export interface NotificationBatch {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Constants
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  quest_completed: '✅',
  quest_approved: '🎉',
  quest_rejected: '❌',
  badge_earned: '🏆',
  level_up: '⬆️',
  achievement_unlocked: '🎯',
  friend_request: '👥',
  friend_accepted: '🤝',
  quest_shared: '📤',
  comment_received: '💬',
  like_received: '❤️',
  system_update: '🔧',
  maintenance: '⚠️',
  promotion: '🎁',
  reminder: '⏰',
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  quest_completed: 'text-green-600',
  quest_approved: 'text-green-600',
  quest_rejected: 'text-red-600',
  badge_earned: 'text-yellow-600',
  level_up: 'text-blue-600',
  achievement_unlocked: 'text-purple-600',
  friend_request: 'text-blue-600',
  friend_accepted: 'text-green-600',
  quest_shared: 'text-blue-600',
  comment_received: 'text-blue-600',
  like_received: 'text-pink-600',
  system_update: 'text-gray-600',
  maintenance: 'text-orange-600',
  promotion: 'text-purple-600',
  reminder: 'text-yellow-600',
};

export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-gray-500',
  normal: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export const NOTIFICATION_CHANNEL_ICONS: Record<NotificationChannel, string> = {
  in_app: '📱',
  email: '📧',
  push: '🔔',
  sms: '📱',
};