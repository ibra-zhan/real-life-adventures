import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { User, Quest } from '@/types';
import { mockUser } from '@/lib/mock-data';
import { updateUserWithQuestCompletion } from '@/lib/progression';
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
      const updatedUser = updateUserWithQuestCompletion(state.user, quest);
      
      return {
        ...state,
        optimisticUpdates: {
          questId: quest.id,
          previousUser: state.user,
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
      const persistedOnboarding = localStorage.getItem('onboardingCompleted');
      const onboardingCompleted = (authUser as any).onboardingCompleted ?? (persistedOnboarding === 'true');
      localStorage.setItem('onboardingCompleted', onboardingCompleted ? 'true' : 'false');

      // Convert backend user to frontend user format
      // Backend User has different structure than frontend User
      const frontendUser: Partial<User> = {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        emailVerified: (authUser as any).emailVerified || false,
        avatar: authUser.avatar,
        firstName: (authUser as any).firstName,
        lastName: (authUser as any).lastName,
        bio: (authUser as any).bio,
        joinedAt: (authUser as any).joinedAt || (authUser as any).createdAt || new Date().toISOString(),
        location: authUser.location,
        createdAt: (authUser as any).createdAt,
        onboardingCompleted,
        preferredCategories: (authUser as any).preferredCategories,
        defaultPrivacy: (authUser as any).defaultPrivacy,
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
    
    // Show success toast for MVP
    toast.success(`Quest completed!`, {
      description: `"${quest.title}" has been completed successfully!`,
      duration: 3000,
    });
    
    // Badge system removed for MVP

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
