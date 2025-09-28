import OpenAI from 'openai';
import config from '../config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey || process.env['OPENAI_API_KEY'],
});

export interface QuestGenerationPrompt {
  systemPrompt: string;
  userPrompt: string;
}

export interface LegacyQuestGenerationPrompt {
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  context: {
    location?: string;
    weather?: string;
    timeOfDay?: string;
    userInterests?: string[];
    userLevel?: number;
    userStreak?: number;
  };
  customIdea?: string;
}

export interface GeneratedQuestContent {
  title: string;
  description: string;
  shortDescription: string;
  instructions?: string;
  requirements: string[];
  submissionTypes: string[];
  complexity: number;
  socialAspect: boolean;
  locationRequired: boolean;
  locationType?: string;
  estimatedTime: number;
}

class OpenAIService {
  private isConfigured(): boolean {
    return !!(config.openai.apiKey || process.env['OPENAI_API_KEY']);
  }

  /**
   * Generate a quest using OpenAI GPT-4 with custom prompts
   */
  async generateQuest(prompt: QuestGenerationPrompt): Promise<{ content: string }> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      return { content };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate quest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a quest using the legacy interface
   */
  async generateQuestLegacy(prompt: LegacyQuestGenerationPrompt): Promise<GeneratedQuestContent> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(prompt);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      return this.parseQuestResponse(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate quest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple quest variations
   */
  async generateQuestVariations(prompt: LegacyQuestGenerationPrompt, count: number = 3): Promise<GeneratedQuestContent[]> {
    const variations: GeneratedQuestContent[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const variedPrompt = {
          ...prompt,
          context: {
            ...prompt.context,
            variation: i + 1,
          }
        };
        
        const quest = await this.generateQuestLegacy(variedPrompt);
        variations.push(quest);
      } catch (error) {
        console.warn(`Failed to generate variation ${i + 1}:`, error);
      }
    }
    
    return variations;
  }

  /**
   * Enhance an existing quest based on user feedback or requirements
   */
  async enhanceQuest(baseQuest: GeneratedQuestContent, enhancementRequest: string): Promise<GeneratedQuestContent> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const systemPrompt = `You are a quest enhancement expert. Enhance the given quest based on the user's request while maintaining the core structure and requirements.`;
      
      const userPrompt = `
Base Quest:
Title: ${baseQuest.title}
Description: ${baseQuest.description}
Requirements: ${baseQuest.requirements.join(', ')}

Enhancement Request: ${enhancementRequest}

Please enhance this quest and return the result in the same JSON format as before.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      return this.parseQuestResponse(content);
    } catch (error) {
      console.error('OpenAI enhancement error:', error);
      throw new Error(`Failed to enhance quest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert quest designer for a gamification platform called "Real Life Adventures". 
Your job is to create engaging, creative, and achievable quests that help people turn their daily lives into exciting challenges.

Guidelines:
1. Create quests that are realistic and achievable in real life
2. Make them fun, engaging, and motivating
3. Include clear, actionable requirements
4. Consider safety and appropriateness
5. Make quests inclusive and accessible
6. Include social aspects when appropriate
7. Provide variety in difficulty and complexity

Response Format:
Always respond with valid JSON in this exact structure:
{
  "title": "Quest title (creative and engaging)",
  "description": "Detailed description of what the user needs to do",
  "shortDescription": "Brief one-line summary",
  "instructions": "Step-by-step instructions (optional)",
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "submissionTypes": ["PHOTO", "TEXT", "VIDEO", "CHECKLIST"],
  "complexity": 1-5,
  "socialAspect": true/false,
  "locationRequired": true/false,
  "locationType": "indoor/outdoor/specific" (if locationRequired is true),
  "estimatedTime": number in minutes
}`;
  }

  private buildUserPrompt(prompt: LegacyQuestGenerationPrompt): string {
    let userPrompt = `Generate a ${prompt.difficulty.toLowerCase()} difficulty quest in the ${prompt.category} category.`;

    if (prompt.context.location) {
      userPrompt += ` Location context: ${prompt.context.location}.`;
    }

    if (prompt.context.weather) {
      userPrompt += ` Weather: ${prompt.context.weather}.`;
    }

    if (prompt.context.timeOfDay) {
      userPrompt += ` Time of day: ${prompt.context.timeOfDay}.`;
    }

    if (prompt.context.userInterests && prompt.context.userInterests.length > 0) {
      userPrompt += ` User interests: ${prompt.context.userInterests.join(', ')}.`;
    }

    if (prompt.context.userLevel) {
      userPrompt += ` User level: ${prompt.context.userLevel}.`;
    }

    if (prompt.context.userStreak) {
      userPrompt += ` Current streak: ${prompt.context.userStreak} days.`;
    }

    if (prompt.customIdea) {
      userPrompt += ` Custom idea: ${prompt.customIdea}.`;
    }

    userPrompt += `\n\nMake the quest engaging, achievable, and fun. Consider the context provided and create something that fits well with the user's situation and interests.`;

    return userPrompt;
  }

  private parseQuestResponse(content: string): GeneratedQuestContent {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and set defaults
      return {
        title: parsed.title || 'Generated Quest',
        description: parsed.description || 'Complete this quest to earn points!',
        shortDescription: parsed.shortDescription || parsed.title || 'Generated Quest',
        instructions: parsed.instructions || undefined,
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : ['Complete the quest'],
        submissionTypes: Array.isArray(parsed.submissionTypes) ? parsed.submissionTypes : ['TEXT'],
        complexity: typeof parsed.complexity === 'number' ? parsed.complexity : 3,
        socialAspect: Boolean(parsed.socialAspect),
        locationRequired: Boolean(parsed.locationRequired),
        locationType: parsed.locationType || undefined,
        estimatedTime: typeof parsed.estimatedTime === 'number' ? parsed.estimatedTime : 30,
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      console.error('Response content:', content);
      
      // Fallback quest if parsing fails
      return {
        title: 'AI Generated Quest',
        description: 'Complete this quest to earn points and have fun!',
        shortDescription: 'AI Generated Quest',
        requirements: ['Complete the quest'],
        submissionTypes: ['TEXT'],
        complexity: 3,
        socialAspect: false,
        locationRequired: false,
        estimatedTime: 30,
      };
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService;
