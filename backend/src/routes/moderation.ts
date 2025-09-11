import { Router } from 'express';
import { moderationController } from '../controllers/moderationController';

const router = Router();

// Health check
router.get('/health', moderationController.getModerationHealth);

// Moderate content
router.post('/moderate', moderationController.moderateContent);

// Get moderation result
router.get('/result/:contentId', moderationController.getModerationResult);

// Admin endpoints
router.put('/result/:resultId', moderationController.updateModerationResult);
router.get('/stats', moderationController.getModerationStats);
router.get('/queue', moderationController.getModerationQueue);
router.post('/queue/process', moderationController.processModerationQueue);

export default router;
