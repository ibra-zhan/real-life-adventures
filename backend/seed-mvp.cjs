// MVP Seed Data
// Simplified seed file with only essential data for MVP

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MVP seed...');

  try {
    // Create quest categories
    const categories = await Promise.all([
      prisma.questCategory.upsert({
        where: { name: 'Health & Fitness' },
        update: {},
        create: {
          name: 'Health & Fitness',
          description: 'Physical and mental wellness challenges',
          icon: '🏃‍♂️',
          color: '#10B981',
          sortOrder: 1,
        },
      }),
      prisma.questCategory.upsert({
        where: { name: 'Learning & Growth' },
        update: {},
        create: {
          name: 'Learning & Growth',
          description: 'Educational and skill-building activities',
          icon: '📚',
          color: '#3B82F6',
          sortOrder: 2,
        },
      }),
      prisma.questCategory.upsert({
        where: { name: 'Creativity' },
        update: {},
        create: {
          name: 'Creativity',
          description: 'Artistic and creative expression',
          icon: '🎨',
          color: '#8B5CF6',
          sortOrder: 3,
        },
      }),
      prisma.questCategory.upsert({
        where: { name: 'Social & Community' },
        update: {},
        create: {
          name: 'Social & Community',
          description: 'Connecting with others and community service',
          icon: '🤝',
          color: '#F59E0B',
          sortOrder: 4,
        },
      }),
      prisma.questCategory.upsert({
        where: { name: 'Mindfulness' },
        update: {},
        create: {
          name: 'Mindfulness',
          description: 'Meditation and mental well-being',
          icon: '🧘‍♀️',
          color: '#06B6D4',
          sortOrder: 5,
        },
      }),
    ]);

    console.log(`✅ Created ${categories.length} quest categories`);

    // Create sample quests
    const sampleQuests = [
      {
        title: 'Take a 10-minute walk',
        description: 'Step outside and take a refreshing 10-minute walk. This simple activity can boost your mood, improve circulation, and give you a break from your daily routine.',
        shortDescription: 'Get moving with a short walk',
        instructions: '1. Find a safe place to walk (park, neighborhood, or even around your building)\n2. Set a timer for 10 minutes\n3. Walk at a comfortable pace\n4. Take photos of interesting things you see along the way',
        categoryId: categories[0].id, // Health & Fitness
        difficulty: 'EASY',
        tags: JSON.stringify(['walking', 'exercise', 'fresh-air', 'mental-break']),
        requirements: JSON.stringify([
          'Complete a 10-minute walk',
          'Take at least one photo during your walk'
        ]),
        estimatedTime: 10,
        submissionTypes: JSON.stringify(['PHOTO', 'TEXT']),
        status: 'AVAILABLE',
        allowSharing: true,
      },
      {
        title: 'Learn 5 new words in a foreign language',
        description: 'Expand your vocabulary by learning 5 new words in any foreign language. This could be Spanish, French, Japanese, or any language you\'re interested in.',
        shortDescription: 'Expand your vocabulary',
        instructions: '1. Choose a foreign language\n2. Find 5 new words to learn\n3. Practice pronouncing them\n4. Use each word in a sentence\n5. Share what you learned',
        categoryId: categories[1].id, // Learning & Growth
        difficulty: 'EASY',
        tags: JSON.stringify(['language', 'learning', 'vocabulary', 'education']),
        requirements: JSON.stringify([
          'Learn 5 new words in a foreign language',
          'Write down the words and their meanings',
          'Practice pronouncing them'
        ]),
        estimatedTime: 15,
        submissionTypes: JSON.stringify(['TEXT']),
        status: 'AVAILABLE',
        allowSharing: true,
      },
      {
        title: 'Create a digital art piece',
        description: 'Express your creativity by creating a digital art piece. Use any digital tool - from simple drawing apps to professional software.',
        shortDescription: 'Express your creativity digitally',
        instructions: '1. Choose your digital art tool\n2. Create an original piece of art\n3. Save your artwork\n4. Share your creation and describe your inspiration',
        categoryId: categories[2].id, // Creativity
        difficulty: 'MEDIUM',
        tags: JSON.stringify(['art', 'digital', 'creativity', 'design']),
        requirements: JSON.stringify([
          'Create an original digital art piece',
          'Use any digital art tool or app',
          'Share your artwork'
        ]),
        estimatedTime: 30,
        submissionTypes: JSON.stringify(['PHOTO']),
        status: 'AVAILABLE',
        allowSharing: true,
      },
      {
        title: 'Call a friend or family member',
        description: 'Reconnect with someone important in your life by giving them a call. In our digital age, a phone call can mean a lot to someone.',
        shortDescription: 'Reconnect with someone special',
        instructions: '1. Think of someone you haven\'t spoken to in a while\n2. Give them a call (not just a text!)\n3. Have a meaningful conversation\n4. Share how the conversation made you feel',
        categoryId: categories[3].id, // Social & Community
        difficulty: 'EASY',
        tags: JSON.stringify(['social', 'connection', 'communication', 'relationships']),
        requirements: JSON.stringify([
          'Call a friend or family member',
          'Have a meaningful conversation',
          'Reflect on the experience'
        ]),
        estimatedTime: 20,
        submissionTypes: JSON.stringify(['TEXT']),
        status: 'AVAILABLE',
        allowSharing: true,
      },
      {
        title: 'Practice 5 minutes of meditation',
        description: 'Take a moment to center yourself with 5 minutes of meditation. This simple practice can reduce stress and improve focus.',
        shortDescription: 'Find your center with meditation',
        instructions: '1. Find a quiet, comfortable place\n2. Set a timer for 5 minutes\n3. Close your eyes and focus on your breathing\n4. Let thoughts come and go without judgment\n5. Reflect on your meditation experience',
        categoryId: categories[4].id, // Mindfulness
        difficulty: 'EASY',
        tags: JSON.stringify(['meditation', 'mindfulness', 'relaxation', 'mental-health']),
        requirements: JSON.stringify([
          'Meditate for 5 minutes',
          'Focus on your breathing',
          'Reflect on the experience'
        ]),
        estimatedTime: 5,
        submissionTypes: JSON.stringify(['TEXT']),
        status: 'AVAILABLE',
        allowSharing: true,
      },
    ];

    const createdQuests = await Promise.all(
      sampleQuests.map(quest =>
        prisma.quest.create({
          data: quest,
        })
      )
    );

    console.log(`✅ Created ${createdQuests.length} sample quests`);

    console.log('🎉 MVP seed completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log(`• Quest Categories: ${categories.length}`);
    console.log(`• Sample Quests: ${createdQuests.length}`);
    console.log('\n🚀 Your MVP is ready! Users can now:');
    console.log('• Browse quests by category');
    console.log('• Generate AI-powered quests');
    console.log('• Submit quest completions');
    console.log('• Manage their profile');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
