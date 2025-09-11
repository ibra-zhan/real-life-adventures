// Media API Routes for SideQuest
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { defaultLimiter } from '../middleware/rateLimiter';
import {
  getMediaFiles,
  getMediaStats,
  getMediaHealth,
} from '../controllers/mediaController';

const router = Router();

// Public routes
router.get('/health', getMediaHealth);

// Protected routes (require authentication)
router.use(authenticate);

// General file uploads
// router.post('/upload', uploadLimiter, uploadFile);

// Media management
router.get('/', defaultLimiter, getMediaFiles);
router.get('/stats', defaultLimiter, getMediaStats);

export default router;
