// Gamification Controller for SideQuest
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { gamificationService } from '../services/gamificationService';
import { AuthenticationError } from '../middleware/errorHandler';

// Validation schemas
const userIdSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
});

const levelSchema = z.object({
  level: z.number().int().min(1).max(100),
});

// Get user's gamification stats
export const getGamificationStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const stats = await gamificationService.getGamificationStats(userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get user's level information
export const getUserLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const userLevel = await gamificationService.getUserLevel(userId);

    res.json({
      success: true,
      data: userLevel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get level progress
export const getLevelProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const progress = await gamificationService.getLevelProgress(userId);

    res.json({
      success: true,
      data: progress,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get level configuration
export const getLevelConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level } = levelSchema.parse(req.params);
    
    const config = await gamificationService.getLevelConfig(level);

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get all level configurations
export const getAllLevelConfigs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = gamificationService.getAllLevelConfigs();

    res.json({
      success: true,
      data: configs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get user's badges
export const getUserBadges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const badges = await gamificationService.getUserBadges(userId);

    res.json({
      success: true,
      data: badges,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get badge progress
export const getBadgeProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { badgeId } = req.params;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const progress = await gamificationService.getBadgeProgress(userId, badgeId);

    res.json({
      success: true,
      data: { progress },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get all available badges
export const getAllBadges = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const badges = gamificationService.getAllBadges();

    res.json({
      success: true,
      data: badges,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get badges by type
export const getBadgesByType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    
    const badges = gamificationService.getBadgesByType(type);

    res.json({
      success: true,
      data: badges,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get badges by rarity
export const getBadgesByRarity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rarity } = req.params;
    
    const badges = gamificationService.getBadgesByRarity(rarity);

    res.json({
      success: true,
      data: badges,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Add XP (admin only)
export const addXP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const addXPSchema = z.object({
      userId: z.string().cuid(),
      amount: z.number().int().min(1),
      source: z.string().min(1),
      sourceId: z.string().optional(),
    });

    const { userId: targetUserId, amount, source, sourceId } = addXPSchema.parse(req.body);
    
    await gamificationService.addXP(targetUserId, amount, source, sourceId);

    res.json({
      success: true,
      data: {
        message: `Added ${amount} XP to user ${targetUserId}`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Award badge (admin only)
export const awardBadge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const awardBadgeSchema = z.object({
      userId: z.string().cuid(),
      badgeId: z.string().min(1),
    });

    const { userId: targetUserId, badgeId } = awardBadgeSchema.parse(req.body);
    
    const userBadge = await gamificationService.awardBadge(targetUserId, badgeId);

    res.json({
      success: true,
      data: userBadge,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Health check for gamification system
export const getGamificationHealth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'Gamification system is operational',
        services: {
          xpLeveling: 'active',
          badgeSystem: 'active',
          achievementSystem: 'pending',
          streakTracking: 'pending',
          leaderboards: 'pending',
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
