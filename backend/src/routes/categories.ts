import { Router } from 'express';
import { defaultLimiter, strictLimiter } from '@/middleware/rateLimiter';
import { authenticate } from '@/middleware/auth';
import * as categoryController from '@/controllers/categoryController';

const router = Router();

// Public category routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/quests', categoryController.getCategoryQuests);

// Protected category routes (require authentication and admin/moderator role)
router.use(authenticate);

router.post('/', strictLimiter, categoryController.createCategory);
router.put('/:id', defaultLimiter, categoryController.updateCategory);
router.delete('/:id', strictLimiter, categoryController.deleteCategory);

export default router;
