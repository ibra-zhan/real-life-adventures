import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Start Quest Hook
export const useStartQuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      const response = await apiClient.startQuest(questId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to start quest');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['quest-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-quests'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });

      toast.success('Quest started! Good luck!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start quest');
    },
  });
};

// Submit Quest Hook
export const useSubmitQuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questId, submission }: {
      questId: string;
      submission: {
        type: 'PHOTO' | 'VIDEO' | 'TEXT' | 'CHECKLIST';
        caption: string;
        textContent?: string;
        mediaUrls?: string[];
        checklistData?: any;
        latitude?: number;
        longitude?: number;
        address?: string;
        privacy?: 'public' | 'private';
      };
    }) => {
      const response = await apiClient.submitQuest(questId, submission);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to submit quest');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['quest-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-quests'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });

      const { rewards } = data;

      if (rewards.leveledUp) {
        toast.success(`🎉 Quest completed! You leveled up and earned ${rewards.xpGained} XP!`);
      } else {
        toast.success(`✅ Quest completed! You earned ${rewards.xpGained} XP!`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit quest');
    },
  });
};

// Get Quest Progress Hook
export const useQuestProgress = (questId: string) => {
  return useQuery({
    queryKey: ['quest-progress', questId],
    queryFn: async () => {
      const response = await apiClient.getQuestProgress(questId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch quest progress');
      }
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!questId,
  });
};

// Get User Quests Hook
export const useUserQuests = (status?: string) => {
  return useQuery({
    queryKey: ['user-quests', status],
    queryFn: async () => {
      const response = await apiClient.getUserQuests(status);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch user quests');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Get User Stats Hook
export const useUserStats = () => {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await apiClient.getUserStats();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch user stats');
      }
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Abandon Quest Hook
export const useAbandonQuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      const response = await apiClient.abandonQuest(questId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to abandon quest');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['quest-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-quests'] });

      toast.success('Quest abandoned');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to abandon quest');
    },
  });
};

// Complete Quest Hook
export const useCompleteQuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      const response = await apiClient.completeQuest(questId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to complete quest');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['quest-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-quests'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });

      const { rewards } = data;

      if (rewards.leveledUp) {
        toast.success(`🎉 Quest completed! You leveled up to level ${rewards.newLevel} and earned ${rewards.xpGained} XP!`);
      } else if (rewards.streakIncreased) {
        toast.success(`🔥 Quest completed! You earned ${rewards.xpGained} XP and your streak is now ${rewards.newStreak}!`);
      } else {
        toast.success(`✅ Quest completed! You earned ${rewards.xpGained} XP!`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete quest');
    },
  });
};