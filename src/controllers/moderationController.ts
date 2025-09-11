// Moderation Controller for SideQuest
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { contentModerationService } from '../services/contentModerationService';
import { ContentType, ModerationStatus } from '../types/moderation';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';

// Validation schemas
const moderateContentSchema = z.object({
  contentId: z.string().cuid('Invalid content ID'),
  contentType: z.nativeEnum(ContentType),
  content: z.string().min(1),
  metadata: z.object({
    userId: z.string().cuid(),
    contentUrl: z.string().url().optional(),
    context: z.object({
      questId: z.string().cuid().optional(),
      submissionId: z.string().cuid().optional(),
      categoryId: z.string().cuid().optional(),
    }).optional(),
  }),
});

// Moderate content
export const moderateContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const validatedData = moderateContentSchema.parse(req.body);
    
    const result = await contentModerationService.moderateContent({
      contentId: validatedData.contentId,
      contentType: validatedData.contentType,
      content: validatedData.content,
      metadata: {
        ...validatedData.metadata,
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get moderation result
export const getModerationResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId } = req.params;
    
    const result = await contentModerationService.getModerationResult(contentId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Moderation result not found',
          code: 'NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Update moderation result (admin only)
export const updateModerationResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const { resultId } = req.params;
    const updates = req.body;
    
    await contentModerationService.updateModerationResult(resultId, updates);

    res.json({
      success: true,
      data: {
        message: 'Moderation result updated successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get moderation statistics (admin only)
export const getModerationStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const querySchema = z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    });

    const { start, end } = querySchema.parse(req.query);
    
    const timeRange = start && end ? {
      start: new Date(start),
      end: new Date(end),
    } : undefined;

    const stats = await contentModerationService.getModerationStats(timeRange);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get moderation queue (admin only)
export const getModerationQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    const queue = await contentModerationService.getModerationQueue();

    res.json({
      success: true,
      data: {
        queue,
        total: queue.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Process moderation queue (admin only)
export const processModerationQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    if (userRole !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    await contentModerationService.processQueue();

    res.json({
      success: true,
      data: {
        message: 'Moderation queue processed successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Health check for moderation system
export const getModerationHealth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'Moderation system is operational',
        services: {
          textModeration: 'active',
          imageModeration: 'active',
          videoModeration: 'active',
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
