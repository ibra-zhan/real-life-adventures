import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/services/database';
import type { ApiResponse } from '@/types';
import { ValidationError, NotFoundError, AuthorizationError } from '@/middleware/errorHandler';

// Validation schemas
const createQuestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  shortDescription: z.string().min(5, 'Short description must be at least 5 characters').max(200, 'Short description must be less than 200 characters'),
  instructions: z.string().max(1000, 'Instructions must be less than 1000 characters').optional(),
  categoryId: z.string().cuid('Invalid category ID'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EPIC']),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed').max(10, 'Maximum 10 requirements allowed'),
  points: z.number().min(10, 'Points must be at least 10').max(10000, 'Points must be less than 10000'),
  estimatedTime: z.number().min(0, 'Estimated time cannot be negative').max(1440, 'Estimated time cannot exceed 24 hours'),
  submissionTypes: z.array(z.enum(['PHOTO', 'VIDEO', 'TEXT', 'CHECKLIST'])).min(1, 'At least one submission type required'),
  locationRequired: z.boolean().default(false),
  locationType: z.enum(['indoor', 'outdoor', 'specific']).optional(),
  specificLocation: z.string().optional(),
  allowSharing: z.boolean().default(true),
  encourageSharing: z.boolean().default(false),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateQuestSchema = createQuestSchema.partial();

const questFiltersSchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().min(1)),
  limit: z.string().default('20').transform(Number).pipe(z.number().min(1).max(100)),
  category: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EPIC']).optional(),
  tags: z.string().optional(), // Comma-separated tags
  featured: z.string().transform(val => val === 'true').optional(),
  status: z.enum(['DRAFT', 'AVAILABLE', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'ARCHIVED']).optional(),
  search: z.string().min(2).optional(),
  sort: z.enum(['created', 'updated', 'points', 'difficulty', 'popularity', 'title']).default('created'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const submitQuestSchema = z.object({
  questId: z.string().cuid('Invalid quest ID'),
  caption: z.string().min(1, 'Caption is required').max(500, 'Caption must be less than 500 characters'),
  textContent: z.string().max(2000, 'Text content must be less than 2000 characters').optional(),
  mediaUrls: z.array(z.string().url()).max(5, 'Maximum 5 media files allowed').optional(),
  checklistData: z.record(z.string(), z.boolean()).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  privacy: z.enum(['public', 'friends', 'private']).default('public'),
});

// Helper functions
const buildQuestFilters = (filters: any) => {
  const where: any = {};
  
  if (filters.category) {
    where.category = { name: { contains: filters.category, mode: 'insensitive' } };
  }
  
  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }
  
  if (filters.featured !== undefined) {
    where.isFeatured = filters.featured;
  }
  
  if (filters.status) {
    where.status = filters.status;
  } else {
    // Default to available quests for public queries
    where.status = 'AVAILABLE';
  }
  
  if (filters.tags) {
    const tagArray = filters.tags.split(',').map((tag: string) => tag.trim());
    // For SQLite with JSON, we need to use a different approach
    where.OR = tagArray.map((tag: string) => ({
      tags: { path: '$', string_contains: tag }
    }));
  }
  
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { shortDescription: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  
  return where;
};

const buildQuestOrderBy = (sort: string, order: string) => {
  const orderBy: any = {};
  
  switch (sort) {
    case 'created':
      orderBy.createdAt = order;
      break;
    case 'updated':
      orderBy.updatedAt = order;
      break;
    case 'points':
      orderBy.points = order;
      break;
    case 'difficulty':
      // Custom ordering for difficulty
      orderBy.difficulty = order;
      break;
    case 'popularity':
      orderBy.completionCount = order;
      break;
    case 'title':
      orderBy.title = order;
      break;
    default:
      orderBy.createdAt = 'desc';
  }
  
  return orderBy;
};

// Controllers
export const getQuests = async (req: Request, res: Response) => {
  try {
    const filters = questFiltersSchema.parse(req.query);
    const { page, limit, sort, order, ...queryFilters } = filters;
    
    const skip = (page - 1) * limit;
    const where = buildQuestFilters(queryFilters);
    const orderBy = buildQuestOrderBy(sort, order);
    
    const [quests, total] = await Promise.all([
      prisma.quest.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.quest.count({ where }),
    ]);
    
    const response: ApiResponse<{
      quests: typeof quests;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        quests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    throw error;
  }
};

export const getQuestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new ValidationError('Quest ID is required');
    }
    
    const quest = await prisma.quest.findUnique({
      where: { id },
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
    
    if (!quest) {
      throw new NotFoundError('Quest not found');
    }
    
    const response: ApiResponse<typeof quest> = {
      success: true,
      data: quest,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const createQuest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthorizationError('User not authenticated');
    }
    
    const validatedData = createQuestSchema.parse(req.body);
    
    // Check if category exists
    const category = await prisma.questCategory.findUnique({
      where: { id: validatedData.categoryId }
    });
    
    if (!category) {
      throw new ValidationError('Invalid category ID');
    }
    
    const quest = await prisma.quest.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        shortDescription: validatedData.shortDescription,
        instructions: validatedData.instructions || null,
        categoryId: validatedData.categoryId,
        difficulty: validatedData.difficulty,
        tags: JSON.stringify(validatedData.tags),
        requirements: JSON.stringify(validatedData.requirements),
        estimatedTime: validatedData.estimatedTime,
        submissionTypes: JSON.stringify(validatedData.submissionTypes),
        locationRequired: validatedData.locationRequired,
        locationType: validatedData.locationType || null,
        specificLocation: validatedData.specificLocation || null,
        allowSharing: validatedData.allowSharing,
        imageUrl: validatedData.imageUrl || null,
        createdBy: userId,
        status: 'DRAFT', // User-created quests start as drafts
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
    throw error;
  }
};

export const updateQuest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { id } = req.params;
    
    if (!userId) {
      throw new AuthorizationError('User not authenticated');
    }
    
    if (!id) {
      throw new ValidationError('Quest ID is required');
    }
    
    const validatedData = updateQuestSchema.parse(req.body);
    
    // Check if quest exists
    const existingQuest = await prisma.quest.findUnique({
      where: { id }
    });
    
    if (!existingQuest) {
      throw new NotFoundError('Quest not found');
    }
    
    // Check permissions
    const canEdit = existingQuest.createdBy === userId || userRole === 'ADMIN' || userRole === 'MODERATOR';
    if (!canEdit) {
      throw new AuthorizationError('You do not have permission to edit this quest');
    }
    
    // Check if category exists (if being updated)
    if (validatedData.categoryId) {
      const category = await prisma.questCategory.findUnique({
        where: { id: validatedData.categoryId }
      });
      
      if (!category) {
        throw new ValidationError('Invalid category ID');
      }
    }
    
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    // Convert arrays to JSON
    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags);
    }
    if (validatedData.requirements) {
      updateData.requirements = JSON.stringify(validatedData.requirements);
    }
    if (validatedData.submissionTypes) {
      updateData.submissionTypes = JSON.stringify(validatedData.submissionTypes);
    }
    if (validatedData.expiresAt) {
      updateData.expiresAt = new Date(validatedData.expiresAt);
    }
    
    const quest = await prisma.quest.update({
      where: { id },
      data: updateData,
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
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    throw error;
  }
};

export const deleteQuest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { id } = req.params;
    
    if (!userId) {
      throw new AuthorizationError('User not authenticated');
    }
    
    if (!id) {
      throw new ValidationError('Quest ID is required');
    }
    
    // Check if quest exists
    const existingQuest = await prisma.quest.findUnique({
      where: { id }
    });
    
    if (!existingQuest) {
      throw new NotFoundError('Quest not found');
    }
    
    // Check permissions
    const canDelete = existingQuest.createdBy === userId || userRole === 'ADMIN' || userRole === 'MODERATOR';
    if (!canDelete) {
      throw new AuthorizationError('You do not have permission to delete this quest');
    }
    
    // Soft delete by archiving
    await prisma.quest.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        updatedAt: new Date(),
      },
    });
    
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Quest deleted successfully' },
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const getFeaturedQuests = async (_req: Request, res: Response) => {
  try {
    const quests = await prisma.quest.findMany({
      where: {
        status: 'AVAILABLE',
        isFeatured: true,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    
    const response: ApiResponse<typeof quests> = {
      success: true,
      data: quests,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const submitQuest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthorizationError('User not authenticated');
    }
    
    const validatedData = submitQuestSchema.parse(req.body);
    
    // Check if quest exists and is available
    const quest = await prisma.quest.findUnique({
      where: { id: validatedData.questId }
    });
    
    if (!quest) {
      throw new NotFoundError('Quest not found');
    }
    
    if (quest.status !== 'AVAILABLE') {
      throw new ValidationError('Quest is not available for submission');
    }
    
    // Check if user has already submitted this quest
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        questId: validatedData.questId,
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
      }
    });
    
    if (existingSubmission) {
      throw new ValidationError('You have already submitted this quest');
    }
    
    const submission = await prisma.submission.create({
      data: {
        questId: validatedData.questId,
        userId,
        type: validatedData.mediaUrls?.length ? 'PHOTO' : 'TEXT', // Simplified logic
        caption: validatedData.caption,
        textContent: validatedData.textContent || null,
        ...(validatedData.mediaUrls && { mediaUrls: JSON.stringify(validatedData.mediaUrls) }),
        ...(validatedData.checklistData && { checklistData: JSON.stringify(validatedData.checklistData) }),
        ...(validatedData.latitude !== undefined && { latitude: validatedData.latitude }),
        ...(validatedData.longitude !== undefined && { longitude: validatedData.longitude }),
        ...(validatedData.address && { address: validatedData.address }),
        privacy: validatedData.privacy,
        status: 'PENDING',
      },
      include: {
        quest: {
          select: {
            id: true,
            title: true,
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          }
        }
      },
    });
    
    const response: ApiResponse<typeof submission> = {
      success: true,
      data: submission,
      timestamp: new Date().toISOString(),
    };
    
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    throw error;
  }
};

export const getQuestSubmissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    
    if (!userId) {
      throw new AuthorizationError('User not authenticated');
    }
    
    if (!id) {
      throw new ValidationError('Quest ID is required');
    }
    
    // Check if quest exists
    const quest = await prisma.quest.findUnique({
      where: { id }
    });
    
    if (!quest) {
      throw new NotFoundError('Quest not found');
    }
    
    const submissions = await prisma.submission.findMany({
      where: {
        questId: id,
        status: 'APPROVED',
        privacy: 'public',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          }
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 20,
    });
    
    const response: ApiResponse<typeof submissions> = {
      success: true,
      data: submissions,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
};
