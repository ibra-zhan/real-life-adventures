const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Check if tables exist
    const categories = await prisma.questCategory.findMany();
    console.log('✅ Quest categories found:', categories.length);
    
    const badges = await prisma.badge.findMany();
    console.log('✅ Badges found:', badges.length);
    
    const quests = await prisma.quest.findMany();
    console.log('✅ Quests found:', quests.length);
    
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
