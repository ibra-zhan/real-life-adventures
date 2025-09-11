// Gamification Types for SideQuest Frontend

export interface UserLevel {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  currentXp: number;
  progress: number;
  nextLevelXp: number;
  description: string;
  color: string;
  icon: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  type: BadgeType;
  requirements: BadgeRequirement[];
  points: number;
  isEarned: boolean;
  earnedAt?: string;
  progress?: number;
}

export interface BadgeRequirement {
  type: 'quests_completed' | 'streak_days' | 'social_interactions' | 'xp_earned' | 'categories_explored';
  value: number;
  current: number;
  description: string;
}

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BadgeType = 'streak' | 'completion' | 'social' | 'special' | 'achievement';

export interface GamificationStats {
  totalXp: number;
  currentLevel: number;
  levelProgress: number;
  badgesEarned: number;
  totalBadges: number;
  currentStreak: number;
  longestStreak: number;
  questsCompleted: number;
  socialInteractions: number;
  categoriesExplored: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  description: string;
  color: string;
  icon: string;
  rewards: string[];
}

export interface XpEvent {
  id: string;
  userId: string;
  source: XpSource;
  amount: number;
  description: string;
  timestamp: string;
  metadata?: any;
}

export type XpSource = 
  | 'quest_completion'
  | 'quest_submission'
  | 'badge_earned'
  | 'streak_milestone'
  | 'social_interaction'
  | 'daily_login'
  | 'achievement_unlocked'
  | 'admin_grant';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
}

export type AchievementCategory = 
  | 'quests'
  | 'social'
  | 'exploration'
  | 'streaks'
  | 'special';

export interface AchievementRequirement {
  type: string;
  value: number;
  current: number;
  description: string;
}

export interface AchievementReward {
  type: 'xp' | 'badge' | 'title' | 'unlock';
  value: any;
  description: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  badges: number;
  streak: number;
  rank: number;
}

export interface GamificationEvent {
  type: 'level_up' | 'badge_earned' | 'achievement_unlocked' | 'streak_milestone';
  data: any;
  timestamp: string;
  message: string;
}

// Constants
export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, name: 'Novice', minXp: 0, maxXp: 100, description: 'Just getting started', color: '#6B7280', icon: '🌱', rewards: [] },
  { level: 2, name: 'Explorer', minXp: 100, maxXp: 300, description: 'Discovering new adventures', color: '#10B981', icon: '🗺️', rewards: [] },
  { level: 3, name: 'Adventurer', minXp: 300, maxXp: 600, description: 'Embracing the journey', color: '#3B82F6', icon: '⚔️', rewards: [] },
  { level: 4, name: 'Hero', minXp: 600, maxXp: 1000, description: 'Making a difference', color: '#8B5CF6', icon: '🦸', rewards: [] },
  { level: 5, name: 'Champion', minXp: 1000, maxXp: 1500, description: 'Rising above challenges', color: '#F59E0B', icon: '🏆', rewards: [] },
  { level: 6, name: 'Master', minXp: 1500, maxXp: 2200, description: 'Perfecting your craft', color: '#EF4444', icon: '🎯', rewards: [] },
  { level: 7, name: 'Legend', minXp: 2200, maxXp: 3000, description: 'Stories will be told', color: '#EC4899', icon: '📜', rewards: [] },
  { level: 8, name: 'Mythic', minXp: 3000, maxXp: 4000, description: 'Beyond mortal limits', color: '#06B6D4', icon: '⚡', rewards: [] },
  { level: 9, name: 'Transcendent', minXp: 4000, maxXp: 5000, description: 'Ascending to greatness', color: '#84CC16', icon: '🌟', rewards: [] },
  { level: 10, name: 'Divine', minXp: 5000, maxXp: Infinity, description: 'Touched by the divine', color: '#F97316', icon: '👑', rewards: [] },
];

export const BADGE_RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#6B7280',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

export const BADGE_TYPE_ICONS: Record<BadgeType, string> = {
  streak: '🔥',
  completion: '✅',
  social: '👥',
  special: '⭐',
  achievement: '🏅',
};