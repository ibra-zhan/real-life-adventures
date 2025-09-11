// Badge System Service for SideQuest
import { prisma } from './database';
import {
  Badge,
  UserBadge,
  BadgeType,
  AchievementType,
  DEFAULT_BADGES,
} from '../types/gamification';

export class BadgeSystemService {
  private badges: Map<string, Badge> = new Map();

  constructor() {
    this.initializeBadges();
  }

  // Check if user is eligible for a badge
  async checkBadgeEligibility(userId: string, badgeId: string): Promise<boolean> {
    try {
      const badge = this.badges.get(badgeId);
      if (!badge) return false;

      // Check if user already has this badge
      const existingBadge = await prisma.userBadge.findFirst({
        where: {
          userId,
          badgeId,
        },
      });

      if (existingBadge) return false;

      // Check prerequisites
      if (badge.requirements.prerequisites) {
        for (const prereqId of badge.requirements.prerequisites) {
          const hasPrereq = await prisma.userBadge.findFirst({
            where: {
              userId,
              badgeId: prereqId,
            },
          });
          if (!hasPrereq) return false;
        }
      }

      // Check time limits
      if (badge.requirements.timeLimit) {
        const now = new Date();
        if (now < badge.requirements.timeLimit.start || now > badge.requirements.timeLimit.end) {
          return false;
        }
      }

      // Check achievement requirements
      return await this.checkAchievementRequirements(userId, badge.requirements);
    } catch (error) {
      console.error('Error checking badge eligibility:', error);
      return false;
    }
  }

  // Award a badge to a user
  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    try {
      const badge = this.badges.get(badgeId);
      if (!badge) {
        throw new Error('Badge not found');
      }

      // Check eligibility
      const isEligible = await this.checkBadgeEligibility(userId, badgeId);
      if (!isEligible) {
        throw new Error('User is not eligible for this badge');
      }

      // Create user badge record
      const userBadge = await prisma.userBadge.create({
        data: {
          userId,
          badgeId,
          earnedAt: new Date(),
          progress: 100,
          isDisplayed: true,
        },
      });

      // Update badge in database if it doesn't exist
      await this.ensureBadgeExists(badge);

      console.log(`Awarded badge ${badge.name} to user ${userId}`);
      
      return {
        id: userBadge.id,
        userId: userBadge.userId,
        badgeId: userBadge.badgeId,
        badge: badge,
        earnedAt: userBadge.earnedAt,
        progress: userBadge.progress,
        isDisplayed: userBadge.isDisplayed,
        metadata: userBadge.metadata || undefined,
      };
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  // Get user's badges
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const userBadges = await prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
        },
        orderBy: { earnedAt: 'desc' },
      });

      return userBadges.map(ub => ({
        id: ub.id,
        userId: ub.userId,
        badgeId: ub.badgeId,
        badge: ub.badge as Badge,
        earnedAt: ub.earnedAt,
        progress: ub.progress,
        isDisplayed: ub.isDisplayed,
        metadata: ub.metadata || undefined,
      }));
    } catch (error) {
      console.error('Error getting user badges:', error);
      throw error;
    }
  }

  // Get badge progress for a user
  async getBadgeProgress(userId: string, badgeId: string): Promise<number> {
    try {
      const badge = this.badges.get(badgeId);
      if (!badge) return 0;

      const progress = await this.calculateBadgeProgress(userId, badge);
      return progress;
    } catch (error) {
      console.error('Error getting badge progress:', error);
      return 0;
    }
  }

  // Check all badges for a user and award eligible ones
  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    try {
      const awardedBadges: UserBadge[] = [];

      for (const [badgeId, badge] of this.badges) {
        if (badge.isActive) {
          const isEligible = await this.checkBadgeEligibility(userId, badgeId);
          if (isEligible) {
            try {
              const userBadge = await this.awardBadge(userId, badgeId);
              awardedBadges.push(userBadge);
            } catch (error) {
              console.error(`Error awarding badge ${badgeId}:`, error);
            }
          }
        }
      }

      return awardedBadges;
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
      return [];
    }
  }

  // Get all available badges
  getAllBadges(): Badge[] {
    return Array.from(this.badges.values());
  }

  // Get badges by type
  getBadgesByType(type: BadgeType): Badge[] {
    return Array.from(this.badges.values()).filter(badge => badge.type === type);
  }

  // Get badges by rarity
  getBadgesByRarity(rarity: string): Badge[] {
    return Array.from(this.badges.values()).filter(badge => badge.rarity === rarity);
  }

  // Private helper methods
  private async checkAchievementRequirements(userId: string, requirements: any): Promise<boolean> {
    try {
      const { type, target, conditions } = requirements;

      switch (type) {
        case AchievementType.QUEST_COUNT:
          const questCount = await prisma.submission.count({
            where: {
              userId,
              approved: true,
            },
          });
          return questCount >= target;

        case AchievementType.STREAK_LENGTH:
          const streak = await prisma.streak.findFirst({
            where: {
              userId,
              type: 'daily_quests',
            },
          });
          return streak ? streak.currentCount >= target : false;

        case AchievementType.XP_TOTAL:
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true },
          });
          return user ? user.xp >= target : false;

        case AchievementType.LEVEL_REACHED:
          const userLevel = await prisma.user.findUnique({
            where: { id: userId },
            select: { level: true },
          });
          return userLevel ? userLevel.level >= target : false;

        case AchievementType.SOCIAL_ACTIVITY:
          const socialCount = await prisma.comment.count({
            where: { userId },
          });
          return socialCount >= target;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking achievement requirements:', error);
      return false;
    }
  }

  private async calculateBadgeProgress(userId: string, badge: Badge): Promise<number> {
    try {
      const { type, target } = badge.requirements;

      let current = 0;

      switch (type) {
        case AchievementType.QUEST_COUNT:
          current = await prisma.submission.count({
            where: {
              userId,
              approved: true,
            },
          });
          break;

        case AchievementType.STREAK_LENGTH:
          const streak = await prisma.streak.findFirst({
            where: {
              userId,
              type: 'daily_quests',
            },
          });
          current = streak ? streak.currentCount : 0;
          break;

        case AchievementType.XP_TOTAL:
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true },
          });
          current = user ? user.xp : 0;
          break;

        case AchievementType.LEVEL_REACHED:
          const userLevel = await prisma.user.findUnique({
            where: { id: userId },
            select: { level: true },
          });
          current = userLevel ? userLevel.level : 0;
          break;

        case AchievementType.SOCIAL_ACTIVITY:
          current = await prisma.comment.count({
            where: { userId },
          });
          break;

        default:
          return 0;
      }

      return Math.min((current / target) * 100, 100);
    } catch (error) {
      console.error('Error calculating badge progress:', error);
      return 0;
    }
  }

  private initializeBadges(): void {
    DEFAULT_BADGES.forEach(badge => {
      const badgeWithId = {
        ...badge,
        id: `badge_${badge.name.toLowerCase().replace(/\s+/g, '_')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.badges.set(badgeWithId.id, badgeWithId);
    });
  }

  private async ensureBadgeExists(badge: Badge): Promise<void> {
    try {
      await prisma.badge.upsert({
        where: { id: badge.id },
        update: badge,
        create: badge,
      });
    } catch (error) {
      console.error('Error ensuring badge exists:', error);
    }
  }
}

// Export singleton instance
export const badgeSystemService = new BadgeSystemService();
