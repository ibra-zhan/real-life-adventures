import { Router } from 'express';
import { defaultLimiter } from '@/middleware/rateLimiter';
import { authenticate } from '@/middleware/auth';
import * as questProgressController from '@/controllers/questProgressController';

const router = Router();

// All quest progress routes require authentication
router.use(authenticate);

// Quest Progress Management
router.post('/start', defaultLimiter, questProgressController.startQuest);
router.post('/submit', defaultLimiter, questProgressController.submitQuest);
router.post('/:questId/complete', defaultLimiter, questProgressController.completeQuest);
router.get('/user', questProgressController.getUserQuests);
router.get('/user/stats', questProgressController.getUserStats);
router.get('/:questId', questProgressController.getQuestProgress);
router.post('/:questId/abandon', questProgressController.abandonQuest);

export default router;