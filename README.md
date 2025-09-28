# Real Life Adventures 🚀

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://prisma.io/)

A gamified quest application that transforms daily moments into exciting challenges. Built with modern full-stack technologies, featuring AI-powered quest generation and a responsive, accessible user interface.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Quest Generation**: Dynamic quest creation using Gemini AI with contextual prompts
- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Quest Management**: Complete CRUD operations for quests with categories and difficulties
- **Progress Tracking**: Real-time quest progress monitoring with XP rewards
- **Responsive Design**: Mobile-first responsive UI with modern design patterns

### 🔧 Technical Highlights
- **Full-Stack TypeScript**: End-to-end type safety across frontend and backend
- **Modern React Architecture**: Hooks, Context API, and React Query for state management
- **RESTful API Design**: Well-structured Express.js backend with proper middleware
- **Database Management**: Prisma ORM with SQLite for development
- **Real-time Updates**: Optimistic updates and instant UI feedback
- **Error Handling**: Comprehensive error boundaries and API error management

## 🏗️ Architecture

### Frontend (`src/`)
```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Route components
├── lib/                # Utilities and API client
├── types/              # TypeScript type definitions
└── tests/              # Test files and utilities
```

### Backend (`backend/src/`)
```
backend/src/
├── controllers/        # Route handlers
├── routes/            # API route definitions
├── services/          # Business logic and external integrations
├── middleware/        # Express middleware functions
├── config/            # Configuration management
└── types/             # Backend TypeScript types
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/real-life-adventures.git
   cd real-life-adventures
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your configuration
   # Add your API keys (OpenAI/Gemini, etc.)
   ```

4. **Database Setup**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   node seed-mvp.cjs
   cd ..
   ```

5. **Start Development Servers**
   ```bash
   # Quick start (both servers)
   ./start-dev.sh

   # Or manually:
   # Terminal 1 - Frontend (localhost:8080)
   npm run dev

   # Terminal 2 - Backend (localhost:3001)
   cd backend && npm run dev:ts
   ```

6. **Access the Application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool and dev server
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management and caching
- **React Hook Form** - Performant form handling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Prisma** - Modern database toolkit and ORM
- **SQLite** - Lightweight database for development
- **JWT** - Secure authentication tokens
- **Gemini AI** - AI-powered quest generation

### Development Tools
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Vitest** - Fast unit testing framework
- **Prisma Studio** - Database GUI

## 📊 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Quests
- `GET /api/quests` - List all quests
- `POST /api/quests` - Create new quest
- `GET /api/quests/:id` - Get quest details
- `PUT /api/quests/:id` - Update quest
- `DELETE /api/quests/:id` - Delete quest

### AI Quest Generation
- `POST /api/ai-quests/generate` - Generate AI-powered quest
- `GET /api/categories` - Get available quest categories

### Quest Progress
- `GET /api/quest-progress/:questId` - Get user progress for quest
- `POST /api/quest-progress/:questId/start` - Start a quest
- `POST /api/quest-progress/:questId/complete` - Complete a quest

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run backend tests
cd backend && npm run test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
npm run preview  # Test production build locally
```

### Backend (Railway/Heroku)
```bash
cd backend
npm run build
npm start
```

### Environment Variables
```env
# Backend (.env)
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3001

# Frontend (optional)
VITE_API_BASE_URL="http://localhost:3001"
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **shadcn/ui** for the excellent component library
- **Prisma** for the amazing database toolkit
- **Google Gemini** for AI quest generation capabilities
- **Vite** for the lightning-fast development experience

## 📧 Contact

Ibragim Tleukulov - ibrahimtleukulov@gmail.com