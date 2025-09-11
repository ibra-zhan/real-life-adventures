// Main Gamification Service for SideQuest
import { xpLevelingService } from './xpLevelingService';
import { badgeSystemService } from './badgeSystemService';
import {
  GamificationService as IGamificationService,
  UserLevel,
  LevelConfig,
  UserBadge,
  UserAchievement,
  Streak,
  LeaderboardEntry,
  UserReward,
  GamificationStats,
  ProgressTracking,
  StreakType,
  DEFAULT_GAMIFICATION_CONFIG,
} from '../types/gamification';

export class GamificationService implements IGamificationService {
  private config = DEFAULT_GAMIFICATION_CONFIG;

  // XP and Leveling
  async addXP(userId: string, amount: number, source: string, sourceId?: string): Promise<void> {
    return xpLevelingService.addXP(userId, amount, source, sourceId);
  }

  async getUserLevel(userId: string): Promise<UserLevel> {
    return xpLevelingService.getUserLevel(userId);
  }

  async getLevelConfig(level: number): Promise<LevelConfig> {
    const config = xpLevelingService.getLevelConfig(level);
    if (!config) {
      throw new Error(`Level ${level} configuration not found`);
    }
    return config;
  }

  async getLevelProgress(userId: string): Promise<{ current: number; next: number; progress: number }> {
    return xpLevelingService.getLevelProgress(userId);
  }

  // Badges
  async checkBadgeEligibility(userId: string, badgeId: string): Promise<boolean> {
    return badgeSystemService.checkBadgeEligibility(userId, badgeId);
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    return badgeSystemService.awardBadge(userId, badgeId);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return badgeSystemService.getUserBadges(userId);
  }

  async getBadgeProgress(userId: string, badgeId: string): Promise<number> {
    return badgeSystemService.getBadgeProgress(userId, badgeId);
  }

  // Achievements (placeholder implementation)
  async checkAchievementProgress(userId: string, achievementId: string): Promise<number> {
    // Placeholder implementation
    return 0;
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<void> {
    // Placeholder implementation
    console.log(`Updating achievement ${achievementId} progress for user ${userId}: ${progress}%`);
  }

  async completeAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    // Placeholder implementation
    throw new Error('Achievement system not yet implemented');
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    // Placeholder implementation
    return [];
  }

  // Streaks (placeholder implementation)
  async updateStreak(userId: string, type: StreakType): Promise<Streak> {
    // Placeholder implementation
    throw new Error('Streak system not yet implemented');
  }

  async getUserStreaks(userId: string): Promise<Streak[]> {
    // Placeholder implementation
    return [];
  }

  async getStreakRewards(streakType: StreakType, milestone: number): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  // Leaderboards (placeholder implementation)
  async updateLeaderboard(leaderboardId: string, userId: string, score: number): Promise<void> {
    // Placeholder implementation
    console.log(`Updating leaderboard ${leaderboardId} for user ${userId} with score ${score}`);
  }

  async getLeaderboard(leaderboardId: string, limit?: number): Promise<LeaderboardEntry[]> {
    // Placeholder implementation
    return [];
  }

  async getUserRank(leaderboardId: string, userId: string): Promise<number> {
    // Placeholder implementation
    return 0;
  }

  // Rewards (placeholder implementation)
  async claimReward(userId: string, rewardId: string): Promise<UserReward> {
    // Placeholder implementation
    throw new Error('Reward system not yet implemented');
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    // Placeholder implementation
    return [];
  }

  // Statistics
  async getGamificationStats(userId: string): Promise<GamificationStats> {
    try {
      const userLevel = await this.getUserLevel(userId);
      const userBadges = await this.getUserBadges(userId);
      
      return {
        userId,
        level: userLevel.level,
        totalXP: userLevel.totalXP,
        badgesEarned: userBadges.length,
        achievementsCompleted: 0, // Placeholder
        currentStreaks: [], // Placeholder
        longestStreak: 0, // Placeholder
        questsCompleted: 0, // Placeholder
        rank: 0, // Placeholder
        percentile: 0, // Placeholder
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting gamification stats:', error);
      throw error;
    }
  }

  async getProgressTracking(userId: string, category?: string): Promise<ProgressTracking[]> {
    // Placeholder implementation
    return [];
  }

  // Quest completion handler
  async handleQuestCompletion(userId: string, questId: string, difficulty: string): Promise<void> {
    try {
      // Award XP for quest completion
      await this.addXP(userId, this.config.xp.questCompletion, 'quest_completion', questId);
      
      // Check for badge eligibility
      await badgeSystemService.checkAndAwardBadges(userId);
      
      console.log(`Handled quest completion for user ${userId}, quest ${questId}`);
    } catch (error) {
      console.error('Error handling quest completion:', error);
    }
  }

  // Quest submission handler
  async handleQuestSubmission(userId: string, submissionId: string): Promise<void> {
    try {
      // Award XP for quest submission
      await this.addXP(userId, this.config.xp.questSubmission, 'quest_submission', submissionId);
      
      console.log(`Handled quest submission for user ${userId}, submission ${submissionId}`);
    } catch (error) {
      console.error('Error handling quest submission:', error);
    }
  }

  // Daily login handler
  async handleDailyLogin(userId: string): Promise<void> {
    try {
      // Award XP for daily login
      await this.addXP(userId, this.config.xp.dailyLogin, 'daily_login');
      
      console.log(`Handled daily login for user ${userId}`);
    } catch (error) {
      console.error('Error handling daily login:', error);
    }
  }

  // Social interaction handler
  async handleSocialInteraction(userId: string, interactionType: string, targetId: string): Promise<void> {
    try {
      // Award XP for social interaction
      await this.addXP(userId, this.config.xp.socialInteraction, 'social_interaction', `${interactionType}_${targetId}`);
      
      console.log(`Handled social interaction for user ${userId}, type: ${interactionType}`);
    } catch (error) {
      console.error('Error handling social interaction:', error);
    }
  }

  // Get all level configurations
  getAllLevelConfigs(): LevelConfig[] {
    return xpLevelingService.getAllLevelConfigs();
  }

  // Get all badges
  getAllBadges() {
    return badgeSystemService.getAllBadges();
  }

  // Get badges by type
  getBadgesByType(type: string) {
    return badgeSystemService.getBadgesByType(type as any);
  }

  // Get badges by rarity
  getBadgesByRarity(rarity: string) {
    return badgeSystemService.getBadgesByRarity(rarity);
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
