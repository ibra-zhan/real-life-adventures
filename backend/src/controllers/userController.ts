import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/services/database';
import type { ApiResponse } from '@/types';
import { ValidationError, AuthenticationError, NotFoundError } from '@/middleware/errorHandler';

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
});

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  profileVisibility: z.enum(['public', 'friends', 'private']).optional(),
  preferredCategories: z.array(z.string()).optional(),
  preferredDifficulty: z.array(z.enum(['EASY', 'MEDIUM', 'HARD', 'EPIC'])).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

const updateUsernameSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

// Controllers
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const validatedData = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validatedData.firstName || null,
        lastName: validatedData.lastName || null,
        bio: validatedData.bio || null,
        avatar: validatedData.avatar || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
      }
    });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      data: updatedUser,
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

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const validatedData = updatePreferencesSchema.parse(req.body);

    // Convert arrays to JSON for storage
    const dataToUpdate: any = { ...validatedData };
    if (validatedData.preferredCategories) {
      dataToUpdate.preferredCategories = JSON.stringify(validatedData.preferredCategories);
    }
    if (validatedData.preferredDifficulty) {
      dataToUpdate.preferredDifficulty = JSON.stringify(validatedData.preferredDifficulty);
    }

    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: dataToUpdate,
      create: {
        userId,
        ...dataToUpdate,
        // Set defaults for any missing required fields
        preferredCategories: dataToUpdate.preferredCategories || JSON.stringify([]),
        preferredDifficulty: dataToUpdate.preferredDifficulty || JSON.stringify(['EASY', 'MEDIUM']),
      }
    });

    const response: ApiResponse<typeof updatedPreferences> = {
      success: true,
      data: updatedPreferences,
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

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Get current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      }
    });

    // Invalidate all sessions except current one (optional - for security)
    // We could keep current session active or invalidate all
    // For now, let's invalidate all sessions to force re-login
    await prisma.userSession.deleteMany({
      where: { userId }
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Password changed successfully. Please log in again.' },
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

export const updateUsername = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const { username } = updateUsernameSchema.parse(req.body);

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        id: { not: userId } // Exclude current user
      }
    });

    if (existingUser) {
      throw new ValidationError('Username is already taken');
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username.toLowerCase(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
      }
    });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      data: updatedUser,
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

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Soft delete - mark as inactive and clear personal data
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${userId}@deleted.com`,
        firstName: null,
        lastName: null,
        bio: null,
        avatar: null,
        updatedAt: new Date(),
      }
    });

    // Delete all sessions
    await prisma.userSession.deleteMany({
      where: { userId }
    });

    // Delete preferences
    await prisma.userPreferences.deleteMany({
      where: { userId }
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Account deleted successfully' },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Get user stats
    const [user, submissionCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          createdAt: true,
        }
      }),
      prisma.submission.count({
        where: { 
          userId,
          status: 'APPROVED'
        }
      })
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const stats = {
      completedQuests: submissionCount,
      memberSince: user.createdAt,
    };

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      throw new ValidationError('Username is required');
    }

    const user = await prisma.user.findFirst({
      where: { 
        username: username.toLowerCase(),
        isActive: true
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        createdAt: true,
        preferences: {
          select: {
            profileVisibility: true,
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check privacy settings
    if (user.preferences?.profileVisibility === 'private') {
      throw new NotFoundError('User profile is private');
    }

    // Filter data based on privacy settings
    const publicProfile = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: user.bio,
      memberSince: user.createdAt,
    };

    // Get additional public stats
    const submissionCount = await prisma.submission.count({
      where: { 
        userId: user.id,
        status: 'APPROVED',
        privacy: 'public'
      }
    });

    const profileWithStats = {
      ...publicProfile,
      completedQuests: submissionCount,
    };

    const response: ApiResponse<typeof profileWithStats> = {
      success: true,
      data: profileWithStats,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};
