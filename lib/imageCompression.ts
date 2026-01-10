/**
 * ImageCompression - Client-side image compression and resizing
 *
 * Features:
 * - Compress images before upload
 * - Resize to standard dimensions
 * - Generate thumbnails
 * - Convert formats (JPEG, PNG, WebP)
 * - Maintain aspect ratio
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface ImageSizes {
  thumbnail: Blob;
  card: Blob;
  full: Blob;
}

/**
 * Compress a single image
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.8,
    format = 'jpeg',
    maintainAspectRatio = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (maintainAspectRatio) {
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }
      } else {
        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(
              `Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB ` +
              `(${((1 - blob.size / file.size) * 100).toFixed(0)}% reduction)`
            );
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generate multiple sizes of an image (thumbnail, card, full)
 */
export async function generateImageSizes(
  file: File | Blob,
  quality: number = 0.8
): Promise<ImageSizes> {
  const [thumbnail, card, full] = await Promise.all([
    compressImage(file, {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.7,
      format: 'jpeg'
    }),
    compressImage(file, {
      maxWidth: 400,
      maxHeight: 300,
      quality: 0.8,
      format: 'jpeg'
    }),
    compressImage(file, {
      maxWidth: 1200,
      maxHeight: 800,
      quality,
      format: 'jpeg'
    })
  ]);

  return { thumbnail, card, full };
}

/**
 * Resize image to exact dimensions (may crop)
 */
export async function resizeImageExact(
  file: File | Blob,
  width: number,
  height: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      // Calculate crop dimensions to maintain aspect ratio
      const imgAspect = img.width / img.height;
      const targetAspect = width / height;

      let sx = 0;
      let sy = 0;
      let sWidth = img.width;
      let sHeight = img.height;

      if (imgAspect > targetAspect) {
        // Image is wider, crop sides
        sWidth = img.height * targetAspect;
        sx = (img.width - sWidth) / 2;
      } else {
        // Image is taller, crop top/bottom
        sHeight = img.width / targetAspect;
        sy = (img.height - sHeight) / 2;
      }

      // Draw cropped image
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convert image format
 */
export async function convertImageFormat(
  file: File | Blob,
  targetFormat: 'jpeg' | 'png' | 'webp',
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // For PNG with transparency, use white background
      if (targetFormat === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
          }
        },
        `image/${targetFormat}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convert blob to base64 data URL
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 to blob
 */
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `File too large (${fileSizeMB}MB). Maximum: ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Create thumbnail with blur effect (for loading placeholder)
 */
export async function createBlurThumbnail(
  file: File | Blob,
  size: number = 20
): Promise<string> {
  const blob = await compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.5,
    format: 'jpeg'
  });

  return blobToBase64(blob);
}
