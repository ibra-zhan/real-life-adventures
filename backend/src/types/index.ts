// SideQuest Backend Core Data Models
// These types should match the frontend types in ../frontend/src/types/index.ts

// Gamification types (commented out due to compilation issues)
// export * from './gamification';

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'epic';
export type QuestStatus = 'available' | 'active' | 'completed' | 'expired';
export type SubmissionType = 'photo' | 'video' | 'text' | 'checklist';
export type BadgeType = 'streak' | 'completion' | 'social' | 'special';
export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  joinedAt: string;
  location?: string;
  role: UserRole;
  isActive: boolean;
  lastActiveAt: string;
  emailVerified: boolean;
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    streakReminders: boolean;
    newQuests: boolean;
    challenges: boolean;
    badges: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    shareCompletions: boolean;
    showLocation: boolean;
  };
  questPreferences: {
    preferredCategories: string[];
    difficulty: QuestDifficulty[];
    timeAvailable: number; // minutes per day
  };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  difficulty: QuestDifficulty;
  points: number;
  estimatedTime: number; // minutes
  category: string;
  tags: string[];
  requirements: string[];
  submissionType: SubmissionType[];
  status: QuestStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  completedAt?: string;
  location?: {
    required: boolean;
    type: 'indoor' | 'outdoor' | 'any';
  };
  social?: {
    allowSharing: boolean;
    encourageSharing: boolean;
  };
  metadata: {
    createdBy: string; // user ID or 'system' or 'ai'
    approved: boolean;
    featured: boolean;
    completionCount: number;
    averageRating?: number;
    ratingCount: number;
  };
}

export interface Submission {
  id: string;
  questId: string;
  userId: string;
  type: SubmissionType;
  content: {
    text?: string;
    mediaUrl?: string;
    checklist?: boolean[];
  };
  caption: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  privacy: 'public' | 'friends' | 'private';
  submittedAt: string;
  approved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  moderationFlags?: string[];
  rating?: number;
  likes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  submissionId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  parentId?: string; // for nested comments
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: BadgeType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: {
    current: number;
    required: number;
  };
  criteria: {
    type: 'quest_count' | 'streak' | 'category' | 'points' | 'level' | 'social' | 'special';
    value: number;
    category?: string;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  participants: number;
  maxParticipants?: number;
  quests: Quest[];
  rewards: Badge[];
  leaderboard: LeaderboardEntry[];
  isJoined: boolean;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  rules?: string;
  prizesDescription?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  points: number;
  streak: number;
  completedQuests: number;
  rank: number;
  change?: number; // rank change from previous period
}

export interface Notification {
  id: string;
  userId: string;
  type: 'streak_reminder' | 'challenge_invite' | 'badge_unlocked' | 'quest_available' | 'friend_request' | 'comment' | 'like';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
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

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface QuestFilters extends PaginationParams {
  category?: string;
  difficulty?: QuestDifficulty;
  tags?: string;
  featured?: boolean;
  active?: boolean;
  userId?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
}

export interface QuestFeedResponse {
  dailyQuest: Quest;
  personalizedQuests: Quest[];
  communityQuests: Quest[];
  hasMore: boolean;
}

export interface UserStatsResponse {
  user: User;
  recentBadges: Badge[];
  weeklyProgress: {
    completed: number;
    target: number;
  };
  streakData: {
    current: number;
    longest: number;
    lastCompletedAt?: string;
  };
}

// Database models (for internal use)
export interface UserModel extends Omit<User, 'badges'> {
  passwordHash: string;
  refreshToken?: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  deletedAt?: Date;
}

export interface QuestModel extends Quest {
  authorId?: string; // if user-generated
  moderatedBy?: string;
  moderatedAt?: Date;
  rejectionReason?: string;
}

export interface SubmissionModel extends Submission {
  moderatedBy?: string;
  moderatedAt?: Date;
  rejectionReason?: string;
  flaggedAt?: Date;
  flaggedBy?: string;
  flagReason?: string;
}

// Utility types
export type CreateUserData = Omit<User, 'id' | 'joinedAt' | 'lastActiveAt' | 'badges' | 'level' | 'xp' | 'totalPoints' | 'currentStreak' | 'longestStreak'>;
export type UpdateUserData = Partial<Pick<User, 'username' | 'avatar' | 'location' | 'preferences'>>;
export type CreateQuestData = Omit<Quest, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>;
export type UpdateQuestData = Partial<CreateQuestData>;
export type CreateSubmissionData = Omit<Submission, 'id' | 'submittedAt' | 'approved' | 'approvedAt' | 'approvedBy' | 'likes' | 'comments'>;

// Environment configuration
export interface Config {
  server: {
    port: number;
    host: string;
    nodeEnv: string;
    baseUrl: string;
  };
  database: {
    url: string;
    ssl: boolean;
  };
  redis: {
    url: string;
    password?: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expireTime: string;
    refreshExpireTime: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3BucketName: string;
    s3BucketRegion: string;
  };
  email: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
    replyTo?: string | undefined;
  };
  push: {
    enabled: boolean;
    vapidKeys: {
      publicKey: string;
      privateKey: string;
    };
    subject: string;
  };
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  fcm: {
    serverKey: string;
    senderId: string;
  };
  features: {
    aiQuestGeneration: boolean;
    contentModeration: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
  };
  development: {
    debugMode: boolean;
    mockExternalApis: boolean;
  };
}

