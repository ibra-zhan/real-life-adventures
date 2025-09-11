import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { User, Quest, Badge } from '@/types';
import { mockUser } from '@/lib/mock-data';
import { calculateQuestRewards, updateUserWithQuestCompletion } from '@/lib/progression';
import { useAuthContext } from './AuthContext';

// Actions
type UserAction =
  | { type: 'QUEST_COMPLETED_OPTIMISTIC'; payload: { quest: Quest } }
  | { type: 'QUEST_COMPLETED_CONFIRMED'; payload: { quest: Quest } }
  | { type: 'QUEST_COMPLETED_FAILED'; payload: { error: string } }
  | { type: 'RESET_USER' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// State
interface UserState {
  user: User;
  optimisticUpdates: {
    questId?: string;
    previousUser?: User;
    rewards?: ReturnType<typeof calculateQuestRewards>;
  };
  isLoading: boolean;
}

// Context
interface UserContextType {
  state: UserState;
  submitQuest: (quest: Quest, submissionData: unknown) => Promise<void>;
  rollbackOptimisticUpdate: () => void;
  updateUser: (updates: Partial<User>) => void;
  resetUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Reducer
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'QUEST_COMPLETED_OPTIMISTIC': {
      const { quest } = action.payload;
      const rewards = calculateQuestRewards(quest, state.user);
      const updatedUser = updateUserWithQuestCompletion(state.user, quest);
      
      return {
        ...state,
        optimisticUpdates: {
          questId: quest.id,
          previousUser: state.user,
          rewards
        },
        user: updatedUser,
        isLoading: true
      };
    }
    
    case 'QUEST_COMPLETED_CONFIRMED': {
      // Clear optimistic state, keep the updates
      return {
        ...state,
        optimisticUpdates: {},
        isLoading: false
      };
    }
    
    case 'QUEST_COMPLETED_FAILED': {
      // Rollback to previous state
      const previousUser = state.optimisticUpdates.previousUser || state.user;
      return {
        ...state,
        user: previousUser,
        optimisticUpdates: {},
        isLoading: false
      };
    }
    
    case 'UPDATE_USER': {
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };
    }
    
    case 'RESET_USER': {
      return {
        user: { ...mockUser },
        optimisticUpdates: {},
        isLoading: false
      };
    }
    
    default:
      return state;
  }
}

// Provider
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [state, dispatch] = useReducer(userReducer, {
    user: { ...mockUser },
    optimisticUpdates: {},
    isLoading: false
  });

  // Sync with authentication state
  useEffect(() => {
    if (isAuthenticated && authUser) {
      // Convert backend user to frontend user format
      const frontendUser: User = {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        avatar: authUser.avatar || undefined,
        level: authUser.level || 1,
        xp: authUser.xp || 0,
        totalPoints: authUser.totalPoints || 0,
        currentStreak: authUser.currentStreak || 0,
        longestStreak: authUser.longestStreak || 0,
        badges: [], // Will be loaded separately
        joinedAt: authUser.createdAt || new Date().toISOString(),
        location: authUser.location || undefined,
      };
      
      dispatch({ type: 'UPDATE_USER', payload: frontendUser });
    } else if (!isAuthenticated && !authLoading) {
      // Reset to mock user when not authenticated
      dispatch({ type: 'RESET_USER' });
    }
  }, [isAuthenticated, authUser, authLoading]);

  const submitQuest = useCallback(async (quest: Quest, submissionData: unknown) => {
    // Apply optimistic update immediately
    dispatch({ type: 'QUEST_COMPLETED_OPTIMISTIC', payload: { quest } });
    
    // Show optimistic feedback
    const rewards = calculateQuestRewards(quest, state.user);
    
    // Show XP gained toast
    toast.success(`+${rewards.totalXP} XP earned!`, {
      description: rewards.levelUp ? `Level up! You're now level ${rewards.newLevel}` : undefined,
      duration: 3000,
    });
    
    // Show streak toast
    if (rewards.newStreak > 1) {
      toast.success(`🔥 ${rewards.newStreak} day streak!`, {
        description: rewards.streakBonus ? "Streak bonus XP earned!" : undefined,
        duration: 2000,
      });
    }
    
    // Show badge unlock toasts
    rewards.unlockedBadges.forEach((badge) => {
      toast.success(`🏆 Badge Unlocked: ${badge.name}!`, {
        description: badge.description,
        duration: 4000,
      });
    });

    try {
      // Simulate API call with random failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.2) {
            reject(new Error("Network error: Unable to submit quest"));
          } else {
            resolve(true);
          }
        }, 1500);
      });
      
      // Success - confirm the optimistic update
      dispatch({ type: 'QUEST_COMPLETED_CONFIRMED', payload: { quest } });
      
    } catch (error) {
      // Failure - rollback optimistic update
      dispatch({ 
        type: 'QUEST_COMPLETED_FAILED', 
        payload: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      // Show rollback toast
      toast.error("Quest submission failed", {
        description: "Your progress has been restored. Please try again.",
        duration: 4000,
      });
    }
  }, [state.user]);

  const rollbackOptimisticUpdate = useCallback(() => {
    dispatch({ type: 'QUEST_COMPLETED_FAILED', payload: { error: 'Manual rollback' } });
    toast.info("Progress rolled back");
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  const resetUser = useCallback(() => {
    dispatch({ type: 'RESET_USER' });
    toast.info("User data reset");
  }, []);

  const contextValue: UserContextType = {
    state,
    submitQuest,
    rollbackOptimisticUpdate,
    updateUser,
    resetUser
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Hook
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Export for convenience
export type { UserContextType, UserState };
