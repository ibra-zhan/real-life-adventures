// SideQuest Core Data Models

// Media types
export * from './media';

// Notification types
export * from './notification';

// Moderation types
export * from './moderation';

// Gamification types
export * from './gamification';

export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
export type QuestStatus = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
export type SubmissionType = 'PHOTO' | 'VIDEO' | 'TEXT' | 'CHECKLIST';
export type BadgeType = 'streak' | 'completion' | 'social' | 'special';

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
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  instructions?: string | null;
  categoryId: string;
  difficulty: QuestDifficulty;
  tags: string | string[]; // Backend sends as JSON string, frontend expects array
  requirements: string | string[]; // Backend sends as JSON string, frontend expects array
  points: number;
  estimatedTime: number; // minutes
  submissionTypes: string | SubmissionType[]; // Backend sends as JSON string, frontend expects array
  status: QuestStatus;
  isFeatured: boolean;
  isEpic: boolean;
  locationRequired: boolean;
  locationType?: string | null;
  specificLocation?: string | null;
  allowSharing: boolean;
  encourageSharing: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdBy?: string | null;
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  rejectionReason?: string | null;
  completionCount: number;
  averageRating?: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
  category?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  };
  creator?: any;
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
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  points: number;
  streak: number;
  completedQuests: number;
  rank: number;
}

export interface ShareAssetSpec {
  format: '1:1' | '9:16' | '16:9';
  quest: Quest;
  user: User;
  submission: Submission;
  badge?: Badge;
  template: 'minimal' | 'achievement' | 'streak';
}

export interface FeatureFlags {
  enablePremiumQuests: boolean;
  enableSocialSharing: boolean;
  enableLocationQuests: boolean;
  enableChallenges: boolean;
  enableLeaderboards: boolean;
  debugMode: boolean;
}

export interface Notification {
  id: string;
  type: 'streak_reminder' | 'challenge_invite' | 'badge_unlocked' | 'quest_available';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// API Response types
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