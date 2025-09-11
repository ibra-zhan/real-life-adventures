// Simplified Media Controller for Testing
import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storageService';
import { MediaCategory } from '../types/media';

// Health check for media system
export const getMediaHealth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const storageHealth = await storageService.validateStorage();

    res.json({
      success: true,
      data: {
        storage: storageHealth,
        timestamp: new Date().toISOString(),
        message: 'Media system is operational',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get media statistics
export const getMediaStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const storageStats = await storageService.getStorageStats();

    res.json({
      success: true,
      data: {
        ...storageStats,
        message: 'Media statistics retrieved successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload single file (simplified)
export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || 'test-user';

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded', code: 'NO_FILE' },
      });
    }

    // Store file with default category
    const mediaFile = await storageService.storeFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      MediaCategory.GENERAL
    );

    res.status(201).json({
      success: true,
      data: {
        file: mediaFile,
        message: 'File uploaded successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get media files (simplified)
export const getMediaFiles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        files: [],
        total: 0,
        message: 'Media files retrieved successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};