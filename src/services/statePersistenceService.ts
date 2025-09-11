export interface PersistenceConfig {
  enableLocalStorage: boolean;
  enableSessionStorage: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
  maxStorageSize: number; // in bytes
  compressionEnabled: boolean;
}

export interface StoredData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
  version: string;
}

class StatePersistenceService {
  private config: PersistenceConfig;
  private version = '1.0.0';

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      enableLocalStorage: true,
      enableSessionStorage: true,
      enableEncryption: false,
      maxStorageSize: 5 * 1024 * 1024, // 5MB
      compressionEnabled: false,
      ...config,
    };
  }

  // Check if storage is available
  private isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // Get storage size
  private getStorageSize(): number {
    let size = 0;
    
    if (this.config.enableLocalStorage && this.isStorageAvailable('localStorage')) {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          size += localStorage[key].length + key.length;
        }
      }
    }
    
    if (this.config.enableSessionStorage && this.isStorageAvailable('sessionStorage')) {
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          size += sessionStorage[key].length + key.length;
        }
      }
    }
    
    return size;
  }

  // Check if storage is within limits
  private isWithinLimits(): boolean {
    return this.getStorageSize() < this.config.maxStorageSize;
  }

  // Encrypt data (simple base64 encoding for now)
  private encrypt(data: string): string {
    if (!this.config.enableEncryption) return data;
    return btoa(data);
  }

  // Decrypt data
  private decrypt(encryptedData: string): string {
    if (!this.config.enableEncryption) return encryptedData;
    try {
      return atob(encryptedData);
    } catch {
      return encryptedData;
    }
  }

  // Compress data (simple JSON stringify for now)
  private compress(data: any): string {
    if (!this.config.compressionEnabled) return JSON.stringify(data);
    return JSON.stringify(data);
  }

  // Decompress data
  private decompress(compressedData: string): any {
    if (!this.config.compressionEnabled) return JSON.parse(compressedData);
    try {
      return JSON.parse(compressedData);
    } catch {
      return null;
    }
  }

  // Store data
  store(
    key: string,
    data: any,
    options: {
      storage?: 'localStorage' | 'sessionStorage';
      expiresIn?: number; // in milliseconds
      encrypt?: boolean;
    } = {}
  ): boolean {
    try {
      if (!this.isWithinLimits()) {
        console.warn('Storage limit exceeded, cleaning up...');
        this.cleanup();
      }

      const storage = options.storage || 'localStorage';
      const expiresIn = options.expiresIn;
      const encrypt = options.encrypt ?? this.config.enableEncryption;

      if (storage === 'localStorage' && !this.config.enableLocalStorage) {
        return false;
      }

      if (storage === 'sessionStorage' && !this.config.enableSessionStorage) {
        return false;
      }

      if (!this.isStorageAvailable(storage)) {
        return false;
      }

      const storedData: StoredData = {
        key,
        data: this.compress(data),
        timestamp: Date.now(),
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
        version: this.version,
      };

      const serializedData = this.encrypt(JSON.stringify(storedData));
      
      window[storage].setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  // Retrieve data
  retrieve<T = any>(
    key: string,
    options: {
      storage?: 'localStorage' | 'sessionStorage';
      defaultValue?: T;
    } = {}
  ): T | null {
    try {
      const storage = options.storage || 'localStorage';
      const defaultValue = options.defaultValue;

      if (!this.isStorageAvailable(storage)) {
        return defaultValue || null;
      }

      const serializedData = window[storage].getItem(key);
      if (!serializedData) {
        return defaultValue || null;
      }

      const decryptedData = this.decrypt(serializedData);
      const storedData: StoredData = JSON.parse(decryptedData);

      // Check if data has expired
      if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
        this.remove(key, { storage });
        return defaultValue || null;
      }

      // Check version compatibility
      if (storedData.version !== this.version) {
        console.warn(`Version mismatch for key ${key}, removing...`);
        this.remove(key, { storage });
        return defaultValue || null;
      }

      return this.decompress(storedData.data);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return options.defaultValue || null;
    }
  }

  // Remove data
  remove(
    key: string,
    options: {
      storage?: 'localStorage' | 'sessionStorage';
    } = {}
  ): boolean {
    try {
      const storage = options.storage || 'localStorage';

      if (!this.isStorageAvailable(storage)) {
        return false;
      }

      window[storage].removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove data:', error);
      return false;
    }
  }

  // Clear all data
  clear(options: {
    storage?: 'localStorage' | 'sessionStorage';
    pattern?: string;
  } = {}): boolean {
    try {
      const storage = options.storage;
      const pattern = options.pattern;

      if (storage) {
        if (!this.isStorageAvailable(storage)) {
          return false;
        }
        window[storage].clear();
      } else {
        if (this.config.enableLocalStorage && this.isStorageAvailable('localStorage')) {
          if (pattern) {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.includes(pattern)) {
                localStorage.removeItem(key);
              }
            });
          } else {
            localStorage.clear();
          }
        }

        if (this.config.enableSessionStorage && this.isStorageAvailable('sessionStorage')) {
          if (pattern) {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
              if (key.includes(pattern)) {
                sessionStorage.removeItem(key);
              }
            });
          } else {
            sessionStorage.clear();
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  // Cleanup expired data
  cleanup(): void {
    const storages: ('localStorage' | 'sessionStorage')[] = [];
    
    if (this.config.enableLocalStorage && this.isStorageAvailable('localStorage')) {
      storages.push('localStorage');
    }
    
    if (this.config.enableSessionStorage && this.isStorageAvailable('sessionStorage')) {
      storages.push('sessionStorage');
    }

    storages.forEach(storage => {
      const keys = Object.keys(window[storage]);
      keys.forEach(key => {
        try {
          const serializedData = window[storage].getItem(key);
          if (serializedData) {
            const decryptedData = this.decrypt(serializedData);
            const storedData: StoredData = JSON.parse(decryptedData);
            
            if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
              window[storage].removeItem(key);
            }
          }
        } catch {
          // Remove corrupted data
          window[storage].removeItem(key);
        }
      });
    });
  }

  // Get storage info
  getStorageInfo(): {
    localStorage: { available: boolean; size: number; keys: number };
    sessionStorage: { available: boolean; size: number; keys: number };
    totalSize: number;
    maxSize: number;
    usagePercent: number;
  } {
    const localStorageInfo = {
      available: this.isStorageAvailable('localStorage'),
      size: 0,
      keys: 0,
    };

    const sessionStorageInfo = {
      available: this.isStorageAvailable('sessionStorage'),
      size: 0,
      keys: 0,
    };

    if (localStorageInfo.available) {
      const keys = Object.keys(localStorage);
      localStorageInfo.keys = keys.length;
      localStorageInfo.size = keys.reduce((size, key) => {
        return size + (localStorage[key]?.length || 0) + key.length;
      }, 0);
    }

    if (sessionStorageInfo.available) {
      const keys = Object.keys(sessionStorage);
      sessionStorageInfo.keys = keys.length;
      sessionStorageInfo.size = keys.reduce((size, key) => {
        return size + (sessionStorage[key]?.length || 0) + key.length;
      }, 0);
    }

    const totalSize = localStorageInfo.size + sessionStorageInfo.size;
    const usagePercent = (totalSize / this.config.maxStorageSize) * 100;

    return {
      localStorage: localStorageInfo,
      sessionStorage: sessionStorageInfo,
      totalSize,
      maxSize: this.config.maxStorageSize,
      usagePercent,
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<PersistenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): PersistenceConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const statePersistenceService = new StatePersistenceService();

// Export class for custom instances
export { StatePersistenceService };
