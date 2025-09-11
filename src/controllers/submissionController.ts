// Simplified Submission Controller for Testing
import { Request, Response, NextFunction } from 'express';

// Submit quest with media files (simplified)
export const submitQuestWithMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || 'test-user';
    const files = req.files as Express.Multer.File[];

    res.status(201).json({
      success: true,
      data: {
        userId,
        filesCount: files?.length || 0,
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
    });
  } catch (error) {
    next(error);
  }
};

// Delete submission
export const deleteSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      data: { deleted: true, id },
    });
  } catch (error) {
    next(error);
  }
};