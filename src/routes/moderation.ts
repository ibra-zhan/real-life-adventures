// Moderation API Routes for SideQuest
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import {
  moderateContent,
  getModerationResult,
  updateModerationResult,
  getModerationStats,
  getModerationQueue,
  processModerationQueue,
  getModerationHealth,
} from '../controllers/moderationController';

const router = Router();

// Public routes
router.get('/health', getModerationHealth);

// Protected routes (require authentication)
router.use(authenticate);

// Content moderation
router.post('/moderate', defaultLimiter, moderateContent);
router.get('/result/:contentId', defaultLimiter, getModerationResult);

// Admin routes (require admin role - checked in controller)
router.put('/result/:resultId', strictLimiter, updateModerationResult);
router.get('/stats', defaultLimiter, getModerationStats);
router.get('/queue', defaultLimiter, getModerationQueue);
router.post('/queue/process', strictLimiter, processModerationQueue);

export default router;
