// Media Types and Interfaces for SideQuest

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  publicUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // for videos
  uploadedBy: string;
  uploadedAt: Date;
  questId?: string;
  submissionId?: string;
  category: MediaCategory;
  status: MediaStatus;
  metadata?: MediaMetadata;
  thumbnailUrl?: string;
  compressedUrl?: string;
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

export interface MediaMetadata {
  exif?: ExifData;
  location?: LocationData;
  tags?: string[];
  description?: string;
  altText?: string;
  processed?: ProcessedVariants;
}

export interface ExifData {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: string;
  dateTaken?: Date;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface ProcessedVariants {
  thumbnail?: MediaVariant;
  small?: MediaVariant;
  medium?: MediaVariant;
  large?: MediaVariant;
  compressed?: MediaVariant;
}

export interface MediaVariant {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface UploadOptions {
  category: MediaCategory;
  questId?: string;
  submissionId?: string;
  generateThumbnail?: boolean;
  compressImage?: boolean;
  extractExif?: boolean;
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  quality?: number;
  resizeOptions?: ResizeOptions;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

export interface MediaUploadResult {
  success: boolean;
  file?: MediaFile;
  error?: string;
  warnings?: string[];
}

export interface MediaProcessingJob {
  id: string;
  mediaId: string;
  type: ProcessingType;
  status: JobStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  options: any;
}

export enum ProcessingType {
  RESIZE = 'resize',
  COMPRESS = 'compress',
  THUMBNAIL = 'thumbnail',
  EXTRACT_EXIF = 'extract_exif',
  VIRUS_SCAN = 'virus_scan',
  CONTENT_MODERATION = 'content_moderation',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// File validation interfaces
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detectedMimeType?: string;
  actualSize?: number;
}

export interface FileValidationRules {
  allowedMimeTypes: string[];
  maxFileSize: number; // in bytes
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  allowedExtensions?: string[];
  requireDimensions?: boolean;
  scanForVirus?: boolean;
  checkContentType?: boolean;
}

// Storage interfaces
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
  etag?: string;
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

// Media query interfaces
export interface MediaQuery {
  userId?: string;
  category?: MediaCategory;
  status?: MediaStatus;
  questId?: string;
  submissionId?: string;
  mimetype?: string;
  minSize?: number;
  maxSize?: number;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'uploadedAt' | 'size' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaQueryResult {
  files: MediaFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API request/response interfaces
export interface UploadRequest {
  category: MediaCategory;
  questId?: string;
  submissionId?: string;
  description?: string;
  tags?: string[];
  generateThumbnail?: boolean;
  compressImage?: boolean;
  quality?: number;
}

export interface UploadResponse {
  success: boolean;
  data?: {
    file: MediaFile;
    processingJobs?: MediaProcessingJob[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface MediaListResponse {
  success: boolean;
  data?: MediaQueryResult;
  error?: {
    code: string;
    message: string;
  };
}

export interface MediaDeleteResponse {
  success: boolean;
  data?: {
    deleted: boolean;
    cleanedUp: string[]; // URLs of cleaned up variants
  };
  error?: {
    code: string;
    message: string;
  };
}

// Constants
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
];

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/mov',
  'video/wmv',
];

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

export const DEFAULT_IMAGE_QUALITY = 80;
export const DEFAULT_THUMBNAIL_SIZE = { width: 300, height: 300 };
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Media category configurations
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
    allowedTypes: SUPPORTED_DOCUMENT_TYPES,
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
    allowedTypes: [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES, ...SUPPORTED_DOCUMENT_TYPES],
    maxSize: 50 * 1024 * 1024, // 50MB
    generateThumbnail: true,
    compressImage: true,
    extractExif: true,
  },
};