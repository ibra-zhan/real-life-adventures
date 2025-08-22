// Mock data for SideQuest development
import type { User, Quest, Badge, Challenge, LeaderboardEntry, Notification } from '@/types';

export const mockUser: User = {
  id: 'user-1',
  username: 'QuestMaster',
  email: 'quest@example.com',
  level: 8,
  xp: 2450,
  totalPoints: 8900,
  currentStreak: 12,
  longestStreak: 23,
  badges: [],
  joinedAt: '2024-01-15T00:00:00Z',
  location: 'San Francisco, CA'
};

export const mockBadges: Badge[] = [
  {
    id: 'badge-1',
    name: 'First Quest',
    description: 'Complete your very first quest',
    icon: 'Trophy',
    type: 'completion',
    rarity: 'common',
    unlockedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'badge-2',
    name: 'Week Warrior',
    description: 'Complete quests for 7 days straight',
    icon: 'Flame',
    type: 'streak',
    rarity: 'rare',
    unlockedAt: '2024-01-22T18:30:00Z'
  },
  {
    id: 'badge-3',
    name: 'Social Butterfly',
    description: 'Share 10 quest completions',
    icon: 'Share2',
    type: 'social',
    rarity: 'epic',
    progress: { current: 7, required: 10 }
  },
  {
    id: 'badge-4',
    name: 'Legend',
    description: 'Reach level 50',
    icon: 'Crown',
    type: 'special',
    rarity: 'legendary',
    progress: { current: 8, required: 50 }
  }
];

export const mockQuests: Quest[] = [
  {
    id: 'quest-1',
    title: 'Coffee Shop Compliment',
    description: 'Visit a local coffee shop and genuinely compliment the barista on something specific (their latte art, service, etc.). Take a photo of your drink as proof.',
    shortDescription: 'Brighten a barista\'s day with a genuine compliment',
    difficulty: 'easy',
    points: 100,
    estimatedTime: 15,
    category: 'Kindness',
    tags: ['social', 'kindness', 'local'],
    requirements: ['Visit a coffee shop', 'Give a genuine compliment', 'Take a photo'],
    submissionType: ['photo', 'text'],
    status: 'available',
    createdAt: '2024-08-22T06:00:00Z',
    location: { required: false, type: 'any' },
    social: { allowSharing: true, encourageSharing: true }
  },
  {
    id: 'quest-2',
    title: 'Sunrise Photography',
    description: 'Wake up early and capture a beautiful sunrise photo. Share the moment of peace and beauty with the community.',
    shortDescription: 'Capture the beauty of dawn',
    difficulty: 'medium',
    points: 200,
    estimatedTime: 45,
    category: 'Photography',
    tags: ['nature', 'photography', 'early-bird'],
    requirements: ['Wake up before sunrise', 'Find a good vantage point', 'Take a photo'],
    submissionType: ['photo'],
    status: 'available',
    createdAt: '2024-08-22T06:00:00Z',
    location: { required: true, type: 'outdoor' },
    social: { allowSharing: true, encourageSharing: true }
  },
  {
    id: 'quest-3',
    title: 'Random Act of Kindness',
    description: 'Perform an unexpected act of kindness for a stranger. This could be helping someone with groceries, paying for someone\'s coffee, or leaving an encouraging note.',
    shortDescription: 'Make a stranger\'s day better',
    difficulty: 'hard',
    points: 300,
    estimatedTime: 30,
    category: 'Kindness',
    tags: ['kindness', 'social', 'impact'],
    requirements: ['Choose a kind act', 'Help a stranger', 'Reflect on the experience'],
    submissionType: ['text', 'photo'],
    status: 'available',
    createdAt: '2024-08-22T06:00:00Z',
    location: { required: false, type: 'any' },
    social: { allowSharing: true, encourageSharing: false }
  },
  {
    id: 'quest-4',
    title: 'Digital Detox Hour',
    description: 'Spend one full hour without any digital devices. Read a book, meditate, draw, or simply observe the world around you.',
    shortDescription: 'Disconnect to reconnect',
    difficulty: 'medium',
    points: 150,
    estimatedTime: 60,
    category: 'Mindfulness',
    tags: ['mindfulness', 'self-care', 'digital-detox'],
    requirements: ['Turn off all devices', 'Engage in analog activity', 'Reflect on the experience'],
    submissionType: ['text'],
    status: 'available',
    createdAt: '2024-08-22T06:00:00Z',
    location: { required: false, type: 'any' },
    social: { allowSharing: true, encourageSharing: true }
  },
  {
    id: 'quest-5',
    title: 'Master Chef Challenge',
    description: 'Cook a meal using only ingredients you already have at home. Get creative and document your culinary adventure!',
    shortDescription: 'Create magic with what you have',
    difficulty: 'epic',
    points: 500,
    estimatedTime: 90,
    category: 'Creativity',
    tags: ['cooking', 'creativity', 'resourcefulness'],
    requirements: ['Inventory your ingredients', 'Plan your meal', 'Cook and plate beautifully', 'Share the recipe'],
    submissionType: ['photo', 'text'],
    status: 'available',
    createdAt: '2024-08-22T06:00:00Z',
    location: { required: false, type: 'indoor' },
    social: { allowSharing: true, encourageSharing: true }
  }
];

export const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    title: 'Kindness Week',
    description: 'Spread kindness throughout your community with daily acts of compassion',
    theme: 'kindness',
    startDate: '2024-08-19T00:00:00Z',
    endDate: '2024-08-25T23:59:59Z',
    participants: 1247,
    maxParticipants: 2000,
    quests: [mockQuests[0], mockQuests[2]],
    rewards: [mockBadges[1]],
    leaderboard: [],
    isJoined: true
  },
  {
    id: 'challenge-2',
    title: 'Creative Expression',
    description: 'Explore your artistic side with photography, cooking, and creative challenges',
    theme: 'creativity',
    startDate: '2024-08-20T00:00:00Z',
    endDate: '2024-08-27T23:59:59Z',
    participants: 892,
    quests: [mockQuests[1], mockQuests[4]],
    rewards: [mockBadges[2]],
    leaderboard: [],
    isJoined: false
  }
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { userId: 'user-1', username: 'QuestMaster', points: 8900, streak: 12, completedQuests: 45, rank: 1 },
  { userId: 'user-2', username: 'AdventureSeeker', points: 7650, streak: 8, completedQuests: 38, rank: 2 },
  { userId: 'user-3', username: 'KindnessKing', points: 6200, streak: 15, completedQuests: 31, rank: 3 },
  { userId: 'user-4', username: 'PhotoNinja', points: 5800, streak: 5, completedQuests: 29, rank: 4 },
  { userId: 'user-5', username: 'MindfulMover', points: 5400, streak: 9, completedQuests: 27, rank: 5 }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'badge_unlocked',
    title: 'New Badge Unlocked!',
    message: 'You earned the "Week Warrior" badge for your 7-day streak!',
    read: false,
    createdAt: '2024-08-22T08:00:00Z'
  },
  {
    id: 'notif-2',
    type: 'challenge_invite',
    title: 'Challenge Invitation',
    message: 'Join the "Creative Expression" challenge starting tomorrow!',
    read: false,
    createdAt: '2024-08-21T20:00:00Z'
  },
  {
    id: 'notif-3',
    type: 'streak_reminder',
    title: 'Keep your streak alive!',
    message: 'Complete a quest today to maintain your 12-day streak.',
    read: true,
    createdAt: '2024-08-22T07:00:00Z'
  }
];

// Update mock user with badges
mockUser.badges = mockBadges;