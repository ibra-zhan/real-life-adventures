import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  UserLevel, 
  Badge, 
  GamificationStats, 
  LevelConfig, 
  XpEvent, 
  Achievement, 
  LeaderboardEntry,
  GamificationEvent 
} from '@/types';

// Gamification Stats Hook
export const useGamificationStats = () => {
  return useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: async () => {
      const response = await apiClient.getGamificationStats();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch gamification stats');
      }
      return response.data as GamificationStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// User Level Hook
export const useUserLevel = () => {
  return useQuery({
    queryKey: ['gamification', 'level'],
    queryFn: async () => {
      const response = await apiClient.getUserLevel();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch user level');
      }
      return response.data as UserLevel;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Level Progress Hook
export const useLevelProgress = () => {
  return useQuery({
    queryKey: ['gamification', 'level', 'progress'],
    queryFn: async () => {
      const response = await apiClient.getLevelProgress();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch level progress');
      }
      return response.data as { currentXp: number; nextLevelXp: number; progress: number };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Level Configuration Hook
export const useLevelConfig = (level: number) => {
  return useQuery({
    queryKey: ['gamification', 'level', level],
    queryFn: async () => {
      const response = await apiClient.getLevelConfig(level);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch level config');
      }
      return response.data as LevelConfig;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// All Level Configurations Hook
export const useAllLevelConfigs = () => {
  return useQuery({
    queryKey: ['gamification', 'levels'],
    queryFn: async () => {
      const response = await apiClient.getAllLevelConfigs();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch level configs');
      }
      return response.data as LevelConfig[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// User Badges Hook
export const useUserBadges = () => {
  return useQuery({
    queryKey: ['gamification', 'badges', 'user'],
    queryFn: async () => {
      const response = await apiClient.getUserBadges();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch user badges');
      }
      return response.data as Badge[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Badge Progress Hook
export const useBadgeProgress = (badgeId: string) => {
  return useQuery({
    queryKey: ['gamification', 'badges', badgeId, 'progress'],
    queryFn: async () => {
      const response = await apiClient.getBadgeProgress(badgeId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch badge progress');
      }
      return response.data as { progress: number; requirements: any[] };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// All Badges Hook
export const useAllBadges = () => {
  return useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: async () => {
      const response = await apiClient.getAllBadges();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch badges');
      }
      return response.data as Badge[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Badges by Type Hook
export const useBadgesByType = (type: string) => {
  return useQuery({
    queryKey: ['gamification', 'badges', 'type', type],
    queryFn: async () => {
      const response = await apiClient.getBadgesByType(type);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch badges by type');
      }
      return response.data as Badge[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Badges by Rarity Hook
export const useBadgesByRarity = (rarity: string) => {
  return useQuery({
    queryKey: ['gamification', 'badges', 'rarity', rarity],
    queryFn: async () => {
      const response = await apiClient.getBadgesByRarity(rarity);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch badges by rarity');
      }
      return response.data as Badge[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Add XP Hook (Admin)
export const useAddXp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, source, description }: {
      userId: string;
      amount: number;
      source: string;
      description: string;
    }) => {
      const response = await apiClient.addXP(userId, amount, source, description);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to add XP');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate gamification queries
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
};

// Award Badge Hook (Admin)
export const useAwardBadge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, badgeId }: {
      userId: string;
      badgeId: string;
    }) => {
      const response = await apiClient.awardBadge(userId, badgeId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to award badge');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate gamification queries
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
};

// Gamification Health Hook
export const useGamificationHealth = () => {
  return useQuery({
    queryKey: ['gamification', 'health'],
    queryFn: async () => {
      const response = await apiClient.getGamificationHealth();
      if (!response.success) {
        throw new Error(response.error?.message || 'Gamification system unhealthy');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};