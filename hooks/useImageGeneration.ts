import { useState, useCallback } from 'react';
import { getGeminiService } from '../services/geminiService';
import { getStorageService } from '../services/storageService';
import { ImageGenerationOptions } from '../types';

export interface GenerateImageResult {
    url: string;
    isUploaded: boolean;
    storageUrl?: string;
}

/**
 * Custom hook for AI image generation with upload support
 * Manages loading state, error handling, and Supabase Storage integration
 *
 * @returns Object with image generation functions and loading states
 *
 * @example
 * const { generateImage, generateVariations, editImage, isGenerating } = useImageGeneration();
 *
 * // Generate single image
 * const result = await generateImage('A beautiful sunset', { aspectRatio: '16:9' });
 *
 * // Generate variations
 * const variations = await generateVariations('Tokyo skyline', 4, { imageSize: '2K' });
 *
 * // Edit existing image
 * const edited = await editImage(currentImageBase64, 'make it brighter');
 */
export function useImageGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [variations, setVariations] = useState<string[]>([]);

    /**
     * Generate a single image
     *
     * @param prompt - Text description of the image
     * @param options - Generation options (aspect ratio, size)
     * @param autoUpload - Automatically upload to Supabase Storage
     * @param uploadPath - Storage path (if autoUpload is true)
     * @returns Image URL or null on failure
     */
    const generateImage = useCallback(
        async (
            prompt: string,
            options?: ImageGenerationOptions,
            autoUpload: boolean = false,
            uploadPath?: string
        ): Promise<GenerateImageResult | null> => {
            setIsGenerating(true);
            setError(null);

            try {
                const service = getGeminiService();
                const imageUrl = await service.generateImage(prompt, options);

                if (!imageUrl) {
                    throw new Error('Failed to generate image');
                }

                // Upload to storage if requested
                if (autoUpload && uploadPath) {
                    setIsUploading(true);
                    const storageService = getStorageService();

                    let storageUrl: string | null = null;

                    // Check if it's a base64 image (from Gemini) or external URL
                    if (imageUrl.startsWith('data:')) {
                        // Upload base64 image
                        storageUrl = await storageService.uploadBase64Image(imageUrl, uploadPath);
                    } else {
                        // Upload from external URL
                        storageUrl = await storageService.uploadImageFromUrl(imageUrl, uploadPath);
                    }

                    setIsUploading(false);

                    return {
                        url: storageUrl || imageUrl,
                        isUploaded: !!storageUrl,
                        storageUrl: storageUrl || undefined
                    };
                }

                return {
                    url: imageUrl,
                    isUploaded: false
                };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
                setError(errorMessage);
                console.error('Image generation error:', err);
                return null;
            } finally {
                setIsGenerating(false);
                setIsUploading(false);
            }
        },
        []
    );

    /**
     * Generate multiple variations of an image
     *
     * @param prompt - Text description
     * @param count - Number of variations (1-4)
     * @param options - Generation options
     * @returns Array of image URLs
     */
    const generateVariations = useCallback(
        async (
            prompt: string,
            count: number = 4,
            options?: ImageGenerationOptions
        ): Promise<string[]> => {
            setIsGenerating(true);
            setError(null);
            setVariations([]);

            try {
                const service = getGeminiService();
                const results = await service.generateImageVariations(prompt, count, options);
                setVariations(results);
                return results;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to generate variations';
                setError(errorMessage);
                console.error('Variation generation error:', err);
                return [];
            } finally {
                setIsGenerating(false);
            }
        },
        []
    );

    /**
     * Edit an existing image with AI
     *
     * @param currentImageBase64 - Current image as base64
     * @param editPrompt - Description of desired changes
     * @param autoUpload - Automatically upload to storage
     * @param uploadPath - Storage path (if autoUpload is true)
     * @returns Edited image URL or null
     */
    const editImage = useCallback(
        async (
            currentImageBase64: string,
            editPrompt: string,
            autoUpload: boolean = false,
            uploadPath?: string
        ): Promise<GenerateImageResult | null> => {
            setIsGenerating(true);
            setError(null);

            try {
                const service = getGeminiService();
                const editedImage = await service.editImageWithAI(currentImageBase64, editPrompt);

                if (!editedImage) {
                    throw new Error('Failed to edit image');
                }

                // Upload to storage if requested
                if (autoUpload && uploadPath) {
                    setIsUploading(true);
                    const storageService = getStorageService();
                    const storageUrl = await storageService.uploadBase64Image(editedImage, uploadPath);
                    setIsUploading(false);

                    return {
                        url: storageUrl || editedImage,
                        isUploaded: !!storageUrl,
                        storageUrl: storageUrl || undefined
                    };
                }

                return {
                    url: editedImage,
                    isUploaded: false
                };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to edit image';
                setError(errorMessage);
                console.error('Image edit error:', err);
                return null;
            } finally {
                setIsGenerating(false);
                setIsUploading(false);
            }
        },
        []
    );

    /**
     * Upload an external image URL to storage
     *
     * @param imageUrl - URL of the image to upload
     * @param uploadPath - Storage path
     * @returns Storage URL or null
     */
    const uploadToStorage = useCallback(
        async (imageUrl: string, uploadPath: string): Promise<string | null> => {
            setIsUploading(true);
            setError(null);

            try {
                const storageService = getStorageService();

                if (imageUrl.startsWith('data:')) {
                    return await storageService.uploadBase64Image(imageUrl, uploadPath);
                } else {
                    return await storageService.uploadImageFromUrl(imageUrl, uploadPath);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
                setError(errorMessage);
                console.error('Upload error:', err);
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setError(null);
        setIsGenerating(false);
        setIsUploading(false);
        setVariations([]);
    }, []);

    return {
        // Generation functions
        generateImage,
        generateVariations,
        editImage,
        uploadToStorage,

        // State
        isGenerating,
        isUploading,
        error,
        variations,

        // Utilities
        reset,
    };
}

export default useImageGeneration;
