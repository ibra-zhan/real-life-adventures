import { QueryClient } from '@tanstack/react-query';

export interface CacheConfig {
  defaultStaleTime: number;
  defaultCacheTime: number;
  enableBackgroundRefetch: boolean;
  enableErrorRetry: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
}

export interface CacheKey {
  type: string;
  id?: string;
  params?: Record<string, any>;
}

class CacheService {
  private queryClient: QueryClient;
  private config: CacheConfig;

  constructor(queryClient: QueryClient, config: Partial<CacheConfig> = {}) {
    this.queryClient = queryClient;
    this.config = {
      defaultStaleTime: 5 * 60 * 1000, // 5 minutes
      defaultCacheTime: 10 * 60 * 1000, // 10 minutes
      enableBackgroundRefetch: true,
      enableErrorRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  // Generate cache key
  generateKey(cacheKey: CacheKey): string[] {
    const key = [cacheKey.type];
    
    if (cacheKey.id) {
      key.push(cacheKey.id);
    }
    
    if (cacheKey.params) {
      const sortedParams = Object.keys(cacheKey.params)
        .sort()
        .map(key => `${key}:${cacheKey.params![key]}`);
      key.push(...sortedParams);
    }
    
    return key;
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern: string | string[]): void {
    this.queryClient.invalidateQueries({ queryKey: pattern });
  }

  // Invalidate specific cache key
  invalidateKey(cacheKey: CacheKey): void {
    const key = this.generateKey(cacheKey);
    this.queryClient.invalidateQueries({ queryKey: key });
  }

  // Remove specific cache key
  removeKey(cacheKey: CacheKey): void {
    const key = this.generateKey(cacheKey);
    this.queryClient.removeQueries({ queryKey: key });
  }

  // Clear all cache
  clearAll(): void {
    this.queryClient.clear();
  }

  // Prefetch data
  async prefetch<T>(
    cacheKey: CacheKey,
    fetchFn: () => Promise<T>,
    options?: {
      staleTime?: number;
      cacheTime?: number;
    }
  ): Promise<void> {
    const key = this.generateKey(cacheKey);
    
    await this.queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fetchFn,
      staleTime: options?.staleTime || this.config.defaultStaleTime,
      cacheTime: options?.cacheTime || this.config.defaultCacheTime,
    });
  }

  // Set data in cache
  setData<T>(cacheKey: CacheKey, data: T): void {
    const key = this.generateKey(cacheKey);
    this.queryClient.setQueryData(key, data);
  }

  // Get data from cache
  getData<T>(cacheKey: CacheKey): T | undefined {
    const key = this.generateKey(cacheKey);
    return this.queryClient.getQueryData<T>(key);
  }

  // Update data in cache
  updateData<T>(
    cacheKey: CacheKey,
    updater: (oldData: T | undefined) => T
  ): void {
    const key = this.generateKey(cacheKey);
    this.queryClient.setQueryData(key, updater);
  }

  // Invalidate related caches
  invalidateRelated(type: string): void {
    // Common invalidation patterns
    const patterns = {
      user: ['user', 'profile', 'auth'],
      quest: ['quest', 'quests', 'quest-feed'],
      badge: ['badge', 'badges', 'gamification'],
      notification: ['notification', 'notifications'],
      moderation: ['moderation', 'moderation-queue'],
      media: ['media', 'media-files'],
    };

    const relatedTypes = patterns[type as keyof typeof patterns] || [type];
    relatedTypes.forEach(pattern => {
      this.invalidatePattern(pattern);
    });
  }

  // Optimistic update
  optimisticUpdate<T>(
    cacheKey: CacheKey,
    newData: T,
    rollbackFn: () => void
  ): void {
    const key = this.generateKey(cacheKey);
    const previousData = this.queryClient.getQueryData<T>(key);
    
    // Set optimistic data
    this.queryClient.setQueryData(key, newData);
    
    // Set up rollback
    this.queryClient.setQueryData(key, previousData);
  }

  // Get cache statistics
  getCacheStats(): {
    totalQueries: number;
    staleQueries: number;
    freshQueries: number;
    errorQueries: number;
  } {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    let staleQueries = 0;
    let freshQueries = 0;
    let errorQueries = 0;
    
    queries.forEach(query => {
      if (query.state.status === 'error') {
        errorQueries++;
      } else if (query.isStale()) {
        staleQueries++;
      } else {
        freshQueries++;
      }
    });
    
    return {
      totalQueries: queries.length,
      staleQueries,
      freshQueries,
      errorQueries,
    };
  }

  // Clean up expired cache
  cleanupExpired(): void {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const now = Date.now();
    queries.forEach(query => {
      if (query.state.dataUpdatedAt && 
          now - query.state.dataUpdatedAt > this.config.defaultCacheTime) {
        this.queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }

  // Update configuration
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): CacheConfig {
    return { ...this.config };
  }
}

// Export singleton instance (will be initialized with queryClient)
export let cacheService: CacheService;

// Initialize cache service
export function initializeCacheService(queryClient: QueryClient, config?: Partial<CacheConfig>): void {
  cacheService = new CacheService(queryClient, config);
}

// Export class for custom instances
export { CacheService };
