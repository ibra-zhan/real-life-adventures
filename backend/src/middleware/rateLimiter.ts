import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config';
import { RateLimitError } from './errorHandler';

// Default rate limiter
const defaultLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_ERROR',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError('Too many requests from this IP, please try again later');
  },
});

// Strict rate limiter for sensitive endpoints (auth, password reset, etc.)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many attempts from this IP, please try again later',
      code: 'RATE_LIMIT_ERROR',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError('Too many attempts from this IP, please try again later');
  },
});

// Lenient rate limiter for public endpoints
const lenientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_ERROR',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError('Too many requests from this IP, please try again later');
  },
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: {
    success: false,
    error: {
      message: 'Too many file uploads from this IP, please try again later',
      code: 'UPLOAD_RATE_LIMIT_ERROR',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError('Too many file uploads from this IP, please try again later');
  },
});

// API key rate limiter (higher limits for authenticated users)
const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each API key to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'API rate limit exceeded, please try again later',
      code: 'API_RATE_LIMIT_ERROR',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new RateLimitError('API rate limit exceeded, please try again later');
  },
});

export {
  defaultLimiter,
  strictLimiter,
  lenientLimiter,
  uploadLimiter,
  apiKeyLimiter,
};

export default defaultLimiter;
