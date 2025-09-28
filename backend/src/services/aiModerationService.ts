import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(config.gemini.apiKey || process.env['GEMINI_API_KEY'] || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ModerationRequest {
  content: string;
  contentType: 'text' | 'submission' | 'comment' | 'quest';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  reason?: string | undefined;
  suggestedAction: 'approve' | 'reject' | 'review' | 'edit';
  editedContent?: string | undefined;
}

class AIModerationService {
  private isConfigured(): boolean {
    return !!(config.gemini.apiKey || process.env['GEMINI_API_KEY']);
  }

  /**
   * Moderate content using Gemini
   */
  async moderateContent(request: ModerationRequest): Promise<ModerationResult> {
    if (!this.isConfigured()) {
      // Fallback to basic keyword filtering
      return this.basicModeration(request.content);
    }

    try {
      const systemPrompt = this.buildModerationPrompt();
      const userPrompt = this.buildContentPrompt(request);

      const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      });

      const response = await result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No moderation result from Gemini');
      }

      return this.parseModerationResult(content);
    } catch (error) {
      console.error('AI moderation error:', error);
      // Fallback to basic moderation
      return this.basicModeration(request.content);
    }
  }

  /**
   * Moderate multiple pieces of content in batch
   */
  async moderateBatch(requests: ModerationRequest[]): Promise<ModerationResult[]> {
    const results: ModerationResult[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.moderateContent(request);
        results.push(result);
      } catch (error) {
        console.warn(`Failed to moderate content:`, error);
        results.push({
          isApproved: false,
          confidence: 0,
          flags: ['moderation_error'],
          reason: 'Failed to moderate content',
          suggestedAction: 'review'
        });
      }
    }
    
    return results;
  }

  private buildModerationPrompt(): string {
    return `You are a content moderator for a gamification platform called "Real Life Adventures". 
Your job is to review user-generated content and determine if it's appropriate for the platform.

Guidelines:
1. APPROVE content that is:
   - Positive and encouraging
   - Related to personal growth and challenges
   - Safe and appropriate for all ages
   - Constructive and helpful

2. REJECT content that contains:
   - Hate speech or discrimination
   - Violence or threats
   - Explicit sexual content
   - Spam or promotional content
   - Personal information (addresses, phone numbers, etc.)
   - Dangerous activities or illegal content

3. REVIEW content that is:
   - Borderline or unclear
   - Potentially problematic but not clearly violating

4. EDIT content that has minor issues that can be fixed

Response Format:
Always respond with valid JSON in this exact structure:
{
  "isApproved": true/false,
  "confidence": 0.0-1.0,
  "flags": ["flag1", "flag2"],
  "reason": "Brief explanation",
  "suggestedAction": "approve/reject/review/edit",
  "editedContent": "Cleaned version if suggestedAction is edit"
}`;
  }

  private buildContentPrompt(request: ModerationRequest): string {
    let prompt = `Content Type: ${request.contentType}\n`;
    prompt += `Content to moderate:\n"${request.content}"\n\n`;
    
    if (request.metadata) {
      prompt += `Additional context: ${JSON.stringify(request.metadata)}\n\n`;
    }
    
    prompt += `Please moderate this content and provide your assessment.`;
    
    return prompt;
  }

  private parseModerationResult(content: string): ModerationResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in moderation response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        isApproved: Boolean(parsed.isApproved),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        flags: Array.isArray(parsed.flags) ? parsed.flags : [],
        reason: parsed.reason || undefined,
        suggestedAction: ['approve', 'reject', 'review', 'edit'].includes(parsed.suggestedAction) 
          ? parsed.suggestedAction 
          : 'review',
        editedContent: parsed.editedContent || undefined,
      };
    } catch (error) {
      console.error('Failed to parse moderation result:', error);
      
      // Fallback result
      return {
        isApproved: false,
        confidence: 0,
        flags: ['parse_error'],
        reason: 'Failed to parse moderation result',
        suggestedAction: 'review'
      };
    }
  }

  private basicModeration(content: string): ModerationResult {
    const inappropriateWords = [
      // Add basic inappropriate words here
      'spam', 'scam', 'fake', 'illegal', 'dangerous'
    ];
    
    const lowerContent = content.toLowerCase();
    const foundFlags = inappropriateWords.filter(word => lowerContent.includes(word));
    
    return {
      isApproved: foundFlags.length === 0,
      confidence: foundFlags.length === 0 ? 0.8 : 0.9,
      flags: foundFlags,
      reason: foundFlags.length > 0 ? `Contains inappropriate content: ${foundFlags.join(', ')}` : undefined,
      suggestedAction: foundFlags.length > 0 ? 'reject' : 'approve'
    };
  }
}

// Export singleton instance
export const aiModerationService = new AIModerationService();
export default aiModerationService;
