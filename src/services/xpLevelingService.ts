// XP and Leveling System Service for SideQuest
import { prisma } from './database';
import {
  XPTransaction,
  UserLevel,
  LevelConfig,
  GamificationEvent,
  DEFAULT_LEVELS,
  DEFAULT_GAMIFICATION_CONFIG,
} from '../types/gamification';

export class XPLevelingService {
  private levelConfigs: Map<number, LevelConfig> = new Map();
  private config = DEFAULT_GAMIFICATION_CONFIG;

  constructor() {
    this.initializeLevelConfigs();
  }

  // Add XP to a user
  async addXP(userId: string, amount: number, source: string, sourceId?: string): Promise<void> {
    try {
      // Create XP transaction record
      const transaction = await prisma.xPTransaction.create({
        data: {
          userId,
          amount,
          source,
          sourceId,
          description: this.getSourceDescription(source, amount),
        },
      });

      // Update user's total XP
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: amount,
          },
        },
      });

      // Check for level up
      await this.checkLevelUp(userId);

      // Emit XP earned event
      this.emitEvent({
        type: 'xp_earned',
        userId,
        data: {
          amount,
          source,
          sourceId,
        },
        timestamp: new Date(),
      });

      console.log(`Added ${amount} XP to user ${userId} from ${source}`);
    } catch (error) {
      console.error('Error adding XP:', error);
      throw error;
    }
  }

  // Get user's current level information
  async getUserLevel(userId: string): Promise<UserLevel> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp: true,
          level: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const levelConfig = this.getLevelConfig(user.level);
      const nextLevelConfig = this.getLevelConfig(user.level + 1);

      const currentLevelXP = user.level > 1 
        ? this.getLevelConfig(user.level - 1)?.requiredXP || 0 
        : 0;
      
      const nextLevelXP = nextLevelConfig?.requiredXP || levelConfig.requiredXP;
      const progress = nextLevelConfig 
        ? ((user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
        : 100;

      return {
        id: `level_${userId}`,
        userId: user.id,
        level: user.level,
        totalXP: user.xp,
        currentLevelXP: user.xp - currentLevelXP,
        nextLevelXP: nextLevelXP - currentLevelXP,
        progress: Math.min(progress, 100),
        title: levelConfig.title,
        perks: levelConfig.perks,
        unlockedAt: new Date(), // This should be tracked in the database
        metadata: {
          levelConfig,
          nextLevelConfig,
        },
      };
    } catch (error) {
      console.error('Error getting user level:', error);
      throw error;
    }
  }

  // Get level configuration
  getLevelConfig(level: number): LevelConfig | undefined {
    return this.levelConfigs.get(level);
  }

  // Get level progress information
  async getLevelProgress(userId: string): Promise<{ current: number; next: number; progress: number }> {
    try {
      const userLevel = await this.getUserLevel(userId);
      
      return {
        current: userLevel.level,
        next: userLevel.level + 1,
        progress: userLevel.progress,
      };
    } catch (error) {
      console.error('Error getting level progress:', error);
      throw error;
    }
  }

  // Check if user should level up
  private async checkLevelUp(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp: true,
          level: true,
        },
      });

      if (!user) return;

      const currentLevel = user.level;
      const newLevel = this.calculateLevel(user.xp);

      if (newLevel > currentLevel) {
        // Level up!
        await this.performLevelUp(userId, currentLevel, newLevel);
      }
    } catch (error) {
      console.error('Error checking level up:', error);
    }
  }

  // Perform level up
  private async performLevelUp(userId: string, oldLevel: number, newLevel: number): Promise<void> {
    try {
      // Update user's level
      await prisma.user.update({
        where: { id: userId },
        data: {
          level: newLevel,
        },
      });

      // Get level configuration
      const levelConfig = this.getLevelConfig(newLevel);
      
      if (levelConfig) {
        // Create level up record
        await prisma.userLevel.create({
          data: {
            userId,
            level: newLevel,
            totalXP: await this.getUserTotalXP(userId),
            currentLevelXP: 0, // Will be calculated
            nextLevelXP: this.getLevelConfig(newLevel + 1)?.requiredXP || 0,
            progress: 0,
            title: levelConfig.title,
            perks: levelConfig.perks,
            unlockedAt: new Date(),
          },
        });

        // Emit level up event
        this.emitEvent({
          type: 'level_up',
          userId,
          data: {
            level: newLevel,
            oldLevel,
            title: levelConfig.title,
            perks: levelConfig.perks,
          },
          timestamp: new Date(),
        });

        console.log(`User ${userId} leveled up from ${oldLevel} to ${newLevel}!`);
      }
    } catch (error) {
      console.error('Error performing level up:', error);
    }
  }

  // Calculate level based on XP
  private calculateLevel(xp: number): number {
    let level = 1;
    
    for (const [levelNum, config] of this.levelConfigs.entries()) {
      if (xp >= config.requiredXP) {
        level = levelNum;
      } else {
        break;
      }
    }
    
    return level;
  }

  // Get user's total XP
  private async getUserTotalXP(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });
    
    return user?.xp || 0;
  }

  // Get XP transactions for a user
  async getXPTransactions(userId: string, limit: number = 50): Promise<XPTransaction[]> {
    try {
      const transactions = await prisma.xPTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return transactions.map(tx => ({
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        source: tx.source,
        sourceId: tx.sourceId || undefined,
        description: tx.description,
        metadata: tx.metadata || undefined,
        createdAt: tx.createdAt,
      }));
    } catch (error) {
      console.error('Error getting XP transactions:', error);
      throw error;
    }
  }

  // Get XP statistics for a user
  async getXPStats(userId: string): Promise<{
    totalXP: number;
    currentLevel: number;
    nextLevelXP: number;
    progress: number;
    recentTransactions: XPTransaction[];
    xpBySource: Record<string, number>;
  }> {
    try {
      const userLevel = await this.getUserLevel(userId);
      const transactions = await this.getXPTransactions(userId, 10);
      
      // Calculate XP by source
      const xpBySource: Record<string, number> = {};
      const allTransactions = await prisma.xPTransaction.findMany({
        where: { userId },
        select: { source: true, amount: true },
      });

      allTransactions.forEach(tx => {
        xpBySource[tx.source] = (xpBySource[tx.source] || 0) + tx.amount;
      });

      return {
        totalXP: userLevel.totalXP,
        currentLevel: userLevel.level,
        nextLevelXP: userLevel.nextLevelXP,
        progress: userLevel.progress,
        recentTransactions: transactions,
        xpBySource,
      };
    } catch (error) {
      console.error('Error getting XP stats:', error);
      throw error;
    }
  }

  // Award XP for specific actions
  async awardQuestCompletion(userId: string, questId: string, difficulty: string): Promise<void> {
    const baseXP = this.config.xp.questCompletion;
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const amount = Math.round(baseXP * difficultyMultiplier);
    
    await this.addXP(userId, amount, 'quest_completion', questId);
  }

  async awardQuestSubmission(userId: string, submissionId: string): Promise<void> {
    const amount = this.config.xp.questSubmission;
    await this.addXP(userId, amount, 'quest_submission', submissionId);
  }

  async awardBadgeEarned(userId: string, badgeId: string): Promise<void> {
    const amount = this.config.xp.badgeEarned;
    await this.addXP(userId, amount, 'badge_earned', badgeId);
  }

  async awardAchievementCompleted(userId: string, achievementId: string): Promise<void> {
    const amount = this.config.xp.achievementCompleted;
    await this.addXP(userId, amount, 'achievement_completed', achievementId);
  }

  async awardStreakMilestone(userId: string, streakType: string, milestone: number): Promise<void> {
    const amount = this.config.xp.streakMilestone;
    await this.addXP(userId, amount, 'streak_milestone', `${streakType}_${milestone}`);
  }

  async awardSocialInteraction(userId: string, interactionType: string, targetId: string): Promise<void> {
    const amount = this.config.xp.socialInteraction;
    await this.addXP(userId, amount, 'social_interaction', `${interactionType}_${targetId}`);
  }

  async awardDailyLogin(userId: string): Promise<void> {
    const amount = this.config.xp.dailyLogin;
    await this.addXP(userId, amount, 'daily_login');
  }

  // Helper methods
  private initializeLevelConfigs(): void {
    DEFAULT_LEVELS.forEach(level => {
      this.levelConfigs.set(level.level, level);
    });
  }

  private getSourceDescription(source: string, amount: number): string {
    const descriptions: Record<string, string> = {
      quest_completion: `Completed quest (+${amount} XP)`,
      quest_submission: `Submitted quest (+${amount} XP)`,
      badge_earned: `Earned badge (+${amount} XP)`,
      achievement_completed: `Completed achievement (+${amount} XP)`,
      streak_milestone: `Streak milestone (+${amount} XP)`,
      social_interaction: `Social interaction (+${amount} XP)`,
      daily_login: `Daily login bonus (+${amount} XP)`,
    };

    return descriptions[source] || `Earned ${amount} XP`;
  }

  private getDifficultyMultiplier(difficulty: string): number {
    const multipliers: Record<string, number> = {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
      epic: 3.0,
    };

    return multipliers[difficulty] || 1.0;
  }

  private emitEvent(event: GamificationEvent): void {
    // In a real implementation, this would emit to an event system
    console.log('Gamification Event:', event);
  }

  // Get all level configurations
  getAllLevelConfigs(): LevelConfig[] {
    return Array.from(this.levelConfigs.values()).sort((a, b) => a.level - b.level);
  }

  // Get level configuration by name
  getLevelConfigByName(name: string): LevelConfig | undefined {
    return Array.from(this.levelConfigs.values()).find(config => config.name === name);
  }

  // Get next level configuration
  getNextLevelConfig(currentLevel: number): LevelConfig | undefined {
    return this.getLevelConfig(currentLevel + 1);
  }

  // Check if user can level up
  async canLevelUp(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true },
      });

      if (!user) return false;

      const nextLevel = this.calculateLevel(user.xp);
      return nextLevel > user.level;
    } catch (error) {
      console.error('Error checking if user can level up:', error);
      return false;
    }
  }
}

// Export singleton instance
export const xpLevelingService = new XPLevelingService();
