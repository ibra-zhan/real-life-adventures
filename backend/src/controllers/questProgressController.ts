import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@/services/database';
import type { ApiResponse } from '@/types';
import { ValidationError, AuthenticationError, NotFoundError } from '@/middleware/errorHandler';

// Validation schemas
const startQuestSchema = z.object({
  questId: z.string().cuid(),
});

const submitQuestSchema = z.object({
  questId: z.string().cuid(),
  submission: z.object({
    type: z.enum(['PHOTO', 'VIDEO', 'TEXT', 'CHECKLIST']),
    caption: z.string().min(1).max(500),
    textContent: z.string().optional(),
    mediaUrls: z.array(z.string().url()).optional(),
    checklistData: z.any().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional(),
    privacy: z.enum(['public', 'private']).default('public'),
  }),
});

// const updateProgressSchema = z.object({
//   questId: z.string().cuid(),
//   currentStep: z.number().min(0),
//   progressData: z.any().optional(),
// });

// XP and Level calculation utilities
const calculateLevel = (totalXP: number): number => {
  // Level progression: Level 1 = 0-99 XP, Level 2 = 100-299 XP, Level 3 = 300-599 XP, etc.
  // Formula: XP needed for level N = (N-1) * 200 + 100
  let level = 1;
  let xpNeeded = 0;

  while (totalXP >= xpNeeded) {
    xpNeeded += level * 100;
    if (totalXP >= xpNeeded) {
      level++;
    }
  }

  return level;
};

const getXPForNextLevel = (currentLevel: number): number => {
  return currentLevel * 100;
};

const updateUserXP = async (userId: string, xpToAdd: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXP: true, currentLevel: true, questsCompleted: true, currentStreak: true, lastActivityDate: true }
  });

  if (!user) throw new NotFoundError('User not found');

  const newTotalXP = user.totalXP + xpToAdd;
  const newLevel = calculateLevel(newTotalXP);
  const leveledUp = newLevel > user.currentLevel;

  // Calculate streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
  lastActivity?.setHours(0, 0, 0, 0);

  let newStreak = user.currentStreak;
  if (lastActivity) {
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      // Consecutive day - increment streak
      newStreak += 1;
    } else if (daysDiff > 1) {
      // Streak broken - reset to 1
      newStreak = 1;
    }
    // Same day - keep current streak
  } else {
    // First activity
    newStreak = 1;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalXP: newTotalXP,
      currentLevel: newLevel,
      questsCompleted: user.questsCompleted + 1,
      currentStreak: newStreak,
      longestStreak: Math.max(user.currentStreak || 0, newStreak),
      lastActivityDate: new Date(),
    },
  });

  return { user: updatedUser, leveledUp, xpGained: xpToAdd };
};

// Controllers
export const startQuest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthenticationError('User not authenticated');

    const { questId } = startQuestSchema.parse(req.body);

    // Check if quest exists and is available
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: { category: true },
    });

    if (!quest) throw new NotFoundError('Quest not found');
    if (quest.status !== 'AVAILABLE') throw new ValidationError('Quest is not available');

    // Check if user already has progress for this quest
    const existingProgress = await prisma.userQuestProgress.findUnique({
      where: { userId_questId: { userId, questId } },
    });

    if (existingProgress && existingProgress.status !== 'NOT_STARTED' && existingProgress.status !== 'ABANDONED') {
      throw new ValidationError('Quest already started or completed');
    }

    // Create or update progress
    const progress = await prisma.userQuestProgress.upsert({
      where: { userId_questId: { userId, questId } },
      update: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        currentStep: 0,
        abandonedAt: null,
      },
      create: {
        userId,
        questId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        currentStep: 0,
        totalSteps: 1,
      },
      include: {
        quest: {
          include: { category: true },
        },
      },
    });

    const response: ApiResponse<typeof progress> = {
      success: true,
      data: progress,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    next(error);
  }
};

export const submitQuest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthenticationError('User not authenticated');

    const { questId, submission } = submitQuestSchema.parse(req.body);

    // Check if quest exists and user has progress
    const progress = await prisma.userQuestProgress.findUnique({
      where: { userId_questId: { userId, questId } },
      include: { quest: true },
    });

    if (!progress) throw new NotFoundError('Quest progress not found. Start the quest first.');
    if (progress.status !== 'IN_PROGRESS') throw new ValidationError('Quest is not in progress');

    // Create submission
    const newSubmission = await prisma.submission.create({
      data: {
        questId,
        userId,
        type: submission.type,
        caption: submission.caption,
        textContent: submission.textContent || null,
        mediaUrls: submission.mediaUrls ? submission.mediaUrls as any : null,
        checklistData: submission.checklistData ? submission.checklistData as any : null,
        latitude: submission.latitude || null,
        longitude: submission.longitude || null,
        address: submission.address || null,
        privacy: submission.privacy,
        status: 'PENDING', // Will be auto-approved for MVP
      },
    });

    // Update progress to submitted
    await prisma.userQuestProgress.update({
      where: { userId_questId: { userId, questId } },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Auto-approve submission for MVP and complete quest
    const approvedSubmission = await prisma.submission.update({
      where: { id: newSubmission.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    // Complete the quest and award XP
    const completedProgress = await prisma.userQuestProgress.update({
      where: { userId_questId: { userId, questId } },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        xpEarned: progress.quest.pointsReward,
      },
      include: {
        quest: {
          include: { category: true },
        },
      },
    });

    // Update user XP and level
    const { user: updatedUser, leveledUp, xpGained } = await updateUserXP(userId, progress.quest.pointsReward);

    // Update quest completion count
    await prisma.quest.update({
      where: { id: questId },
      data: {
        completionCount: { increment: 1 },
      },
    });

    const response: ApiResponse<{
      submission: typeof approvedSubmission;
      progress: typeof completedProgress;
      user: typeof updatedUser;
      rewards: { xpGained: number; leveledUp: boolean };
    }> = {
      success: true,
      data: {
        submission: approvedSubmission,
        progress: completedProgress,
        user: updatedUser,
        rewards: { xpGained, leveledUp },
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    next(error);
  }
};

export const getQuestProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthenticationError('User not authenticated');

    const { questId } = req.params;
    if (!questId) throw new ValidationError('Quest ID is required');

    const progress = await prisma.userQuestProgress.findUnique({
      where: { userId_questId: { userId, questId } },
      include: {
        quest: {
          include: { category: true },
        },
      },
    });

    if (!progress) {
      // Return NOT_STARTED status if no progress exists
      const quest = await prisma.quest.findUnique({
        where: { id: questId },
        include: { category: true },
      });

      if (!quest) throw new NotFoundError('Quest not found');

      const response: ApiResponse<{
        status: string;
        quest: typeof quest;
      }> = {
        success: true,
        data: {
          status: 'NOT_STARTED',
          quest,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
      return;
    }

    const response: ApiResponse<typeof progress> = {
      success: true,
      data: progress,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getUserQuests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthenticationError('User not authenticated');

    const { status, page = 1, limit = 20 } = req.query;

    const where: any = { userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const quests = await prisma.userQuestProgress.findMany({
      where,
      include: {
        quest: {
          include: { category: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { updatedAt: 'desc' },
      ],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.userQuestProgress.count({ where });

    const response: ApiResponse<typeof quests> = {
      success: true,
      data: quests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const abandonQuest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthenticationError('User not authenticated');

    const { questId } = req.params;
    if (!questId) throw new ValidationError('Quest ID is required');

    const progress = await prisma.userQuestProgress.findUnique({
      where: { userId_questId: { userId, questId } },
    });

    if (!progress) throw new NotFoundError('Quest progress not found');
    if (progress.status !== 'IN_PROGRESS') throw new ValidationError('Can only abandon quests in progress');

    const updatedProgress = await prisma.userQuestProgress.update({
      where: { userId_questId: { userId, questId } },
      data: {
        status: 'ABANDONED',
        abandonedAt: new Date(),
      },
      include: {
        quest: {
          include: { category: true },
        },
      },
    });

    const response: ApiResponse<typeof updatedProgress> = {
      success: true,
      data: updatedProgress,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthenticationError('User not authenticated');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalXP: true,
        currentLevel: true,
        questsCompleted: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');

    const xpForNextLevel = getXPForNextLevel(user.currentLevel);
    const xpInCurrentLevel = user.totalXP - (user.currentLevel - 1) * 100;

    const stats = {
      totalXP: user.totalXP,
      currentLevel: user.currentLevel,
      xpForNextLevel,
      xpInCurrentLevel,
      xpProgress: Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100),
      questsCompleted: user.questsCompleted,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
    };

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const completeQuest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthenticationError('User not authenticated');

    const { questId } = req.params;
    if (!questId) throw new ValidationError('Quest ID is required');

    // Check if quest exists and user has it in progress
    const progress = await prisma.userQuestProgress.findUnique({
      where: { userId_questId: { userId, questId } },
      include: {
        quest: {
          include: { category: true },
        },
      },
    });

    if (!progress) throw new NotFoundError('Quest not started');
    if (progress.status !== 'IN_PROGRESS') throw new ValidationError('Quest is not in progress');

    // Complete the quest and award XP
    const quest = progress.quest;
    const xpGained = quest.pointsReward || 100;

    // Update progress to completed
    const updatedProgress = await prisma.userQuestProgress.update({
      where: { userId_questId: { userId, questId } },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        xpEarned: xpGained,
      },
      include: {
        quest: {
          include: { category: true },
        },
      },
    });

    // Update user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundError('User not found');

    const newTotalXP = (user.totalXP || 0) + xpGained;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > (user.currentLevel || 1);

    // Update streak
    const today = new Date();
    const lastActivity = user.lastActivityDate;
    let newStreak = user.currentStreak || 0;

    if (lastActivity) {
      const daysSinceLastActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastActivity === 0) {
        // Same day, keep streak
      } else if (daysSinceLastActivity === 1) {
        // Next day, increment streak
        newStreak += 1;
      } else {
        // More than one day, reset streak
        newStreak = 1;
      }
    } else {
      // First activity
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: newTotalXP,
        currentLevel: newLevel,
        questsCompleted: (user.questsCompleted || 0) + 1,
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak || 0, newStreak),
        lastActivityDate: today,
      },
    });

    // Also update quest completion count
    await prisma.quest.update({
      where: { id: questId },
      data: {
        completionCount: {
          increment: 1,
        },
      },
    });

    const response: ApiResponse<{
      progress: typeof updatedProgress;
      rewards: {
        xpGained: number;
        leveledUp: boolean;
        newLevel: number;
        newTotalXP: number;
        streakIncreased: boolean;
        newStreak: number;
      };
    }> = {
      success: true,
      data: {
        progress: updatedProgress,
        rewards: {
          xpGained,
          leveledUp,
          newLevel,
          newTotalXP,
          streakIncreased: newStreak > (user.currentStreak || 0),
          newStreak,
        },
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};