import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { User, Quest, Badge, Notification, ModerationResult } from '@/types';

// State interfaces
interface AppState {
  user: User | null;
  quests: Quest[];
  badges: Badge[];
  notifications: Notification[];
  moderationQueue: ModerationResult[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Action types
type AppStateAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_QUESTS'; payload: Quest[] }
  | { type: 'ADD_QUEST'; payload: Quest }
  | { type: 'UPDATE_QUEST'; payload: Quest }
  | { type: 'REMOVE_QUEST'; payload: string }
  | { type: 'SET_BADGES'; payload: Badge[] }
  | { type: 'ADD_BADGE'; payload: Badge }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_MODERATION_QUEUE'; payload: ModerationResult[] }
  | { type: 'UPDATE_MODERATION_ITEM'; payload: ModerationResult }
  | { type: 'REMOVE_MODERATION_ITEM'; payload: string }
  | { type: 'SET_LAST_UPDATED'; payload: string }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  user: null,
  quests: [],
  badges: [],
  notifications: [],
  moderationQueue: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Reducer
function appStateReducer(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_USER':
      return { ...state, user: action.payload, error: null };
    
    case 'SET_QUESTS':
      return { ...state, quests: action.payload, error: null };
    
    case 'ADD_QUEST':
      return { ...state, quests: [...state.quests, action.payload] };
    
    case 'UPDATE_QUEST':
      return {
        ...state,
        quests: state.quests.map(quest =>
          quest.id === action.payload.id ? action.payload : quest
        ),
      };
    
    case 'REMOVE_QUEST':
      return {
        ...state,
        quests: state.quests.filter(quest => quest.id !== action.payload),
      };
    
    case 'SET_BADGES':
      return { ...state, badges: action.payload, error: null };
    
    case 'ADD_BADGE':
      return { ...state, badges: [...state.badges, action.payload] };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, error: null };
    
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id ? action.payload : notification
        ),
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
      };
    
    case 'SET_MODERATION_QUEUE':
      return { ...state, moderationQueue: action.payload, error: null };
    
    case 'UPDATE_MODERATION_ITEM':
      return {
        ...state,
        moderationQueue: state.moderationQueue.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    
    case 'REMOVE_MODERATION_ITEM':
      return {
        ...state,
        moderationQueue: state.moderationQueue.filter(item => item.id !== action.payload),
      };
    
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context
interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppStateAction>;
  // Actions
  refreshUser: () => Promise<void>;
  refreshQuests: () => Promise<void>;
  refreshBadges: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshModerationQueue: () => Promise<void>;
  refreshAll: () => Promise<void>;
  // Quest actions
  addQuest: (quest: Quest) => void;
  updateQuest: (quest: Quest) => void;
  removeQuest: (questId: string) => void;
  // Badge actions
  addBadge: (badge: Badge) => void;
  // Notification actions
  addNotification: (notification: Notification) => void;
  updateNotification: (notification: Notification) => void;
  removeNotification: (notificationId: string) => void;
  // Moderation actions
  updateModerationItem: (item: ModerationResult) => void;
  removeModerationItem: (itemId: string) => void;
  // Utility actions
  clearError: () => void;
  resetState: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider component
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const queryClient = useQueryClient();

  // Refresh functions
  const refreshUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const userData = await apiClient.getProfile();
      dispatch({ type: 'SET_USER', payload: userData });
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh user data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshQuests = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.getQuests();
      if (response.success) {
        const questsData = response.data.quests || response.data;
        dispatch({ type: 'SET_QUESTS', payload: Array.isArray(questsData) ? questsData : [] });
        dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh quests' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshBadges = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.getUserBadges();
      if (response.success) {
        dispatch({ type: 'SET_BADGES', payload: response.data });
        dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh badges' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshNotifications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.getNotifications({ page: 1, limit: 50 });
      if (response.success) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data.notifications || [] });
        dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh notifications' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshModerationQueue = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.getModerationQueue({ page: 1, limit: 50 });
      if (response.success) {
        dispatch({ type: 'SET_MODERATION_QUEUE', payload: response.data.items || [] });
        dispatch({ type: 'SET_LAST_UPDATED', payload: new Date().toISOString() });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh moderation queue' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshAll = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await Promise.all([
        refreshUser(),
        refreshQuests(),
        refreshBadges(),
        refreshNotifications(),
        refreshModerationQueue(),
      ]);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to refresh all data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Action functions
  const addQuest = (quest: Quest) => {
    dispatch({ type: 'ADD_QUEST', payload: quest });
  };

  const updateQuest = (quest: Quest) => {
    dispatch({ type: 'UPDATE_QUEST', payload: quest });
  };

  const removeQuest = (questId: string) => {
    dispatch({ type: 'REMOVE_QUEST', payload: questId });
  };

  const addBadge = (badge: Badge) => {
    dispatch({ type: 'ADD_BADGE', payload: badge });
  };

  const addNotification = (notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const updateNotification = (notification: Notification) => {
    dispatch({ type: 'UPDATE_NOTIFICATION', payload: notification });
  };

  const removeNotification = (notificationId: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
  };

  const updateModerationItem = (item: ModerationResult) => {
    dispatch({ type: 'UPDATE_MODERATION_ITEM', payload: item });
  };

  const removeModerationItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_MODERATION_ITEM', payload: itemId });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  // Auto-refresh on mount
  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      refreshAll();
    }
  }, []);

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (apiClient.isAuthenticated() && !state.isLoading) {
        refreshAll();
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [state.isLoading]);

  const contextValue: AppStateContextType = {
    state,
    dispatch,
    refreshUser,
    refreshQuests,
    refreshBadges,
    refreshNotifications,
    refreshModerationQueue,
    refreshAll,
    addQuest,
    updateQuest,
    removeQuest,
    addBadge,
    addNotification,
    updateNotification,
    removeNotification,
    updateModerationItem,
    removeModerationItem,
    clearError,
    resetState,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

// Hook to use the context
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
