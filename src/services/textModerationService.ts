// Text Content Moderation Service for SideQuest
import axios from 'axios';
import { config } from '../config';
import {
  TextModerationService as ITextModerationService,
  ModerationCategory,
  ModerationSeverity,
} from '../types/moderation';

export class TextModerationService implements ITextModerationService {
  private openaiApiKey: string;
  private isConfigured = false;

  constructor() {
    this.openaiApiKey = config.openai.apiKey;
    this.isConfigured = !!this.openaiApiKey;
  }

  // Analyze text for various moderation concerns
  async analyzeText(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    toxicity: number;
    profanity: boolean;
    categories: ModerationCategory[];
    confidence: number;
    entities: string[];
    topics: string[];
  }> {
    try {
      if (!this.isConfigured) {
        // Fallback to basic analysis
        return this.basicTextAnalysis(text);
      }

      // Use OpenAI for advanced analysis
      const analysis = await this.openAIAnalysis(text);
      
      return {
        sentiment: analysis.sentiment,
        toxicity: analysis.toxicity,
        profanity: analysis.profanity,
        categories: analysis.categories,
        confidence: analysis.confidence,
        entities: analysis.entities,
        topics: analysis.topics,
      };
    } catch (error) {
      console.error('Error in text analysis:', error);
      return this.basicTextAnalysis(text);
    }
  }

  // Detect profanity in text
  async detectProfanity(text: string): Promise<{
    hasProfanity: boolean;
    words: string[];
    severity: ModerationSeverity;
  }> {
    try {
      const profanityWords = this.getProfanityWords();
      const words = text.toLowerCase().split(/\s+/);
      const foundWords = words.filter(word => 
        profanityWords.some(profanity => 
          word.includes(profanity.toLowerCase())
        )
      );

      const hasProfanity = foundWords.length > 0;
      const severity = this.calculateProfanitySeverity(foundWords.length, text.length);

      return {
        hasProfanity,
        words: foundWords,
        severity,
      };
    } catch (error) {
      console.error('Error detecting profanity:', error);
      return {
        hasProfanity: false,
        words: [],
        severity: ModerationSeverity.LOW,
      };
    }
  }

  // Detect hate speech
  async detectHateSpeech(text: string): Promise<{
    isHateSpeech: boolean;
    categories: ModerationCategory[];
    confidence: number;
  }> {
    try {
      const hateSpeechPatterns = this.getHateSpeechPatterns();
      const lowerText = text.toLowerCase();
      
      let isHateSpeech = false;
      const categories: ModerationCategory[] = [];
      let confidence = 0;

      // Check for hate speech patterns
      for (const pattern of hateSpeechPatterns) {
        if (pattern.regex.test(lowerText)) {
          isHateSpeech = true;
          categories.push(pattern.category);
          confidence = Math.max(confidence, pattern.confidence);
        }
      }

      // Check for discriminatory language
      const discriminatoryTerms = this.getDiscriminatoryTerms();
      for (const term of discriminatoryTerms) {
        if (lowerText.includes(term.term)) {
          isHateSpeech = true;
          categories.push(term.category);
          confidence = Math.max(confidence, term.confidence);
        }
      }

      return {
        isHateSpeech,
        categories,
        confidence,
      };
    } catch (error) {
      console.error('Error detecting hate speech:', error);
      return {
        isHateSpeech: false,
        categories: [],
        confidence: 0,
      };
    }
  }

  // Detect spam content
  async detectSpam(text: string): Promise<{
    isSpam: boolean;
    confidence: number;
    reasons: string[];
  }> {
    try {
      const reasons: string[] = [];
      let confidence = 0;

      // Check for spam indicators
      const spamIndicators = this.getSpamIndicators();
      
      for (const indicator of spamIndicators) {
        if (indicator.check(text)) {
          reasons.push(indicator.reason);
          confidence += indicator.weight;
        }
      }

      // Check for excessive repetition
      const repetitionScore = this.calculateRepetitionScore(text);
      if (repetitionScore > 0.7) {
        reasons.push('Excessive repetition detected');
        confidence += 0.3;
      }

      // Check for promotional language
      const promotionalScore = this.calculatePromotionalScore(text);
      if (promotionalScore > 0.6) {
        reasons.push('Promotional content detected');
        confidence += 0.2;
      }

      // Check for suspicious links
      const linkScore = this.calculateLinkScore(text);
      if (linkScore > 0.5) {
        reasons.push('Suspicious links detected');
        confidence += 0.4;
      }

      const isSpam = confidence > 0.5;

      return {
        isSpam,
        confidence: Math.min(confidence, 1),
        reasons,
      };
    } catch (error) {
      console.error('Error detecting spam:', error);
      return {
        isSpam: false,
        confidence: 0,
        reasons: [],
      };
    }
  }

  // Private helper methods
  private async openAIAnalysis(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    toxicity: number;
    profanity: boolean;
    categories: ModerationCategory[];
    confidence: number;
    entities: string[];
    topics: string[];
  }> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content: `Analyze the following text for content moderation. Return a JSON response with:
              - sentiment: "positive", "negative", or "neutral"
              - toxicity: number between 0 and 1
              - profanity: boolean
              - categories: array of moderation categories
              - confidence: number between 0 and 1
              - entities: array of named entities
              - topics: array of topics
              
              Moderation categories: profanity, harassment, hate_speech, violence, sexual_content, spam, scam, phishing, misinformation, self_harm, bullying, personal_info, off_topic, inappropriate_language, adult_content, other`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 500,
          temperature: 0.1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const analysis = JSON.parse(response.data.choices[0].message.content);
      
      return {
        sentiment: analysis.sentiment || 'neutral',
        toxicity: analysis.toxicity || 0,
        profanity: analysis.profanity || false,
        categories: analysis.categories || [],
        confidence: analysis.confidence || 0.5,
        entities: analysis.entities || [],
        topics: analysis.topics || [],
      };
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      throw error;
    }
  }

  private basicTextAnalysis(text: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    toxicity: number;
    profanity: boolean;
    categories: ModerationCategory[];
    confidence: number;
    entities: string[];
    topics: string[];
  } {
    const profanityResult = this.detectProfanitySync(text);
    const hateSpeechResult = this.detectHateSpeechSync(text);
    const spamResult = this.detectSpamSync(text);

    const categories: ModerationCategory[] = [];
    if (profanityResult.hasProfanity) categories.push(ModerationCategory.PROFANITY);
    if (hateSpeechResult.isHateSpeech) categories.push(...hateSpeechResult.categories);
    if (spamResult.isSpam) categories.push(ModerationCategory.SPAM);

    return {
      sentiment: this.calculateSentiment(text),
      toxicity: Math.max(profanityResult.severity === ModerationSeverity.HIGH ? 0.8 : 0.3, hateSpeechResult.confidence),
      profanity: profanityResult.hasProfanity,
      categories,
      confidence: Math.max(profanityResult.hasProfanity ? 0.7 : 0.3, hateSpeechResult.confidence, spamResult.confidence),
      entities: this.extractBasicEntities(text),
      topics: this.extractBasicTopics(text),
    };
  }

  private detectProfanitySync(text: string): {
    hasProfanity: boolean;
    words: string[];
    severity: ModerationSeverity;
  } {
    const profanityWords = this.getProfanityWords();
    const words = text.toLowerCase().split(/\s+/);
    const foundWords = words.filter(word => 
      profanityWords.some(profanity => 
        word.includes(profanity.toLowerCase())
      )
    );

    return {
      hasProfanity: foundWords.length > 0,
      words: foundWords,
      severity: this.calculateProfanitySeverity(foundWords.length, text.length),
    };
  }

  private detectHateSpeechSync(text: string): {
    isHateSpeech: boolean;
    categories: ModerationCategory[];
    confidence: number;
  } {
    const hateSpeechPatterns = this.getHateSpeechPatterns();
    const lowerText = text.toLowerCase();
    
    let isHateSpeech = false;
    const categories: ModerationCategory[] = [];
    let confidence = 0;

    for (const pattern of hateSpeechPatterns) {
      if (pattern.regex.test(lowerText)) {
        isHateSpeech = true;
        categories.push(pattern.category);
        confidence = Math.max(confidence, pattern.confidence);
      }
    }

    return {
      isHateSpeech,
      categories,
      confidence,
    };
  }

  private detectSpamSync(text: string): {
    isSpam: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let confidence = 0;

    const spamIndicators = this.getSpamIndicators();
    
    for (const indicator of spamIndicators) {
      if (indicator.check(text)) {
        reasons.push(indicator.reason);
        confidence += indicator.weight;
      }
    }

    return {
      isSpam: confidence > 0.5,
      confidence: Math.min(confidence, 1),
      reasons,
    };
  }

  private calculateSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'enjoy', 'happy', 'pleased'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'sad', 'disappointed', 'frustrated', 'annoyed'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateProfanitySeverity(profanityCount: number, textLength: number): ModerationSeverity {
    const ratio = profanityCount / (textLength / 10); // Normalize by text length
    
    if (ratio > 0.3) return ModerationSeverity.CRITICAL;
    if (ratio > 0.2) return ModerationSeverity.HIGH;
    if (ratio > 0.1) return ModerationSeverity.MEDIUM;
    return ModerationSeverity.LOW;
  }

  private calculateRepetitionScore(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts: Record<string, number> = {};
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(wordCounts));
    return maxCount / words.length;
  }

  private calculatePromotionalScore(text: string): number {
    const promotionalWords = ['buy', 'sale', 'discount', 'offer', 'deal', 'promo', 'free', 'win', 'prize', 'click', 'visit', 'subscribe'];
    const words = text.toLowerCase().split(/\s+/);
    const promotionalCount = words.filter(word => promotionalWords.includes(word)).length;
    
    return promotionalCount / words.length;
  }

  private calculateLinkScore(text: string): number {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    
    if (urls.length === 0) return 0;
    if (urls.length > 3) return 1;
    
    return urls.length * 0.3;
  }

  private extractBasicEntities(text: string): string[] {
    // Simple entity extraction - in production, use a proper NER service
    const entities: string[] = [];
    
    // Extract potential names (capitalized words)
    const words = text.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2 && word[0] === word[0].toUpperCase() && /^[A-Za-z]+$/.test(word)) {
        entities.push(word);
      }
    });
    
    return entities.slice(0, 10); // Limit to 10 entities
  }

  private extractBasicTopics(text: string): string[] {
    // Simple topic extraction - in production, use a proper topic modeling service
    const topics: string[] = [];
    const commonTopics = ['technology', 'sports', 'food', 'travel', 'music', 'art', 'education', 'health', 'business', 'entertainment'];
    
    const lowerText = text.toLowerCase();
    commonTopics.forEach(topic => {
      if (lowerText.includes(topic)) {
        topics.push(topic);
      }
    });
    
    return topics;
  }

  private getProfanityWords(): string[] {
    // Basic profanity list - in production, use a comprehensive database
    return [
      'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'jerk', 'loser',
      // Add more as needed
    ];
  }

  private getHateSpeechPatterns(): Array<{
    regex: RegExp;
    category: ModerationCategory;
    confidence: number;
  }> {
    return [
      {
        regex: /\b(you|they|those)\s+(are|is)\s+(stupid|dumb|idiot|moron|retard)\b/i,
        category: ModerationCategory.HARASSMENT,
        confidence: 0.7,
      },
      {
        regex: /\b(go|goes)\s+(die|kill|hurt)\s+(yourself|themselves)\b/i,
        category: ModerationCategory.VIOLENCE,
        confidence: 0.8,
      },
      {
        regex: /\b(hate|hates)\s+(you|them|those)\b/i,
        category: ModerationCategory.HATE_SPEECH,
        confidence: 0.6,
      },
    ];
  }

  private getDiscriminatoryTerms(): Array<{
    term: string;
    category: ModerationCategory;
    confidence: number;
  }> {
    return [
      { term: 'retard', category: ModerationCategory.HARASSMENT, confidence: 0.8 },
      { term: 'idiot', category: ModerationCategory.HARASSMENT, confidence: 0.6 },
      { term: 'stupid', category: ModerationCategory.HARASSMENT, confidence: 0.5 },
      // Add more as needed
    ];
  }

  private getSpamIndicators(): Array<{
    check: (text: string) => boolean;
    reason: string;
    weight: number;
  }> {
    return [
      {
        check: (text) => text.includes('http://') || text.includes('https://'),
        reason: 'Contains links',
        weight: 0.2,
      },
      {
        check: (text) => text.includes('@') && text.includes('.com'),
        reason: 'Contains email addresses',
        weight: 0.3,
      },
      {
        check: (text) => text.includes('$') && /\d+/.test(text),
        reason: 'Contains monetary references',
        weight: 0.2,
      },
      {
        check: (text) => text.length > 500,
        reason: 'Unusually long text',
        weight: 0.1,
      },
      {
        check: (text) => /[A-Z]{3,}/.test(text),
        reason: 'Contains excessive capitalization',
        weight: 0.2,
      },
    ];
  }
}

// Export singleton instance
export const textModerationService = new TextModerationService();
