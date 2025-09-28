import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/services/database';
import type { ApiResponse } from '@/types';
import { ValidationError, NotFoundError, AuthorizationError } from '@/middleware/errorHandler';

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  icon: z.string().max(10, 'Icon must be less than 10 characters').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  sortOrder: z.number().min(0).default(0),
});

const updateCategorySchema = createCategorySchema.partial();

// Controllers
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    
    const where: any = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }
    
    const categories = await prisma.questCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            quests: {
              where: {
                status: 'AVAILABLE',
              }
            }
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
    
    // Transform the data to include quest count
    const categoriesWithCount = categories.map(category => ({
      ...category,
      questCount: category._count.quests,
      _count: undefined,
    }));
    
    const response: ApiResponse<typeof categoriesWithCount> = {
      success: true,
      data: categoriesWithCount,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new ValidationError('Category ID is required');
    }
    
    const category = await prisma.questCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quests: {
              where: {
                status: 'AVAILABLE',
              }
            }
          }
        }
      },
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    const categoryWithCount = {
      ...category,
      questCount: category._count.quests,
      _count: undefined,
    };
    
    const response: ApiResponse<typeof categoryWithCount> = {
      success: true,
      data: categoryWithCount,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
      throw new AuthorizationError('Only administrators and moderators can create categories');
    }
    
    const validatedData = createCategorySchema.parse(req.body);
    
    // Check if category name already exists
    const existingCategory = await prisma.questCategory.findFirst({
      where: {
        name: {
          equals: validatedData.name,
        }
      }
    });
    
    if (existingCategory) {
      throw new ValidationError('A category with this name already exists');
    }
    
    const category = await prisma.questCategory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        icon: validatedData.icon || null,
        color: validatedData.color || null,
        sortOrder: validatedData.sortOrder,
        isActive: true,
      },
    });
    
    const response: ApiResponse<typeof category> = {
      success: true,
      data: category,
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

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const { id } = req.params;
    
    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
      throw new AuthorizationError('Only administrators and moderators can update categories');
    }
    
    if (!id) {
      throw new ValidationError('Category ID is required');
    }
    
    const validatedData = updateCategorySchema.parse(req.body);
    
    // Check if category exists
    const existingCategory = await prisma.questCategory.findUnique({
      where: { id }
    });
    
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }
    
    // Check if name is being changed and if it conflicts with existing category
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.questCategory.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        }
      });
      
      if (nameConflict) {
        throw new ValidationError('A category with this name already exists');
      }
    }
    
    const category = await prisma.questCategory.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description || null }),
        ...(validatedData.icon !== undefined && { icon: validatedData.icon || null }),
        ...(validatedData.color !== undefined && { color: validatedData.color || null }),
        ...(validatedData.sortOrder !== undefined && { sortOrder: validatedData.sortOrder }),
        updatedAt: new Date(),
      },
    });
    
    const response: ApiResponse<typeof category> = {
      success: true,
      data: category,
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

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const { id } = req.params;
    
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can delete categories');
    }
    
    if (!id) {
      throw new ValidationError('Category ID is required');
    }
    
    // Check if category exists
    const existingCategory = await prisma.questCategory.findUnique({
      where: { id }
    });
    
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }
    
    // Check if category has active quests
    const activeQuests = await prisma.quest.count({
      where: {
        categoryId: id,
        status: { in: ['AVAILABLE', 'COMPLETED'] },
      }
    });
    
    if (activeQuests > 0) {
      throw new ValidationError('Cannot delete category with active quests. Please reassign or archive the quests first.');
    }
    
    // Soft delete by marking as inactive
    await prisma.questCategory.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
    
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Category deleted successfully' },
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const getCategoryQuests = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', status = 'AVAILABLE' } = req.query;
    
    if (!id) {
      throw new ValidationError('Category ID is required');
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Check if category exists
    const category = await prisma.questCategory.findUnique({
      where: { id }
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    const where: any = {
      categoryId: id,
    };
    
    if (status) {
      where.status = status;
    }
    
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.quest.count({ where }),
    ]);
    
    const response: ApiResponse<{
      category: typeof category;
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
        category,
        quests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
};
