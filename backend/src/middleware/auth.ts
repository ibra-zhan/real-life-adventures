import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import type { User, UserRole } from '../types';
import config from '../config';

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
    
    // TODO: In a real implementation, you would fetch the user from the database
    // For now, we'll create a mock user object
    const user: User = {
      id: decoded.userId,
      username: 'MockUser', // This would come from DB
      email: 'mock@example.com', // This would come from DB
      role: decoded.role,
      level: 1,
      xp: 0,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      joinedAt: new Date().toISOString(),
      isActive: true,
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
      preferences: {
        notifications: {
          email: true,
          push: true,
          streakReminders: true,
          newQuests: true,
          challenges: true,
          badges: true,
        },
        privacy: {
          profileVisibility: 'public',
          shareCompletions: true,
          showLocation: false,
        },
        questPreferences: {
          preferredCategories: [],
          difficulty: ['easy', 'medium'],
          timeAvailable: 30,
        },
      },
    };

    // Attach user to request
    req.user = user;
    
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
        
        // TODO: Fetch user from database
        const user: User = {
          id: decoded.userId,
          username: 'MockUser',
          email: 'mock@example.com',
          role: decoded.role,
          level: 1,
          xp: 0,
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          badges: [],
          joinedAt: new Date().toISOString(),
          isActive: true,
          lastActiveAt: new Date().toISOString(),
          emailVerified: true,
          preferences: {
            notifications: {
              email: true,
              push: true,
              streakReminders: true,
              newQuests: true,
              challenges: true,
              badges: true,
            },
            privacy: {
              profileVisibility: 'public',
              shareCompletions: true,
              showLocation: false,
            },
            questPreferences: {
              preferredCategories: [],
              difficulty: ['easy', 'medium'],
              timeAvailable: 30,
            },
          },
        };

        req.user = user;
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
