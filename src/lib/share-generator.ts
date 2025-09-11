import { toPng, toJpeg } from 'html-to-image';
import type { Quest, User, Badge } from '@/types';

export interface ShareCardData {
  quest: Quest;
  user: User;
  xpGained: number;
  newStreak?: number;
  unlockedBadge?: Badge;
}

export interface ShareOptions {
  format: '1:1' | '9:16';
  template?: 'minimal' | 'achievement' | 'streak';
  quality?: number;
  fileType?: 'png' | 'jpeg';
}

export class ShareCardGenerator {
  private static readonly DEFAULT_OPTIONS: Required<ShareOptions> = {
    format: '1:1',
    template: 'minimal',
    quality: 1.0,
    fileType: 'png'
  };

  /**
   * Generate and download a share card image
   */
  static async generateAndDownload(
    element: HTMLElement,
    data: ShareCardData,
    options: Partial<ShareOptions> = {}
  ): Promise<void> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      const dataUrl = await this.generateImage(element, opts);
      this.downloadImage(dataUrl, this.generateFilename(data, opts));
    } catch (error) {
      console.error('Failed to generate share card:', error);
      throw new Error('Failed to generate share card. Please try again.');
    }
  }

  /**
   * Generate share card image as data URL
   */
  static async generateImage(
    element: HTMLElement,
    options: Required<ShareOptions>
  ): Promise<string> {
    const { quality, fileType } = options;
    
    // Configure generation options
    const config = {
      quality,
      pixelRatio: 2, // High DPI for better quality
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
      filter: (node: HTMLElement) => {
        // Filter out any elements we don't want in the export
        if (node.classList?.contains('no-export')) {
          return false;
        }
        return true;
      }
    };

    // Generate image based on file type
    if (fileType === 'jpeg') {
      return await toJpeg(element, config);
    } else {
      return await toPng(element, config);
    }
  }

  /**
   * Download image from data URL
   */
  private static downloadImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate filename for the share card
   */
  private static generateFilename(
    data: ShareCardData,
    options: Required<ShareOptions>
  ): string {
    const { quest, user } = data;
    const { format, fileType } = options;
    
    // Clean quest title for filename
    const cleanTitle = quest.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `sidequest-${user.username.toLowerCase()}-${cleanTitle}-${format}-${timestamp}.${fileType}`;
  }

  /**
   * Check if the browser supports the required features
   */
  static isSupported(): boolean {
    try {
      // Check for required APIs
      return !!(
        window.HTMLCanvasElement &&
        window.URL &&
        window.URL.createObjectURL &&
        document.createElement
      );
    } catch {
      return false;
    }
  }

  /**
   * Get optimal format based on the quest and achievements
   */
  static getRecommendedFormat(data: ShareCardData): '1:1' | '9:16' {
    const { unlockedBadge, newStreak } = data;
    
    // Suggest story format for special achievements
    if (unlockedBadge || (newStreak && newStreak >= 7)) {
      return '9:16';
    }
    
    // Default to square for general sharing
    return '1:1';
  }

  /**
   * Get recommended template based on the achievement type
   */
  static getRecommendedTemplate(data: ShareCardData): 'minimal' | 'achievement' | 'streak' {
    const { unlockedBadge, newStreak, quest } = data;
    
    if (unlockedBadge) {
      return 'achievement';
    }
    
    if (newStreak && newStreak >= 5) {
      return 'streak';
    }
    
    if (quest.difficulty === 'epic') {
      return 'achievement';
    }
    
    return 'minimal';
  }

  /**
   * Prepare element for image generation
   */
  static prepareElementForExport(element: HTMLElement): void {
    // Ensure all fonts are loaded
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        // Fonts are loaded
      });
    }

    // Force layout recalculation
    element.style.transform = 'translateZ(0)';
    
    // Wait for any CSS animations to complete
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.animationName !== 'none') {
      element.style.animationPlayState = 'paused';
    }
  }

  /**
   * Clean up after export
   */
  static cleanupAfterExport(element: HTMLElement): void {
    element.style.transform = '';
    element.style.animationPlayState = '';
  }
}
