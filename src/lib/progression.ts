import type { User, Badge, Quest } from "@/types";

// XP and level calculations
export function calculateLevelFromXP(xp: number): number {
  // Each level requires exponentially more XP: level 1 = 100 XP, level 2 = 300 XP, etc.
  let level = 1;
  let totalXPNeeded = 0;
  
  while (totalXPNeeded <= xp) {
    totalXPNeeded += level * 100; // Level 1 = 100, Level 2 = 200, Level 3 = 300, etc.
    if (totalXPNeeded <= xp) {
      level++;
    }
  }
  
  return level;
}

export function calculateXPForLevel(level: number): number {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += i * 100;
  }
  return totalXP;
}

export function calculateXPToNextLevel(currentXP: number): { current: number; max: number; level: number } {
  const currentLevel = calculateLevelFromXP(currentXP);
  const currentLevelXP = calculateXPForLevel(currentLevel);
  const nextLevelXP = calculateXPForLevel(currentLevel + 1);
  
  return {
    current: currentXP - currentLevelXP,
    max: nextLevelXP - currentLevelXP,
    level: currentLevel
  };
}

// Badge unlock conditions
export function checkBadgeUnlocks(user: User, quest: Quest): Badge[] {
  const unlockedBadges: Badge[] = [];
  
  // First Quest badge
  if (user.badges.length === 0) {
    unlockedBadges.push({
      id: 'badge-1',
      name: 'First Quest',
      description: 'Complete your very first quest',
      icon: 'Trophy',
      type: 'completion',
      rarity: 'common',
      unlockedAt: new Date().toISOString()
    });
  }
  
  // Week Warrior badge (7-day streak)
  if (user.currentStreak + 1 === 7 && !user.badges.some(b => b.id === 'badge-2')) {
    unlockedBadges.push({
      id: 'badge-2',
      name: 'Week Warrior',
      description: 'Complete quests for 7 days straight',
      icon: 'Flame',
      type: 'streak',
      rarity: 'rare',
      unlockedAt: new Date().toISOString()
    });
  }
  
  // Social Butterfly badge (10 shared quests)
  // This would be tracked separately in a real app
  
  // Level-based badges
  const newLevel = calculateLevelFromXP(user.xp + quest.points);
  if (newLevel >= 10 && user.level < 10 && !user.badges.some(b => b.name === 'Rising Star')) {
    unlockedBadges.push({
      id: 'badge-level-10',
      name: 'Rising Star',
      description: 'Reach level 10',
      icon: 'Star',
      type: 'completion',
      rarity: 'rare',
      unlockedAt: new Date().toISOString()
    });
  }
  
  return unlockedBadges;
}

// Quest completion rewards calculation
export function calculateQuestRewards(quest: Quest, user: User): {
  xpGained: number;
  bonusXP: number;
  totalXP: number;
  newLevel: number;
  levelUp: boolean;
  newStreak: number;
  streakBonus: boolean;
  unlockedBadges: Badge[];
} {
  const baseXP = quest.points;
  let bonusXP = 0;
  
  // Epic quest bonus
  if (quest.difficulty === 'EPIC') {
    bonusXP += Math.floor(baseXP * 0.5);
  }
  
  // Streak bonus (every 5 days)
  const newStreak = user.currentStreak + 1;
  const streakBonus = newStreak % 5 === 0;
  if (streakBonus) {
    bonusXP += Math.floor(baseXP * 0.2);
  }
  
  const totalXP = baseXP + bonusXP;
  const newTotalXP = user.xp + totalXP;
  const newLevel = calculateLevelFromXP(newTotalXP);
  const levelUp = newLevel > user.level;
  
  const unlockedBadges = checkBadgeUnlocks(user, quest);
  
  return {
    xpGained: baseXP,
    bonusXP,
    totalXP,
    newLevel,
    levelUp,
    newStreak,
    streakBonus,
    unlockedBadges
  };
}

// Update user with quest completion
export function updateUserWithQuestCompletion(user: User, quest: Quest): User {
  const rewards = calculateQuestRewards(quest, user);
  
  return {
    ...user,
    xp: user.xp + rewards.totalXP,
    level: rewards.newLevel,
    totalPoints: user.totalPoints + quest.points,
    currentStreak: rewards.newStreak,
    longestStreak: Math.max(user.longestStreak, rewards.newStreak),
    badges: [...user.badges, ...rewards.unlockedBadges]
  };
}
