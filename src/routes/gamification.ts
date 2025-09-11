// Gamification API Routes for SideQuest
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { defaultLimiter, strictLimiter } from '../middleware/rateLimiter';
import {
  getGamificationStats,
  getUserLevel,
  getLevelProgress,
  getLevelConfig,
  getAllLevelConfigs,
  getUserBadges,
  getBadgeProgress,
  getAllBadges,
  getBadgesByType,
  getBadgesByRarity,
  addXP,
  awardBadge,
  getGamificationHealth,
} from '../controllers/gamificationController';

const router = Router();

// Public routes
router.get('/health', getGamificationHealth);
router.get('/levels', getAllLevelConfigs);
router.get('/badges', getAllBadges);
router.get('/badges/type/:type', getBadgesByType);
router.get('/badges/rarity/:rarity', getBadgesByRarity);

// Protected routes (require authentication)
router.use(authenticate);

// User gamification data
router.get('/stats', defaultLimiter, getGamificationStats);
router.get('/level', defaultLimiter, getUserLevel);
router.get('/level/progress', defaultLimiter, getLevelProgress);
router.get('/level/:level', defaultLimiter, getLevelConfig);
router.get('/badges/user', defaultLimiter, getUserBadges);
router.get('/badges/:badgeId/progress', defaultLimiter, getBadgeProgress);

// Admin routes (require admin role - checked in controller)
router.post('/xp', strictLimiter, addXP);
router.post('/badges/award', strictLimiter, awardBadge);

export default router;
