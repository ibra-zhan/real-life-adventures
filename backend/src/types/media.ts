// Media Types and Interfaces for SideQuest Backend

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  publicUrl?: string | undefined;
  uploadedBy: string;
  uploadedAt: Date;
  questId?: string | undefined;
  submissionId?: string | undefined;
  category: MediaCategory;
  status: MediaStatus;
  metadata?: any;
}

export enum MediaCategory {
  PROFILE_AVATAR = 'profile_avatar',
  QUEST_IMAGE = 'quest_image',
  QUEST_VIDEO = 'quest_video',
  SUBMISSION_PHOTO = 'submission_photo',
  SUBMISSION_VIDEO = 'submission_video',
  SUBMISSION_DOCUMENT = 'submission_document',
  CATEGORY_ICON = 'category_icon',
  BADGE_IMAGE = 'badge_image',
  GENERAL = 'general',
}

export enum MediaStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detectedMimeType?: string;
  actualSize?: number;
}

export interface FileValidationRules {
  allowedMimeTypes: string[];
  maxFileSize: number;
  requireDimensions?: boolean;
  scanForVirus?: boolean;
  checkContentType?: boolean;
}

export interface StorageProvider {
  name: string;
  upload(file: Buffer, key: string, options?: any): Promise<StorageResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

export interface StorageResult {
  key: string;
  url: string;
  publicUrl?: string;
  size: number;
}

export interface StorageConfig {
  provider: 'local' | 'aws-s3' | 'google-cloud' | 'azure-blob';
  basePath: string;
  publicPath?: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  generateThumbnails: boolean;
  compressImages: boolean;
  extractExif: boolean;
}

export interface MediaQuery {
  userId?: string;
  category?: MediaCategory;
  status?: MediaStatus;
  page?: number;
  limit?: number;
}

export interface UploadRequest {
  category: MediaCategory;
  questId?: string;
  submissionId?: string;
  description?: string;
}

export interface UploadResponse {
  success: boolean;
  data?: {
    file: MediaFile;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface MediaListResponse {
  success: boolean;
  data?: {
    files: MediaFile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface MediaDeleteResponse {
  success: boolean;
  data?: {
    deleted: boolean;
    cleanedUp: string[];
  };
}

// Constants
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
];

export const MEDIA_CATEGORY_CONFIG: Record<MediaCategory, {
  allowedTypes: string[];
  maxSize: number;
  generateThumbnail: boolean;
  compressImage: boolean;
  extractExif: boolean;
}> = {
  [MediaCategory.PROFILE_AVATAR]: {
    allowedTypes: SUPPORTED_IMAGE_TYPES,
    maxSize: 5 * 1024 * 1024, // 5MB
    generateThumbnail: true,
    compressImage: true,
    extractExif: false,
  },
  [MediaCategory.QUEST_IMAGE]: {
    allowedTypes: SUPPORTED_IMAGE_TYPES,
    maxSize: 10 * 1024 * 1024, // 10MB
    generateThumbnail: true,
    compressImage: true,
    extractExif: true,
  },
  [MediaCategory.QUEST_VIDEO]: {
    allowedTypes: SUPPORTED_VIDEO_TYPES,
    maxSize: 100 * 1024 * 1024, // 100MB
    generateThumbnail: true,
    compressImage: false,
    extractExif: false,
  },
  [MediaCategory.SUBMISSION_PHOTO]: {
    allowedTypes: SUPPORTED_IMAGE_TYPES,
    maxSize: 15 * 1024 * 1024, // 15MB
    generateThumbnail: true,
    compressImage: true,
    extractExif: true,
  },
  [MediaCategory.SUBMISSION_VIDEO]: {
    allowedTypes: SUPPORTED_VIDEO_TYPES,
    maxSize: 200 * 1024 * 1024, // 200MB
    generateThumbnail: true,
    compressImage: false,
    extractExif: false,
  },
  [MediaCategory.SUBMISSION_DOCUMENT]: {
    allowedTypes: ['application/pdf', 'text/plain'],
    maxSize: 20 * 1024 * 1024, // 20MB
    generateThumbnail: false,
    compressImage: false,
    extractExif: false,
  },
  [MediaCategory.CATEGORY_ICON]: {
    allowedTypes: SUPPORTED_IMAGE_TYPES,
    maxSize: 2 * 1024 * 1024, // 2MB
    generateThumbnail: true,
    compressImage: true,
    extractExif: false,
  },
  [MediaCategory.BADGE_IMAGE]: {
    allowedTypes: SUPPORTED_IMAGE_TYPES,
    maxSize: 2 * 1024 * 1024, // 2MB
    generateThumbnail: true,
    compressImage: true,
    extractExif: false,
  },
  [MediaCategory.GENERAL]: {
    allowedTypes: [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES],
    maxSize: 50 * 1024 * 1024, // 50MB
    generateThumbnail: true,
    compressImage: true,
    extractExif: true,
  },
};
