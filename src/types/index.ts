// Real Life Adventures MVP - Core Data Models

// Notification types
// Removed notification import to avoid conflicts with simplified MVP version

// MVP types - simplified

export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
export type QuestStatus = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
export type SubmissionType = 'PHOTO' | 'VIDEO' | 'TEXT' | 'CHECKLIST';
// Removed BadgeType for MVP

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  joinedAt: string;
  location?: string;
  onboardingCompleted?: boolean;
  preferredCategories?: string[];
  defaultPrivacy?: 'public' | 'friends' | 'private';
  createdAt?: string;
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

// Removed Badge interface for MVP

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