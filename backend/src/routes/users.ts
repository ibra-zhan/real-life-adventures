import { Router } from 'express';
import { defaultLimiter, strictLimiter } from '@/middleware/rateLimiter';
import { authenticate } from '@/middleware/auth';
import * as userController from '@/controllers/userController';

const router = Router();

// Public user routes
router.get('/profile/:username', userController.getPublicProfile);

// Protected user routes (require authentication)
router.use(authenticate);

// Profile management
router.put('/profile', defaultLimiter, userController.updateProfile);
router.put('/preferences', defaultLimiter, userController.updatePreferences);
router.put('/username', strictLimiter, userController.updateUsername);
router.put('/password', strictLimiter, userController.changePassword);

// Account management
router.delete('/account', strictLimiter, userController.deleteAccount);

// User stats
router.get('/stats', userController.getUserStats);

export default router;
