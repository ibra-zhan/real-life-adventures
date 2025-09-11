import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.getCategories();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch categories');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const response = await apiClient.getCategory(categoryId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch category');
      }
      return response.data;
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}
