import { PrismaClient } from '@prisma/client';
import config from '../config';

// Create Prisma client with configuration
const prisma = new PrismaClient({
  log: config.development.debugMode ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  errorFormat: 'pretty',
});

// Database connection management
export class DatabaseService {
  private static instance: DatabaseService;
  private client: PrismaClient;
  private isConnected = false;

  private constructor() {
    this.client = prisma;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): PrismaClient {
    return this.client;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.$connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      
      if (config.development.debugMode) {
        console.log('🔍 Database debug logging enabled');
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    
    try {
      await this.client.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - start
      };
    }
  }

  public async getStats(): Promise<{
    users: number;
    quests: number;
    submissions: number;
    badges: number;
    challenges: number;
  }> {
    try {
      const [users, quests, submissions, badges, challenges] = await Promise.all([
        this.client.user.count(),
        this.client.quest.count(),
        this.client.submission.count(),
        this.client.badge.count(),
        this.client.challenge.count(),
      ]);

      return {
        users,
        quests,
        submissions,
        badges,
        challenges,
      };
    } catch (error) {
      console.error('❌ Failed to get database stats:', error);
      throw error;
    }
  }

  public async seedData(): Promise<void> {
    console.log('🌱 Starting database seeding...');
    
    try {
      // Create quest categories
      const categories = await this.client.questCategory.createMany({
        data: [
          { name: 'Kindness', description: 'Acts of kindness and compassion', icon: '❤️', color: '#FF6B6B' },
          { name: 'Fitness', description: 'Physical health and exercise', icon: '💪', color: '#4ECDC4' },
          { name: 'Creativity', description: 'Creative expression and art', icon: '🎨', color: '#45B7D1' },
          { name: 'Mindfulness', description: 'Mental health and awareness', icon: '🧘', color: '#96CEB4' },
          { name: 'Photography', description: 'Capturing beautiful moments', icon: '📸', color: '#FFEAA7' },
          { name: 'Learning', description: 'Education and skill development', icon: '📚', color: '#DDA0DD' },
          { name: 'Social', description: 'Building connections with others', icon: '👥', color: '#98D8C8' },
          { name: 'Adventure', description: 'Exploring and trying new things', icon: '🌍', color: '#F7DC6F' },
        ],

      });

      // Create some basic badges
      const badges = await this.client.badge.createMany({
        data: [
          {
            name: 'First Quest',
            description: 'Complete your very first quest',
            icon: '🏆',
            type: 'COMPLETION',
            rarity: 'COMMON',
          },
          {
            name: 'Week Warrior',
            description: 'Complete quests for 7 days straight',
            icon: '🔥',
            type: 'STREAK',
            rarity: 'RARE',
          },
          {
            name: 'Social Butterfly',
            description: 'Share 10 quest completions',
            icon: '🦋',
            type: 'SOCIAL',
            rarity: 'EPIC',
          },
          {
            name: 'Legend',
            description: 'Reach level 50',
            icon: '👑',
            type: 'SPECIAL',
            rarity: 'LEGENDARY',
          },
          {
            name: 'Kindness Champion',
            description: 'Complete 25 kindness quests',
            icon: '💝',
            type: 'COMPLETION',
            rarity: 'EPIC',
          },
        ],

      });

      // Get the first category for sample quests
      const kindnessCategory = await this.client.questCategory.findFirst({
        where: { name: 'Kindness' }
      });

      const fitnessCategory = await this.client.questCategory.findFirst({
        where: { name: 'Fitness' }
      });

      if (kindnessCategory && fitnessCategory) {
        // Create some sample quests
        await this.client.quest.createMany({
          data: [
            {
              title: 'Coffee Shop Compliment',
              description: 'Visit a local coffee shop and genuinely compliment the barista on something specific (their latte art, service, etc.). Take a photo of your drink as proof.',
              shortDescription: 'Brighten a barista\'s day with a genuine compliment',
              categoryId: kindnessCategory.id,
              difficulty: 'EASY',
              tags: JSON.stringify(['social', 'kindness', 'local']),
              requirements: JSON.stringify(['Visit a coffee shop', 'Give a genuine compliment', 'Take a photo of your drink']),
              points: 100,
              estimatedTime: 15,
              submissionTypes: JSON.stringify(['PHOTO', 'TEXT']),
              status: 'AVAILABLE',
              isFeatured: true,
              allowSharing: true,
              encourageSharing: true,
            },
            {
              title: 'Stair Master',
              description: 'For one full day, choose stairs over elevators whenever possible. Track how many flights you climbed!',
              shortDescription: 'Take the stairs instead of elevators today',
              categoryId: fitnessCategory.id,
              difficulty: 'EASY',
              tags: JSON.stringify(['fitness', 'daily', 'simple']),
              requirements: JSON.stringify(['Choose stairs over elevators', 'Count flights climbed', 'Complete for one full day']),
              points: 75,
              estimatedTime: 0,
              submissionTypes: JSON.stringify(['TEXT']),
              status: 'AVAILABLE',
              allowSharing: true,
            },
          ],
  
        });
      }

      console.log('✅ Database seeding completed');
      console.log(`   • Categories created: ${categories.count}`);
      console.log(`   • Badges created: ${badges.count}`);
      console.log('   • Sample quests created');
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();
export { prisma };
export default db;
