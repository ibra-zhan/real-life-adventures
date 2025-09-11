const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create quest categories
    console.log('📂 Creating quest categories...');
    const categories = await prisma.questCategory.createMany({
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
    console.log('🏆 Creating badges...');
    const badges = await prisma.badge.createMany({
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

    // Get the categories for sample quests
    const kindnessCategory = await prisma.questCategory.findFirst({
      where: { name: 'Kindness' }
    });

    const fitnessCategory = await prisma.questCategory.findFirst({
      where: { name: 'Fitness' }
    });

    if (kindnessCategory && fitnessCategory) {
      console.log('⚡ Creating sample quests...');
      // Create some sample quests
      await prisma.quest.createMany({
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
    
    // Verify the data
    const stats = await Promise.all([
      prisma.questCategory.count(),
      prisma.badge.count(),
      prisma.quest.count(),
    ]);
    
    console.log('📊 Final database stats:');
    console.log(`   • Categories: ${stats[0]}`);
    console.log(`   • Badges: ${stats[1]}`);
    console.log(`   • Quests: ${stats[2]}`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
