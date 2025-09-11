import { useQuery } from '@tanstack/react-query';
import type { LeaderboardEntry, Notification } from '@/types';
import { apiClient } from '@/lib/api-client';

// Leaderboard API functions using real backend
const leaderboardApi = {
  async getLeaderboard(timeframe: 'weekly' | 'all-time' = 'all-time'): Promise<LeaderboardEntry[]> {
    const response = await apiClient.getLeaderboard({ 
      timeframe: timeframe === 'weekly' ? 'weekly' : 'all-time' 
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch leaderboard');
    }
    return response.data;
  },

  async getUserRank(userId: string, timeframe: 'weekly' | 'all-time' = 'all-time'): Promise<LeaderboardEntry | null> {
    try {
      const leaderboard = await this.getLeaderboard(timeframe);
      return leaderboard.find(entry => entry.userId === userId) || null;
    } catch (error) {
      console.warn('Failed to get user rank:', error);
      return null;
    }
  }
};

// Notification API functions - placeholder for now
const notificationApi = {
  async getNotifications(): Promise<Notification[]> {
    // This would need to be implemented in the API
    // For now, return empty array
    return [];
  },

  async markAsRead(notificationId: string): Promise<Notification[]> {
    // This would need to be implemented in the API
    // For now, return empty array
    return [];
  },

  async markAllAsRead(): Promise<Notification[]> {
    // This would need to be implemented in the API
    // For now, return empty array
    return [];
  }
};

// Query keys
export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  lists: () => [...leaderboardKeys.all, 'list'] as const,
  list: (timeframe: string) => [...leaderboardKeys.lists(), timeframe] as const,
  userRank: (userId: string, timeframe: string) => [...leaderboardKeys.all, 'userRank', userId, timeframe] as const,
};

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
};

// Leaderboard hooks
export function useLeaderboard(timeframe: 'weekly' | 'all-time' = 'all-time') {
  return useQuery({
    queryKey: leaderboardKeys.list(timeframe),
    queryFn: () => leaderboardApi.getLeaderboard(timeframe),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useUserRank(userId: string, timeframe: 'weekly' | 'all-time' = 'all-time') {
  return useQuery({
    queryKey: leaderboardKeys.userRank(userId, timeframe),
    queryFn: () => leaderboardApi.getUserRank(userId, timeframe),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

// Notification hooks
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.lists(),
    queryFn: notificationApi.getNotifications,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
    retryDelay: 1000,
  });
}

// Derived hook for unread notifications count
export function useUnreadNotificationsCount() {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter(n => !n.read).length;
}