import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@/services/database';
import { aiQuestGenerator, type QuestGenerationInput } from '@/services/aiQuestGenerator';
import type { ApiResponse } from '@/types';
import { ValidationError, AuthenticationError } from '@/middleware/errorHandler';

// Validation schemas
const generateQuestSchema = z.object({
  mode: z.enum(['quick', 'custom']).default('quick'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'epic']).default('easy'),
  category: z.enum(['fitness', 'learning']).optional(),
  count: z.number().min(1).max(10).default(1),
});

const saveGeneratedQuestSchema = z.object({
  questData: z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(2000),
    shortDescription: z.string().min(5).max(200),
    instructions: z.string().max(1000).optional(),
    categoryId: z.string().cuid(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'epic']),
    tags: z.array(z.string()).max(10),
    requirements: z.array(z.string()).min(1).max(10),
    points: z.number().min(10).max(10000),
    estimatedTime: z.number().min(0).max(1440),
    submissionTypes: z.array(z.enum(['PHOTO', 'VIDEO', 'TEXT', 'CHECKLIST'])).min(1),
    locationRequired: z.boolean(),
    locationType: z.enum(['indoor', 'outdoor', 'specific']).optional(),
    specificLocation: z.string().optional(),
    allowSharing: z.boolean(),
    encourageSharing: z.boolean(),
    imageUrl: z.string().url().optional(),
  }),
  autoPublish: z.boolean().default(false),
});


// Controllers
export const generateQuest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }
    
    const validatedData = generateQuestSchema.parse(req.body);
    
    // Build generation input
    const input: QuestGenerationInput = {
      mode: validatedData.mode,
      difficulty: validatedData.difficulty,
      ...(validatedData.category && { category: validatedData.category }),
      userId,
    };
    
    // Generate quest(s)
    let generatedQuests;
    if (validatedData.count === 1) {
      const quest = await aiQuestGenerator.generateQuest(input);
      generatedQuests = [quest];
    } else {
      generatedQuests = await aiQuestGenerator.generateQuestBatch(input, validatedData.count);
    }
    
    // Add generation metadata
    const questsWithMetadata = generatedQuests.map(quest => ({
      ...quest,
      generatedAt: new Date().toISOString(),
      generationContext: {
        userId,
        mode: validatedData.mode,
        difficultyRequested: validatedData.difficulty,
        categoryRequested: validatedData.category,
      }
    }));
    
    const response: ApiResponse<typeof questsWithMetadata> = {
      success: true,
      data: questsWithMetadata,
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

export const saveGeneratedQuest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }
    
    const validatedData = saveGeneratedQuestSchema.parse(req.body);
    const { questData, autoPublish } = validatedData;
    
    // Check if category exists
    const category = await prisma.questCategory.findUnique({
      where: { id: questData.categoryId }
    });
    
    if (!category) {
      throw new ValidationError('Invalid category ID');
    }
    
    // Determine quest status
    let status = 'DRAFT';
    if (autoPublish) {
      // Only admins and moderators can auto-publish
      if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
        status = 'AVAILABLE';
      }
    }
    
    // Create the quest
    const quest = await prisma.quest.create({
      data: {
        title: questData.title,
        description: questData.description,
        shortDescription: questData.shortDescription,
        instructions: questData.instructions || null,
        categoryId: questData.categoryId,
        difficulty: questData.difficulty.toUpperCase() as any,
        tags: JSON.stringify(questData.tags),
        requirements: JSON.stringify(questData.requirements),
        estimatedTime: questData.estimatedTime,
        submissionTypes: JSON.stringify(questData.submissionTypes),
        locationRequired: questData.locationRequired,
        locationType: questData.locationType || null,
        specificLocation: questData.specificLocation || null,
        allowSharing: questData.allowSharing,
        imageUrl: questData.imageUrl || null,
        createdBy: userId,
        status: status as any,
        // Mark as AI-generated
        isFeatured: false, // Can be promoted later
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            color: true,
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          }
        }
      },
    });
    
    const response: ApiResponse<typeof quest> = {
      success: true,
      data: quest,
      timestamp: new Date().toISOString(),
    };
    
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    next(error);
  }
};


export const getGenerationStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }
    
    // Get user's quest generation and completion stats
    const [userQuests, completedSubmissions, categories] = await Promise.all([
      prisma.quest.findMany({
        where: { createdBy: userId },
        select: {
          id: true,
          difficulty: true,
          status: true,
          completionCount: true,
          createdAt: true,
          category: { select: { name: true } }
        }
      }),
      prisma.submission.count({
        where: { 
          userId,
          status: 'APPROVED'
        }
      }),
      prisma.questCategory.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      })
    ]);
    
    // Calculate stats
    const totalCreated = userQuests.length;
    const publishedQuests = userQuests.filter(q => q.status === 'AVAILABLE').length;
    const totalCompletions = userQuests.reduce((sum, q) => sum + q.completionCount, 0);
    
    const difficultyDistribution = userQuests.reduce((acc, quest) => {
      acc[quest.difficulty] = (acc[quest.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryDistribution = userQuests.reduce((acc, quest) => {
      const categoryName = quest.category.name;
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentQuests = userQuests.filter(q => 
      new Date(q.createdAt) > thirtyDaysAgo
    ).length;
    
    const stats = {
      questCreation: {
        totalCreated,
        publishedQuests,
        draftQuests: totalCreated - publishedQuests,
        totalCompletions,
        averageCompletionsPerQuest: totalCreated > 0 ? (totalCompletions / totalCreated).toFixed(1) : '0',
        recentActivity: recentQuests,
      },
      questCompletion: {
        totalCompleted: completedSubmissions,
        completionRate: totalCreated > 0 ? ((completedSubmissions / totalCreated) * 100).toFixed(1) : '0',
      },
      distributions: {
        difficulty: difficultyDistribution,
        category: categoryDistribution,
      },
      recommendations: generateRecommendations(userQuests, completedSubmissions, categories),
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

export const getPersonalizedSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }
    
    // Get user context for personalization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        submissions: {
          where: { status: 'APPROVED' },
          include: { quest: { include: { category: true } } },
          orderBy: { submittedAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    // Analyze user patterns
    const completedCategories = user.submissions.map(s => s.quest.category.name);
    const categoryCounts = completedCategories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
    
    // Generate suggestions based on patterns
    const suggestions = {
      exploreNewCategories: await suggestNewCategories(favoriteCategories, userId),
      nextDifficultyLevel: suggestNextDifficulty(user.submissions),
      basedOnRecentActivity: await suggestBasedOnActivity(user.submissions),
      seasonalSuggestions: generateSeasonalSuggestions(),
      streakMaintenance: generateStreakSuggestions(0),
    };
    
    const response: ApiResponse<typeof suggestions> = {
      success: true,
      data: suggestions,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Helper methods removed - now using AI for quest generation

const generateRecommendations = (userQuests: any[], completedSubmissions: number, _categories: any[]) => {
  const recommendations = [];
  
  if (userQuests.length === 0) {
    recommendations.push({
      type: 'getting_started',
      message: 'Try generating your first quest! Start with an easy difficulty to get familiar with the system.',
      action: 'generate_easy_quest'
    });
  }
  
  if (completedSubmissions < 3) {
    recommendations.push({
      type: 'complete_quests',
      message: 'Complete a few quests to unlock better personalization and quest generation.',
      action: 'browse_quests'
    });
  }
  
  const difficultyCount = userQuests.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  if ((difficultyCount.EASY || 0) > 5 && (difficultyCount.MEDIUM || 0) === 0) {
    recommendations.push({
      type: 'try_medium',
      message: "You've mastered easy quests! Try generating a medium difficulty quest for a new challenge.",
      action: 'generate_medium_quest'
    });
  }
  
  return recommendations;
};

const suggestNewCategories = async (favoriteCategories: string[], _userId: string) => {
  const allCategories = await prisma.questCategory.findMany({
    where: { isActive: true }
  });
  
  const unexplored = allCategories.filter(cat => 
    !favoriteCategories.includes(cat.name)
  ).slice(0, 3);
  
  return unexplored.map(cat => ({
    category: cat.name,
    reason: `Explore ${cat.description?.toLowerCase() || 'this category'}`,
    icon: cat.icon
  }));
};

const suggestNextDifficulty = (submissions: any[]) => {
  if (submissions.length === 0) return { suggested: 'EASY', reason: 'Start with easy quests to build confidence' };
  
  const difficulties = submissions.map(s => s.quest.difficulty);
  const easyCount = difficulties.filter(d => d === 'EASY').length;
  const mediumCount = difficulties.filter(d => d === 'MEDIUM').length;
  const hardCount = difficulties.filter(d => d === 'HARD').length;
  
  if (easyCount >= 3 && mediumCount === 0) {
    return { suggested: 'MEDIUM', reason: 'Ready for medium difficulty challenges' };
  }
  
  if (mediumCount >= 3 && hardCount === 0) {
    return { suggested: 'HARD', reason: 'Time for harder challenges' };
  }
  
  if (hardCount >= 2) {
    return { suggested: 'EPIC', reason: 'Ready for epic adventures' };
  }
  
  return { suggested: 'EASY', reason: 'Continue building experience' };
};

const suggestBasedOnActivity = async (submissions: any[]) => {
  if (submissions.length === 0) return [];
  
  const recentCategories = submissions.slice(0, 3).map(s => s.quest.category.name);
  const suggestions = [];
  
  if (recentCategories.includes('Fitness')) {
    suggestions.push({
      theme: 'Mindfulness Recovery',
      reason: 'Balance your fitness activities with mindful recovery'
    });
  }
  
  if (recentCategories.includes('Social')) {
    suggestions.push({
      theme: 'Personal Reflection',
      reason: 'Complement social activities with personal growth'
    });
  }
  
  return suggestions;
};

const generateSeasonalSuggestions = () => {
  const month = new Date().getMonth();
  const seasons = {
    winter: [11, 0, 1],
    spring: [2, 3, 4],
    summer: [5, 6, 7],
    fall: [8, 9, 10]
  };
  
  let currentSeason = 'spring';
  for (const [season, months] of Object.entries(seasons)) {
    if (months.includes(month)) {
      currentSeason = season;
      break;
    }
  }
  
  const seasonalQuests = {
    winter: ['Indoor creativity', 'Cozy social gatherings', 'Learning new skills'],
    spring: ['Outdoor exploration', 'Garden projects', 'Fresh start challenges'],
    summer: ['Adventure quests', 'Photography expeditions', 'Community events'],
    fall: ['Harvest activities', 'Preparation challenges', 'Gratitude practices']
  };
  
  return {
    season: currentSeason,
    suggestions: seasonalQuests[currentSeason as keyof typeof seasonalQuests] || []
  };
};

const generateStreakSuggestions = (currentStreak: number) => {
  if (currentStreak === 0) {
    return {
      message: 'Start a quest streak! Complete quests on consecutive days.',
      suggestion: 'Try an easy daily quest to begin your streak'
    };
  }
  
  if (currentStreak < 7) {
    return {
      message: `Great start! You're on a ${currentStreak}-day streak.`,
      suggestion: 'Keep it going with consistent daily quests'
    };
  }
  
  if (currentStreak >= 7) {
    return {
      message: `Amazing! ${currentStreak} days strong!`,
      suggestion: 'Consider an epic quest to celebrate your dedication'
    };
  }
  
  return {
    message: 'Maintain your momentum',
    suggestion: 'Try varying quest types to keep things interesting'
  };
};
