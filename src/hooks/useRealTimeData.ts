import { useEffect, useRef, useCallback } from 'react';
import { useAppState } from '@/contexts/AppStateContext';
import { dataSyncService } from '@/services/dataSyncService';
import { cacheService } from '@/services/cacheService';
import { statePersistenceService } from '@/services/statePersistenceService';

export interface RealTimeConfig {
  enableAutoSync: boolean;
  syncInterval: number;
  enablePersistence: boolean;
  enableOptimisticUpdates: boolean;
  enableBackgroundSync: boolean;
}

export function useRealTimeData(config: Partial<RealTimeConfig> = {}) {
  const {
    state,
    refreshUser,
    refreshQuests,
    refreshBadges,
    refreshNotifications,
    refreshModerationQueue,
    addQuest,
    updateQuest,
    removeQuest,
    addBadge,
    addNotification,
    updateNotification,
    removeNotification,
    updateModerationItem,
    removeModerationItem,
  } = useAppState();

  const configRef = useRef({
    enableAutoSync: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    enablePersistence: true,
    enableOptimisticUpdates: true,
    enableBackgroundSync: true,
    ...config,
  });

  // Update config when it changes
  useEffect(() => {
    configRef.current = { ...configRef.current, ...config };
  }, [config]);

  // Initialize services
  useEffect(() => {
    // Update data sync service config
    dataSyncService.updateConfig({
      enableAutoSync: configRef.current.enableAutoSync,
      syncInterval: configRef.current.syncInterval,
    });

    // Update cache service config
    cacheService.updateConfig({
      defaultStaleTime: configRef.current.syncInterval,
      enableBackgroundRefetch: configRef.current.enableBackgroundSync,
    });

    // Update persistence service config
    statePersistenceService.updateConfig({
      enableLocalStorage: configRef.current.enablePersistence,
    });
  }, [config]);

  // Auto-sync setup
  useEffect(() => {
    if (!configRef.current.enableAutoSync) return;

    // Start auto-sync for all data types
    dataSyncService.startAutoSync(
      'user',
      async () => {
        const response = await dataSyncService.syncUser(
          (user) => {
            if (configRef.current.enablePersistence) {
              statePersistenceService.store('user', user, {
                storage: 'localStorage',
                expiresIn: 24 * 60 * 60 * 1000, // 24 hours
              });
            }
          },
          (error) => console.error('User sync error:', error)
        );
        return response.data;
      },
      (user) => {
        // Handle user data update
        if (user) {
          // Update cache
          cacheService.setData({ type: 'user' }, user);
        }
      },
      (error) => console.error('User auto-sync error:', error)
    );

    dataSyncService.startAutoSync(
      'quests',
      async () => {
        const response = await dataSyncService.syncQuests(
          (quests) => {
            if (configRef.current.enablePersistence) {
              statePersistenceService.store('quests', quests, {
                storage: 'localStorage',
                expiresIn: 10 * 60 * 1000, // 10 minutes
              });
            }
          },
          (error) => console.error('Quests sync error:', error)
        );
        return response.data;
      },
      (quests) => {
        // Handle quests data update
        if (quests) {
          // Update cache
          cacheService.setData({ type: 'quests' }, quests);
        }
      },
      (error) => console.error('Quests auto-sync error:', error)
    );

    dataSyncService.startAutoSync(
      'badges',
      async () => {
        const response = await dataSyncService.syncBadges(
          (badges) => {
            if (configRef.current.enablePersistence) {
              statePersistenceService.store('badges', badges, {
                storage: 'localStorage',
                expiresIn: 30 * 60 * 1000, // 30 minutes
              });
            }
          },
          (error) => console.error('Badges sync error:', error)
        );
        return response.data;
      },
      (badges) => {
        // Handle badges data update
        if (badges) {
          // Update cache
          cacheService.setData({ type: 'badges' }, badges);
        }
      },
      (error) => console.error('Badges auto-sync error:', error)
    );

    dataSyncService.startAutoSync(
      'notifications',
      async () => {
        const response = await dataSyncService.syncNotifications(
          (notifications) => {
            if (configRef.current.enablePersistence) {
              statePersistenceService.store('notifications', notifications, {
                storage: 'localStorage',
                expiresIn: 5 * 60 * 1000, // 5 minutes
              });
            }
          },
          (error) => console.error('Notifications sync error:', error)
        );
        return response.data;
      },
      (notifications) => {
        // Handle notifications data update
        if (notifications) {
          // Update cache
          cacheService.setData({ type: 'notifications' }, notifications);
        }
      },
      (error) => console.error('Notifications auto-sync error:', error)
    );

    dataSyncService.startAutoSync(
      'moderationQueue',
      async () => {
        const response = await dataSyncService.syncModerationQueue(
          (items) => {
            if (configRef.current.enablePersistence) {
              statePersistenceService.store('moderationQueue', items, {
                storage: 'localStorage',
                expiresIn: 2 * 60 * 1000, // 2 minutes
              });
            }
          },
          (error) => console.error('Moderation queue sync error:', error)
        );
        return response.data;
      },
      (items) => {
        // Handle moderation queue data update
        if (items) {
          // Update cache
          cacheService.setData({ type: 'moderationQueue' }, items);
        }
      },
      (error) => console.error('Moderation queue auto-sync error:', error)
    );

    // Cleanup on unmount
    return () => {
      dataSyncService.stopAllAutoSync();
    };
  }, [configRef.current.enableAutoSync, configRef.current.syncInterval]);

  // Load persisted data on mount
  useEffect(() => {
    if (!configRef.current.enablePersistence) return;

    // Load user data
    const persistedUser = statePersistenceService.retrieve('user', {
      storage: 'localStorage',
    });
    if (persistedUser) {
      cacheService.setData({ type: 'user' }, persistedUser);
    }

    // Load quests data
    const persistedQuests = statePersistenceService.retrieve('quests', {
      storage: 'localStorage',
    });
    if (persistedQuests) {
      cacheService.setData({ type: 'quests' }, persistedQuests);
    }

    // Load badges data
    const persistedBadges = statePersistenceService.retrieve('badges', {
      storage: 'localStorage',
    });
    if (persistedBadges) {
      cacheService.setData({ type: 'badges' }, persistedBadges);
    }

    // Load notifications data
    const persistedNotifications = statePersistenceService.retrieve('notifications', {
      storage: 'localStorage',
    });
    if (persistedNotifications) {
      cacheService.setData({ type: 'notifications' }, persistedNotifications);
    }

    // Load moderation queue data
    const persistedModerationQueue = statePersistenceService.retrieve('moderationQueue', {
      storage: 'localStorage',
    });
    if (persistedModerationQueue) {
      cacheService.setData({ type: 'moderationQueue' }, persistedModerationQueue);
    }
  }, [configRef.current.enablePersistence]);

  // Optimistic updates
  const optimisticUpdateQuest = useCallback((quest: any) => {
    if (!configRef.current.enableOptimisticUpdates) return;

    // Update cache immediately
    cacheService.updateData({ type: 'quests' }, (oldQuests: any[]) => {
      if (!oldQuests) return [quest];
      return oldQuests.map(q => q.id === quest.id ? quest : q);
    });

    // Update state
    updateQuest(quest);
  }, [updateQuest]);

  const optimisticAddQuest = useCallback((quest: any) => {
    if (!configRef.current.enableOptimisticUpdates) return;

    // Update cache immediately
    cacheService.updateData({ type: 'quests' }, (oldQuests: any[]) => {
      if (!oldQuests) return [quest];
      return [quest, ...oldQuests];
    });

    // Update state
    addQuest(quest);
  }, [addQuest]);

  const optimisticRemoveQuest = useCallback((questId: string) => {
    if (!configRef.current.enableOptimisticUpdates) return;

    // Update cache immediately
    cacheService.updateData({ type: 'quests' }, (oldQuests: any[]) => {
      if (!oldQuests) return [];
      return oldQuests.filter(q => q.id !== questId);
    });

    // Update state
    removeQuest(questId);
  }, [removeQuest]);

  // Manual refresh functions
  const refreshAllData = useCallback(async () => {
    try {
      await Promise.all([
        refreshUser(),
        refreshQuests(),
        refreshBadges(),
        refreshNotifications(),
        refreshModerationQueue(),
      ]);
    } catch (error) {
      console.error('Failed to refresh all data:', error);
    }
  }, [refreshUser, refreshQuests, refreshBadges, refreshNotifications, refreshModerationQueue]);

  // Get sync status
  const getSyncStatus = useCallback(() => {
    return {
      dataSync: dataSyncService.getSyncStatus(),
      cache: cacheService.getCacheStats(),
      persistence: statePersistenceService.getStorageInfo(),
    };
  }, []);

  // Cleanup expired data
  const cleanupExpiredData = useCallback(() => {
    cacheService.cleanupExpired();
    statePersistenceService.cleanup();
  }, []);

  return {
    // State
    state,
    
    // Optimistic updates
    optimisticUpdateQuest,
    optimisticAddQuest,
    optimisticRemoveQuest,
    
    // Manual refresh
    refreshAllData,
    
    // Status and utilities
    getSyncStatus,
    cleanupExpiredData,
    
    // Configuration
    config: configRef.current,
  };
}
