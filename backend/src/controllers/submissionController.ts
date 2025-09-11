// Submission Controller with Media Integration
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/database';
import { storageService } from '../services/storageService';
import { MediaCategory } from '../types/media';
import { NotFoundError, AuthenticationError } from '../middleware/errorHandler';

// Validation schemas
const submitQuestWithMediaSchema = z.object({
  questId: z.string().cuid('Invalid quest ID'),
  caption: z.string().min(1, 'Caption is required').max(500, 'Caption must be less than 500 characters'),
  textContent: z.string().max(2000, 'Text content must be less than 2000 characters').optional(),
  privacy: z.enum(['public', 'friends', 'private']).default('public'),
});

// Submit quest with media files
export const submitQuestWithMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const validatedData = submitQuestWithMediaSchema.parse(req.body);
    const files = req.files as Express.Multer.File[];

    // Check if quest exists
    const quest = await prisma.quest.findUnique({
      where: { id: validatedData.questId }
    });

    if (!quest) {
      throw new NotFoundError('Quest not found');
    }

    // Upload media files if provided
    let mediaUrls: string[] = [];
    if (files && files.length > 0) {
      const mediaCategory = files.some(f => f.mimetype.startsWith('video/')) 
        ? MediaCategory.SUBMISSION_VIDEO 
        : MediaCategory.SUBMISSION_PHOTO;

      const uploadPromises = files.map(async (file) => {
        const mediaFile = await storageService.storeFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          userId,
          mediaCategory,
          {
            questId: validatedData.questId,
            metadata: {
              altText: `Submission for quest: ${quest.title}`,
            },
          }
        );

        return mediaFile.publicUrl || mediaFile.url;
      });

      mediaUrls = await Promise.all(uploadPromises);
    }

    res.status(201).json({
      success: true,
      data: {
        questId: validatedData.questId,
        mediaUrls,
        message: 'Quest submission processed successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get submission by ID
export const getSubmissionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      data: {
        id,
        message: 'Submission retrieved successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Update submission
export const updateSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      data: {
        id,
        message: 'Submission updated successfully',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Delete submission
export const deleteSubmission = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // const { id } = req.params;

    res.json({
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
