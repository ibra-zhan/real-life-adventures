import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/lib/api-client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const user = await apiClient.getProfile();
          const persistedOnboarding = localStorage.getItem('onboardingCompleted');
          const onboardingCompleted = user.onboardingCompleted ?? (persistedOnboarding === 'true');
          const normalizedUser: User = {
            ...user,
            onboardingCompleted,
          };

          localStorage.setItem('onboardingCompleted', onboardingCompleted ? 'true' : 'false');
          setState(prev => ({
            ...prev,
            user: normalizedUser,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response: AuthResponse = await apiClient.login(credentials);
      const persistedOnboarding = localStorage.getItem('onboardingCompleted');
      const onboardingCompleted = response.user.onboardingCompleted ?? (persistedOnboarding === 'true');
      const normalizedUser: User = {
        ...response.user,
        onboardingCompleted,
      };

      localStorage.setItem('onboardingCompleted', onboardingCompleted ? 'true' : 'false');
      setState(prev => ({
        ...prev,
        user: normalizedUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response: AuthResponse = await apiClient.register(credentials);
      const onboardingCompleted = response.user.onboardingCompleted ?? false;
      const normalizedUser: User = {
        ...response.user,
        onboardingCompleted,
      };

      localStorage.setItem('onboardingCompleted', onboardingCompleted ? 'true' : 'false');
      setState(prev => ({
        ...prev,
        user: normalizedUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await apiClient.logout();
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
      localStorage.removeItem('onboardingCompleted');
    }
  }, []);

  const logoutAll = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await apiClient.logoutAll();
    } catch (error) {
      console.warn('Logout all request failed:', error);
    } finally {
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
      localStorage.removeItem('onboardingCompleted');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!apiClient.isAuthenticated()) {
      return;
    }

    try {
      const user = await apiClient.getProfile();
      const persistedOnboarding = localStorage.getItem('onboardingCompleted');
      const onboardingCompleted = user.onboardingCompleted ?? (persistedOnboarding === 'true');
      const normalizedUser: User = {
        ...user,
        onboardingCompleted,
      };
      localStorage.setItem('onboardingCompleted', onboardingCompleted ? 'true' : 'false');
      setState(prev => ({
        ...prev,
        user: normalizedUser,
        isAuthenticated: true,
        error: null,
      }));
    } catch (error) {
      console.warn('Failed to refresh user:', error);
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Failed to refresh user',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => {
      if (!prev.user) {
        return prev;
      }

      const nextUser = {
        ...prev.user,
        ...updates,
      };

      if (updates.onboardingCompleted !== undefined) {
        localStorage.setItem('onboardingCompleted', updates.onboardingCompleted ? 'true' : 'false');
      }

      return {
        ...prev,
        user: nextUser,
      };
    });
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
    clearError,
    updateUser,
  };
}
