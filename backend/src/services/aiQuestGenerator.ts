// AI Quest Generator Service
import { prisma } from '@/services/database';
import type { QuestDifficulty } from '@prisma/client';

// AI Quest Generation Types
interface QuestGenerationContext {
  userId?: string;
  categoryId?: string;
  difficulty?: QuestDifficulty;
  location?: {
    latitude: number;
    longitude: number;
    city?: string | undefined;
    country?: string | undefined;
  };
  weather?: {
    temperature: number;
    condition: string; // sunny, rainy, cloudy, etc.
    season: string;
  };
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  userPreferences?: {
    interests?: string[] | undefined;
    preferredDifficulties?: QuestDifficulty[] | undefined;
    preferredCategories?: string[] | undefined;
  };
  userHistory?: {
    completedQuests: number;
    favoriteCategories: string[];
    averageCompletionTime: number;
    currentStreak: number;
  };
}

interface GeneratedQuest {
  title: string;
  description: string;
  shortDescription: string;
  instructions?: string;
  categoryId: string;
  difficulty: QuestDifficulty;
  tags: string[];
  requirements: string[];
  points: number;
  estimatedTime: number;
  submissionTypes: ('PHOTO' | 'VIDEO' | 'TEXT' | 'CHECKLIST')[];
  locationRequired: boolean;
  locationType?: 'indoor' | 'outdoor' | 'specific';
  specificLocation?: string;
  allowSharing: boolean;
  encourageSharing: boolean;
  imageUrl?: string;
  complexity?: number;
  socialAspect?: boolean;
}

// Quest Templates by Category
const QUEST_TEMPLATES = {
  kindness: [
    {
      template: "compliment_stranger",
      title: "Random Acts of Kindness",
      baseDescription: "Brighten someone's day with a genuine compliment",
      variations: [
        { target: "barista", location: "coffee shop", action: "compliment their service" },
        { target: "cashier", location: "store", action: "thank them for their help" },
        { target: "neighbor", location: "neighborhood", action: "compliment their garden" },
        { target: "colleague", location: "workplace", action: "acknowledge their hard work" },
      ]
    },
    {
      template: "help_someone",
      title: "Lending a Hand",
      baseDescription: "Help someone with a task or problem",
      variations: [
        { action: "help carry groceries", location: "grocery store", target: "elderly person" },
        { action: "give directions", location: "street", target: "lost tourist" },
        { action: "hold the door", location: "building entrance", target: "person with hands full" },
        { action: "help with technology", location: "anywhere", target: "someone struggling" },
      ]
    }
  ],
  fitness: [
    {
      template: "daily_exercise",
      title: "Movement Challenge",
      baseDescription: "Incorporate physical activity into your day",
      variations: [
        { activity: "take stairs", duration: "all day", goal: "count flights climbed" },
        { activity: "walk meeting", duration: "30 minutes", goal: "conduct a meeting while walking" },
        { activity: "desk exercises", duration: "every hour", goal: "do 10 stretches per hour" },
        { activity: "dance break", duration: "5 minutes", goal: "dance to 2 songs" },
      ]
    },
    {
      template: "outdoor_activity",
      title: "Nature Fitness",
      baseDescription: "Exercise in nature",
      variations: [
        { activity: "park workout", location: "local park", goal: "20 minutes of bodyweight exercises" },
        { activity: "hiking", location: "nature trail", goal: "complete a 2-mile hike" },
        { activity: "outdoor yoga", location: "garden or park", goal: "20-minute yoga session" },
        { activity: "bike ride", location: "neighborhood", goal: "30-minute bike ride" },
      ]
    }
  ],
  creativity: [
    {
      template: "artistic_expression",
      title: "Creative Expression",
      baseDescription: "Create something artistic",
      variations: [
        { medium: "photography", subject: "shadows", goal: "capture 5 interesting shadow photos" },
        { medium: "drawing", subject: "daily objects", goal: "sketch 3 items from your desk" },
        { medium: "writing", subject: "gratitude", goal: "write a 100-word gratitude note" },
        { medium: "music", subject: "rhythm", goal: "create a 30-second beat with household items" },
      ]
    },
    {
      template: "diy_project",
      title: "DIY Creation",
      baseDescription: "Make something useful or beautiful",
      variations: [
        { project: "origami", goal: "fold 5 different animals", materials: "paper" },
        { project: "upcycling", goal: "transform an old item", materials: "household items" },
        { project: "plant care", goal: "create a mini garden", materials: "small containers" },
        { project: "decoration", goal: "beautify your space", materials: "natural elements" },
      ]
    }
  ],
  mindfulness: [
    {
      template: "meditation_practice",
      title: "Mindful Moments",
      baseDescription: "Practice mindfulness and presence",
      variations: [
        { practice: "breathing", duration: "10 minutes", location: "quiet space" },
        { practice: "walking meditation", duration: "15 minutes", location: "outdoors" },
        { practice: "gratitude reflection", duration: "5 minutes", location: "anywhere" },
        { practice: "body scan", duration: "10 minutes", location: "comfortable position" },
      ]
    },
    {
      template: "awareness_exercise",
      title: "Present Moment Awareness",
      baseDescription: "Heighten your awareness of the present",
      variations: [
        { focus: "5 senses", goal: "notice 5 things you can see, 4 hear, 3 feel, 2 smell, 1 taste" },
        { focus: "sounds", goal: "sit quietly and identify 10 different sounds" },
        { focus: "textures", goal: "touch and describe 7 different textures" },
        { focus: "colors", goal: "find and photograph 6 different shades of one color" },
      ]
    }
  ],
  social: [
    {
      template: "connection_building",
      title: "Social Connection",
      baseDescription: "Build meaningful connections with others",
      variations: [
        { action: "call old friend", goal: "have a 20-minute catch-up conversation" },
        { action: "meet new person", goal: "introduce yourself to a neighbor" },
        { action: "group activity", goal: "organize a small gathering with friends" },
        { action: "active listening", goal: "have a deep conversation without giving advice" },
      ]
    },
    {
      template: "community_engagement",
      title: "Community Involvement",
      baseDescription: "Engage with your local community",
      variations: [
        { activity: "local event", goal: "attend a community event" },
        { activity: "support local", goal: "visit and support a local business" },
        { activity: "volunteering", goal: "offer help to a local organization" },
        { activity: "neighborhood improvement", goal: "do something to beautify your area" },
      ]
    }
  ],
  learning: [
    {
      template: "skill_development",
      title: "Learning Challenge",
      baseDescription: "Learn something new",
      variations: [
        { skill: "language", goal: "learn 10 new words in a foreign language" },
        { skill: "cooking", goal: "try a recipe from a different culture" },
        { skill: "technology", goal: "learn a new app or software feature" },
        { skill: "history", goal: "research the history of your neighborhood" },
      ]
    },
    {
      template: "knowledge_sharing",
      title: "Teaching Moment",
      baseDescription: "Share knowledge with others",
      variations: [
        { method: "tutorial", goal: "teach someone a skill you know" },
        { method: "documentation", goal: "write instructions for something you do well" },
        { method: "demonstration", goal: "show someone how to do something practical" },
        { method: "storytelling", goal: "share an interesting fact or story you learned" },
      ]
    }
  ],
  adventure: [
    {
      template: "exploration",
      title: "Local Explorer",
      baseDescription: "Discover something new in your area",
      variations: [
        { location: "new restaurant", goal: "try a cuisine you've never had" },
        { location: "hidden spot", goal: "find a place you've never been within 5 miles" },
        { location: "historical site", goal: "visit and learn about a local landmark" },
        { location: "nature area", goal: "explore a park or trail you haven't visited" },
      ]
    },
    {
      template: "challenge_comfort_zone",
      title: "Comfort Zone Challenge",
      baseDescription: "Do something that pushes your boundaries",
      variations: [
        { challenge: "public speaking", goal: "speak up in a meeting or group setting" },
        { challenge: "new activity", goal: "try an activity you've always wanted to do" },
        { challenge: "social interaction", goal: "start a conversation with a stranger" },
        { challenge: "creative risk", goal: "share something you've created with others" },
      ]
    }
  ],
  photography: [
    {
      template: "photo_challenge",
      title: "Photography Mission",
      baseDescription: "Capture the world through your lens",
      variations: [
        { theme: "golden hour", goal: "take 5 photos during sunrise or sunset" },
        { theme: "street photography", goal: "capture everyday life in your neighborhood" },
        { theme: "macro photography", goal: "photograph small details up close" },
        { theme: "black and white", goal: "create 7 compelling monochrome images" },
      ]
    },
    {
      template: "visual_storytelling",
      title: "Story in Pictures",
      baseDescription: "Tell a story through photography",
      variations: [
        { story: "day in the life", goal: "document your entire day in 10 photos" },
        { story: "local character", goal: "photograph someone interesting in your community" },
        { story: "transformation", goal: "show before and after of something changing" },
        { story: "emotions", goal: "capture 5 different emotions in photographs" },
      ]
    }
  ]
};

// Difficulty scaling factors
const DIFFICULTY_MULTIPLIERS = {
  EASY: { points: 1, time: 1, complexity: 0.5 },
  MEDIUM: { points: 1.5, time: 1.5, complexity: 1 },
  HARD: { points: 2.5, time: 2, complexity: 1.5 },
  EPIC: { points: 4, time: 3, complexity: 2 }
};

// Weather-based quest modifications
const WEATHER_MODIFIERS = {
  sunny: {
    outdoor_bonus: 1.2,
    preferred_activities: ['photography', 'exercise', 'exploration'],
    avoid_activities: []
  },
  rainy: {
    indoor_bonus: 1.3,
    preferred_activities: ['creativity', 'learning', 'mindfulness'],
    avoid_activities: ['outdoor_exercise', 'photography']
  },
  cloudy: {
    neutral: true,
    preferred_activities: ['social', 'kindness', 'learning'],
    avoid_activities: []
  },
  snowy: {
    indoor_bonus: 1.4,
    preferred_activities: ['creativity', 'social', 'learning'],
    avoid_activities: ['outdoor_exercise']
  }
};

class AIQuestGenerator {
  
  /**
   * Generate a personalized quest based on context
   */
  async generateQuest(context: QuestGenerationContext): Promise<GeneratedQuest> {
    try {
      // Get user preferences and history
      const userContext = await this.getUserContext(context.userId);
      const mergedContext = { ...context, ...userContext };
      
      // Determine category
      const categoryId = await this.selectCategory(mergedContext);
      const category = await this.getCategoryInfo(categoryId);
      
      // Determine difficulty
      const difficulty = this.selectDifficulty(mergedContext);
      
      // Generate quest content
      const questContent = await this.generateQuestContent(category.name.toLowerCase(), difficulty, mergedContext);
      
      // Calculate points and time
      const { points, estimatedTime } = this.calculateRewards(difficulty, questContent.complexity || 1);
      
      // Generate tags
      const tags = this.generateTags(category.name, difficulty, mergedContext);
      
      return {
        ...questContent,
        categoryId,
        difficulty,
        points,
        estimatedTime,
        tags,
        allowSharing: true,
        encourageSharing: questContent.socialAspect || false,
      };
    } catch (error) {
      console.error('Error generating quest:', error);
      throw new Error('Failed to generate quest');
    }
  }
  
  /**
   * Generate multiple quests for variety
   */
  async generateQuestBatch(
    context: QuestGenerationContext,
    count: number = 5
  ): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const usedTemplates = new Set<string>();
    
    for (let i = 0; i < count; i++) {
      try {
        // Vary the context slightly for each quest
        const variedContext = this.varyContext(context, i);
        const quest = await this.generateQuest(variedContext);
        
        // Ensure variety by avoiding duplicate templates
        const questKey = `${quest.categoryId}-${quest.title}`;
        if (!usedTemplates.has(questKey)) {
          quests.push(quest);
          usedTemplates.add(questKey);
        }
      } catch (error) {
        console.warn(`Failed to generate quest ${i + 1}:`, error);
      }
    }
    
    return quests;
  }
  
  /**
   * Get user context for personalization
   */
  private async getUserContext(userId?: string): Promise<Partial<QuestGenerationContext>> {
    if (!userId) return {};
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          preferences: true,
          submissions: {
            where: { status: 'APPROVED' },
            include: { quest: { include: { category: true } } }
          }
        }
      });
      
      if (!user) return {};
      
      // Parse user preferences
      const preferredCategories = user.preferences?.preferredCategories 
        ? JSON.parse(user.preferences.preferredCategories as string) 
        : [];
      const preferredDifficulty = user.preferences?.preferredDifficulty 
        ? JSON.parse(user.preferences.preferredDifficulty as string) 
        : [];
      
      // Analyze user history
      const completedQuests = user.submissions.length;
      const favoriteCategories = this.analyzeFavoriteCategories(user.submissions);
      const averageCompletionTime = this.calculateAverageCompletionTime(user.submissions);
      
      return {
        userPreferences: {
          interests: preferredCategories,
          preferredDifficulties: preferredDifficulty,
          preferredCategories
        },
        userHistory: {
          completedQuests,
          favoriteCategories,
          averageCompletionTime,
          currentStreak: user.currentStreak
        }
      };
    } catch (error) {
      console.warn('Error getting user context:', error);
      return {};
    }
  }
  
  /**
   * Select appropriate category based on context
   */
  private async selectCategory(context: QuestGenerationContext): Promise<string> {
    // If category is specified, use it
    if (context.categoryId) return context.categoryId;
    
    // Get all available categories
    const categories = await prisma.questCategory.findMany({
      where: { isActive: true }
    });
    
    // Weight categories based on user preferences and context
    const weights = categories.map(category => {
      let weight = 1;
      
      // User preference bonus
      if (context.userPreferences?.preferredCategories?.includes(category.name)) {
        weight *= 2;
      }
      
      // User history bonus
      if (context.userHistory?.favoriteCategories.includes(category.name)) {
        weight *= 1.5;
      }
      
      // Weather context
      if (context.weather) {
        const modifier = WEATHER_MODIFIERS[context.weather.condition as keyof typeof WEATHER_MODIFIERS];
        if (modifier?.preferred_activities.includes(category.name.toLowerCase())) {
          weight *= 1.3;
        }
        if (modifier?.avoid_activities && (modifier.avoid_activities as string[]).includes(category.name.toLowerCase())) {
          weight *= 0.5;
        }
      }
      
      // Time of day context
      if (context.timeOfDay) {
        if (context.timeOfDay === 'morning' && ['fitness', 'mindfulness'].includes(category.name.toLowerCase())) {
          weight *= 1.2;
        }
        if (context.timeOfDay === 'evening' && ['social', 'creativity'].includes(category.name.toLowerCase())) {
          weight *= 1.2;
        }
      }
      
      return { category, weight };
    });
    
    // Select category using weighted random selection
    const totalWeight = weights.reduce((sum, { weight }) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { category, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return category.id;
      }
    }
    
    // Fallback to first category
    return categories[0]?.id || '';
  }
  
  /**
   * Select difficulty based on user context
   */
  private selectDifficulty(context: QuestGenerationContext): QuestDifficulty {
    if (context.difficulty) return context.difficulty;
    
    // Consider user preferences
    if (context.userPreferences?.preferredDifficulties?.length) {
      const preferred = context.userPreferences.preferredDifficulties;
      const selected = preferred[Math.floor(Math.random() * preferred.length)];
      return selected || 'EASY';
    }
    
    // Consider user history
    if (context.userHistory) {
      const { completedQuests, currentStreak } = context.userHistory;
      
      // Scale difficulty based on experience
      if (completedQuests < 5) return 'EASY';
      if (completedQuests < 15) return Math.random() < 0.7 ? 'EASY' : 'MEDIUM';
      if (completedQuests < 50) return Math.random() < 0.4 ? 'EASY' : Math.random() < 0.8 ? 'MEDIUM' : 'HARD';
      
      // High streak bonus - offer epic quests
      if (currentStreak > 7) {
        return Math.random() < 0.2 ? 'EPIC' : Math.random() < 0.5 ? 'HARD' : 'MEDIUM';
      }
    }
    
    // Default distribution
    const rand = Math.random();
    if (rand < 0.5) return 'EASY';
    if (rand < 0.8) return 'MEDIUM';
    if (rand < 0.95) return 'HARD';
    return 'EPIC';
  }
  
  /**
   * Generate quest content based on templates and context
   */
  private async generateQuestContent(
    categoryName: string,
    difficulty: QuestDifficulty,
    context: QuestGenerationContext
  ): Promise<Omit<GeneratedQuest, 'categoryId' | 'difficulty' | 'points' | 'estimatedTime' | 'tags' | 'allowSharing' | 'encourageSharing'>> {
    const templates = QUEST_TEMPLATES[categoryName as keyof typeof QUEST_TEMPLATES] || [];
    
    if (templates.length === 0) {
      // Fallback generic quest
      return this.generateGenericQuest(categoryName, difficulty);
    }
    
    // Select random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    if (!template) return this.generateGenericQuest(categoryName, difficulty);
    
    const variation = template.variations[Math.floor(Math.random() * template.variations.length)];
    
    // Customize based on difficulty and context
    const customizedQuest = this.customizeQuestForContext(template, variation, difficulty, context);
    
    return customizedQuest;
  }
  
  /**
   * Customize quest based on context
   */
  private customizeQuestForContext(
    template: any,
    variation: any,
    difficulty: QuestDifficulty,
    _context: QuestGenerationContext
  ): Omit<GeneratedQuest, 'categoryId' | 'difficulty' | 'points' | 'estimatedTime' | 'tags' | 'allowSharing' | 'encourageSharing'> {
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];
    
    // Generate title with difficulty variation
    let title = template.title;
    if (difficulty === 'HARD') title = `Advanced ${title}`;
    if (difficulty === 'EPIC') title = `Ultimate ${title}`;
    
    // Generate description
    let description = template.baseDescription;
    if (variation.action) description += ` by ${variation.action}`;
    if (variation.location) description += ` at a ${variation.location}`;
    if (variation.goal) description += `. Goal: ${variation.goal}`;
    
    // Add difficulty-specific requirements
    const baseRequirements = [variation.goal || variation.action || 'Complete the task'];
    let requirements = [...baseRequirements];
    
    if (difficulty === 'MEDIUM') {
      requirements.push('Document your experience with photos or notes');
    }
    if (difficulty === 'HARD') {
      requirements.push('Share your experience with someone');
      requirements.push('Reflect on what you learned');
    }
    if (difficulty === 'EPIC') {
      requirements.push('Create a detailed story about your experience');
      requirements.push('Inspire someone else to try something similar');
      requirements.push('Plan a follow-up activity');
    }
    
    // Determine submission types
    let submissionTypes: ('PHOTO' | 'VIDEO' | 'TEXT' | 'CHECKLIST')[] = ['TEXT'];
    if (variation.location || template.template.includes('photo')) {
      submissionTypes.push('PHOTO');
    }
    if (difficulty === 'HARD' || difficulty === 'EPIC') {
      submissionTypes.push('VIDEO');
    }
    
    // Location requirements
    const locationRequired = Boolean(variation.location && variation.location !== 'anywhere');
    const locationType = variation.location === 'outdoors' || variation.location === 'park' ? 'outdoor' : 
                        variation.location === 'home' ? 'indoor' : undefined;
    
    return {
      title,
      description,
      shortDescription: template.baseDescription,
      instructions: this.generateInstructions(variation, difficulty),
      requirements,
      submissionTypes,
      locationRequired,
      ...(locationType && { locationType: locationType as 'indoor' | 'outdoor' | 'specific' }),
      specificLocation: variation.specificLocation,
      complexity: difficultyMultiplier.complexity,
      socialAspect: template.template.includes('social') || difficulty === 'HARD' || difficulty === 'EPIC'
    };
  }
  
  /**
   * Generate detailed instructions
   */
  private generateInstructions(variation: any, difficulty: QuestDifficulty): string {
    let instructions = '';
    
    if (variation.materials) {
      instructions += `Materials needed: ${variation.materials}. `;
    }
    
    if (variation.duration) {
      instructions += `Duration: ${variation.duration}. `;
    }
    
    if (difficulty === 'HARD' || difficulty === 'EPIC') {
      instructions += 'Take your time and focus on quality over speed. ';
    }
    
    instructions += 'Remember to stay safe and have fun!';
    
    return instructions.trim();
  }
  
  /**
   * Generate fallback generic quest
   */
  private generateGenericQuest(categoryName: string, difficulty: QuestDifficulty): Omit<GeneratedQuest, 'categoryId' | 'difficulty' | 'points' | 'estimatedTime' | 'tags' | 'allowSharing' | 'encourageSharing'> {
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];
    
    return {
      title: `${categoryName} Challenge`,
      description: `A ${difficulty.toLowerCase()} ${categoryName.toLowerCase()} quest to help you grow and explore.`,
      shortDescription: `Explore ${categoryName.toLowerCase()} in a new way`,
      requirements: ['Complete the assigned task', 'Document your experience'],
      submissionTypes: ['TEXT', 'PHOTO'],
      locationRequired: false,
      complexity: difficultyMultiplier.complexity
    };
  }
  
  /**
   * Calculate quest rewards
   */
  private calculateRewards(difficulty: QuestDifficulty, complexity: number): { points: number; estimatedTime: number } {
    const multiplier = DIFFICULTY_MULTIPLIERS[difficulty];
    const basePoints = 50;
    const baseTime = 15; // minutes
    
    const points = Math.round(basePoints * multiplier.points * (1 + complexity * 0.5));
    const estimatedTime = Math.round(baseTime * multiplier.time * (1 + complexity * 0.3));
    
    return { points, estimatedTime };
  }
  
  /**
   * Generate relevant tags
   */
  private generateTags(categoryName: string, difficulty: QuestDifficulty, context: QuestGenerationContext): string[] {
    const tags = [categoryName.toLowerCase(), difficulty.toLowerCase()];
    
    if (context.weather?.condition) {
      tags.push(context.weather.condition);
    }
    
    if (context.timeOfDay) {
      tags.push(context.timeOfDay);
    }
    
    if (context.location?.city) {
      tags.push('local');
    }
    
    // Add contextual tags
    if (difficulty === 'EASY') tags.push('beginner-friendly');
    if (difficulty === 'EPIC') tags.push('challenge', 'achievement');
    
    return [...new Set(tags)]; // Remove duplicates
  }
  
  /**
   * Vary context for quest batch generation
   */
  private varyContext(baseContext: QuestGenerationContext, index: number): QuestGenerationContext {
    const variations = { ...baseContext };
    
    // Vary difficulty
    if (!variations.difficulty && index > 0) {
      const difficulties: QuestDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
      const selectedDifficulty = difficulties[index % difficulties.length];
      if (selectedDifficulty) {
        variations.difficulty = selectedDifficulty;
      }
    }
    
    // Clear category to allow variety
    if (index > 2) {
      delete variations.categoryId;
    }
    
    return variations;
  }
  
  /**
   * Analyze user's favorite categories
   */
  private analyzeFavoriteCategories(submissions: any[]): string[] {
    const categoryCount: { [key: string]: number } = {};
    
    submissions.forEach(submission => {
      const categoryName = submission.quest?.category?.name;
      if (categoryName) {
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
      }
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }
  
  /**
   * Calculate average completion time
   */
  private calculateAverageCompletionTime(submissions: any[]): number {
    if (submissions.length === 0) return 30; // Default 30 minutes
    
    const times = submissions.map(s => s.quest?.estimatedTime || 30);
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  /**
   * Get category information
   */
  private async getCategoryInfo(categoryId: string) {
    const category = await prisma.questCategory.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    return category;
  }
}

export const aiQuestGenerator = new AIQuestGenerator();
export type { QuestGenerationContext, GeneratedQuest };
