// /services/gemini/config.ts
// Centralized configuration for Gemini 3 API

export const GEMINI_CONFIG = {
    // Modelos
    models: {
        text: {
            fast: 'gemini-3-flash-preview',
            pro: 'gemini-3-pro-preview',
            // Legacy fallback
            legacy: 'gemini-2.5-flash',
        },
        image: {
            pro: 'gemini-3-pro-image-preview',
            fast: 'gemini-2.5-flash-image',
        },
    },

    // URLs de API
    apiUrls: {
        base: 'https://generativelanguage.googleapis.com/v1beta/models',
        textFlash: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
        textPro: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent',
        imagePro: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
        imageFast: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    },

    // Configurações padrão
    defaults: {
        thinkingLevel: 'high' as const,
        mediaResolution: 'media_resolution_medium' as const,
        imageAspectRatio: '16:9' as const,
        imageSize: '2K' as const,
    },

    // Aspect ratios disponíveis
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const,

    // Tamanhos de imagem
    imageSizes: ['1K', '2K', '4K'] as const,
} as const;

// Types
export type ThinkingLevel = 'low' | 'medium' | 'high' | 'minimal';
export type MediaResolution = 'media_resolution_low' | 'media_resolution_medium' | 'media_resolution_high' | 'media_resolution_ultra_high';
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = typeof GEMINI_CONFIG.aspectRatios[number];

// V3 specific configurations
export interface GeminiV3Config {
    thinkingLevel?: ThinkingLevel;
    mediaResolution?: MediaResolution;
}

export interface ImageGenerationOptionsV3 {
    aspectRatio?: AspectRatio;
    imageSize?: ImageSize;
    useGoogleSearch?: boolean;
    negativePrompt?: string;
}

export default GEMINI_CONFIG;
