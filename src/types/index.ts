// SideQuest Core Data Models

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'epic';
export type QuestStatus = 'available' | 'active' | 'completed' | 'expired';
export type SubmissionType = 'photo' | 'video' | 'text' | 'checklist';
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
  difficulty: QuestDifficulty;
  points: number;
  estimatedTime: number; // minutes
  category: string;
  tags: string[];
  requirements: string[];
  submissionType: SubmissionType[];
  status: QuestStatus;
  createdAt: string;
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