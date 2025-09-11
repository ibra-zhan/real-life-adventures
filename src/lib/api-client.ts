import { Quest, Challenge, User, Badge, Submission, LeaderboardEntry } from '../types/index';

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
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  tags?: string;
  featured?: boolean;
  active?: boolean;
}

// Authentication types
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
  tokens: AuthTokens;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadTokensFromStorage();
  }

  // Token management
  private loadTokensFromStorage() {
    try {
      const storedTokens = localStorage.getItem('auth_tokens');
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
      }
    } catch (error) {
      console.warn('Failed to load tokens from storage:', error);
      this.clearTokens();
    }
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    try {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
    } catch (error) {
      console.warn('Failed to save tokens to storage:', error);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_tokens');
  }

  private async refreshAccessToken(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.request<AuthTokens>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    }).then(response => {
      this.refreshPromise = null;
      if (response.success) {
        this.saveTokensToStorage(response.data);
        return response.data;
      } else {
        this.clearTokens();
        throw new Error(response.error?.message || 'Token refresh failed');
      }
    }).catch(error => {
      this.refreshPromise = null;
      this.clearTokens();
      throw error;
    });

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh-token')) {
        try {
          await this.refreshAccessToken();
          // Retry the request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${this.accessToken}`,
            },
          };
          const retryResponse = await fetch(url, retryConfig);
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({ 
              success: false, 
              error: { 
                message: `HTTP ${retryResponse.status}: ${retryResponse.statusText}`,
                code: 'HTTP_ERROR' 
              } 
            }));
            throw new Error(errorData.error?.message || `Request failed with status ${retryResponse.status}`);
          }

          const data = await retryResponse.json();
          return data;
        } catch (refreshError) {
          // Refresh failed, clear tokens and throw original error
          this.clearTokens();
          throw new Error('Authentication failed. Please log in again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          success: false, 
          error: { 
            message: `HTTP ${response.status}: ${response.statusText}`,
            code: 'HTTP_ERROR' 
          } 
        }));
        throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success) {
      this.saveTokensToStorage(response.data.tokens);
    }
    
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success) {
      this.saveTokensToStorage(response.data.tokens);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }
    this.clearTokens();
  }

  async logoutAll(): Promise<void> {
    try {
      await this.request('/auth/logout-all', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Logout all request failed:', error);
    }
    this.clearTokens();
  }

  async getProfile(): Promise<User> {
    const response = await this.request<User>('/auth/profile');
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Quest endpoints
  async getQuests(
    filters: QuestFilters & PaginationParams = {}
  ): Promise<ApiResponse<Quest[]>> {
    try {
      const queryString = this.buildQueryString(filters);
      return await this.request<Quest[]>(`/quests${queryString}`);
    } catch (error) {
      console.warn('API not available, using fallback data:', error);
      // Fallback to local mock data if API is not available
      const mockQuests = [
        {
          id: "quest-kindness-coffee",
          title: "Coffee Shop Compliment",
          shortDescription: "Brighten a barista's day with a genuine compliment",
          description: "Visit a local coffee shop and genuinely compliment the barista on something specific (their latte art, service, etc.). Take a photo of your drink as proof.",
          category: "Kindness",
          difficulty: "EASY" as const,
          requirements: ["Visit a coffee shop", "Give a genuine compliment", "Take a photo of your drink"],
          estimatedTime: 15,
          points: 100,
          tags: ["social", "kindness", "local"],
          isFeatured: true,
          isEpic: false,
          imageUrl: null,
          locationRequired: false,
          allowSharing: true
        },
        {
          id: "quest-fitness-stairs",
          title: "Stair Master",
          shortDescription: "Take the stairs instead of elevators today",
          description: "For one full day, choose stairs over elevators whenever possible. Track how many flights you climbed!",
          category: "Fitness",
          difficulty: "EASY" as const,
          requirements: ["Choose stairs over elevators", "Count flights climbed", "Complete for one full day"],
          estimatedTime: 0,
          points: 75,
          tags: ["fitness", "daily", "simple"],
          isFeatured: false,
          isEpic: false,
          imageUrl: null,
          locationRequired: false,
          allowSharing: true
        }
      ];
      
      return {
        success: true,
        data: mockQuests as Quest[],
        timestamp: new Date().toISOString()
      };
    }
  }

  async getQuest(id: string): Promise<ApiResponse<Quest>> {
    try {
      return await this.request<Quest>(`/quests/${id}`);
    } catch (error) {
      console.warn('API not available, using fallback data for quest:', id, error);
      
      // Create mock quest data based on the requested ID
      const mockQuests = {
        "quest-kindness-coffee": {
          id: "quest-kindness-coffee",
          title: "Coffee Shop Compliment",
          shortDescription: "Brighten a barista's day with a genuine compliment",
          description: "Visit a local coffee shop and genuinely compliment the barista on something specific (their latte art, service, etc.). Take a photo of your drink as proof.",
          category: "Kindness",
          difficulty: "EASY" as const,
          requirements: ["Visit a coffee shop", "Give a genuine compliment", "Take a photo of your drink"],
          estimatedTime: 15,
          points: 100,
          tags: ["social", "kindness", "local"],
          isFeatured: true,
          isEpic: false,
          imageUrl: null,
          locationRequired: false,
          allowSharing: true
        },
        "quest-fitness-stairs": {
          id: "quest-fitness-stairs",
          title: "Stair Master",
          shortDescription: "Take the stairs instead of elevators today",
          description: "For one full day, choose stairs over elevators whenever possible. Track how many flights you climbed!",
          category: "Fitness",
          difficulty: "EASY" as const,
          requirements: ["Choose stairs over elevators", "Count flights climbed", "Complete for one full day"],
          estimatedTime: 0,
          points: 75,
          tags: ["fitness", "daily", "simple"],
          isFeatured: false,
          isEpic: false,
          imageUrl: null,
          locationRequired: false,
          allowSharing: true
        }
      };
      
      const mockQuest = mockQuests[id as keyof typeof mockQuests];
      
      if (mockQuest) {
        return {
          success: true,
          data: mockQuest as Quest,
          timestamp: new Date().toISOString()
        };
      }
      
      // If quest ID not found in mock data, throw error
      throw new Error(`Quest ${id} not found`);
    }
  }

  async getFeaturedQuest(): Promise<ApiResponse<Quest>> {
    try {
      return await this.request<Quest>('/quests/featured');
    } catch (error) {
      console.warn('API not available, using fallback data:', error);
      // Fallback to local mock data if API is not available
      const mockFeaturedQuest = {
        id: "quest-kindness-coffee",
        title: "Coffee Shop Compliment",
        shortDescription: "Brighten a barista's day with a genuine compliment",
        description: "Visit a local coffee shop and genuinely compliment the barista on something specific (their latte art, service, etc.). Take a photo of your drink as proof.",
        category: "Kindness",
        difficulty: "EASY" as const,
        requirements: ["Visit a coffee shop", "Give a genuine compliment", "Take a photo of your drink"],
        estimatedTime: 15,
        points: 100,
        tags: ["social", "kindness", "local"],
        isFeatured: true,
        isEpic: false,
        imageUrl: null,
        locationRequired: false,
        allowSharing: true
      };
      
      return {
        success: true,
        data: mockFeaturedQuest as Quest,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getRandomQuest(): Promise<ApiResponse<Quest>> {
    try {
      return await this.request<Quest>('/quests/random');
    } catch (error) {
      console.warn('API not available, using fallback data for random quest:', error);
      
      // Return random quest from mock data
      const mockQuests = [
        {
          id: "quest-kindness-coffee",
          title: "Coffee Shop Compliment",
          shortDescription: "Brighten a barista's day with a genuine compliment",
          description: "Visit a local coffee shop and genuinely compliment the barista on something specific (their latte art, service, etc.). Take a photo of your drink as proof.",
          category: "Kindness",
          difficulty: "EASY" as const,
          requirements: ["Visit a coffee shop", "Give a genuine compliment", "Take a photo of your drink"],
          estimatedTime: 15,
          points: 100,
          tags: ["social", "kindness", "local"],
          isFeatured: true,
          isEpic: false,
          imageUrl: null,
          locationRequired: false,
          allowSharing: true
        },
        {
          id: "quest-fitness-stairs",
          title: "Stair Master",
          shortDescription: "Take the stairs instead of elevators today",
          description: "For one full day, choose stairs over elevators whenever possible. Track how many flights you climbed!",
          category: "Fitness",
          difficulty: "EASY" as const,
          requirements: ["Choose stairs over elevators", "Count flights climbed", "Complete for one full day"],
          estimatedTime: 0,
          points: 75,
          tags: ["fitness", "daily", "simple"],
          isFeatured: false,
          isEpic: false,
          imageUrl: null,
          locationRequired: false,
          allowSharing: true
        }
      ];
      
      const randomIndex = Math.floor(Math.random() * mockQuests.length);
      return {
        success: true,
        data: mockQuests[randomIndex] as Quest,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getQuestCategories(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/quests/categories/all');
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
    return this.request<void>(`/quests/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Challenge endpoints
  async getChallenges(
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<Challenge[]>> {
    const queryString = this.buildQueryString(pagination);
    return this.request<Challenge[]>(`/challenges${queryString}`);
  }

  async getChallenge(id: string): Promise<ApiResponse<Challenge>> {
    return this.request<Challenge>(`/challenges/${id}`);
  }

  async createChallenge(challengeData: Partial<Challenge>): Promise<ApiResponse<Challenge>> {
    return this.request<Challenge>('/challenges', {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
  }

  async joinChallenge(challengeId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/challenges/${challengeId}/join`, {
      method: 'POST',
    });
  }

  // Submission endpoints
  async getSubmissions(
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<Submission[]>> {
    const queryString = this.buildQueryString(pagination);
    return this.request<Submission[]>(`/submissions${queryString}`);
  }

  async createSubmission(submissionData: Partial<Submission>): Promise<ApiResponse<Submission>> {
    return this.request<Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async updateSubmission(id: string, submissionData: Partial<Submission>): Promise<ApiResponse<Submission>> {
    return this.request<Submission>(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(submissionData),
    });
  }

  // Badge endpoints
  async getBadges(): Promise<ApiResponse<Badge[]>> {
    return this.request<Badge[]>('/badges');
  }

  async getBadge(id: number): Promise<ApiResponse<Badge>> {
    return this.request<Badge>(`/badges/${id}`);
  }

  // Leaderboard endpoints
  async getLeaderboard(
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<LeaderboardEntry[]>> {
    const queryString = this.buildQueryString(pagination);
    return this.request<LeaderboardEntry[]>(`/leaderboard${queryString}`);
  }

  // Gamification endpoints
  async getGamificationHealth(): Promise<ApiResponse<any>> {
    return this.request('/gamification/health');
  }

  async getGamificationStats(): Promise<ApiResponse<any>> {
    return this.request('/gamification/stats');
  }

  async getUserLevel(): Promise<ApiResponse<any>> {
    return this.request('/gamification/user/level');
  }

  async getLevelProgress(): Promise<ApiResponse<any>> {
    return this.request('/gamification/user/level-progress');
  }

  async getLevelConfig(): Promise<ApiResponse<any>> {
    return this.request('/gamification/level-config');
  }

  async getAllLevelConfigs(): Promise<ApiResponse<any>> {
    return this.request('/gamification/level-configs');
  }

  async getUserBadges(): Promise<ApiResponse<any>> {
    return this.request('/gamification/user/badges');
  }

  async getBadgeProgress(): Promise<ApiResponse<any>> {
    return this.request('/gamification/user/badge-progress');
  }

  async getAllBadges(): Promise<ApiResponse<any>> {
    return this.request('/gamification/badges');
  }

  async getBadgesByType(type: string): Promise<ApiResponse<any>> {
    return this.request(`/gamification/badges/type/${type}`);
  }

  async getBadgesByRarity(rarity: string): Promise<ApiResponse<any>> {
    return this.request(`/gamification/badges/rarity/${rarity}`);
  }

  async addXP(amount: number, source: string): Promise<ApiResponse<any>> {
    return this.request('/gamification/xp/add', {
      method: 'POST',
      body: JSON.stringify({ amount, source }),
    });
  }

  async awardBadge(badgeId: string): Promise<ApiResponse<any>> {
    return this.request('/gamification/badges/award', {
      method: 'POST',
      body: JSON.stringify({ badgeId }),
    });
  }

  // Media endpoints
  async getMediaFiles(filters?: any): Promise<ApiResponse<any>> {
    const queryString = this.buildQueryString(filters || {});
    return this.request(`/media${queryString}`);
  }

  async getMediaStats(): Promise<ApiResponse<any>> {
    return this.request('/media/stats');
  }

  async getMediaHealth(): Promise<ApiResponse<any>> {
    return this.request('/media/health');
  }

  // Notification endpoints
  async getNotifications(filters?: any): Promise<ApiResponse<any>> {
    const queryString = this.buildQueryString(filters || {});
    return this.request(`/notifications${queryString}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async getNotificationSettings(): Promise<ApiResponse<any>> {
    return this.request('/notifications/settings');
  }

  async updateNotificationSettings(settings: any): Promise<ApiResponse<any>> {
    return this.request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Moderation endpoints
  async getModerationHealth(): Promise<ApiResponse<any>> {
    return this.request('/moderation/health');
  }

  async getModerationStats(): Promise<ApiResponse<any>> {
    return this.request('/moderation/stats');
  }

  async moderateContent(content: any): Promise<ApiResponse<any>> {
    return this.request('/moderation/moderate', {
      method: 'POST',
      body: JSON.stringify(content),
    });
  }

  async getModerationQueue(filters?: any): Promise<ApiResponse<any>> {
    const queryString = this.buildQueryString(filters || {});
    return this.request(`/moderation/queue${queryString}`);
  }

  async approveContent(contentId: string): Promise<ApiResponse<any>> {
    return this.request(`/moderation/queue/${contentId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectContent(contentId: string, reason: string): Promise<ApiResponse<any>> {
    return this.request(`/moderation/queue/${contentId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // AI Quest Generation endpoints
  async generateQuest(params: {
    categoryId?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
    count?: number;
    location?: {
      latitude: number;
      longitude: number;
      city?: string;
      country?: string;
    };
    weather?: {
      temperature: number;
      condition: string;
      season: string;
    };
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    preferences?: {
      interests?: string[];
      preferredDifficulties?: ('EASY' | 'MEDIUM' | 'HARD' | 'EPIC')[];
      preferredCategories?: string[];
    };
  }): Promise<ApiResponse<any>> {
    return this.request('/ai-quests/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async saveGeneratedQuest(questData: any, autoPublish: boolean = false): Promise<ApiResponse<any>> {
    return this.request('/ai-quests/save', {
      method: 'POST',
      body: JSON.stringify({ questData, autoPublish }),
    });
  }

  async generateQuestFromIdea(idea: {
    theme: string;
    description: string;
    categoryPreference?: string;
    difficultyPreference?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
    includeLocation?: boolean;
    targetAudience?: 'beginners' | 'intermediate' | 'advanced' | 'everyone';
  }): Promise<ApiResponse<any>> {
    return this.request('/ai-quests/from-idea', {
      method: 'POST',
      body: JSON.stringify(idea),
    });
  }

  async getGenerationStats(): Promise<ApiResponse<any>> {
    return this.request('/ai-quests/stats');
  }

  async getPersonalizedSuggestions(): Promise<ApiResponse<any>> {
    return this.request('/ai-quests/suggestions');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    // Use absolute URL for health check
    return fetch(`${this.baseUrl.replace('/api', '')}/health`)
      .then(res => res.json())
      .catch(() => ({ 
        status: 'error', 
        message: 'API server not available' 
      }));
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export type { 
  ApiResponse, 
  PaginationParams, 
  QuestFilters, 
  AuthTokens, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse 
};
