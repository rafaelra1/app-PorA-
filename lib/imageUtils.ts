/**
 * Image Utility Functions
 * 
 * Helper functions for image handling and URLs
 */

/**
 * Generate avatar URL from name
 * @param name - User name
 * @param options - Additional options
 * @returns Avatar URL
 */
export function generateAvatarUrl(
    name: string,
    options: {
        background?: string;
        color?: string;
        size?: number;
    } = {}
): string {
    const { background = 'random', color = 'fff', size = 128 } = options;
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=${background}&color=${color}&size=${size}`;
}

/**
 * Check if URL is a valid image URL
 * @param url - URL to check
 * @returns True if valid image URL
 */
export function isValidImageUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        return imageExtensions.some(ext => parsedUrl.pathname.toLowerCase().endsWith(ext));
    } catch {
        return false;
    }
}

/**
 * Get optimized image URL with parameters
 * @param url - Original image URL
 * @param width - Desired width
 * @param quality - Quality (1-100)
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(
    url: string,
    width?: number,
    quality = 80
): string {
    if (!url) return url;

    // For Unsplash images
    if (url.includes('unsplash.com')) {
        const separator = url.includes('?') ? '&' : '?';
        const params = [];
        if (width) params.push(`w=${width}`);
        params.push(`q=${quality}`, 'auto=format', 'fit=crop');
        return `${url}${separator}${params.join('&')}`;
    }

    return url;
}

/**
 * Convert base64 to blob
 * @param base64 - Base64 string
 * @param mimeType - MIME type
 * @returns Blob
 */
export function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
    const byteString = atob(base64.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeType });
}
