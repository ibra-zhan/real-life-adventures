import { Router } from 'express';
import { strictLimiter } from '@/middleware/rateLimiter';
import { authenticate } from '@/middleware/auth';
import * as authController from '@/controllers/authController';

const router = Router();

// Public authentication routes
router.post('/register', strictLimiter, authController.register);
router.post('/login', strictLimiter, authController.login);
router.post('/refresh-token', strictLimiter, authController.refreshToken);
router.post('/forgot-password', strictLimiter, authController.forgotPassword);
router.post('/reset-password', strictLimiter, authController.resetPassword);

// Protected authentication routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/profile', authenticate, authController.getProfile);

export default router;
