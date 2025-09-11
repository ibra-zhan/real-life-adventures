import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';

const router = Router();

// Health check
router.get('/health', notificationController.getNotificationHealth);

// Get notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// Get preferences
router.get('/preferences', notificationController.getPreferences);

// Update preferences
router.put('/preferences', notificationController.updatePreferences);

// Push notification endpoints
router.get('/vapid-key', notificationController.getVAPIDPublicKey);
router.post('/push/subscribe', notificationController.subscribeToPush);
router.post('/push/unsubscribe', notificationController.unsubscribeFromPush);
router.post('/push/test', notificationController.testPushNotification);

// Admin endpoints
router.post('/send', notificationController.sendNotification);
router.get('/stats', notificationController.getNotificationStats);
router.delete('/:id/cancel', notificationController.cancelNotification);

export default router;
