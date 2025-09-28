import type { User, Quest } from "@/types";

// Simplified progression for MVP
export function calculateQuestRewards(quest: Quest): {
  xp: number;
  points: number;
} {
  // Simple reward calculation based on difficulty
  const baseRewards = {
    EASY: { xp: 50, points: 10 },
    MEDIUM: { xp: 100, points: 25 },
    HARD: { xp: 200, points: 50 },
    EPIC: { xp: 500, points: 100 }
  };

  return baseRewards[quest.difficulty] || baseRewards.EASY;
}

export function updateUserWithQuestCompletion(user: User, quest: Quest): User {
  // For MVP, just return the user as-is since we removed gamification
  return user;
}

// Simplified level calculation
export function calculateLevelFromXP(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

export function calculateXPToNextLevel(currentXP: number): { 
  current: number; 
  max: number; 
  level: number 
} {
  const currentLevel = calculateLevelFromXP(currentXP);
  const currentLevelXP = (currentLevel - 1) * 1000;
  const nextLevelXP = currentLevel * 1000;
  
  return {
    current: currentXP - currentLevelXP,
    max: nextLevelXP - currentLevelXP,
    level: currentLevel
  };
}