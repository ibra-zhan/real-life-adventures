import app from './app';
import config from './config';
import { db } from './services/database';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

let serverInstance: any = null;

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  
  if (serverInstance) {
    serverInstance.close(async (error: any) => {
      if (error) {
        console.error('❌ Error during server shutdown:', error);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      
      // Close database connections
      try {
        await db.disconnect();
        console.log('✅ All connections closed. Exiting...');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
  
  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    await db.connect();
    
    // Seed database if it's empty
    const stats = await db.getStats();
    if (stats.users === 0 && stats.quests === 0) {
      console.log('📊 Database is empty, seeding with initial data...');
      await db.seedData();
    }
    
    // Start server
    const server = app.listen(config.server.port, config.server.host, () => {
      console.log('🚀 SideQuest API Server Started');
      console.log('📍 Server Details:');
      console.log(`   • Environment: ${config.server.nodeEnv}`);
      console.log(`   • Host: ${config.server.host}`);
      console.log(`   • Port: ${config.server.port}`);
      console.log(`   • URL: http://${config.server.host}:${config.server.port}`);
      console.log('📊 Database Stats:');
      console.log(`   • Users: ${stats.users}`);
      console.log(`   • Quests: ${stats.quests}`);
      console.log(`   • Submissions: ${stats.submissions}`);
      console.log(`   • Badges: ${stats.badges}`);
      console.log(`   • Challenges: ${stats.challenges}`);
      console.log('📋 Available Endpoints:');
      console.log(`   • Health Check: http://${config.server.host}:${config.server.port}/health`);
      console.log(`   • API Info: http://${config.server.host}:${config.server.port}/api`);
      console.log(`   • Quests: http://${config.server.host}:${config.server.port}/api/quests`);
      console.log(`   • Leaderboard: http://${config.server.host}:${config.server.port}/api/leaderboard`);
      console.log('⚡ Ready to handle requests!');
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer().then((server) => {
  serverInstance = server;
  
  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${config.server.port} is already in use`);
    } else if (error.code === 'EACCES') {
      console.error(`❌ Permission denied to bind to port ${config.server.port}`);
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default null;

