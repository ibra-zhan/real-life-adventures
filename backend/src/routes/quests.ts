import { Router } from 'express';
import { defaultLimiter, strictLimiter } from '@/middleware/rateLimiter';
import { authenticate } from '@/middleware/auth';
import * as questController from '@/controllers/questController';

const router = Router();

// Public quest routes
router.get('/', questController.getQuests);
router.get('/featured', questController.getFeaturedQuests);
router.get('/:id', questController.getQuestById);
router.get('/:id/submissions', questController.getQuestSubmissions);

// Protected quest routes (require authentication)
router.use(authenticate);

// Quest management
router.post('/', defaultLimiter, questController.createQuest);
router.put('/:id', defaultLimiter, questController.updateQuest);
router.delete('/:id', strictLimiter, questController.deleteQuest);

// Quest submissions
router.post('/submit', defaultLimiter, questController.submitQuest);

export default router;
