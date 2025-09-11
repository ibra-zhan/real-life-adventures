import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  ModerationResult, 
  ModerationQueue, 
  ModerationStats, 
  ModerationSettings,
  ModerationAction,
  ModerationReport
} from '@/types';

// Moderation Health Hook
export const useModerationHealth = () => {
  return useQuery({
    queryKey: ['moderation', 'health'],
    queryFn: async () => {
      const response = await apiClient.getModerationHealth();
      if (!response.success) {
        throw new Error(response.error?.message || 'Moderation system unhealthy');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Moderation Queue Hook
export const useModerationQueue = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['moderation', 'queue', page, limit],
    queryFn: async () => {
      const response = await apiClient.getModerationQueue({ page, limit });
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch moderation queue');
      }
      return response.data as { items: ModerationQueue[]; total: number; page: number; limit: number; hasMore: boolean };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Moderation Stats Hook
export const useModerationStats = () => {
  return useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: async () => {
      const response = await apiClient.getModerationStats();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch moderation stats');
      }
      return response.data as ModerationStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Moderation Settings Hook
export const useModerationSettings = () => {
  return useQuery({
    queryKey: ['moderation', 'settings'],
    queryFn: async () => {
      const response = await apiClient.getModerationSettings();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch moderation settings');
      }
      return response.data as ModerationSettings;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Moderation Result Hook
export const useModerationResult = (contentId: string) => {
  return useQuery({
    queryKey: ['moderation', 'result', contentId],
    queryFn: async () => {
      const response = await apiClient.getModerationResult(contentId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch moderation result');
      }
      return response.data as ModerationResult;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Moderate Content Hook
export const useModerateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contentId: string;
      contentType: string;
      content: string;
      metadata?: any;
    }) => {
      const response = await apiClient.moderateContent(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to moderate content');
      }
      return response.data as ModerationResult;
    },
    onSuccess: () => {
      // Invalidate moderation queries
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });
};

// Approve Content Hook
export const useApproveContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await apiClient.approveContent(contentId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to approve content');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate moderation queries
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });
};

// Reject Content Hook
export const useRejectContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contentId: string;
      reason: string;
      details?: string;
    }) => {
      const response = await apiClient.rejectContent(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reject content');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate moderation queries
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });
};

// Flag Content Hook
export const useFlagContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contentId: string;
      contentType: string;
      reason: string;
      description?: string;
    }) => {
      const response = await apiClient.flagContent(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to flag content');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate moderation queries
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });
};

// Escalate Content Hook
export const useEscalateContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contentId: string;
      reason: string;
      details?: string;
    }) => {
      const response = await apiClient.escalateContent(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to escalate content');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate moderation queries
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });
};

// Update Moderation Settings Hook
export const useUpdateModerationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<ModerationSettings>) => {
      const response = await apiClient.updateModerationSettings(settings);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update moderation settings');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate settings query
      queryClient.invalidateQueries({ queryKey: ['moderation', 'settings'] });
    },
  });
};

// Moderation Reports Hook
export const useModerationReports = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['moderation', 'reports', page, limit],
    queryFn: async () => {
      const response = await apiClient.getModerationReports({ page, limit });
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch moderation reports');
      }
      return response.data as { items: ModerationReport[]; total: number; page: number; limit: number; hasMore: boolean };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Resolve Report Hook
export const useResolveReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      reportId: string;
      resolution: string;
      action: string;
    }) => {
      const response = await apiClient.resolveReport(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to resolve report');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate reports query
      queryClient.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    },
  });
};