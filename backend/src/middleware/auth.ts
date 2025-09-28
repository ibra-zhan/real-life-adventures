import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import type { User, UserRole } from '../types';
import config from '../config';
import { prisma } from '../services/database';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface JwtPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// JWT authentication middleware
export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token required');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Fetch user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
        preferences: true,
      }
    });

    if (!dbUser || !dbUser.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Create user object matching the expected interface
    const user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      avatar: dbUser.avatar || undefined,
      role: dbUser.role as UserRole,
      isActive: dbUser.isActive,
      emailVerified: dbUser.emailVerified,
      joinedAt: dbUser.createdAt.toISOString(),
      lastActiveAt: dbUser.lastActiveAt?.toISOString() || new Date().toISOString(),
      level: 1, // TODO: Calculate from user data
      xp: 0, // TODO: Calculate from user data
      totalPoints: 0, // TODO: Calculate from user data
      currentStreak: 0, // TODO: Calculate from user data
      longestStreak: 0, // TODO: Calculate from user data
      badges: [], // TODO: Fetch from database
      preferences: {
        notifications: {
          email: dbUser.preferences?.emailNotifications ?? true,
          push: dbUser.preferences?.pushNotifications ?? true,
          streakReminders: true,
          newQuests: true,
          challenges: true,
          badges: true,
        },
        privacy: {
          profileVisibility: (dbUser.preferences?.profileVisibility as 'public' | 'friends' | 'private') || 'public',
          shareCompletions: true,
          showLocation: false,
        },
        questPreferences: {
          preferredCategories: dbUser.preferences?.preferredCategories ? JSON.parse(dbUser.preferences.preferredCategories as string) : [],
          difficulty: dbUser.preferences?.preferredDifficulty ? JSON.parse(dbUser.preferences.preferredDifficulty as string) : ['easy', 'medium'],
          timeAvailable: 30,
        },
      },
    };

    // Attach user to request
    req.user = user as User;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        // Fetch user from database
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            username: true,
            avatar: true,
                role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            lastActiveAt: true,
            preferences: true,
          }
        });

        if (dbUser && dbUser.isActive) {
          const user = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            avatar: dbUser.avatar || undefined,
                  role: dbUser.role as UserRole,
            isActive: dbUser.isActive,
            emailVerified: dbUser.emailVerified,
            joinedAt: dbUser.createdAt.toISOString(),
            lastActiveAt: dbUser.lastActiveAt?.toISOString() || new Date().toISOString(),
            level: 1,
            xp: 0,
            totalPoints: 0,
            currentStreak: 0,
            longestStreak: 0,
            badges: [],
            preferences: {
              notifications: {
                email: dbUser.preferences?.emailNotifications ?? true,
                push: dbUser.preferences?.pushNotifications ?? true,
                streakReminders: true,
                newQuests: true,
                challenges: true,
                badges: true,
              },
              privacy: {
                profileVisibility: (dbUser.preferences?.profileVisibility as 'public' | 'friends' | 'private') || 'public',
                shareCompletions: true,
                showLocation: false,
              },
              questPreferences: {
                preferredCategories: dbUser.preferences?.preferredCategories ? JSON.parse(dbUser.preferences.preferredCategories as string) : [],
                difficulty: dbUser.preferences?.preferredDifficulty ? JSON.parse(dbUser.preferences.preferredDifficulty as string) : ['easy', 'medium'],
                timeAvailable: 30,
              },
            },
          };
          req.user = user as User;
        }
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};

// Authorization middleware factory
export const authorize = (roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    next();
  };
};

// Check if user owns resource
export const checkOwnership = (getUserId: (req: Request) => string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const resourceUserId = getUserId(req);
    
    // Allow if user owns the resource or is admin/moderator
    if (req.user.id !== resourceUserId && !['admin', 'moderator'].includes(req.user.role)) {
      throw new AuthorizationError('Access denied');
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (userId: string, role: UserRole): string => {
  return jwt.sign(
    { userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expireTime } as jwt.SignOptions
  );
};

// Generate refresh token
export const generateRefreshToken = (userId: string, role: UserRole): string => {
  return jwt.sign(
    { userId, role },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpireTime } as jwt.SignOptions
  );
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
};

export default authenticate;
