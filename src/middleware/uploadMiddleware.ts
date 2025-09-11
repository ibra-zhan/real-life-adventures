// Upload Middleware using Multer for SideQuest
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MediaCategory, MEDIA_CATEGORY_CONFIG } from '../types/media';
import { fileValidationService } from '../services/fileValidationService';
import { ValidationError } from './errorHandler';

// Extend Request interface to include file validation results
declare module 'express' {
  interface Request {
    fileValidation?: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
  }
}

// Memory storage for processing files
const storage = multer.memoryStorage();

// File filter function
const fileFilter = async (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  try {
    // Get category from request body or default to GENERAL
    const category = (req.body.category as MediaCategory) || MediaCategory.GENERAL;
    const categoryConfig = MEDIA_CATEGORY_CONFIG[category];

    // Check MIME type
    if (!categoryConfig.allowedTypes.includes(file.mimetype)) {
      return cb(new ValidationError(`File type ${file.mimetype} not allowed for category ${category}`));
    }

    // Check file size (basic check - detailed validation happens later)
    if (req.headers['content-length']) {
      const contentLength = parseInt(req.headers['content-length'], 10);
      if (contentLength > categoryConfig.maxSize) {
        return cb(new ValidationError(`File size exceeds maximum allowed size for category ${category}`));
      }
    }

    cb(null, true);
  } catch (error) {
    cb(new ValidationError(`File validation error: ${error}`));
  }
};

// Base multer configuration
const upload = multer({
  storage,
  fileFilter: fileFilter as any, // Type assertion needed due to async function
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max (will be validated per category later)
    files: 10, // Maximum 10 files per request
    fields: 20, // Maximum 20 form fields
  },
});

// Single file upload middleware
export const uploadSingle = (fieldName: string = 'file') => {
  return [
    upload.single(fieldName),
    validateUploadedFile,
  ];
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => {
  return [
    upload.array(fieldName, maxCount),
    validateUploadedFiles,
  ];
};

// Fields upload middleware for different field names
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => {
  return [
    upload.fields(fields),
    validateUploadedFiles,
  ];
};

// Validate single uploaded file
async function validateUploadedFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return next(new ValidationError('No file uploaded'));
    }

    const category = (req.body.category as MediaCategory) || MediaCategory.GENERAL;
    
    // Perform comprehensive validation
    const validationResult = await fileValidationService.validateFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      category
    );

    // Attach validation results to request
    req.fileValidation = validationResult;

    if (!validationResult.isValid) {
      return next(new ValidationError(
        `File validation failed: ${validationResult.errors.join(', ')}`
      ));
    }

    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      console.warn('File upload warnings:', validationResult.warnings);
    }

    // Sanitize filename
    req.file.originalname = fileValidationService.sanitizeFilename(req.file.originalname);

    next();
  } catch (error) {
    next(new ValidationError(`File validation error: ${error}`));
  }
}

// Validate multiple uploaded files
async function validateUploadedFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || (Array.isArray(files) && files.length === 0)) {
      return next(new ValidationError('No files uploaded'));
    }

    const category = (req.body.category as MediaCategory) || MediaCategory.GENERAL;
    const allFiles: Express.Multer.File[] = Array.isArray(files) 
      ? files 
      : Object.values(files).flat();

    const validationResults = [];
    const errors = [];
    const warnings = [];

    // Validate each file
    for (const file of allFiles) {
      const validationResult = await fileValidationService.validateFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        category
      );

      validationResults.push(validationResult);

      if (!validationResult.isValid) {
        errors.push(`${file.originalname}: ${validationResult.errors.join(', ')}`);
      }

      warnings.push(...validationResult.warnings.map(w => `${file.originalname}: ${w}`));

      // Sanitize filename
      file.originalname = fileValidationService.sanitizeFilename(file.originalname);
    }

    // Attach validation results to request
    req.fileValidation = {
      isValid: errors.length === 0,
      errors,
      warnings,
    };

    if (errors.length > 0) {
      return next(new ValidationError(`File validation failed: ${errors.join('; ')}`));
    }

    // Log warnings if any
    if (warnings.length > 0) {
      console.warn('File upload warnings:', warnings);
    }

    next();
  } catch (error) {
    next(new ValidationError(`Files validation error: ${error}`));
  }
}

// Profile avatar upload (single image, small size)
export const uploadAvatar = [
  (req: Request, res: Response, next: NextFunction) => {
    req.body.category = MediaCategory.PROFILE_AVATAR;
    next();
  },
  ...uploadSingle('avatar'),
];

// Quest image upload (single image, medium size)
export const uploadQuestImage = [
  (req: Request, res: Response, next: NextFunction) => {
    req.body.category = MediaCategory.QUEST_IMAGE;
    next();
  },
  ...uploadSingle('image'),
];

// Quest video upload (single video, large size)
export const uploadQuestVideo = [
  (req: Request, res: Response, next: NextFunction) => {
    req.body.category = MediaCategory.QUEST_VIDEO;
    next();
  },
  ...uploadSingle('video'),
];

// Submission media upload (multiple files)
export const uploadSubmissionMedia = [
  (req: Request, res: Response, next: NextFunction) => {
    const submissionType = req.body.submissionType || 'photo';
    req.body.category = submissionType === 'video' 
      ? MediaCategory.SUBMISSION_VIDEO
      : submissionType === 'document'
      ? MediaCategory.SUBMISSION_DOCUMENT
      : MediaCategory.SUBMISSION_PHOTO;
    next();
  },
  ...uploadMultiple('media', 5),
];

// Category icon upload (single small image)
export const uploadCategoryIcon = [
  (req: Request, res: Response, next: NextFunction) => {
    req.body.category = MediaCategory.CATEGORY_ICON;
    next();
  },
  ...uploadSingle('icon'),
];

// Badge image upload (single small image)
export const uploadBadgeImage = [
  (req: Request, res: Response, next: NextFunction) => {
    req.body.category = MediaCategory.BADGE_IMAGE;
    next();
  },
  ...uploadSingle('image'),
];

// General file upload (flexible)
export const uploadGeneral = [
  (req: Request, res: Response, next: NextFunction) => {
    req.body.category = req.body.category || MediaCategory.GENERAL;
    next();
  },
  ...uploadSingle('file'),
];

// Error handler for multer errors
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new ValidationError('File too large'));
      case 'LIMIT_FILE_COUNT':
        return next(new ValidationError('Too many files'));
      case 'LIMIT_FIELD_COUNT':
        return next(new ValidationError('Too many fields'));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new ValidationError('Unexpected file field'));
      default:
        return next(new ValidationError(`Upload error: ${err.message}`));
    }
  }
  next(err);
};

// Utility function to get file info
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  };
};

// Utility function to generate unique filename
export const generateUniqueFilename = (originalName: string, category: MediaCategory, userId: string) => {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0];
  const ext = path.extname(originalName).toLowerCase();
  const sanitizedName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);

  return `${category}_${userId}_${timestamp}_${uuid}_${sanitizedName}${ext}`;
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadAvatar,
  uploadQuestImage,
  uploadQuestVideo,
  uploadSubmissionMedia,
  uploadCategoryIcon,
  uploadBadgeImage,
  uploadGeneral,
  handleUploadError,
  getFileInfo,
  generateUniqueFilename,
};
