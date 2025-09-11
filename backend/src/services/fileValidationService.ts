// File Validation and Security Service for SideQuest
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import {
  FileValidationResult,
  FileValidationRules,
  MediaCategory,
  MEDIA_CATEGORY_CONFIG,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_VIDEO_TYPES,
} from '../types/media';

export class FileValidationService {
  // Validate file against rules
  async validateFile(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    category: MediaCategory,
    _customRules?: Partial<FileValidationRules>
  ): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      actualSize: fileBuffer.length,
    };

    // Get validation rules for category
    const categoryConfig = MEDIA_CATEGORY_CONFIG[category];
    const rules: FileValidationRules = {
      allowedMimeTypes: categoryConfig.allowedTypes,
      maxFileSize: categoryConfig.maxSize,
      requireDimensions: category !== MediaCategory.SUBMISSION_DOCUMENT,
      scanForVirus: true,
      checkContentType: true,
      ..._customRules,
    };

    // 1. File size validation
    if (fileBuffer.length > rules.maxFileSize) {
      result.errors.push(
        `File size (${this.formatFileSize(fileBuffer.length)}) exceeds maximum allowed size (${this.formatFileSize(rules.maxFileSize)})`
      );
      result.isValid = false;
    }

    // 2. File extension validation
    // const fileExtension = path.extname(originalName).toLowerCase();
    // if (rules.allowedExtensions && !rules.allowedExtensions.includes(fileExtension)) {
    //   result.errors.push(`File extension "${fileExtension}" is not allowed`);
    //   result.isValid = false;
    // }

    // 3. MIME type validation
    if (!rules.allowedMimeTypes.includes(mimetype)) {
      result.errors.push(`MIME type "${mimetype}" is not allowed for category "${category}"`);
      result.isValid = false;
    }

    // 4. Content type detection and validation
    if (rules.checkContentType) {
      try {
        const detectedType = await fileTypeFromBuffer(fileBuffer);
        if (detectedType) {
          result.detectedMimeType = detectedType.mime;
          
          // Check if detected type matches declared type
          if (detectedType.mime !== mimetype) {
            result.warnings.push(
              `Detected MIME type (${detectedType.mime}) differs from declared type (${mimetype})`
            );
            
            // If detected type is not in allowed types, it's an error
            if (!rules.allowedMimeTypes.includes(detectedType.mime)) {
              result.errors.push(
                `Detected file type (${detectedType.mime}) is not allowed for category "${category}"`
              );
              result.isValid = false;
            }
          }
        } else {
          result.warnings.push('Could not detect file type from content');
        }
      } catch (error) {
        result.warnings.push(`Failed to detect file type: ${error}`);
      }
    }

    // 5. Image-specific validations
    if (this.isImageFile(mimetype) || this.isImageFile(result.detectedMimeType)) {
      const imageValidation = await this.validateImageFile(fileBuffer, rules);
      result.errors.push(...imageValidation.errors);
      result.warnings.push(...imageValidation.warnings);
      if (imageValidation.errors.length > 0) {
        result.isValid = false;
      }
    }

    // 6. Video-specific validations
    if (this.isVideoFile(mimetype) || this.isVideoFile(result.detectedMimeType)) {
      const videoValidation = await this.validateVideoFile(fileBuffer, rules);
      result.errors.push(...videoValidation.errors);
      result.warnings.push(...videoValidation.warnings);
      if (videoValidation.errors.length > 0) {
        result.isValid = false;
      }
    }

    // 7. Filename validation
    const filenameValidation = this.validateFilename(originalName);
    result.errors.push(...filenameValidation.errors);
    result.warnings.push(...filenameValidation.warnings);
    if (filenameValidation.errors.length > 0) {
      result.isValid = false;
    }

    // 8. Security checks
    const securityValidation = await this.performSecurityChecks(fileBuffer, originalName);
    result.errors.push(...securityValidation.errors);
    result.warnings.push(...securityValidation.warnings);
    if (securityValidation.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  }

  // Validate image files
  private async validateImageFile(
    fileBuffer: Buffer,
    rules: FileValidationRules
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // For now, we'll use basic validation
      // In a real implementation, you'd use a library like sharp to get image dimensions
      
      // Check if it's a valid image by trying to get its type
      const detectedType = await fileTypeFromBuffer(fileBuffer);
      if (!detectedType || !SUPPORTED_IMAGE_TYPES.includes(detectedType.mime)) {
        errors.push('Invalid or corrupted image file');
        return { errors, warnings };
      }

      // Basic dimension checks would go here
      // For now, we'll skip dimension validation as it requires image processing libraries
      if (rules.requireDimensions) {
        warnings.push('Image dimension validation skipped - requires image processing setup');
      }

      // Check for potentially malicious image files
      if (this.containsSuspiciousPatterns(fileBuffer)) {
        errors.push('Image file contains suspicious patterns');
      }

    } catch (error) {
      errors.push(`Image validation failed: ${error}`);
    }

    return { errors, warnings };
  }

  // Validate video files
  private async validateVideoFile(
    fileBuffer: Buffer,
    _rules: FileValidationRules
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic video validation
      const detectedType = await fileTypeFromBuffer(fileBuffer);
      if (!detectedType || !SUPPORTED_VIDEO_TYPES.includes(detectedType.mime)) {
        errors.push('Invalid or corrupted video file');
        return { errors, warnings };
      }

      // Check for potentially malicious video files
      if (this.containsSuspiciousPatterns(fileBuffer)) {
        errors.push('Video file contains suspicious patterns');
      }

      warnings.push('Video validation is basic - consider implementing ffprobe for detailed validation');

    } catch (error) {
      errors.push(`Video validation failed: ${error}`);
    }

    return { errors, warnings };
  }

  // Validate filename
  private validateFilename(filename: string): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check filename length
    if (filename.length > 255) {
      errors.push('Filename is too long (maximum 255 characters)');
    }

    // Check for suspicious filename patterns
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com|dll|vbs|js|jar|php|asp|jsp)$/i,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i, // Windows reserved names
      /[<>:"|?*]/g, // Invalid filename characters
      /\.\./g, // Path traversal
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(filename)) {
        errors.push('Filename contains suspicious or invalid characters');
        break;
      }
    }

    // Check for hidden files
    if (filename.startsWith('.') && filename !== '.gitkeep') {
      warnings.push('Hidden file detected');
    }

    // Check for very long extensions
    const extension = path.extname(filename);
    if (extension.length > 10) {
      warnings.push('Unusually long file extension');
    }

    return { errors, warnings };
  }

  // Perform security checks
  private async performSecurityChecks(
    fileBuffer: Buffer,
    _filename: string
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size (prevent zip bombs)
    if (fileBuffer.length > 500 * 1024 * 1024) { // 500MB
      errors.push('File is too large for security processing');
    }

    // Check for embedded executables
    if (this.containsExecutableSignatures(fileBuffer)) {
      errors.push('File contains embedded executable code');
    }

    // Check for script injections
    if (this.containsScriptInjections(fileBuffer)) {
      errors.push('File contains potentially malicious scripts');
    }

    // Check for polyglot files (files that are valid in multiple formats)
    if (this.isPolyglotFile(fileBuffer)) {
      warnings.push('File appears to be a polyglot (valid in multiple formats)');
    }

    // Basic virus scanning simulation (in production, use ClamAV or similar)
    const virusScanResult = await this.performBasicVirusScan(fileBuffer);
    if (!virusScanResult.clean) {
      errors.push(`Potential security threat detected: ${virusScanResult.threat}`);
    }

    return { errors, warnings };
  }

  // Check for suspicious patterns in file content
  private containsSuspiciousPatterns(buffer: Buffer): boolean {
    const content = buffer.toString('binary');
    
    // Look for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi,
      /eval\(/gi,
      /document\.write/gi,
      /\.exe/gi,
      /powershell/gi,
      /cmd\.exe/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  // Check for executable signatures
  private containsExecutableSignatures(buffer: Buffer): boolean {
    // Check for common executable file signatures
    const signatures = [
      Buffer.from([0x4D, 0x5A]), // PE executable (MZ)
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
      Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // Mach-O executable (32-bit)
      Buffer.from([0xFE, 0xED, 0xFA, 0xCF]), // Mach-O executable (64-bit)
    ];

    return signatures.some(signature => 
      buffer.length >= signature.length && 
      buffer.subarray(0, signature.length).equals(signature)
    );
  }

  // Check for script injections
  private containsScriptInjections(buffer: Buffer): boolean {
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 8192)); // Check first 8KB
    
    const injectionPatterns = [
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /data:application\/javascript/gi,
      /<%/g, // Server-side scripts
      /<\?php/gi,
    ];

    return injectionPatterns.some(pattern => pattern.test(content));
  }

  // Check if file is a polyglot
  private isPolyglotFile(buffer: Buffer): boolean {
    if (buffer.length < 10) return false;

    // Check for multiple file signatures in the same file
    const signatures = new Set();
    
    // Check for common file signatures
    const fileSignatures = [
      { signature: Buffer.from([0xFF, 0xD8, 0xFF]), type: 'JPEG' },
      { signature: Buffer.from([0x89, 0x50, 0x4E, 0x47]), type: 'PNG' },
      { signature: Buffer.from([0x47, 0x49, 0x46, 0x38]), type: 'GIF' },
      { signature: Buffer.from([0x25, 0x50, 0x44, 0x46]), type: 'PDF' },
      { signature: Buffer.from([0x50, 0x4B, 0x03, 0x04]), type: 'ZIP' },
    ];

    for (const { signature, type } of fileSignatures) {
      if (buffer.length >= signature.length) {
        // Check at beginning
        if (buffer.subarray(0, signature.length).equals(signature)) {
          signatures.add(type);
        }
        
        // Check for embedded signatures
        for (let i = 1; i < Math.min(buffer.length - signature.length, 1024); i++) {
          if (buffer.subarray(i, i + signature.length).equals(signature)) {
            signatures.add(`embedded_${type}`);
          }
        }
      }
    }

    return signatures.size > 1;
  }

  // Basic virus scan simulation
  private async performBasicVirusScan(buffer: Buffer): Promise<{ clean: boolean; threat?: string }> {
    // This is a basic simulation - in production, integrate with ClamAV or similar
    
    // Check for known malicious patterns
    const maliciousPatterns = [
      /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/gi, // EICAR test string
      /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!\$H\+H\*/gi,
    ];

    const content = buffer.toString('binary');
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        return { clean: false, threat: 'Test virus signature detected' };
      }
    }

    // Check file entropy (high entropy might indicate encryption/packing)
    const entropy = this.calculateEntropy(buffer);
    if (entropy > 7.5) {
      return { clean: false, threat: 'High entropy detected (possible packed/encrypted content)' };
    }

    return { clean: true };
  }

  // Calculate file entropy
  private calculateEntropy(buffer: Buffer): number {
    const frequencies = new Array(256).fill(0);
    
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      if (byte !== undefined) {
        frequencies[byte]++;
      }
    }

    let entropy = 0;
    const length = buffer.length;

    for (let i = 0; i < 256; i++) {
      if (frequencies[i] > 0) {
        const probability = frequencies[i] / length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  // Helper methods
  private isImageFile(mimetype?: string): boolean {
    return mimetype ? SUPPORTED_IMAGE_TYPES.includes(mimetype) : false;
  }

  private isVideoFile(mimetype?: string): boolean {
    return mimetype ? SUPPORTED_VIDEO_TYPES.includes(mimetype) : false;
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // Get validation rules for category
  getValidationRules(category: MediaCategory): FileValidationRules {
    const config = MEDIA_CATEGORY_CONFIG[category];
    return {
      allowedMimeTypes: config.allowedTypes,
      maxFileSize: config.maxSize,
      requireDimensions: category !== MediaCategory.SUBMISSION_DOCUMENT,
      scanForVirus: true,
      checkContentType: true,
    };
  }

  // Sanitize filename
  sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    let sanitized = filename.replace(/[/\\:*?"<>|]/g, '_');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
    
    // Ensure filename is not empty
    if (sanitized.length === 0) {
      sanitized = 'unnamed_file';
    }
    
    // Limit filename length
    if (sanitized.length > 200) {
      const ext = path.extname(sanitized);
      const name = path.basename(sanitized, ext);
      sanitized = name.substring(0, 200 - ext.length) + ext;
    }

    return sanitized;
  }
}

// Create singleton instance
export const fileValidationService = new FileValidationService();
export default fileValidationService;
