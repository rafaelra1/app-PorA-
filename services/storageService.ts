import { supabase } from '../lib/supabase';

/**
 * StorageService - Manages image upload/download to Supabase Storage
 *
 * Bucket structure: /{user_id}/trips/{trip_id}/images/{image_id}.{ext}
 */
class StorageService {
  private readonly BUCKET_NAME = 'trip-images';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Initialize storage bucket (call once on app startup or first use)
   */
  async initializeBucket(): Promise<boolean> {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === this.BUCKET_NAME);

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          fileSizeLimit: this.MAX_FILE_SIZE,
          allowedMimeTypes: this.ALLOWED_TYPES
        });

        if (error) {
          console.error('Error creating storage bucket:', error);
          return false;
        }

        console.log('✅ Storage bucket created successfully');
      }

      return true;
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
      return false;
    }
  }

  /**
   * Upload base64 image to Supabase Storage
   *
   * @param base64Data - Base64 encoded image data (with or without data URI prefix)
   * @param path - Storage path (e.g., "user123/trips/trip456/images/image1.png")
   * @returns Public URL of uploaded image or null on failure
   */
  async uploadBase64Image(
    base64Data: string,
    path: string
  ): Promise<string | null> {
    try {
      // Extract base64 content and determine file type
      const { base64Content, mimeType } = this.parseBase64Data(base64Data);

      if (!this.ALLOWED_TYPES.includes(mimeType)) {
        console.error('Invalid file type:', mimeType);
        return null;
      }

      // Convert base64 to blob
      const blob = this.base64ToBlob(base64Content, mimeType);

      if (blob.size > this.MAX_FILE_SIZE) {
        console.error('File size exceeds limit:', blob.size);
        return null;
      }

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(path, blob, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '31536000' // 1 year cache
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadBase64Image:', error);
      return null;
    }
  }

  /**
   * Upload image from URL to Supabase Storage
   *
   * @param imageUrl - URL of the image to download and upload
   * @param path - Storage path
   * @returns Public URL of uploaded image or null on failure
   */
  async uploadImageFromUrl(
    imageUrl: string,
    path: string
  ): Promise<string | null> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error('Failed to fetch image from URL:', imageUrl);
        return null;
      }

      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';

      if (!this.ALLOWED_TYPES.includes(mimeType)) {
        console.error('Invalid file type from URL:', mimeType);
        return null;
      }

      if (blob.size > this.MAX_FILE_SIZE) {
        console.error('File size exceeds limit:', blob.size);
        return null;
      }

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(path, blob, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '31536000'
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadImageFromUrl:', error);
      return null;
    }
  }

  /**
   * Upload image file (from user's device)
   *
   * @param file - File object from file input
   * @param path - Storage path
   * @returns Public URL of uploaded image or null on failure
   */
  async uploadImageFile(
    file: File,
    path: string
  ): Promise<string | null> {
    try {
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        console.error('Invalid file type:', file.type);
        return null;
      }

      if (file.size > this.MAX_FILE_SIZE) {
        console.error('File size exceeds limit:', file.size);
        return null;
      }

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(path, file, {
          contentType: file.type,
          upsert: true,
          cacheControl: '31536000'
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadImageFile:', error);
      return null;
    }
  }

  /**
   * Delete image from storage
   *
   * @param path - Storage path of the image to delete
   * @returns True if deleted successfully, false otherwise
   */
  async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteImage:', error);
      return false;
    }
  }

  /**
   * Generate storage path for an image
   *
   * @param userId - User ID
   * @param tripId - Trip ID (optional)
   * @param imageId - Unique image identifier
   * @param extension - File extension (e.g., 'png', 'jpg')
   * @returns Storage path string
   */
  generatePath(
    userId: string,
    tripId: string | null,
    imageId: string,
    extension: string = 'png'
  ): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);

    if (tripId) {
      return `${userId}/trips/${tripId}/images/${imageId}-${timestamp}-${randomId}.${extension}`;
    }

    return `${userId}/images/${imageId}-${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Parse base64 data and extract content and mime type
   */
  private parseBase64Data(base64Data: string): { base64Content: string; mimeType: string } {
    // Check if it's a data URI
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          mimeType: matches[1],
          base64Content: matches[2]
        };
      }
    }

    // Assume it's raw base64 with default JPEG type
    return {
      mimeType: 'image/jpeg',
      base64Content: base64Data
    };
  }

  /**
   * Convert base64 string to Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Get optimized image URL with transformations
   *
   * @param publicUrl - Original public URL from Supabase
   * @param width - Desired width
   * @param height - Desired height
   * @param quality - Image quality (1-100)
   * @returns Transformed image URL
   */
  getOptimizedUrl(
    publicUrl: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string {
    // Supabase Storage doesn't support image transformations out of the box
    // For production, consider using Cloudinary, imgix, or Supabase Image Transformations (enterprise)
    // For now, return original URL

    // TODO: Implement image transformation service
    return publicUrl;
  }

  /**
   * List all images for a user/trip
   *
   * @param userId - User ID
   * @param tripId - Trip ID (optional)
   * @returns Array of image URLs
   */
  async listImages(userId: string, tripId?: string): Promise<string[]> {
    try {
      const prefix = tripId
        ? `${userId}/trips/${tripId}/images/`
        : `${userId}/images/`;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(prefix);

      if (error) {
        console.error('Error listing images:', error);
        return [];
      }

      // Convert to public URLs
      return data.map(file => {
        const { data: urlData } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(`${prefix}${file.name}`);
        return urlData.publicUrl;
      });
    } catch (error) {
      console.error('Error in listImages:', error);
      return [];
    }
  }
}

// Singleton instance
let storageServiceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService();
  }
  return storageServiceInstance;
}

export default StorageService;
