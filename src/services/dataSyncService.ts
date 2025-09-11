import { apiClient } from '@/lib/api-client';
import type { User, Quest, Badge, Notification, ModerationResult } from '@/types';

export interface DataSyncConfig {
  enableAutoSync: boolean;
  syncInterval: number; // in milliseconds
  enableRealTimeSync: boolean;
  enableOptimisticUpdates: boolean;
  retryAttempts: number;
  retryDelay: number; // in milliseconds
}

export interface SyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

class DataSyncService {
  private config: DataSyncConfig;
  private syncTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private retryCounters: Map<string, number> = new Map();

  constructor(config: Partial<DataSyncConfig> = {}) {
    this.config = {
      enableAutoSync: true,
      syncInterval: 5 * 60 * 1000, // 5 minutes
      enableRealTimeSync: false,
      enableOptimisticUpdates: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  // Generic sync method
  private async syncData<T>(
    key: string,
    fetchFn: () => Promise<T>,
    onSuccess: (data: T) => void,
    onError: (error: string) => void
  ): Promise<SyncResult<T>> {
    try {
      const data = await fetchFn();
      onSuccess(data);
      this.retryCounters.delete(key);
      
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Sync failed';
      onError(errorMessage);
      
      // Retry logic
      const retryCount = this.retryCounters.get(key) || 0;
      if (retryCount < this.config.retryAttempts) {
        this.retryCounters.set(key, retryCount + 1);
        setTimeout(() => {
          this.syncData(key, fetchFn, onSuccess, onError);
        }, this.config.retryDelay * Math.pow(2, retryCount));
      }
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // User data sync
  async syncUser(
    onSuccess: (user: User) => void,
    onError: (error: string) => void
  ): Promise<SyncResult<User>> {
    return this.syncData(
      'user',
      async () => {
        const response = await apiClient.getProfile();
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch user profile');
        }
        return response.data;
      },
      onSuccess,
      onError
    );
  }

  // Quests data sync
  async syncQuests(
    onSuccess: (quests: Quest[]) => void,
    onError: (error: string) => void,
    filters?: any
  ): Promise<SyncResult<Quest[]>> {
    return this.syncData(
      'quests',
      async () => {
        const response = await apiClient.getQuests(filters);
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch quests');
        }
        const questsData = response.data.quests || response.data;
        return Array.isArray(questsData) ? questsData : [];
      },
      onSuccess,
      onError
    );
  }

  // Badges data sync
  async syncBadges(
    onSuccess: (badges: Badge[]) => void,
    onError: (error: string) => void
  ): Promise<SyncResult<Badge[]>> {
    return this.syncData(
      'badges',
      async () => {
        const response = await apiClient.getUserBadges();
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch badges');
        }
        return response.data;
      },
      onSuccess,
      onError
    );
  }

  // Notifications data sync
  async syncNotifications(
    onSuccess: (notifications: Notification[]) => void,
    onError: (error: string) => void,
    page: number = 1,
    limit: number = 50
  ): Promise<SyncResult<Notification[]>> {
    return this.syncData(
      'notifications',
      async () => {
        const response = await apiClient.getNotifications({ page, limit });
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch notifications');
        }
        return response.data.notifications || [];
      },
      onSuccess,
      onError
    );
  }

  // Moderation queue sync
  async syncModerationQueue(
    onSuccess: (items: ModerationResult[]) => void,
    onError: (error: string) => void,
    page: number = 1,
    limit: number = 50
  ): Promise<SyncResult<ModerationResult[]>> {
    return this.syncData(
      'moderationQueue',
      async () => {
        const response = await apiClient.getModerationQueue({ page, limit });
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch moderation queue');
        }
        return response.data.items || [];
      },
      onSuccess,
      onError
    );
  }

  // Start auto-sync for a specific data type
  startAutoSync(
    key: string,
    fetchFn: () => Promise<any>,
    onSuccess: (data: any) => void,
    onError: (error: string) => void
  ): void {
    if (!this.config.enableAutoSync) return;

    const sync = () => {
      this.syncData(key, fetchFn, onSuccess, onError);
    };

    // Initial sync
    sync();

    // Set up interval
    const timeout = setInterval(sync, this.config.syncInterval);
    this.syncTimeouts.set(key, timeout);
  }

  // Stop auto-sync for a specific data type
  stopAutoSync(key: string): void {
    const timeout = this.syncTimeouts.get(key);
    if (timeout) {
      clearInterval(timeout);
      this.syncTimeouts.delete(key);
    }
  }

  // Stop all auto-sync
  stopAllAutoSync(): void {
    this.syncTimeouts.forEach((timeout) => {
      clearInterval(timeout);
    });
    this.syncTimeouts.clear();
  }

  // Update configuration
  updateConfig(newConfig: Partial<DataSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): DataSyncConfig {
    return { ...this.config };
  }

  // Clear retry counters
  clearRetryCounters(): void {
    this.retryCounters.clear();
  }

  // Get sync status
  getSyncStatus(): { [key: string]: { retryCount: number; lastSync?: string } } {
    const status: { [key: string]: { retryCount: number; lastSync?: string } } = {};
    
    this.retryCounters.forEach((retryCount, key) => {
      status[key] = { retryCount };
    });

    return status;
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();

// Export class for custom instances
export { DataSyncService };
