// Mock data for Real Life Adventures MVP
import type { User, Quest, Notification } from '@/types';

export const mockUser: User = {
  id: 'user-1',
  username: 'QuestMaster',
  email: 'quest@example.com',
  joinedAt: '2024-01-15T00:00:00Z',
  location: 'San Francisco, CA'
};

export const mockQuests: Quest[] = [
  {
    id: 'quest-1',
    title: 'Take a 10-minute walk',
    description: 'Step outside and take a refreshing 10-minute walk. This simple activity can boost your mood, improve circulation, and give you a break from your daily routine.',
    shortDescription: 'Get moving with a short walk',
    instructions: '1. Find a safe place to walk (park, neighborhood, or even around your building)\n2. Set a timer for 10 minutes\n3. Walk at a comfortable pace\n4. Take photos of interesting things you see along the way',
    categoryId: 'health-fitness',
    difficulty: 'EASY',
    tags: ['walking', 'exercise', 'fresh-air', 'mental-break'],
    requirements: ['Complete a 10-minute walk', 'Take at least one photo during your walk'],
    points: 50,
    estimatedTime: 10,
    submissionTypes: ['PHOTO', 'TEXT'],
    status: 'AVAILABLE',
    isFeatured: true,
    isEpic: false,
    locationRequired: false,
    allowSharing: true,
    encourageSharing: false,
    imageUrl: null,
    videoUrl: null,
    createdBy: null,
    moderatedBy: null,
    moderatedAt: null,
    rejectionReason: null,
    completionCount: 150,
    averageRating: 4.8,
    ratingCount: 45,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    publishedAt: '2024-01-01T00:00:00Z',
    expiresAt: null,
    category: {
      id: 'health-fitness',
      name: 'Health & Fitness',
      description: 'Physical and mental wellness challenges',
      icon: '🏃‍♂️',
      color: '#10B981'
    },
    creator: null
  },
  {
    id: 'quest-2',
    title: 'Learn 5 new words in a foreign language',
    description: 'Expand your vocabulary by learning 5 new words in any foreign language. This could be Spanish, French, Japanese, or any language you\'re interested in.',
    shortDescription: 'Expand your vocabulary',
    instructions: '1. Choose a foreign language\n2. Find 5 new words to learn\n3. Practice pronouncing them\n4. Use each word in a sentence\n5. Share what you learned',
    categoryId: 'learning-growth',
    difficulty: 'EASY',
    tags: ['language', 'learning', 'vocabulary', 'education'],
    requirements: ['Learn 5 new words in a foreign language', 'Write down the words and their meanings', 'Practice pronouncing them'],
    points: 75,
    estimatedTime: 15,
    submissionTypes: ['TEXT'],
    status: 'AVAILABLE',
    isFeatured: false,
    isEpic: false,
    locationRequired: false,
    allowSharing: true,
    encourageSharing: false,
    imageUrl: null,
    videoUrl: null,
    createdBy: null,
    moderatedBy: null,
    moderatedAt: null,
    rejectionReason: null,
    completionCount: 89,
    averageRating: 4.6,
    ratingCount: 32,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    publishedAt: '2024-01-02T00:00:00Z',
    expiresAt: null,
    category: {
      id: 'learning-growth',
      name: 'Learning & Growth',
      description: 'Educational and skill-building activities',
      icon: '📚',
      color: '#3B82F6'
    },
    creator: null
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'quest_available',
    title: 'New Quest Available!',
    message: 'A new quest "Take a 10-minute walk" is now available for you to complete.',
    read: false,
    createdAt: '2024-01-15T10:00:00Z',
    actionUrl: '/quest/quest-1'
  },
  {
    id: 'notif-2',
    type: 'quest_available',
    title: 'Featured Quest',
    message: 'Check out today\'s featured quest: "Learn 5 new words in a foreign language"',
    read: true,
    createdAt: '2024-01-14T15:30:00Z',
    actionUrl: '/quest/quest-2'
  }
];