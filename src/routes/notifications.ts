// Notification API Routes for SideQuest
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  subscribeToPush,
  unsubscribeFromPush,
  sendNotification,
  testPushNotification,
  getNotificationStats,
  getVAPIDPublicKey,
  cancelNotification,
} from '../controllers/notificationController';

const router = Router();

// Public routes
router.get('/vapid-key', getVAPIDPublicKey);

// Protected routes (require authentication)
router.use(authenticate);

// User notification management
router.get('/', defaultLimiter, getNotifications);
router.get('/unread-count', defaultLimiter, getUnreadCount);
router.put('/:id/read', defaultLimiter, markAsRead);
router.put('/read-all', defaultLimiter, markAllAsRead);

// Notification preferences
router.get('/preferences', defaultLimiter, getPreferences);
router.put('/preferences', defaultLimiter, updatePreferences);

// Push notification subscription management
router.post('/push/subscribe', defaultLimiter, subscribeToPush);
router.post('/push/unsubscribe', defaultLimiter, unsubscribeFromPush);
router.post('/push/test', defaultLimiter, testPushNotification);

// Admin routes (require admin role - checked in controller)
router.post('/send', strictLimiter, sendNotification);
router.get('/stats', defaultLimiter, getNotificationStats);
router.delete('/:id/cancel', strictLimiter, cancelNotification);

export default router;
