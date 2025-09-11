// Core Notification Service for SideQuest
import { EventEmitter } from 'events';
import { prisma } from './database';
import {
  Notification,
  NotificationBatch,
  NotificationChannel,
  NotificationDeliveryResult,
  NotificationEvent,
  NotificationPreferences,
  NotificationPriority,
  NotificationService as INotificationService,
  NotificationStatus,
  NotificationType,
  NotificationQueue,
  TemplateContext,
} from '../types/notification';

export class NotificationService extends EventEmitter implements INotificationService {
  private queue: NotificationQueue[] = [];
  private processing = false;
  private batchSize = 50;
  private retryDelay = 5000; // 5 seconds
  private maxAttempts = 3;

  constructor() {
    super();
    this.startQueueProcessor();
  }

  // Core notification sending
  async send(notification: Notification): Promise<NotificationDeliveryResult[]> {
    try {
      // Check user preferences
      const preferences = await this.getPreferences(notification.recipientId);
      const filteredChannels = this.filterChannelsByPreferences(
        notification.channels,
        notification.type,
        preferences
      );

      if (filteredChannels.length === 0) {
        return [{
          success: false,
          channel: NotificationChannel.IN_APP,
          error: 'All channels disabled by user preferences',
          timestamp: new Date(),
        }];
      }

      // Check quiet hours
      if (this.isQuietHours(preferences)) {
        // Schedule for later or skip non-urgent notifications
        if (notification.priority !== NotificationPriority.URGENT) {
          await this.schedule(notification, this.getNextActiveTime(preferences));
          return [{
            success: true,
            channel: NotificationChannel.IN_APP,
            messageId: `scheduled_${notification.id}`,
            timestamp: new Date(),
          }];
        }
      }

      // Send to each channel
      const results: NotificationDeliveryResult[] = [];
      
      for (const channel of filteredChannels) {
        try {
          const result = await this.sendToChannel(notification, channel);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            channel,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          });
        }
      }

      // Update notification status
      const hasSuccess = results.some(r => r.success);
      await this.updateNotificationStatus(
        notification.id,
        hasSuccess ? NotificationStatus.SENT : NotificationStatus.FAILED
      );

      // Emit event for analytics
      this.emit('notification_sent', {
        notificationId: notification.id,
        type: notification.type,
        results,
      });

      return results;
    } catch (error) {
      console.error('Error sending notification:', error);
      await this.updateNotificationStatus(notification.id, NotificationStatus.FAILED);
      
      return [{
        success: false,
        channel: NotificationChannel.IN_APP,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }];
    }
  }

  // Batch notification sending
  async sendBatch(batch: NotificationBatch): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];
    
    try {
      // Process in chunks to avoid overwhelming the system
      for (let i = 0; i < batch.recipientIds.length; i += this.batchSize) {
        const chunk = batch.recipientIds.slice(i, i + this.batchSize);
        
        const chunkPromises = chunk.map(async (recipientId) => {
          const notification: Notification = {
            id: `${batch.id}_${recipientId}`,
            type: batch.type,
            recipientId,
            title: batch.template.title,
            body: batch.template.body,
            data: batch.data,
            channels: [batch.template.channel],
            priority: NotificationPriority.NORMAL,
            status: NotificationStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return this.send(notification);
        });

        const chunkResults = await Promise.allSettled(chunkPromises);
        
        chunkResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push(...result.value);
          } else {
            results.push({
              success: false,
              channel: NotificationChannel.IN_APP,
              error: result.reason?.message || 'Batch processing failed',
              timestamp: new Date(),
            });
          }
        });

        // Small delay between chunks to prevent rate limiting
        if (i + this.batchSize < batch.recipientIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending batch notifications:', error);
      return [{
        success: false,
        channel: NotificationChannel.IN_APP,
        error: error instanceof Error ? error.message : 'Batch processing failed',
        timestamp: new Date(),
      }];
    }
  }

  // Schedule notification for later delivery
  async schedule(notification: Notification, scheduledFor: Date): Promise<void> {
    const queueItem: NotificationQueue = {
      id: `queue_${notification.id}_${Date.now()}`,
      notification: {
        ...notification,
        scheduledFor,
      },
      priority: this.getPriorityScore(notification.priority),
      attempts: 0,
      maxAttempts: this.maxAttempts,
      nextAttempt: scheduledFor,
      createdAt: new Date(),
    };

    this.queue.push(queueItem);
    this.queue.sort((a, b) => b.priority - a.priority); // Sort by priority (high to low)
  }

  // Cancel scheduled notification
  async cancel(notificationId: string): Promise<boolean> {
    const index = this.queue.findIndex(item => 
      item.notification.id === notificationId
    );

    if (index !== -1) {
      this.queue.splice(index, 1);
      await this.updateNotificationStatus(notificationId, NotificationStatus.CANCELLED);
      return true;
    }

    return false;
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      // In a real implementation, you'd update the database
      // For now, we'll just emit an event
      this.emit('notification_read', {
        notificationId,
        userId,
        readAt: new Date(),
      });

      await this.updateNotificationStatus(notificationId, NotificationStatus.READ);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Get user notifications
  async getNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    status?: NotificationStatus;
    type?: NotificationType;
  } = {}): Promise<Notification[]> {
    try {
      // In a real implementation, you'd query the database
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // In a real implementation, you'd query the database
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Update user notification preferences
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      // In a real implementation, you'd update the database
      console.log(`Updated preferences for user ${userId}:`, preferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  // Get user notification preferences
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // In a real implementation, you'd query the database
      // For now, return default preferences
      return {
        userId,
        preferences: {},
        globalSettings: {
          enabled: true,
          doNotDisturb: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting preferences:', error);
      throw error;
    }
  }

  // Process notification events and create notifications
  async processEvent(event: NotificationEvent): Promise<void> {
    try {
      const notifications = await this.createNotificationsFromEvent(event);
      
      for (const notification of notifications) {
        await this.send(notification);
      }
    } catch (error) {
      console.error('Error processing notification event:', error);
    }
  }

  // Private helper methods
  private async sendToChannel(notification: Notification, channel: NotificationChannel): Promise<NotificationDeliveryResult> {
    switch (channel) {
      case NotificationChannel.IN_APP:
        return this.sendInAppNotification(notification);
      case NotificationChannel.EMAIL:
        return this.sendEmailNotification(notification);
      case NotificationChannel.PUSH:
        return this.sendPushNotification(notification);
      case NotificationChannel.SMS:
        return this.sendSMSNotification(notification);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private async sendInAppNotification(notification: Notification): Promise<NotificationDeliveryResult> {
    // In-app notifications are stored in the database and sent via WebSocket
    try {
      // Store in database (mock for now)
      console.log('Storing in-app notification:', notification.id);
      
      // Send via WebSocket if user is online
      this.emit('in_app_notification', {
        recipientId: notification.recipientId,
        notification,
      });

      return {
        success: true,
        channel: NotificationChannel.IN_APP,
        messageId: notification.id,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        channel: NotificationChannel.IN_APP,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<NotificationDeliveryResult> {
    // Email notifications will be handled by the email service
    return {
      success: false,
      channel: NotificationChannel.EMAIL,
      error: 'Email service not implemented',
      timestamp: new Date(),
    };
  }

  private async sendPushNotification(notification: Notification): Promise<NotificationDeliveryResult> {
    // Push notifications will be handled by the push service
    return {
      success: false,
      channel: NotificationChannel.PUSH,
      error: 'Push service not implemented',
      timestamp: new Date(),
    };
  }

  private async sendSMSNotification(notification: Notification): Promise<NotificationDeliveryResult> {
    // SMS notifications will be handled by the SMS service
    return {
      success: false,
      channel: NotificationChannel.SMS,
      error: 'SMS service not implemented',
      timestamp: new Date(),
    };
  }

  private filterChannelsByPreferences(
    channels: NotificationChannel[],
    type: NotificationType,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    if (!preferences.globalSettings.enabled) {
      return [];
    }

    const typePrefs = preferences.preferences[type];
    if (!typePrefs || !typePrefs.enabled) {
      return channels.filter(c => c === NotificationChannel.IN_APP); // Always allow in-app
    }

    return channels.filter(channel => typePrefs.channels.includes(channel));
  }

  private isQuietHours(preferences: NotificationPreferences): boolean {
    const quietHours = preferences.globalSettings.quietHours;
    if (!quietHours || preferences.globalSettings.doNotDisturb) {
      return preferences.globalSettings.doNotDisturb;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private getNextActiveTime(preferences: NotificationPreferences): Date {
    const quietHours = preferences.globalSettings.quietHours;
    if (!quietHours) {
      return new Date(Date.now() + 60000); // 1 minute from now
    }

    const now = new Date();
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const nextActive = new Date(now);
    nextActive.setHours(endHour, endMin, 0, 0);
    
    if (nextActive <= now) {
      nextActive.setDate(nextActive.getDate() + 1);
    }

    return nextActive;
  }

  private getPriorityScore(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.URGENT: return 4;
      case NotificationPriority.HIGH: return 3;
      case NotificationPriority.NORMAL: return 2;
      case NotificationPriority.LOW: return 1;
      default: return 2;
    }
  }

  private async updateNotificationStatus(notificationId: string, status: NotificationStatus): Promise<void> {
    try {
      // In a real implementation, you'd update the database
      console.log(`Notification ${notificationId} status updated to ${status}`);
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }

  private async createNotificationsFromEvent(event: NotificationEvent): Promise<Notification[]> {
    const notifications: Notification[] = [];

    try {
      switch (event.type) {
        case 'quest_created':
          // Notify followers of the quest creator
          notifications.push(...await this.createQuestCreatedNotifications(event as any));
          break;
        case 'submission_approved':
          // Notify the submission author
          notifications.push(...await this.createSubmissionApprovedNotifications(event as any));
          break;
        case 'badge_earned':
          // Notify the user who earned the badge
          notifications.push(...await this.createBadgeEarnedNotifications(event as any));
          break;
        // Add more event types as needed
        default:
          console.log(`Unhandled notification event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error creating notifications from event:', error);
    }

    return notifications;
  }

  private async createQuestCreatedNotifications(event: any): Promise<Notification[]> {
    // Mock implementation - in reality, you'd query for followers
    return [];
  }

  private async createSubmissionApprovedNotifications(event: any): Promise<Notification[]> {
    // Mock implementation
    return [];
  }

  private async createBadgeEarnedNotifications(event: any): Promise<Notification[]> {
    // Mock implementation
    return [];
  }

  // Queue processing
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.processQueue();
      }
    }, 1000); // Check every second
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;

    try {
      const now = new Date();
      const readyItems = this.queue.filter(item => 
        item.nextAttempt && item.nextAttempt <= now && 
        item.attempts < item.maxAttempts
      );

      for (const item of readyItems) {
        try {
          await this.send(item.notification);
          
          // Remove from queue on success
          const index = this.queue.indexOf(item);
          if (index !== -1) {
            this.queue.splice(index, 1);
          }
        } catch (error) {
          // Increment attempts and reschedule
          item.attempts++;
          if (item.attempts < item.maxAttempts) {
            item.nextAttempt = new Date(now.getTime() + this.retryDelay * item.attempts);
          } else {
            // Max attempts reached, remove from queue
            const index = this.queue.indexOf(item);
            if (index !== -1) {
              this.queue.splice(index, 1);
            }
            
            await this.updateNotificationStatus(
              item.notification.id,
              NotificationStatus.FAILED
            );
          }
        }
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.processing = false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
