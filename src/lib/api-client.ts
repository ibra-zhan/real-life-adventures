import { Quest, User, Submission } from '../types/index';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface QuestFilters {
  category?: string;
  difficulty?: string;
  status?: string;
  featured?: boolean;
  search?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface UserProfile {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  avatar?: string;
}

interface UserPreferences {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  profileVisibility?: string;
  preferredCategories?: string[];
  preferredDifficulty?: string[];
  defaultPrivacy?: 'public' | 'friends' | 'private';
  onboardingCompleted?: boolean;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken(): void {
    this.accessToken = localStorage.getItem('accessToken');
    // Also check if token exists but might be expired
    if (this.accessToken) {
      try {
        // Simple JWT expiry check without full validation
        const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          console.log('Access token is expired, will refresh on next request');
          // Don't clear the token here, let the request handling deal with it
        }
      } catch (error) {
        console.warn('Invalid access token format:', error);
        this.accessToken = null;
        localStorage.removeItem('accessToken');
      }
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If we get a 401 and have a refresh token, try to refresh the access token
        if (response.status === 401 && retryCount === 0 && localStorage.getItem('refreshToken')) {
          try {
            await this.refreshToken();
            // Retry the request with the new token
            return this.request(endpoint, options, retryCount + 1);
          } catch (refreshError) {
            // If refresh fails, clear tokens and throw original error
            this.accessToken = null;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw new Error(data.error?.message || `HTTP ${response.status}`);
          }
        }

        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<{
      user: User;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success) {
      this.accessToken = response.data.tokens.accessToken;
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }

    return {
      user: response.data.user,
      tokens: response.data.tokens
    };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.request<{
      user: User;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success) {
      this.accessToken = response.data.tokens.accessToken;
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }

    return {
      user: response.data.user,
      tokens: response.data.tokens
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.request<void>('/auth/logout', { method: 'POST' });
    } finally {
      this.accessToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    return { success: true, data: undefined as any, timestamp: new Date().toISOString() };
  }

  async logoutAll(): Promise<ApiResponse<void>> {
    try {
      await this.request<void>('/auth/logout-all', { method: 'POST' });
    } finally {
      this.accessToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    return { success: true, data: undefined as any, timestamp: new Date().toISOString() };
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success) {
      this.accessToken = response.data.tokens.accessToken;
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }

    return {
      success: response.success,
      data: { accessToken: response.data.tokens.accessToken },
      timestamp: response.timestamp
    };
  }

  async getProfile(): Promise<User> {
    const response = await this.request<User>('/auth/profile');
    return response.data;
  }

  // Email verification endpoints
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async verifyEmailWithCode(code: string): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/verify-email-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async resendVerificationEmail(): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/resend-verification', {
      method: 'POST',
    });
  }

  // User endpoints
  async updateProfile(profileData: UserProfile): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updatePreferences(preferences: UserPreferences): Promise<ApiResponse<any>> {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    return this.request<void>('/users/account', { method: 'DELETE' });
  }

  // Quest endpoints
  async getQuests(
    filters: QuestFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<Quest[]>> {
    const params = { ...filters, ...pagination };
    const queryString = this.buildQueryString(params);
    return this.request<Quest[]>(`/quests${queryString}`);
  }

  async getFeaturedQuests(): Promise<ApiResponse<Quest[]>> {
    return this.request<Quest[]>('/quests/featured');
  }


  async getQuest(id: string): Promise<ApiResponse<Quest>> {
    return this.request<Quest>(`/quests/${id}`);
  }

  async createQuest(questData: Partial<Quest>): Promise<ApiResponse<Quest>> {
    return this.request<Quest>('/quests', {
      method: 'POST',
      body: JSON.stringify(questData),
    });
  }

  async updateQuest(id: string, questData: Partial<Quest>): Promise<ApiResponse<Quest>> {
    return this.request<Quest>(`/quests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questData),
    });
  }

  async deleteQuest(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/quests/${id}`, { method: 'DELETE' });
  }

  // AI Quest endpoints
  async generateQuest(generationData: {
    mode: 'quick' | 'custom';
    difficulty: 'easy' | 'medium' | 'hard' | 'epic';
    category?: 'fitness' | 'learning';
    count?: number;
  }): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/ai-quests/generate', {
      method: 'POST',
      body: JSON.stringify(generationData),
    });
  }

  async saveGeneratedQuest(questData: any, autoPublish: boolean = false): Promise<ApiResponse<Quest>> {
    return this.request<Quest>('/ai-quests/save', {
      method: 'POST',
      body: JSON.stringify({ questData, autoPublish }),
    });
  }

  async getGenerationStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/ai-quests/stats');
  }

  async getPersonalizedSuggestions(): Promise<ApiResponse<any>> {
    return this.request<any>('/ai-quests/suggestions');
  }

  async generateQuestFromIdea(idea: {
    theme: string;
    description: string;
    categoryPreference?: string;
    difficultyPreference?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
    includeLocation?: boolean;
    targetAudience?: 'beginners' | 'intermediate' | 'advanced' | 'everyone';
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/ai-quests/from-idea', {
      method: 'POST',
      body: JSON.stringify(idea),
    });
  }

  async getRandomQuest(): Promise<ApiResponse<any>> {
    // Generate a random quest using AI with minimal parameters
    const response = await this.request<any[]>('/ai-quests/generate', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'quick',
        difficulty: 'easy',
        count: 1,
      }),
    });

    if (!response.success || !response.data || response.data.length === 0) {
      throw new Error('Failed to generate random quest');
    }

    // Return the first (and only) generated quest
    return {
      ...response,
      data: response.data[0]
    };
  }

  // Submission endpoints
  async submitQuest(
    questId: string,
    submissionData: {
      type: string;
      caption: string;
      textContent?: string;
      mediaUrls?: string[];
      checklistData?: any;
      latitude?: number;
      longitude?: number;
      address?: string;
      privacy?: string;
    }
  ): Promise<ApiResponse<Submission>> {
    return this.request<Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify({ questId, ...submissionData }),
    });
  }

  async getSubmissions(
    questId?: string,
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<Submission[]>> {
    const endpoint = questId ? `/quests/${questId}/submissions` : '/submissions';
    const queryString = this.buildQueryString(pagination);
    return this.request<Submission[]>(`${endpoint}${queryString}`);
  }

  async getSubmission(id: string): Promise<ApiResponse<Submission>> {
    return this.request<Submission>(`/submissions/${id}`);
  }

  async updateSubmission(id: string, submissionData: Partial<Submission>): Promise<ApiResponse<Submission>> {
    return this.request<Submission>(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(submissionData),
    });
  }

  async deleteSubmission(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/submissions/${id}`, { method: 'DELETE' });
  }

  // Notification endpoints
  async getNotifications(pagination: PaginationParams = {}): Promise<ApiResponse<any[]>> {
    const queryString = this.buildQueryString(pagination);
    return this.request<any[]>(`/notifications${queryString}`);
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markAsRead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    return this.request<void>('/notifications/read-all', { method: 'PUT' });
  }

  // Media endpoints
  async uploadFile(file: File, category: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await fetch(`${this.baseURL}/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: this.accessToken ? `Bearer ${this.accessToken}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Quest Progress endpoints
  async startQuest(questId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/quest-progress/start', {
      method: 'POST',
      body: JSON.stringify({ questId }),
    });
  }

  async submitQuest(questId: string, submission: {
    type: 'PHOTO' | 'VIDEO' | 'TEXT' | 'CHECKLIST';
    caption: string;
    textContent?: string;
    mediaUrls?: string[];
    checklistData?: any;
    latitude?: number;
    longitude?: number;
    address?: string;
    privacy?: 'public' | 'private';
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/quest-progress/submit', {
      method: 'POST',
      body: JSON.stringify({ questId, submission }),
    });
  }

  async getQuestProgress(questId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/quest-progress/${questId}`);
  }

  async getUserQuests(status?: string, pagination: PaginationParams = {}): Promise<ApiResponse<any[]>> {
    const params = { status, ...pagination };
    const queryString = this.buildQueryString(params);
    return this.request<any[]>(`/quest-progress/user${queryString}`);
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/quest-progress/user/stats');
  }

  async abandonQuest(questId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/quest-progress/${questId}/abandon`, {
      method: 'POST',
    });
  }

  async completeQuest(questId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/quest-progress/${questId}/complete`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/../health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type {
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  UserProfile,
  UserPreferences,
  QuestFilters,
  PaginationParams,
};