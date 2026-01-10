/**
 * ImageCache - Persistent image caching with IndexedDB
 *
 * Features:
 * - Store images locally with TTL (time to live)
 * - Automatic cleanup of expired images
 * - Size limit management
 * - Thumbnail and full-size storage
 */

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
  type: 'thumbnail' | 'full';
}

class ImageCache {
  private dbName = 'trip-images-cache';
  private storeName = 'images';
  private version = 1;
  private db: IDBDatabase | null = null;

  // Configuration
  private ttl = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private maxSize = 50 * 1024 * 1024; // 50MB total cache size
  private currentSize = 0;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.calculateCurrentSize();
        console.log('✅ ImageCache initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'url' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Get image from cache
   */
  async get(url: string): Promise<Blob | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);

      request.onsuccess = () => {
        const cached = request.result as CachedImage | undefined;

        if (!cached) {
          resolve(null);
          return;
        }

        // Check if expired
        const now = Date.now();
        if (now - cached.timestamp > this.ttl) {
          console.log('Cache expired for:', url);
          this.delete(url); // Remove expired entry
          resolve(null);
          return;
        }

        console.log('Cache hit for:', url);
        resolve(cached.blob);
      };

      request.onerror = () => {
        console.error('Error getting from cache:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Store image in cache
   */
  async set(url: string, blob: Blob, type: 'thumbnail' | 'full' = 'full'): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    // Check if adding this would exceed max size
    if (this.currentSize + blob.size > this.maxSize) {
      console.warn('Cache size limit reached, cleaning up old entries');
      await this.cleanup();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const cachedImage: CachedImage = {
        url,
        blob,
        timestamp: Date.now(),
        size: blob.size,
        type
      };

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cachedImage);

      request.onsuccess = () => {
        this.currentSize += blob.size;
        console.log(`Cached image (${type}):`, url, `(${(blob.size / 1024).toFixed(1)}KB)`);
        resolve();
      };

      request.onerror = () => {
        console.error('Error storing in cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete image from cache
   */
  async delete(url: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Get the item first to update size
      const getRequest = store.get(url);

      getRequest.onsuccess = () => {
        const cached = getRequest.result as CachedImage | undefined;
        if (cached) {
          this.currentSize -= cached.size;
        }

        const deleteRequest = store.delete(url);
        deleteRequest.onsuccess = () => {
          console.log('Deleted from cache:', url);
          resolve();
        };
      };

      getRequest.onerror = () => {
        resolve();
      };
    });
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        this.currentSize = 0;
        console.log('✅ Cache cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Cleanup expired and oldest entries
   */
  async cleanup(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor();

      const now = Date.now();
      const toDelete: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const cached = cursor.value as CachedImage;

          // Mark expired entries for deletion
          if (now - cached.timestamp > this.ttl) {
            toDelete.push(cached.url);
          }

          cursor.continue();
        } else {
          // Delete expired entries
          Promise.all(toDelete.map(url => this.delete(url))).then(() => {
            // If still over limit, delete oldest entries
            if (this.currentSize > this.maxSize * 0.8) {
              this.deleteOldest(Math.floor(this.currentSize * 0.2));
            }
            console.log(`Cleaned up ${toDelete.length} expired entries`);
            resolve();
          });
        }
      };

      request.onerror = () => {
        console.error('Error during cleanup:', request.error);
        resolve();
      };
    });
  }

  /**
   * Delete oldest entries to free up space
   */
  private async deleteOldest(targetSize: number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor();

      let freedSize = 0;
      const toDelete: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor && freedSize < targetSize) {
          const cached = cursor.value as CachedImage;
          toDelete.push(cached.url);
          freedSize += cached.size;
          cursor.continue();
        } else {
          Promise.all(toDelete.map(url => this.delete(url))).then(() => {
            console.log(`Deleted ${toDelete.length} oldest entries, freed ${(freedSize / 1024 / 1024).toFixed(2)}MB`);
            resolve();
          });
        }
      };
    });
  }

  /**
   * Calculate current cache size
   */
  private async calculateCurrentSize(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();

      let totalSize = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const cached = cursor.value as CachedImage;
          totalSize += cached.size;
          cursor.continue();
        } else {
          this.currentSize = totalSize;
          console.log(`Current cache size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
          resolve();
        }
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ count: number; size: number; sizeFormatted: string }> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ count: 0, size: 0, sizeFormatted: '0 MB' });
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => {
        const count = request.result;
        const sizeMB = (this.currentSize / 1024 / 1024).toFixed(2);

        resolve({
          count,
          size: this.currentSize,
          sizeFormatted: `${sizeMB} MB`
        });
      };

      request.onerror = () => {
        resolve({ count: 0, size: 0, sizeFormatted: '0 MB' });
      };
    });
  }

  /**
   * Set custom TTL (in milliseconds)
   */
  setTTL(milliseconds: number): void {
    this.ttl = milliseconds;
  }

  /**
   * Set max cache size (in bytes)
   */
  setMaxSize(bytes: number): void {
    this.maxSize = bytes;
  }
}

// Singleton instance
let imageCacheInstance: ImageCache | null = null;

export function getImageCache(): ImageCache {
  if (!imageCacheInstance) {
    imageCacheInstance = new ImageCache();
  }
  return imageCacheInstance;
}

export default ImageCache;
