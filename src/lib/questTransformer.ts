import type { Quest } from '@/types';

/**
 * Transforms backend quest data to frontend format
 */
export function transformQuest(backendQuest: any): Quest {
  return {
    id: backendQuest.id,
    title: backendQuest.title,
    description: backendQuest.description,
    shortDescription: backendQuest.shortDescription,
    instructions: backendQuest.instructions,
    categoryId: backendQuest.categoryId,
    difficulty: backendQuest.difficulty,
    tags: parseJsonField(backendQuest.tags),
    requirements: parseJsonField(backendQuest.requirements),
    points: backendQuest.points,
    estimatedTime: backendQuest.estimatedTime,
    submissionTypes: parseJsonField(backendQuest.submissionTypes),
    status: backendQuest.status,
    isFeatured: backendQuest.isFeatured,
    isEpic: backendQuest.isEpic,
    locationRequired: backendQuest.locationRequired,
    locationType: backendQuest.locationType,
    specificLocation: backendQuest.specificLocation,
    allowSharing: backendQuest.allowSharing,
    encourageSharing: backendQuest.encourageSharing,
    imageUrl: backendQuest.imageUrl,
    videoUrl: backendQuest.videoUrl,
    createdBy: backendQuest.createdBy,
    moderatedBy: backendQuest.moderatedBy,
    moderatedAt: backendQuest.moderatedAt,
    rejectionReason: backendQuest.rejectionReason,
    completionCount: backendQuest.completionCount,
    averageRating: backendQuest.averageRating,
    ratingCount: backendQuest.ratingCount,
    createdAt: backendQuest.createdAt,
    updatedAt: backendQuest.updatedAt,
    publishedAt: backendQuest.publishedAt,
    expiresAt: backendQuest.expiresAt,
    category: backendQuest.category,
    creator: backendQuest.creator,
  };
}

/**
 * Parses JSON string fields from backend to arrays
 */
function parseJsonField(field: string | string[]): string[] {
  if (Array.isArray(field)) {
    return field;
  }
  
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return [field];
    }
  }
  
  return [];
}

/**
 * Transforms an array of backend quests
 */
export function transformQuests(backendQuests: any[]): Quest[] {
  return backendQuests.map(transformQuest);
}
