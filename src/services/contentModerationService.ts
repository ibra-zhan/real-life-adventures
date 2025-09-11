// Content Moderation Service for SideQuest
import { textModerationService } from './textModerationService';
import { imageModerationService } from './imageModerationService';
import { videoModerationService } from './videoModerationService';
import {
  ModerationService as IModerationService,
  ModerationRequest,
  ModerationResult,
  ModerationMetadata,
  ModerationStats,
  ModerationQueue,
  ContentType,
  ModerationStatus,
  ModerationSeverity,
  ModerationAction,
  ModerationCategory,
} from '../types/moderation';

export class ContentModerationService implements IModerationService {
  private queue: ModerationQueue[] = [];
  private processing = false;

  async moderateContent(request: ModerationRequest): Promise<ModerationResult> {
    try {
      const result: ModerationResult = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contentId: request.contentId,
        contentType: request.contentType,
        status: ModerationStatus.PENDING,
        severity: ModerationSeverity.LOW,
        categories: [],
        confidence: 0,
        action: ModerationAction.NO_ACTION,
        details: {},
        metadata: request.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Process based on content type
      switch (request.contentType) {
        case ContentType.TEXT:
          const textResult = await this.moderateText(request.content as string, request.metadata);
          Object.assign(result, textResult);
          break;
        case ContentType.IMAGE:
          const imageResult = await this.moderateImage(request.content as string, request.metadata);
          Object.assign(result, imageResult);
          break;
        case ContentType.VIDEO:
          const videoResult = await this.moderateVideo(request.content as string, request.metadata);
          Object.assign(result, videoResult);
          break;
        default:
          result.status = ModerationStatus.REJECTED;
          result.action = ModerationAction.REJECT;
          result.reason = 'Unsupported content type';
      }

      // Determine final action based on results
      this.determineAction(result);

      return result;
    } catch (error) {
      console.error('Error moderating content:', error);
      return {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contentId: request.contentId,
        contentType: request.contentType,
        status: ModerationStatus.FAILED,
        severity: ModerationSeverity.LOW,
        categories: [],
        confidence: 0,
        action: ModerationAction.REJECT,
        reason: 'Moderation failed',
        details: {},
        metadata: request.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async moderateText(text: string, metadata: ModerationMetadata): Promise<ModerationResult> {
    const analysis = await textModerationService.analyzeText(text);
    const profanity = await textModerationService.detectProfanity(text);
    const hateSpeech = await textModerationService.detectHateSpeech(text);
    const spam = await textModerationService.detectSpam(text);

    const categories: ModerationCategory[] = [];
    let severity = ModerationSeverity.LOW;
    let confidence = 0;

    if (profanity.hasProfanity) {
      categories.push(ModerationCategory.PROFANITY);
      severity = profanity.severity;
      confidence = Math.max(confidence, 0.7);
    }

    if (hateSpeech.isHateSpeech) {
      categories.push(...hateSpeech.categories);
      severity = ModerationSeverity.HIGH;
      confidence = Math.max(confidence, hateSpeech.confidence);
    }

    if (spam.isSpam) {
      categories.push(ModerationCategory.SPAM);
      severity = ModerationSeverity.MEDIUM;
      confidence = Math.max(confidence, spam.confidence);
    }

    return {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: metadata.context?.submissionId || 'unknown',
      contentType: ContentType.TEXT,
      status: ModerationStatus.PENDING,
      severity,
      categories,
      confidence,
      action: ModerationAction.NO_ACTION,
      details: {
        textAnalysis: analysis,
        profanity: profanity,
        hateSpeech: hateSpeech,
        spam: spam,
      },
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async moderateImage(imageUrl: string, metadata: ModerationMetadata): Promise<ModerationResult> {
    const analysis = await imageModerationService.analyzeImage(imageUrl);
    const inappropriate = await imageModerationService.detectInappropriateContent(imageUrl);

    return {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: metadata.context?.submissionId || 'unknown',
      contentType: ContentType.IMAGE,
      status: ModerationStatus.PENDING,
      severity: inappropriate.isInappropriate ? ModerationSeverity.HIGH : ModerationSeverity.LOW,
      categories: inappropriate.categories,
      confidence: inappropriate.confidence,
      action: ModerationAction.NO_ACTION,
      details: {
        imageAnalysis: analysis,
        inappropriate: inappropriate,
      },
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async moderateVideo(videoUrl: string, metadata: ModerationMetadata): Promise<ModerationResult> {
    const analysis = await videoModerationService.analyzeVideo(videoUrl);
    const inappropriate = await videoModerationService.detectInappropriateContent(videoUrl);

    return {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: metadata.context?.submissionId || 'unknown',
      contentType: ContentType.VIDEO,
      status: ModerationStatus.PENDING,
      severity: inappropriate.isInappropriate ? ModerationSeverity.HIGH : ModerationSeverity.LOW,
      categories: inappropriate.categories,
      confidence: inappropriate.confidence,
      action: ModerationAction.NO_ACTION,
      details: {
        videoAnalysis: analysis,
        inappropriate: inappropriate,
      },
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getModerationResult(contentId: string): Promise<ModerationResult | null> {
    // In production, query database
    return null;
  }

  async updateModerationResult(resultId: string, updates: Partial<ModerationResult>): Promise<void> {
    // In production, update database
    console.log(`Updating moderation result ${resultId}:`, updates);
  }

  async getModerationStats(timeRange?: { start: Date; end: Date }): Promise<ModerationStats> {
    // In production, query database for statistics
    return {
      totalProcessed: 0,
      approved: 0,
      rejected: 0,
      flagged: 0,
      underReview: 0,
      byCategory: {} as Record<ModerationCategory, number>,
      bySeverity: {} as Record<ModerationSeverity, number>,
      byContentType: {} as Record<ContentType, number>,
      averageProcessingTime: 0,
      accuracy: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
    };
  }

  async getModerationQueue(): Promise<ModerationQueue[]> {
    return this.queue;
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    try {
      const pendingItems = this.queue.filter(item => item.status === 'pending');
      
      for (const item of pendingItems) {
        // Process queue item
        console.log(`Processing moderation queue item: ${item.id}`);
      }
    } catch (error) {
      console.error('Error processing moderation queue:', error);
    } finally {
      this.processing = false;
    }
  }

  private determineAction(result: ModerationResult): void {
    if (result.categories.length === 0) {
      result.status = ModerationStatus.APPROVED;
      result.action = ModerationAction.APPROVE;
      return;
    }

    // Check for critical violations
    if (result.categories.includes(ModerationCategory.HATE_SPEECH) ||
        result.categories.includes(ModerationCategory.VIOLENCE) ||
        result.categories.includes(ModerationCategory.ADULT_CONTENT)) {
      result.status = ModerationStatus.REJECTED;
      result.action = ModerationAction.REJECT;
      result.severity = ModerationSeverity.CRITICAL;
      return;
    }

    // Check for high severity violations
    if (result.severity === ModerationSeverity.HIGH) {
      result.status = ModerationStatus.REJECTED;
      result.action = ModerationAction.REJECT;
      return;
    }

    // Check for medium severity violations
    if (result.severity === ModerationSeverity.MEDIUM) {
      result.status = ModerationStatus.FLAGGED;
      result.action = ModerationAction.FLAG;
      return;
    }

    // Low severity - flag for review
    result.status = ModerationStatus.FLAGGED;
    result.action = ModerationAction.FLAG;
  }
}

export const contentModerationService = new ContentModerationService();
