# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real Life Adventures is a quest-based application that transforms daily moments into exciting challenges. The application uses AI to generate personalized quests and allows users to complete and share their adventures. This is an MVP focusing on core functionality without complex gamification features.

## Architecture

This is a full-stack TypeScript application with:
- **Frontend**: React 18 + Vite + shadcn/ui + Tailwind CSS + React Router + TanStack Query
- **Backend**: Express.js + TypeScript + Prisma ORM + SQLite
- **AI Integration**: OpenAI GPT-4 for quest generation
- **Authentication**: JWT-based authentication with refresh tokens

## Development Commands

### Frontend (Root directory)
```bash
npm run dev          # Start Vite dev server on http://localhost:8080
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (backend/ directory)
```bash
npm run dev:ts       # Start development server with ts-node
npm run dev          # Build and watch with nodemon
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled JavaScript from dist/
npm run type-check   # Type check without emitting
```

### Quick Start (Recommended)
```bash
# Start both frontend and backend servers
./start-dev.sh
```

### Database Operations
```bash
cd backend
npx prisma generate        # Generate Prisma client
npx prisma db push         # Push schema changes to database
npx prisma studio          # Open Prisma Studio
node seed-mvp.cjs          # Seed database with initial data
```

## Project Structure

### Frontend (`src/`)
- **`pages/`**: Route components (Landing, Home, Profile, AIQuests, etc.)
- **`components/`**: Reusable UI components, organized by feature
- **`contexts/`**: React context providers (Auth, User, AppState)
- **`hooks/`**: Custom React hooks (useQuests, useAuth, etc.)
- **`lib/`**: Utilities (api-client, progression, questTransformer)
- **`types/`**: TypeScript type definitions

### Backend (`backend/src/`)
- **`controllers/`**: Route handlers for different features
- **`routes/`**: Express route definitions
- **`services/`**: Business logic and external integrations
- **`middleware/`**: Express middleware functions
- **`config/`**: Configuration management
- **`types/`**: Backend TypeScript types

### Database (`backend/prisma/`)
- **`schema.prisma`**: Database schema definition
- **`dev.db`**: SQLite database file
- **`migrations/`**: Database migration files

## Key Technologies & Patterns

### Frontend Architecture
- **Context-based state management**: Auth, User, and AppState contexts
- **TanStack Query**: Server state management and caching
- **React Router**: Client-side routing
- **shadcn/ui**: Component library built on Radix UI
- **Form handling**: React Hook Form with Zod validation

### Backend Architecture
- **Express.js**: RESTful API server
- **Prisma ORM**: Type-safe database access
- **JWT Authentication**: Access and refresh token pattern
- **Middleware pipeline**: Security, CORS, rate limiting, compression
- **OpenAI Integration**: AI quest generation service

### Database Design
- **Core entities**: User, Quest, QuestCategory, Submission, Notification
- **Authentication**: UserSession model for refresh token management
- **Preferences**: UserPreferences for notification and privacy settings
- **Submission types**: Photo, video, text, and checklist submissions

## API Routes

### Core endpoints:
- **Auth**: `/api/auth/*` - Registration, login, password reset
- **Users**: `/api/users/*` - Profile management, preferences
- **Quests**: `/api/quests/*` - Quest CRUD operations
- **AI Quests**: `/api/ai-quests/*` - AI-powered quest generation
- **Submissions**: `/api/submissions/*` - Quest completion handling
- **Categories**: `/api/categories/*` - Quest category management
- **Media**: `/api/media/*` - File upload and management
- **Notifications**: `/api/notifications/*` - Push notifications and alerts

### Health check:
- **Health**: `/health` - Application and database health status

## Environment Setup

### Required Environment Variables (Backend)
Create `backend/.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
OPENAI_API_KEY="your-openai-key"
PORT=3001
```

### Optional Frontend Environment Variables
Create `.env`:
```env
VITE_API_BASE_URL="http://localhost:3001"
```

## Development Workflow

1. **Database Setup**: Run `npx prisma db push` in backend directory
2. **Seed Data**: Run `node seed-mvp.cjs` for initial categories and test data
3. **Start Development**: Use `./start-dev.sh` to start both servers
4. **Access Points**:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api
   - Health Check: http://localhost:3001/health

## Important Notes

### MVP Scope
This is a simplified MVP version. The following features have been removed to focus on core functionality:
- Complex gamification (badges, XP, levels)
- Social features (friends, comments, likes)
- Leaderboards and challenges
- Advanced moderation tools
- Analytics and reporting

### Code Conventions
- **TypeScript**: Strict mode enabled, prefer type safety
- **ESLint**: Configured for React and TypeScript
- **File naming**: kebab-case for files, PascalCase for components
- **Import paths**: Use `@/` alias for absolute imports in frontend
- **API responses**: Consistent ApiResponse interface with success/error structure
- **Database**: Use Prisma for all database operations, prefer async/await

### AI Integration
The application integrates with OpenAI GPT-4 for quest generation:
- **Service**: `backend/src/services/openaiService.ts`
- **Controller**: `backend/src/controllers/aiQuestController.ts`
- **Frontend**: Quest generation in `src/pages/AIQuests.tsx`

### Authentication Flow
- JWT access tokens (short-lived)
- Refresh tokens (long-lived, stored in database)
- Protected routes use authentication middleware
- Frontend handles token refresh automatically

## Testing

Currently, no formal test suite is configured. When adding tests:
- Use Jest for unit tests
- Consider React Testing Library for component tests
- Use Supertest for API endpoint testing