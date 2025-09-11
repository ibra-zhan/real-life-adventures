// Notification Controller for SideQuest
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { 
  notificationService, 
  emailService, 
  pushNotificationService 
} from '../services';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../types/notification';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';

// Validation schemas
const sendNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  recipientId: z.string().cuid('Invalid recipient ID'),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  channels: z.array(z.nativeEnum(NotificationChannel)),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
  data: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
});

const updatePreferencesSchema = z.object({
  preferences: z.record(z.object({
    enabled: z.boolean(),
    channels: z.array(z.nativeEnum(NotificationChannel)),
    frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
  })),
  globalSettings: z.object({
    enabled: z.boolean(),
    quietHours: z.object({
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      timezone: z.string(),
    }).optional(),
    doNotDisturb: z.boolean(),
  }),
});

const subscribeToNotificationsSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  userAgent: z.string().optional(),
});

// Get user notifications
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const querySchema = z.object({
      page: z.string().default('1').transform(Number),
      limit: z.string().default('20').transform(Number),
      status: z.nativeEnum(NotificationStatus).optional(),
      type: z.nativeEnum(NotificationType).optional(),
    });

    const { page, limit, status, type } = querySchema.parse(req.query);
    const offset = (page - 1) * limit;

    const notifications = await notificationService.getNotifications(userId, {
      limit,
      offset,
      status,
      type,
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total: notifications.length, // In real implementation, get total count
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        unreadCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const { id } = req.params;
    
    await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      data: {
        message: 'Notification marked as read',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // In a real implementation, you'd mark all user notifications as read
    console.log(`Marking all notifications as read for user ${userId}`);

    res.json({
      success: true,
      data: {
        message: 'All notifications marked as read',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get notification preferences
export const getPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const preferences = await notificationService.getPreferences(userId);

    res.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Update notification preferences
export const updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const validatedData = updatePreferencesSchema.parse(req.body);
    
    await notificationService.updatePreferences(userId, validatedData);

    res.json({
      success: true,
      data: {
        message: 'Notification preferences updated successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const validatedData = subscribeToNotificationsSchema.parse(req.body);
    
    const success = await pushNotificationService.subscribe(
      userId,
      validatedData.subscription,
      validatedData.userAgent
    );

    if (success) {
      res.json({
        success: true,
        data: {
          message: 'Successfully subscribed to push notifications',
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: 'Failed to subscribe to push notifications',
          code: 'SUBSCRIPTION_FAILED',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    next(error);
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const { endpoint } = req.body;
    if (!endpoint) {
      throw new ValidationError('Endpoint is required');
    }

    const success = await pushNotificationService.unsubscribe(userId, endpoint);

    res.json({
      success: true,
      data: {
        message: success ? 'Successfully unsubscribed' : 'Subscription not found',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Send notification (admin only)
export const sendNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const validatedData = sendNotificationSchema.parse(req.body);

    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: validatedData.type,
      recipientId: validatedData.recipientId,
      senderId: userId,
      title: validatedData.title,
      body: validatedData.body,
      data: validatedData.data,
      channels: validatedData.channels,
      priority: validatedData.priority,
      status: NotificationStatus.PENDING,
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let results;
    if (validatedData.scheduledFor) {
      await notificationService.schedule(notification, new Date(validatedData.scheduledFor));
      results = [{ success: true, scheduled: true }];
    } else {
      results = await notificationService.send(notification);
    }

    res.json({
      success: true,
      data: {
        notificationId: notification.id,
        results,
        message: validatedData.scheduledFor ? 'Notification scheduled successfully' : 'Notification sent successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Test push notification
export const testPushNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const { subscription } = req.body;
    if (!subscription) {
      throw new ValidationError('Push subscription is required');
    }

    const result = await pushNotificationService.testPushNotification(subscription);

    res.json({
      success: true,
      data: {
        testResult: result,
        message: result.success ? 'Test notification sent successfully' : 'Test notification failed',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get notification statistics (admin only)
export const getNotificationStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const pushStats = await pushNotificationService.getStats();

    res.json({
      success: true,
      data: {
        push: pushStats,
        // In a real implementation, you'd also get email and in-app stats
        email: {
          totalSent: 0,
          deliveredToday: 0,
          failedToday: 0,
        },
        inApp: {
          totalSent: 0,
          totalRead: 0,
          unreadCount: 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get VAPID public key for push notifications
export const getVAPIDPublicKey = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, you'd get this from config
    const publicKey = process.env.PUSH_VAPID_PUBLIC_KEY || '';

    res.json({
      success: true,
      data: {
        publicKey,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Cancel scheduled notification (admin only)
export const cancelNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const { id } = req.params;
    
    const cancelled = await notificationService.cancel(id);

    res.json({
      success: true,
      data: {
        cancelled,
        message: cancelled ? 'Notification cancelled successfully' : 'Notification not found or already sent',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
