import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/database';
import config from '../config';
import type { ApiResponse } from '../types';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

// Helper functions
const generateTokens = (userId: string, role: string = 'USER') => {
  const accessToken = jwt.sign(
    { userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expireTime } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpireTime } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

const generateResetToken = () => {
  return jwt.sign(
    { type: 'password-reset', timestamp: Date.now() },
    config.jwt.secret,
    { expiresIn: '1h' } as jwt.SignOptions
  );
};

// Controllers
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, username, password, firstName, lastName } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ValidationError('Email is already registered');
      } else {
        throw new ValidationError('Username is already taken');
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        emailVerified: false, // In production, require email verification
        // Create default preferences
        preferences: {
          create: {
            emailNotifications: true,
            pushNotifications: true,
            streakReminders: true,
            newQuestNotifications: true,
            challengeNotifications: true,
            badgeNotifications: true,
            socialNotifications: true,
            profileVisibility: 'public',
            shareCompletions: true,
            showLocation: false,
            showStreak: true,
            showBadges: true,
            preferredCategories: JSON.stringify([]),
            preferredDifficulty: JSON.stringify(['EASY', 'MEDIUM']),
            timeAvailablePerDay: 30,
            autoAcceptFriendRequests: false,
          }
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        level: true,
        xp: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Store refresh token in database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        deviceInfo: req.get('User-Agent') || 'Unknown',
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    const response: ApiResponse<{
      user: typeof user;
      tokens: { accessToken: string; refreshToken: string };
    }> = {
      success: true,
      data: {
        user,
        tokens: { accessToken, refreshToken }
      },
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

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        level: true,
        xp: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        role: true,
        isActive: true,
        emailVerified: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
      }
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Store refresh token in database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        deviceInfo: req.get('User-Agent') || 'Unknown',
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    const response: ApiResponse<{
      user: typeof userWithoutPassword;
      tokens: { accessToken: string; refreshToken: string };
    }> = {
      success: true,
      data: {
        user: userWithoutPassword,
        tokens: { accessToken, refreshToken }
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

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as any;
    
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Find session in database
    const session = await prisma.userSession.findUnique({
      where: { refreshToken: token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired or invalid');
    }

    if (!session.user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      session.user.id, 
      session.user.role
    );

    // Update session with new refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // Update last active
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveAt: new Date() }
    });

    const response: ApiResponse<{
      tokens: { accessToken: string; refreshToken: string };
    }> = {
      success: true,
      data: {
        tokens: { accessToken, refreshToken: newRefreshToken }
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    throw error;
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = refreshTokenSchema.parse(req.body);

    // Remove session from database
    await prisma.userSession.deleteMany({
      where: { refreshToken: token }
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Logged out successfully' },
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

export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Remove all sessions for this user
    await prisma.userSession.deleteMany({
      where: { userId }
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Logged out from all devices successfully' },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'If an account with that email exists, a password reset link has been sent.' },
      timestamp: new Date().toISOString(),
    };

    if (user && user.isActive) {
      // Generate reset token
      const resetToken = generateResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        }
      });

      // TODO: Send email with reset link
      // await sendPasswordResetEmail(user.email, resetToken);
      console.log(`Password reset token for ${user.email}: ${resetToken}`);
    }

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map(i => i.message).join(', ')}`);
    }
    throw error;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Verify reset token
    try {
      jwt.verify(token, config.jwt.secret);
    } catch {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Find user with this reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      }
    });

    // Invalidate all sessions
    await prisma.userSession.deleteMany({
      where: { userId: user.id }
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Password reset successfully' },
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

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        location: true,
        timezone: true,
        level: true,
        xp: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
        preferences: true,
      }
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};
