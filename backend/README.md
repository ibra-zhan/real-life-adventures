# SideQuest Backend API

## 🎯 Overview

The SideQuest Backend API is a robust, TypeScript-based Express.js server that powers the SideQuest gamification platform. It transforms daily moments into exciting challenges through a comprehensive quest and achievement system.

## ✅ Current Status: COMPLETED ✅

**Task 1: Backend Infrastructure & API Server** has been successfully implemented and is fully operational.

## 🚀 Features Implemented

### Core Infrastructure
- **TypeScript Express Server** with comprehensive type safety
- **Environment Configuration** with Zod validation
- **Security Middleware** (Helmet, CORS, Rate Limiting)
- **Request Logging** with Morgan
- **Error Handling** with custom error types and standardized responses
- **Path Mapping** support for clean imports (`@/config`, `@/middleware`, etc.)

### Middleware Stack
- **Authentication Middleware** (JWT-based with role support)
- **Rate Limiting** (Multiple tiers: default, strict, lenient, upload, API key)
- **Request Validation** (Zod schema validation)
- **Compression** (Gzip compression for responses)
- **Security Headers** (CSP, HSTS, XSS protection, etc.)
- **CORS** (Configurable cross-origin support)

### API Endpoints (Mock Data)
- `GET /health` - Health check endpoint
- `GET /api` - API information and available endpoints
- `GET /api/quests` - List all available quests
- `GET /api/quests/featured` - Get featured quest
- `GET /api/leaderboard` - Get leaderboard rankings

## 🏗️ Architecture

```
backend/
├── src/
│   ├── app.ts              # Express application setup
│   ├── index.ts            # Server entry point
│   ├── config/             # Environment configuration
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # JWT authentication
│   │   ├── rateLimiter.ts  # Rate limiting
│   │   ├── errorHandler.ts # Error handling
│   │   ├── validation.ts   # Request validation
│   │   ├── security.ts     # Security headers
│   │   ├── cors.ts         # CORS configuration
│   │   ├── compression.ts  # Response compression
│   │   └── requestLogger.ts # Request logging
│   └── types/              # TypeScript type definitions
├── dist/                   # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env.example
└── .env
```

## 🔧 Configuration

### Environment Variables
The server uses environment-based configuration with validation:

- **Server**: `PORT`, `HOST`, `NODE_ENV`
- **Database**: `DATABASE_URL`, `DATABASE_SSL`
- **JWT**: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- **CORS**: `CORS_ORIGIN`, `CORS_CREDENTIALS`
- **Rate Limiting**: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`
- **Features**: `ENABLE_AI_QUEST_GENERATION`, `ENABLE_CONTENT_MODERATION`

### Current Configuration
- **Environment**: Development
- **Port**: 3001
- **Host**: localhost
- **Debug Mode**: Enabled
- **Mock APIs**: Enabled for testing

## 🚦 API Response Format

All API responses follow a standardized format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}
```

## 🛡️ Security Features

- **Helmet.js** security headers
- **Rate limiting** with multiple tiers
- **Input validation** with Zod schemas
- **JWT authentication** with role-based access
- **CORS** protection
- **Request logging** for monitoring
- **Error handling** without information leakage

## 🔄 Development Workflow

### Scripts
- `npm run dev:ts` - Start development server with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run type-check` - Type checking without compilation

### Testing
The server is currently running and responding to requests:
- ✅ Health check endpoint working
- ✅ API info endpoint working
- ✅ Mock quest data endpoint working
- ✅ Mock leaderboard endpoint working

## 📊 Current Mock Data

The server currently serves mock data for:
- **Quests**: Coffee Shop Compliment, Stair Master
- **Leaderboard**: 5 sample users with rankings
- **API Info**: Available endpoint documentation

## 🎯 Next Steps

The backend infrastructure is complete and ready for the next phase:

1. **Database Setup** - PostgreSQL schema and connection
2. **Authentication System** - User registration, login, JWT management
3. **Quest Management** - CRUD operations for quests
4. **AI Quest Generation** - OpenAI integration for dynamic content
5. **Media Processing** - File upload and image handling

## 🏃‍♂️ Running the Server

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, set DATABASE_URL and JWT secrets

# Start development server
npm run dev:ts

# The server will start on http://localhost:3001
```

## 📈 Performance & Monitoring

- **Request logging** with Morgan
- **Error tracking** with structured error handling
- **Performance monitoring** ready for APM integration
- **Health checks** for deployment readiness
- **Graceful shutdown** handling

---

**Status**: ✅ **COMPLETE** - Backend Infrastructure & API Server is fully operational and ready for the next development phase.

