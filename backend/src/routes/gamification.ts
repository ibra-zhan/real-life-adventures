import { Router } from 'express';
import { gamificationController } from '../controllers/gamificationController';

const router = Router();

// Health check
router.get('/health', gamificationController.getGamificationHealth);

// Get stats
router.get('/stats', gamificationController.getGamificationStats);

// Level endpoints
router.get('/level', gamificationController.getUserLevel);
router.get('/level/progress', gamificationController.getLevelProgress);
router.get('/level/:level', gamificationController.getLevelConfig);
router.get('/levels', gamificationController.getAllLevelConfigs);

// Badge endpoints
router.get('/badges/user', gamificationController.getUserBadges);
router.get('/badges/:badgeId/progress', gamificationController.getBadgeProgress);
router.get('/badges', gamificationController.getAllBadges);
router.get('/badges/type/:type', gamificationController.getBadgesByType);
router.get('/badges/rarity/:rarity', gamificationController.getBadgesByRarity);

// Admin endpoints
router.post('/xp', gamificationController.addXP);
router.post('/badges/award', gamificationController.awardBadge);

export default router;
