import { useState, useCallback } from 'react';
import { getGeminiService } from '../services/geminiService';
import { ImageGenerationOptions } from '../types';

/**
 * Custom hook for AI image generation
 * Manages loading state and error handling for image generation
 * 
 * @returns Object with generateImage function and loading state
 * 
 * @example
 * const { generateImage, isGenerating, error } = useImageGeneration();
 * const imageUrl = await generateImage('A beautiful sunset over mountains', {
 *   aspectRatio: '16:9',
 *   imageSize: '2K'
 * });
 */
export function useImageGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateImage = useCallback(
        async (prompt: string, options?: ImageGenerationOptions): Promise<string | null> => {
            setIsGenerating(true);
            setError(null);

            try {
                const service = getGeminiService();
                const imageUrl = await service.generateImage(prompt, options);
                return imageUrl;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
                setError(errorMessage);
                console.error('Image generation error:', err);
                return null;
            } finally {
                setIsGenerating(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setError(null);
        setIsGenerating(false);
    }, []);

    return {
        generateImage,
        isGenerating,
        error,
        reset,
    };
}

export default useImageGeneration;
