import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3001),
  HOST: z.string().default('localhost'),
  
  // Database
  DATABASE_URL: z.string().default('file:./dev.db'),
  
  // JWT
  JWT_SECRET: z.string().default('your-secret-key'),
  JWT_REFRESH_SECRET: z.string().default('your-refresh-secret-key'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:8080'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default(true),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default(100),
  
  // File upload
  MAX_FILE_SIZE: z.string().transform(Number).default(10485760), // 10MB
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  
  // AWS S3 (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // OpenAI (optional)
  OPENAI_API_KEY: z.string().optional(),

  // Gemini (optional)
  GEMINI_API_KEY: z.string().optional(),
  
  // Google Cloud (optional)
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  
  // Push notifications (optional)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  
  // Feature flags
  ENABLE_AI_QUESTS: z.string().transform(val => val === 'true').default(true),
  ENABLE_MEDIA_UPLOAD: z.string().transform(val => val === 'true').default(true),
  ENABLE_NOTIFICATIONS: z.string().transform(val => val === 'true').default(true),
  ENABLE_MODERATION: z.string().transform(val => val === 'true').default(true),
  ENABLE_GAMIFICATION: z.string().transform(val => val === 'true').default(true),
  
  // Development
  DEBUG_MODE: z.string().transform(val => val === 'true').default(true),
  
  // Server
  BASE_URL: z.string().default('http://localhost:3001'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export configuration
export const config = {
  server: {
    nodeEnv: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    baseUrl: env.BASE_URL,
  },
  
  development: {
    debugMode: env.DEBUG_MODE,
  },
  
  database: {
    url: env.DATABASE_URL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    expireTime: env.JWT_EXPIRES_IN, // Alias for compatibility
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    refreshExpireTime: env.JWT_REFRESH_EXPIRES_IN, // Alias for compatibility
  },
  
  cors: {
    origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: env.CORS_CREDENTIALS,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    maxRequests: env.RATE_LIMIT_MAX, // Alias for compatibility
  },
  
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    uploadDir: env.UPLOAD_DIR,
  },
  
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  },
  
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    s3Bucket: env.AWS_S3_BUCKET,
  },
  
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },

  gemini: {
    apiKey: env.GEMINI_API_KEY,
  },
  
  googleCloud: {
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  
  push: {
    vapidPublicKey: env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: env.VAPID_PRIVATE_KEY,
    vapidSubject: env.VAPID_SUBJECT,
  },
  
  features: {
    enableAIQuests: env.ENABLE_AI_QUESTS,
    enableMediaUpload: env.ENABLE_MEDIA_UPLOAD,
    enableNotifications: env.ENABLE_NOTIFICATIONS,
    enableModeration: env.ENABLE_MODERATION,
    enableGamification: env.ENABLE_GAMIFICATION,
  },
};

export default config;