// Storage Service for SideQuest Media Management
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import {
  StorageProvider,
  StorageResult,
  StorageConfig,
  MediaCategory,
  MediaFile,
  MediaStatus,
} from '../types/media';

// Local File System Storage Provider
export class LocalStorageProvider implements StorageProvider {
  name = 'local';
  private basePath: string;
  private publicPath: string;

  constructor(basePath: string, publicPath: string) {
    this.basePath = basePath;
    this.publicPath = publicPath;
  }

  async upload(file: Buffer, key: string, _options?: any): Promise<StorageResult> {
    try {
      const fullPath = path.join(this.basePath, key);
      const directory = path.dirname(fullPath);

      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, file);

      // Get file stats
      const stats = await fs.stat(fullPath);

      return {
        key,
        url: fullPath,
        publicUrl: this.getPublicUrl(key),
        size: stats.size,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.basePath, key);
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, key);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return true; // File doesn't exist, consider it deleted
      }
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicPath}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, key);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

// Storage Service Class
export class StorageService {
  private provider: StorageProvider;
  private config: StorageConfig;

  constructor(provider?: StorageProvider) {
    this.config = {
      provider: 'local',
      basePath: path.join(process.cwd(), 'uploads'),
      publicPath: `${config.server.baseUrl}/uploads`,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'application/pdf',
      ],
      generateThumbnails: true,
      compressImages: true,
      extractExif: true,
    };

    this.provider = provider || new LocalStorageProvider(
      this.config.basePath,
      this.config.publicPath || ''
    );

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.basePath, { recursive: true });
      
      // Create category subdirectories
      const categories = Object.values(MediaCategory);
      for (const category of categories) {
        await fs.mkdir(path.join(this.config.basePath, category), { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  // Generate unique file key/path
  generateFileKey(originalName: string, category: MediaCategory, userId: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0]; // Short UUID
    const ext = path.extname(originalName).toLowerCase();
    const sanitizedName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);

    return `${category}/${userId}/${timestamp}_${uuid}_${sanitizedName}${ext}`;
  }

  // Store file
  async storeFile(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    userId: string,
    category: MediaCategory,
    options?: {
      questId?: string;
      submissionId?: string;
      metadata?: any;
    }
  ): Promise<MediaFile> {
    try {
      const fileKey = this.generateFileKey(originalName, category, userId);
      
      // Upload to storage provider
      const storageResult = await this.provider.upload(fileBuffer, fileKey);

      // Create media file record
      const mediaFile: MediaFile = {
        id: uuidv4(),
        filename: path.basename(fileKey),
        originalName,
        mimetype,
        size: storageResult.size,
        path: storageResult.key,
        url: storageResult.url,
        publicUrl: storageResult.publicUrl || undefined,
        uploadedBy: userId,
        uploadedAt: new Date(),
        category,
        status: MediaStatus.READY,
        questId: options?.questId,
        submissionId: options?.submissionId,
        metadata: options?.metadata,
      };

      return mediaFile;
    } catch (error) {
      throw new Error(`Failed to store file: ${error}`);
    }
  }

  // Get file
  async getFile(key: string): Promise<Buffer> {
    return await this.provider.download(key);
  }

  // Delete file
  async deleteFile(key: string): Promise<boolean> {
    return await this.provider.delete(key);
  }

  // Check if file exists
  async fileExists(key: string): Promise<boolean> {
    return await this.provider.exists(key);
  }

  // Get public URL
  getPublicUrl(key: string): string {
    return this.provider.getPublicUrl(key);
  }

  // Clean up orphaned files
  async cleanupOrphanedFiles(mediaFiles: MediaFile[]): Promise<string[]> {
    const cleanedUp: string[] = [];
    
    for (const file of mediaFiles) {
      try {
        // Delete main file
        await this.deleteFile(file.path);
        cleanedUp.push(file.path);

        // Delete variants if they exist
        if (file.metadata?.processed) {
          const variants = file.metadata.processed;
          for (const [_variantName, variant] of Object.entries(variants)) {
            if (variant && typeof variant === 'object' && 'url' in variant) {
              const variantKey = this.extractKeyFromUrl((variant as any).url);
              if (variantKey) {
                await this.deleteFile(variantKey);
                cleanedUp.push(variantKey);
              }
            }
          }
        }

        // Delete thumbnail
        if ((file as any).thumbnailUrl) {
          const thumbnailKey = this.extractKeyFromUrl((file as any).thumbnailUrl);
          if (thumbnailKey) {
            await this.deleteFile(thumbnailKey);
            cleanedUp.push(thumbnailKey);
          }
        }

        // Delete compressed version
        if ((file as any).compressedUrl) {
          const compressedKey = this.extractKeyFromUrl((file as any).compressedUrl);
          if (compressedKey) {
            await this.deleteFile(compressedKey);
            cleanedUp.push(compressedKey);
          }
        }
      } catch (error) {
        console.error(`Failed to cleanup file ${file.path}:`, error);
      }
    }

    return cleanedUp;
  }

  // Extract storage key from URL
  private extractKeyFromUrl(url: string): string | null {
    try {
      // For local storage, extract the path after the public path
      const publicPath = this.config.publicPath;
      if (publicPath && url.startsWith(publicPath)) {
        return url.substring(publicPath.length + 1); // +1 for the slash
      }
      
      // For other providers, might need different logic
      return null;
    } catch {
      return null;
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byCategory: Record<MediaCategory, { count: number; size: number }>;
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      byCategory: {} as Record<MediaCategory, { count: number; size: number }>,
    };

    // Initialize category stats
    Object.values(MediaCategory).forEach(category => {
      stats.byCategory[category] = { count: 0, size: 0 };
    });

    try {
      // This would typically query the database for media files
      // For now, return empty stats
      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return stats;
    }
  }

  // Validate storage health
  async validateStorage(): Promise<{
    healthy: boolean;
    issues: string[];
    stats: any;
  }> {
    const issues: string[] = [];
    let healthy = true;

    try {
      // Check if base directory exists and is writable
      await fs.access(this.config.basePath, fs.constants.W_OK);
    } catch {
      issues.push('Upload directory is not writable');
      healthy = false;
    }

    try {
      // Test write operation
      const testFile = path.join(this.config.basePath, '.health-check');
      await fs.writeFile(testFile, 'health-check');
      await fs.unlink(testFile);
    } catch {
      issues.push('Cannot write test files to storage');
      healthy = false;
    }

    // Get storage stats
    const stats = await this.getStorageStats();

    return {
      healthy,
      issues,
      stats,
    };
  }

  // Configure storage provider
  setProvider(provider: StorageProvider): void {
    this.provider = provider;
  }

  // Get current configuration
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(updates: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Create singleton instance
export const storageService = new StorageService();
export default storageService;
