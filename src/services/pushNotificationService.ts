// Push Notification Service for SideQuest
import webpush from 'web-push';
import { config } from '../config';
import { prisma } from './database';
import {
  PushNotificationData,
  PushNotificationService as IPushNotificationService,
  NotificationDeliveryResult,
  NotificationChannel,
} from '../types/notification';

interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PushNotificationService implements IPushNotificationService {
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  // Initialize the push notification service
  private initialize(): void {
    try {
      if (!config.push?.enabled) {
        console.log('Push notification service disabled in configuration');
        return;
      }

      // Set VAPID details
      webpush.setVapidDetails(
        config.push.subject,
        config.push.vapidKeys.publicKey,
        config.push.vapidKeys.privateKey
      );

      this.isConfigured = true;
      console.log('Push notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      this.isConfigured = false;
    }
  }

  // Send push notification to a single subscription
  async sendPushNotification(
    subscription: any,
    data: PushNotificationData
  ): Promise<NotificationDeliveryResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        channel: NotificationChannel.PUSH,
        error: 'Push notification service not configured',
        timestamp: new Date(),
      };
    }

    try {
      const payload = JSON.stringify({
        title: data.title,
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/badge-72x72.png',
        image: data.image,
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        timestamp: data.timestamp || Date.now(),
        vibrate: data.vibrate || [200, 100, 200],
        sound: data.sound,
      });

      const options = {
        vapidDetails: {
          subject: config.push.subject,
          publicKey: config.push.vapidKeys.publicKey,
          privateKey: config.push.vapidKeys.privateKey,
        },
        TTL: 24 * 60 * 60, // 24 hours
        urgency: 'normal' as const,
        headers: {
          'Topic': data.tag || 'general',
        },
      };

      const result = await webpush.sendNotification(subscription, payload, options);

      return {
        success: true,
        channel: NotificationChannel.PUSH,
        messageId: `push_${Date.now()}`,
        timestamp: new Date(),
        metadata: {
          statusCode: result.statusCode,
          body: result.body,
          headers: result.headers,
        },
      };
    } catch (error: any) {
      console.error('Failed to send push notification:', error);

      // Handle specific error cases
      let errorMessage = 'Unknown push notification error';
      if (error.statusCode === 410 || error.statusCode === 413) {
        // Subscription is no longer valid
        errorMessage = 'Push subscription expired or invalid';
        await this.removeInvalidSubscription(subscription.endpoint);
      } else if (error.statusCode === 429) {
        errorMessage = 'Push service rate limit exceeded';
      } else if (error.statusCode === 400) {
        errorMessage = 'Invalid push notification payload';
      }

      return {
        success: false,
        channel: NotificationChannel.PUSH,
        error: errorMessage,
        timestamp: new Date(),
        metadata: {
          statusCode: error.statusCode,
          originalError: error.message,
        },
      };
    }
  }

  // Send push notification to all subscriptions of a user
  async sendToUser(userId: string, data: PushNotificationData): Promise<NotificationDeliveryResult[]> {
    try {
      const subscriptions = await this.getUserSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        return [{
          success: false,
          channel: NotificationChannel.PUSH,
          error: 'No push subscriptions found for user',
          timestamp: new Date(),
        }];
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendPushNotification(sub, data))
      );

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            channel: NotificationChannel.PUSH,
            error: `Failed to send to subscription ${index}: ${result.reason?.message}`,
            timestamp: new Date(),
          };
        }
      });
    } catch (error) {
      console.error('Failed to send push notifications to user:', error);
      return [{
        success: false,
        channel: NotificationChannel.PUSH,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }];
    }
  }

  // Send push notifications to multiple users
  async sendToMultipleUsers(
    userIds: string[],
    data: PushNotificationData
  ): Promise<NotificationDeliveryResult[]> {
    const allResults: NotificationDeliveryResult[] = [];
    const batchSize = 100; // Process in batches to avoid overwhelming the system

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(userId => this.sendToUser(userId, data));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value);
        } else {
          allResults.push({
            success: false,
            channel: NotificationChannel.PUSH,
            error: result.reason?.message || 'Batch processing failed',
            timestamp: new Date(),
          });
        }
      });

      // Small delay between batches
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return allResults;
  }

  // Generate VAPID keys (for initial setup)
  generateVAPIDKeys(): { publicKey: string; privateKey: string } {
    const vapidKeys = webpush.generateVAPIDKeys();
    return {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
    };
  }

  // Subscribe user to push notifications
  async subscribe(userId: string, subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }, userAgent?: string): Promise<boolean> {
    try {
      // In a real implementation, you'd save to database
      console.log(`User ${userId} subscribed to push notifications`);
      
      // Validate the subscription by sending a test notification
      const testResult = await this.sendPushNotification(subscription, {
        title: 'SideQuest Notifications',
        body: 'You\'re now subscribed to push notifications!',
        tag: 'subscription-confirmation',
        silent: true,
      });

      return testResult.success;
    } catch (error) {
      console.error('Failed to subscribe user to push notifications:', error);
      return false;
    }
  }

  // Unsubscribe user from push notifications
  async unsubscribe(userId: string, endpoint: string): Promise<boolean> {
    try {
      // In a real implementation, you'd remove from database
      console.log(`User ${userId} unsubscribed from push notifications`);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe user from push notifications:', error);
      return false;
    }
  }

  // Get all subscriptions for a user
  async getUserSubscriptions(userId: string): Promise<any[]> {
    try {
      // In a real implementation, you'd query the database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get user subscriptions:', error);
      return [];
    }
  }

  // Send quest-related push notifications
  async sendQuestNotification(
    userIds: string[],
    questData: {
      title: string;
      description: string;
      points: number;
    },
    type: 'new_quest' | 'quest_reminder' | 'quest_expiring'
  ): Promise<NotificationDeliveryResult[]> {
    let title: string;
    let body: string;
    let tag: string;

    switch (type) {
      case 'new_quest':
        title = 'New Quest Available!';
        body = `Check out "${questData.title}" and earn ${questData.points} points!`;
        tag = 'new-quest';
        break;
      case 'quest_reminder':
        title = 'Don\'t forget your quest!';
        body = `Complete "${questData.title}" to earn ${questData.points} points`;
        tag = 'quest-reminder';
        break;
      case 'quest_expiring':
        title = 'Quest expiring soon!';
        body = `"${questData.title}" expires soon. Complete it now!`;
        tag = 'quest-expiring';
        break;
      default:
        title = 'Quest Update';
        body = questData.description;
        tag = 'quest-update';
    }

    const pushData: PushNotificationData = {
      title,
      body,
      icon: '/icons/quest-icon.png',
      tag,
      data: {
        type: 'quest',
        questTitle: questData.title,
        points: questData.points,
      },
      actions: [
        {
          action: 'view',
          title: 'View Quest',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    };

    return await this.sendToMultipleUsers(userIds, pushData);
  }

  // Send achievement push notifications
  async sendAchievementNotification(
    userId: string,
    achievementData: {
      type: 'badge' | 'level' | 'streak' | 'points';
      title: string;
      description: string;
      imageUrl?: string;
    }
  ): Promise<NotificationDeliveryResult[]> {
    const pushData: PushNotificationData = {
      title: `Achievement Unlocked! 🏆`,
      body: `${achievementData.title}: ${achievementData.description}`,
      icon: achievementData.imageUrl || '/icons/achievement-icon.png',
      image: achievementData.imageUrl,
      tag: 'achievement',
      requireInteraction: true,
      data: {
        type: 'achievement',
        achievementType: achievementData.type,
        title: achievementData.title,
      },
      actions: [
        {
          action: 'view',
          title: 'View Achievement',
        },
        {
          action: 'share',
          title: 'Share',
        },
      ],
      vibrate: [200, 100, 200, 100, 200],
    };

    return await this.sendToUser(userId, pushData);
  }

  // Send social push notifications
  async sendSocialNotification(
    userId: string,
    socialData: {
      type: 'follow' | 'like' | 'comment' | 'mention';
      actorName: string;
      content?: string;
    }
  ): Promise<NotificationDeliveryResult[]> {
    let title: string;
    let body: string;
    let tag: string;

    switch (socialData.type) {
      case 'follow':
        title = 'New Follower';
        body = `${socialData.actorName} started following you!`;
        tag = 'follow';
        break;
      case 'like':
        title = 'New Like';
        body = `${socialData.actorName} liked your submission`;
        tag = 'like';
        break;
      case 'comment':
        title = 'New Comment';
        body = `${socialData.actorName} commented on your submission`;
        tag = 'comment';
        break;
      case 'mention':
        title = 'You were mentioned';
        body = `${socialData.actorName} mentioned you`;
        tag = 'mention';
        break;
      default:
        title = 'Social Update';
        body = socialData.content || 'You have a new social notification';
        tag = 'social';
    }

    const pushData: PushNotificationData = {
      title,
      body,
      icon: '/icons/social-icon.png',
      tag,
      data: {
        type: 'social',
        socialType: socialData.type,
        actorName: socialData.actorName,
      },
      actions: [
        {
          action: 'view',
          title: 'View',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    };

    return await this.sendToUser(userId, pushData);
  }

  // Private helper methods
  private async removeInvalidSubscription(endpoint: string): Promise<void> {
    try {
      // In a real implementation, you'd remove from database
      console.log(`Removed invalid push subscription: ${endpoint}`);
    } catch (error) {
      console.error('Failed to remove invalid subscription:', error);
    }
  }

  // Get push notification statistics
  async getStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    sentToday: number;
    deliveredToday: number;
    failedToday: number;
  }> {
    try {
      // In a real implementation, you'd query the database
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        sentToday: 0,
        deliveredToday: 0,
        failedToday: 0,
      };
    } catch (error) {
      console.error('Failed to get push notification stats:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        sentToday: 0,
        deliveredToday: 0,
        failedToday: 0,
      };
    }
  }

  // Test push notification functionality
  async testPushNotification(subscription: any): Promise<NotificationDeliveryResult> {
    const testData: PushNotificationData = {
      title: 'SideQuest Test Notification',
      body: 'This is a test notification to verify push functionality.',
      icon: '/icons/icon-192x192.png',
      tag: 'test',
      data: {
        type: 'test',
        timestamp: Date.now(),
      },
    };

    return await this.sendPushNotification(subscription, testData);
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
