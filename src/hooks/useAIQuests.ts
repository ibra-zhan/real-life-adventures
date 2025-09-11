import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { transformQuest, transformQuests } from '@/lib/questTransformer';
import type { Quest } from '@/types';

// AI Quest Generation Hook
export const useGenerateQuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      categoryId?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
      count?: number;
      location?: {
        latitude: number;
        longitude: number;
        city?: string;
        country?: string;
      };
      weather?: {
        temperature: number;
        condition: string;
        season: string;
      };
      timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
      preferences?: {
        interests?: string[];
        preferredDifficulties?: ('EASY' | 'MEDIUM' | 'HARD' | 'EPIC')[];
        preferredCategories?: string[];
      };
    }) => {
      const response = await apiClient.generateQuest(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to generate quest');
      }
      
      // Transform the generated quest data
      const questsData = response.data.quests || response.data;
      const quests = Array.isArray(questsData) ? questsData : [questsData];
      return transformQuests(quests);
    },
    onSuccess: () => {
      // Invalidate quest queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
};

// AI Quest from Idea Hook
export const useGenerateQuestFromIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idea: {
      theme: string;
      description: string;
      categoryPreference?: string;
      difficultyPreference?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
      includeLocation?: boolean;
      targetAudience?: 'beginners' | 'intermediate' | 'advanced' | 'everyone';
    }) => {
      const response = await apiClient.generateQuestFromIdea(idea);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to generate quest from idea');
      }
      
      // Transform the generated quest data
      const questData = response.data.quest || response.data;
      return transformQuest(questData);
    },
    onSuccess: () => {
      // Invalidate quest queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
};

// Save Generated Quest Hook
export const useSaveGeneratedQuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questData, autoPublish = false }: {
      questData: any;
      autoPublish?: boolean;
    }) => {
      const response = await apiClient.saveGeneratedQuest(questData, autoPublish);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to save quest');
      }
      
      return transformQuest(response.data.quest);
    },
    onSuccess: () => {
      // Invalidate quest queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
};

// Generation Stats Hook
export const useGenerationStats = () => {
  return useQuery({
    queryKey: ['ai-quests', 'stats'],
    queryFn: async () => {
      const response = await apiClient.getGenerationStats();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch generation stats');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Personalized Suggestions Hook
export const usePersonalizedSuggestions = () => {
  return useQuery({
    queryKey: ['ai-quests', 'suggestions'],
    queryFn: async () => {
      const response = await apiClient.getPersonalizedSuggestions();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch suggestions');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
