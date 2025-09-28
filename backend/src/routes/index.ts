import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import questRoutes from './quests';
import categoryRoutes from './categories';
import aiQuestRoutes from './ai-quests';
import questProgressRoutes from './quest-progress';
import mediaRoutes from './media';
import submissionRoutes from './submissions';
import notificationRoutes from './notifications';
import moderationRoutes from './moderation';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/quests', questRoutes);
router.use('/categories', categoryRoutes);
router.use('/ai-quests', aiQuestRoutes);
router.use('/quest-progress', questProgressRoutes);
router.use('/media', mediaRoutes);
router.use('/submissions', submissionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/moderation', moderationRoutes);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'SideQuest API',
      version: '1.0.0',
      description: 'Transform daily moments into exciting challenges',
      endpoints: {
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          refreshToken: 'POST /api/auth/refresh-token',
          logout: 'POST /api/auth/logout',
          logoutAll: 'POST /api/auth/logout-all',
          forgotPassword: 'POST /api/auth/forgot-password',
          resetPassword: 'POST /api/auth/reset-password',
          profile: 'GET /api/auth/profile',
        },
        users: {
          publicProfile: 'GET /api/users/profile/:username',
          updateProfile: 'PUT /api/users/profile',
          updatePreferences: 'PUT /api/users/preferences',
          updateUsername: 'PUT /api/users/username',
          changePassword: 'PUT /api/users/password',
          deleteAccount: 'DELETE /api/users/account',
          getUserStats: 'GET /api/users/stats',
        },
        quests: {
          getQuests: 'GET /api/quests',
          getFeaturedQuests: 'GET /api/quests/featured',
          getQuestById: 'GET /api/quests/:id',
          createQuest: 'POST /api/quests',
          updateQuest: 'PUT /api/quests/:id',
          deleteQuest: 'DELETE /api/quests/:id',
          submitQuest: 'POST /api/quests/submit',
          getQuestSubmissions: 'GET /api/quests/:id/submissions',
        },
        categories: {
          getCategories: 'GET /api/categories',
          getCategoryById: 'GET /api/categories/:id',
          getCategoryQuests: 'GET /api/categories/:id/quests',
          createCategory: 'POST /api/categories',
          updateCategory: 'PUT /api/categories/:id',
          deleteCategory: 'DELETE /api/categories/:id',
        },
              'ai-quests': {
                generateQuest: 'POST /api/ai-quests/generate',
                saveGeneratedQuest: 'POST /api/ai-quests/save',
                generateFromIdea: 'POST /api/ai-quests/from-idea',
                getGenerationStats: 'GET /api/ai-quests/stats',
                getPersonalizedSuggestions: 'GET /api/ai-quests/suggestions',
              },
              'quest-progress': {
                startQuest: 'POST /api/quest-progress/start',
                submitQuest: 'POST /api/quest-progress/submit',
                completeQuest: 'POST /api/quest-progress/:questId/complete',
                getUserQuests: 'GET /api/quest-progress/user',
                getUserStats: 'GET /api/quest-progress/user/stats',
                getQuestProgress: 'GET /api/quest-progress/:questId',
                abandonQuest: 'POST /api/quest-progress/:questId/abandon',
              },
              media: {
                getUploadConfig: 'GET /api/media/config/:category',
                validateFile: 'POST /api/media/validate',
                uploadFile: 'POST /api/media/upload',
                uploadMultiple: 'POST /api/media/upload/multiple',
                uploadAvatar: 'POST /api/media/upload/avatar',
                uploadQuestImage: 'POST /api/media/upload/quest-image',
                uploadQuestVideo: 'POST /api/media/upload/quest-video',
                uploadSubmission: 'POST /api/media/upload/submission',
                uploadCategoryIcon: 'POST /api/media/upload/category-icon',
                uploadBadgeImage: 'POST /api/media/upload/badge-image',
                getMediaFiles: 'GET /api/media',
                getMediaStats: 'GET /api/media/stats',
                getMediaFile: 'GET /api/media/:id',
                downloadMediaFile: 'GET /api/media/:id/download',
                updateMediaFile: 'PUT /api/media/:id',
                deleteMediaFile: 'DELETE /api/media/:id',
                getMediaHealth: 'GET /api/media/health',
              },
              submissions: {
                submitQuestWithMedia: 'POST /api/submissions',
                getSubmissionById: 'GET /api/submissions/:id',
                updateSubmission: 'PUT /api/submissions/:id',
                deleteSubmission: 'DELETE /api/submissions/:id',
              },
              notifications: {
                getVAPIDPublicKey: 'GET /api/notifications/vapid-key',
                getNotifications: 'GET /api/notifications',
                getUnreadCount: 'GET /api/notifications/unread-count',
                markAsRead: 'PUT /api/notifications/:id/read',
                markAllAsRead: 'PUT /api/notifications/read-all',
                getPreferences: 'GET /api/notifications/preferences',
                updatePreferences: 'PUT /api/notifications/preferences',
                subscribeToPush: 'POST /api/notifications/push/subscribe',
                unsubscribeFromPush: 'POST /api/notifications/push/unsubscribe',
                testPushNotification: 'POST /api/notifications/push/test',
                sendNotification: 'POST /api/notifications/send (Admin)',
                getNotificationStats: 'GET /api/notifications/stats (Admin)',
                cancelNotification: 'DELETE /api/notifications/:id/cancel (Admin)',
              },
              moderation: {
                getModerationHealth: 'GET /api/moderation/health',
                moderateContent: 'POST /api/moderation/moderate',
                getModerationResult: 'GET /api/moderation/result/:contentId',
                updateModerationResult: 'PUT /api/moderation/result/:resultId (Admin)',
                getModerationStats: 'GET /api/moderation/stats (Admin)',
                getModerationQueue: 'GET /api/moderation/queue (Admin)',
                processModerationQueue: 'POST /api/moderation/queue/process (Admin)',
              },
              health: 'GET /health',
      }
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
