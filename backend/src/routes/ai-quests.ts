import { Router } from 'express';
import { defaultLimiter } from '@/middleware/rateLimiter';
import { authenticate } from '@/middleware/auth';
import * as aiQuestController from '@/controllers/aiQuestController';

const router = Router();

// All AI quest routes require authentication
router.use(authenticate);

// AI Quest Generation Routes
router.post('/generate', defaultLimiter, aiQuestController.generateQuest);
router.post('/save', defaultLimiter, aiQuestController.saveGeneratedQuest);
router.post('/from-idea', defaultLimiter, aiQuestController.generateQuestFromIdea);

// AI Quest Analytics and Personalization
router.get('/stats', aiQuestController.getGenerationStats);
router.get('/suggestions', aiQuestController.getPersonalizedSuggestions);

export default router;
