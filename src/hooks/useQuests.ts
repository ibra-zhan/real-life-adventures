import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Quest, Challenge } from '@/types';
import { apiClient, QuestFilters } from '@/lib/api-client';
import { transformQuest, transformQuests } from '@/lib/questTransformer';

// Quest API functions using real backend
const questApi = {
  async getQuests(filters?: QuestFilters): Promise<Quest[]> {
    const response = await apiClient.getQuests(filters);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch quests');
    }
    // Transform backend quest data to frontend format
    const questsData = response.data.quests || response.data;
    return transformQuests(Array.isArray(questsData) ? questsData : []);
  },

  async getQuest(id: string): Promise<Quest | null> {
    try {
      const response = await apiClient.getQuest(id);
      if (!response.success) {
        return null;
      }
      return transformQuest(response.data);
    } catch (error) {
      console.warn(`Quest ${id} not found:`, error);
      return null;
    }
  },

  async getFeaturedQuest(): Promise<Quest> {
    const response = await apiClient.getFeaturedQuests();
    if (!response.success) {
      throw new Error(response.error?.message || 'No featured quest found');
    }
    const featuredQuests = response.data;
    if (!featuredQuests || featuredQuests.length === 0) {
      throw new Error('No featured quest found');
    }
    // Return the first featured quest
    return transformQuest(featuredQuests[0]);
  },

  async getRandomQuest(): Promise<Quest> {
    const response = await apiClient.getRandomQuest();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get random quest');
    }
    return transformQuest(response.data);
  }
};

// Challenge API functions using real backend
const challengeApi = {
  async getChallenges(): Promise<Challenge[]> {
    const response = await apiClient.getChallenges();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch challenges');
    }
    return response.data;
  },

  async getChallenge(id: string): Promise<Challenge | null> {
    try {
      const response = await apiClient.getChallenge(id);
      if (!response.success) {
        return null;
      }
      return response.data;
    } catch (error) {
      console.warn(`Challenge ${id} not found:`, error);
      return null;
    }
  },

  async joinChallenge(id: string): Promise<Challenge> {
    const response = await apiClient.joinChallenge(id);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to join challenge');
    }
    return response.data;
  },

  async leaveChallenge(id: string): Promise<Challenge> {
    // Implementation would depend on actual API endpoint
    throw new Error('Leave challenge not yet implemented');
  }
};

// Query keys
export const questKeys = {
  all: ['quests'] as const,
  lists: () => [...questKeys.all, 'list'] as const,
  list: (filters?: QuestFilters) => [...questKeys.lists(), filters] as const,
  details: () => [...questKeys.all, 'detail'] as const,
  detail: (id: string) => [...questKeys.details(), id] as const,
  featured: () => [...questKeys.all, 'featured'] as const,
  random: () => [...questKeys.all, 'random'] as const,
};

export const challengeKeys = {
  all: ['challenges'] as const,
  lists: () => [...challengeKeys.all, 'list'] as const,
  details: () => [...challengeKeys.all, 'detail'] as const,
  detail: (id: string) => [...challengeKeys.details(), id] as const,
};

// Quest hooks
export function useQuests(filters?: QuestFilters) {
  return useQuery({
    queryKey: questKeys.list(filters),
    queryFn: () => questApi.getQuests(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useQuest(id: string | undefined) {
  return useQuery({
    queryKey: questKeys.detail(id || ''),
    queryFn: () => id ? questApi.getQuest(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}

export function useFeaturedQuest() {
  return useQuery({
    queryKey: questKeys.featured(),
    queryFn: questApi.getFeaturedQuest,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

export function useRandomQuest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: questApi.getRandomQuest,
    onSuccess: (quest) => {
      // Cache the random quest temporarily
      queryClient.setQueryData(questKeys.detail(quest.id), quest);
    },
  });
}

// Challenge hooks
export function useChallenges() {
  return useQuery({
    queryKey: challengeKeys.lists(),
    queryFn: challengeApi.getChallenges,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

export function useChallenge(id: string | undefined) {
  return useQuery({
    queryKey: challengeKeys.detail(id || ''),
    queryFn: () => id ? challengeApi.getChallenge(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}

export function useJoinChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: challengeApi.joinChallenge,
    onMutate: async (challengeId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: challengeKeys.detail(challengeId) });
      await queryClient.cancelQueries({ queryKey: challengeKeys.lists() });
      
      // Snapshot previous values
      const previousChallenge = queryClient.getQueryData(challengeKeys.detail(challengeId));
      const previousChallenges = queryClient.getQueryData(challengeKeys.lists());
      
      // Optimistically update
      if (previousChallenge) {
        queryClient.setQueryData(challengeKeys.detail(challengeId), (old: Challenge) => ({
          ...old,
          isJoined: true,
          participants: old.participants + 1
        }));
      }
      
      if (previousChallenges) {
        queryClient.setQueryData(challengeKeys.lists(), (old: Challenge[]) =>
          old.map(challenge =>
            challenge.id === challengeId
              ? { ...challenge, isJoined: true, participants: challenge.participants + 1 }
              : challenge
          )
        );
      }
      
      return { previousChallenge, previousChallenges };
    },
    onError: (err, challengeId, context) => {
      // Rollback on error
      if (context?.previousChallenge) {
        queryClient.setQueryData(challengeKeys.detail(challengeId), context.previousChallenge);
      }
      if (context?.previousChallenges) {
        queryClient.setQueryData(challengeKeys.lists(), context.previousChallenges);
      }
    },
    onSettled: (data, error, challengeId) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
    },
  });
}

export function useLeaveChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: challengeApi.leaveChallenge,
    onMutate: async (challengeId) => {
      await queryClient.cancelQueries({ queryKey: challengeKeys.detail(challengeId) });
      await queryClient.cancelQueries({ queryKey: challengeKeys.lists() });
      
      const previousChallenge = queryClient.getQueryData(challengeKeys.detail(challengeId));
      const previousChallenges = queryClient.getQueryData(challengeKeys.lists());
      
      if (previousChallenge) {
        queryClient.setQueryData(challengeKeys.detail(challengeId), (old: Challenge) => ({
          ...old,
          isJoined: false,
          participants: Math.max(0, old.participants - 1)
        }));
      }
      
      if (previousChallenges) {
        queryClient.setQueryData(challengeKeys.lists(), (old: Challenge[]) =>
          old.map(challenge =>
            challenge.id === challengeId
              ? { ...challenge, isJoined: false, participants: Math.max(0, challenge.participants - 1) }
              : challenge
          )
        );
      }
      
      return { previousChallenge, previousChallenges };
    },
    onError: (err, challengeId, context) => {
      if (context?.previousChallenge) {
        queryClient.setQueryData(challengeKeys.detail(challengeId), context.previousChallenge);
      }
      if (context?.previousChallenges) {
        queryClient.setQueryData(challengeKeys.lists(), context.previousChallenges);
      }
    },
    onSettled: (data, error, challengeId) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
    },
  });
}