import express from 'express';
import { Request, Response } from 'express';
import config, { validateConfig } from './config';
import {
  errorHandler,
  requestLogger,
  rateLimiter,
  cors,
  security,
  compression,
} from './middleware';
import { notFoundHandler } from './middleware/errorHandler';
import type { ApiResponse } from './types';
import { db } from './services/database';

// Import routes
import apiRoutes from './routes';
// import submissionRoutes from '@/routes/submissions';
// import challengeRoutes from '@/routes/challenges';
// import leaderboardRoutes from '@/routes/leaderboard';

// Validate configuration on startup
validateConfig();

// Create Express application
const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware (should be first)
app.use(security);

// CORS middleware
app.use(cors);

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression);

// Rate limiting (apply to all routes)
app.use(rateLimiter);

// Health check endpoint (before authentication)
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbHealth = await db.healthCheck();
    const dbStats = await db.getStats();
    
    const healthResponse: ApiResponse<{
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
      version: string;
      database: {
        status: string;
        latency: number;
        stats: typeof dbStats;
      };
    }> = {
      success: true,
      data: {
        status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.nodeEnv,
        version: process.env['npm_package_version'] || '1.0.0',
        database: {
          status: dbHealth.status,
          latency: dbHealth.latency,
          stats: dbStats,
        },
      },
      timestamp: new Date().toISOString(),
    };
    
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthResponse);
  } catch (error) {
    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        message: 'Health check failed',
        code: 'HEALTH_CHECK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
    
    res.status(503).json(errorResponse);
  }
});

// Mount API routes
app.use('/api', apiRoutes);



// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
