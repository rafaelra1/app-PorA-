import pica from 'pica';

export interface PreprocessingResult {
    processedBase64: string;
    originalSize: { width: number; height: number };
    appliedTransforms: string[];
    qualityScore: number; // 0-1
}

export interface QualityAnalysis {
    isAcceptable: boolean;
    issues: ('blurry' | 'dark' | 'overexposed' | 'glare')[];
    score: number;
}

export class ImagePreprocessor {
    private picaInstance: any;

    constructor() {
        this.picaInstance = pica();
    }

    async process(base64: string): Promise<PreprocessingResult> {
        const transforms: string[] = [];

        // 1. Load image
        const img = await this.loadImage(base64);
        const originalSize = { width: img.width, height: img.height };

        // 2. Resize if needed
        let canvas = document.createElement('canvas');
        let targetWidth = img.width;
        let targetHeight = img.height;
        const MAX_DIMENSION = 4096;

        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
            const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
            targetWidth = Math.round(img.width * scale);
            targetHeight = Math.round(img.height * scale);
            transforms.push('resize');
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Use pica for high validation resizing
        await this.picaInstance.resize(img, canvas, {
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2
        });

        // 3. Analyze quality before final output
        const qualityScore = this.calculateQualityScore(canvas);

        // 4. Enhance contrast if needed (basic implementation)
        // For now, we perform a simple histogram stretch if the image is too washed out
        // This is computationally expensive in JS, so we might skip or do a lightweight version
        // transforms.push('contrast_enhanced'); // if applied

        // 5. Convert to JPEG if PNG/large
        const processedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        if (!base64.startsWith('data:image/jpeg')) {
            transforms.push('format_conversion');
        }

        return {
            processedBase64,
            originalSize,
            appliedTransforms: transforms,
            qualityScore
        };
    }

    async analyzeQuality(base64: string): Promise<QualityAnalysis> {
        const img = await this.loadImage(base64);
        const canvas = document.createElement('canvas');
        // Analyze on a smaller version for performance
        const ANALYSIS_SIZE = 500;
        const scale = Math.min(ANALYSIS_SIZE / img.width, ANALYSIS_SIZE / img.height);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const issues: ('blurry' | 'dark' | 'overexposed' | 'glare')[] = [];

        // 1. Brightness Check
        const brightness = this.calculateAverageBrightness(imageData);
        if (brightness < 40) issues.push('dark');
        if (brightness > 220) issues.push('overexposed');

        // 2. Blur detection (Laplacian variance)
        const blurScore = this.calculateBlurScore(imageData);
        // Lower score means more blurry. Threshold depends on implementation.
        // Normalized approx 0-1, < 0.2 is very blurry
        if (blurScore < 0.15) issues.push('blurry');

        // 3. Quality Score
        // Simple weighted average
        const score = Math.max(0, Math.min(1, (blurScore * 0.7) + (1 - Math.abs(brightness - 128) / 128) * 0.3));

        return {
            isAcceptable: issues.length === 0,
            issues,
            score
        };
    }

    // --- Helpers ---

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    private calculateAverageBrightness(imageData: ImageData): number {
        let sum = 0;
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Perceived brightness (R*0.299 + G*0.587 + B*0.114)
            sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }
        return sum / (data.length / 4);
    }

    private calculateBlurScore(imageData: ImageData): number {
        // Simple Laplacian variance approximation
        // We'll calculate variance of the Laplacian of the image luminance
        // This is a simplified version for browser performance

        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        // Convert to grayscale first
        const gray = new Uint8Array(width * height);
        for (let i = 0; i < data.length; i += 4) {
            gray[i / 4] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }

        let mean = 0;
        let count = 0;

        // Convolve with Laplacian kernel
        // [0, 1, 0]
        // [1, -4, 1]
        // [0, 1, 0]
        // We skip borders for simplicity
        const laplacian = [];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const val =
                    gray[idx - width] + // top
                    gray[idx + width] + // bottom
                    gray[idx - 1] +     // left
                    gray[idx + 1] -     // right
                    (4 * gray[idx]);    // center

                laplacian.push(val);
                mean += val;
                count++;
            }
        }

        mean /= count;

        // Calculate Variance
        let variance = 0;
        for (const val of laplacian) {
            variance += (val - mean) * (val - mean);
        }
        variance /= count;

        // Normalize variance to 0-1 range (heuristic)
        // Variance usually ranges 0-1000+ for sharp images
        // < 100 often indicates blur
        const normalized = Math.min(1, variance / 500);
        return normalized;
    }

    private calculateQualityScore(canvas: HTMLCanvasElement): number {
        // Re-use logic or implement specific post-process scoring
        // For now returning dummy pass-through or re-analyzing
        return 0.9;
    }
}

export const imagePreprocessor = new ImagePreprocessor();
