import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  Notification, 
  NotificationSettings, 
  NotificationStats, 
  NotificationBatch,
  NotificationAction 
} from '@/types';

// Notifications Hook
export const useNotifications = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: async () => {
      const response = await apiClient.getNotifications({ page, limit });
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch notifications');
      }
      return response.data as NotificationBatch;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Unread Notifications Hook
export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const response = await apiClient.getUnreadNotifications();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch unread notifications');
      }
      return response.data as Notification[];
    },
    staleTime: 10 * 1000, // 10 seconds
  });
};

// Notification Settings Hook
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: async () => {
      const response = await apiClient.getNotificationSettings();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch notification settings');
      }
      return response.data as NotificationSettings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Notification Stats Hook
export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: async () => {
      const response = await apiClient.getNotificationStats();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch notification stats');
      }
      return response.data as NotificationStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mark Notification as Read Hook
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.markNotificationRead(notificationId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to mark notification as read');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Mark All Notifications as Read Hook
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.markAllNotificationsRead();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to mark all notifications as read');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Delete Notification Hook
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.deleteNotification(notificationId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete notification');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Update Notification Settings Hook
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const response = await apiClient.updateNotificationSettings(settings);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update notification settings');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate settings query
      queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
    },
  });
};

// Send Test Notification Hook (Admin)
export const useSendTestNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: {
      type: string;
      title: string;
      message: string;
      channel: string;
    }) => {
      const response = await apiClient.sendTestNotification(notification);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send test notification');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Notification Health Hook
export const useNotificationHealth = () => {
  return useQuery({
    queryKey: ['notifications', 'health'],
    queryFn: async () => {
      const response = await apiClient.getNotificationHealth();
      if (!response.success) {
        throw new Error(response.error?.message || 'Notification system unhealthy');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};