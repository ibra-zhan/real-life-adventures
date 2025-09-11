import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Query keys
export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (filters?: any) => [...mediaKeys.lists(), filters] as const,
  stats: () => [...mediaKeys.all, 'stats'] as const,
  health: () => [...mediaKeys.all, 'health'] as const,
};

// Get media files
export function useMediaFiles(filters?: any) {
  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: () => apiClient.getMediaFiles(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
}

// Get media stats
export function useMediaStats() {
  return useQuery({
    queryKey: mediaKeys.stats(),
    queryFn: () => apiClient.getMediaStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Get media health
export function useMediaHealth() {
  return useQuery({
    queryKey: mediaKeys.health(),
    queryFn: () => apiClient.getMediaHealth(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
