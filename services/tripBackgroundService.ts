/**
 * TripBackgroundService - Dynamic AI-generated trip backgrounds
 * 
 * Features:
 * - Auto-detects destination vibe (praia, urbano, montanha, etc.)
 * - Generates contextual prompts for Imagen API
 * - Caches generated images in Supabase Storage
 * - Provides fallback chain for reliability
 */

import { getGeminiService } from './geminiService';
import { getStorageService } from './storageService';
import { Trip } from '../types';

// =============================================================================
// Types
// =============================================================================

export type DestinationVibe = 'praia' | 'urbano' | 'montanha' | 'rural' | 'cultural' | 'aventura' | 'tropical' | 'historico';
export type LightingMode = 'golden_hour' | 'blue_hour' | 'noon' | 'night' | 'sunset';

export interface TripBackgroundData {
    destination: string;
    vibe?: DestinationVibe;
    lighting?: LightingMode;
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
    tags?: string[];
}

export interface GeneratedBackground {
    url: string;
    prompt: string;
    vibe: DestinationVibe;
    generatedAt: string;
}

// =============================================================================
// Vibe Detection Keywords
// =============================================================================

const VIBE_KEYWORDS: Record<DestinationVibe, string[]> = {
    praia: [
        'rio de janeiro', 'copacabana', 'ipanema', 'florianópolis', 'natal', 'maceió',
        'cancun', 'punta cana', 'maldivas', 'bali', 'phuket', 'miami', 'hawaii',
        'bahamas', 'caribe', 'caribbean', 'beach', 'praia', 'litoral', 'costa',
        'fernando de noronha', 'buzios', 'cabo frio', 'ilhabela', 'ubatuba'
    ],
    urbano: [
        'são paulo', 'new york', 'tokyo', 'londres', 'paris', 'dubai', 'singapore',
        'hong kong', 'chicago', 'los angeles', 'berlin', 'amsterdam', 'barcelona',
        'madrid', 'milan', 'roma', 'bangkok', 'shanghai', 'buenos aires', 'cidade'
    ],
    montanha: [
        'campos do jordão', 'gramado', 'swiss alps', 'alps', 'andes', 'patagonia',
        'machu picchu', 'cusco', 'aspen', 'whistler', 'chamonix', 'dolomites',
        'himalaya', 'mount', 'serra', 'montanha', 'mountain', 'ski'
    ],
    rural: [
        'toscana', 'provence', 'napa valley', 'vinícola', 'fazenda', 'countryside',
        'farm', 'rural', 'wine country', 'vale dos vinhedos', 'bento gonçalves'
    ],
    cultural: [
        'kyoto', 'jerusalem', 'vaticano', 'cairo', 'atenas', 'petra', 'angkor wat',
        'taj mahal', 'great wall', 'coliseu', 'museu', 'museum', 'temple', 'templo'
    ],
    aventura: [
        'queenstown', 'interlaken', 'moab', 'costa rica', 'safari', 'amazonia',
        'amazon', 'galapagos', 'iceland', 'patagonia', 'torres del paine'
    ],
    tropical: [
        'amazônia', 'manaus', 'belém', 'pantanal', 'costa rica', 'hawaii',
        'fiji', 'tahiti', 'seychelles', 'mauritius', 'zanzibar'
    ],
    historico: [
        'ouro preto', 'lisboa', 'porto', 'roma', 'atenas', 'cairo', 'jerusalém',
        'havana', 'cartagena', 'cusco', 'antigo', 'histórico', 'colonial'
    ]
};

// =============================================================================
// Service Class
// =============================================================================

class TripBackgroundService {
    private geminiService = getGeminiService();
    private storageService = getStorageService();

    /**
     * Detect vibe from destination name
     */
    detectVibe(destination: string): DestinationVibe {
        const lowerDest = destination.toLowerCase();

        for (const [vibe, keywords] of Object.entries(VIBE_KEYWORDS)) {
            if (keywords.some(kw => lowerDest.includes(kw))) {
                return vibe as DestinationVibe;
            }
        }

        // Default fallback based on common patterns
        if (lowerDest.includes('beach') || lowerDest.includes('island')) {
            return 'praia';
        }
        if (lowerDest.includes('city') || lowerDest.includes('metro')) {
            return 'urbano';
        }

        // Default to urbano for unknown destinations
        return 'urbano';
    }

    /**
     * Determine optimal lighting based on vibe
     */
    private getLightingForVibe(vibe: DestinationVibe): LightingMode {
        switch (vibe) {
            case 'praia':
            case 'tropical':
                return 'golden_hour';
            case 'urbano':
                return 'blue_hour';
            case 'montanha':
                return 'sunrise' as LightingMode;
            case 'cultural':
            case 'historico':
                return 'golden_hour';
            case 'aventura':
                return 'noon';
            default:
                return 'golden_hour';
        }
    }

    /**
     * Build optimized prompt for trip background
     */
    private buildPrompt(data: TripBackgroundData): string {
        const vibe = data.vibe || this.detectVibe(data.destination);
        const lighting = data.lighting || this.getLightingForVibe(vibe);

        // Vibe-specific atmosphere descriptions
        const atmosphereMap: Record<DestinationVibe, string> = {
            praia: 'tropical beach vibes, crystal clear water, palm trees, relaxing atmosphere',
            urbano: 'metropolitan skyline, modern architecture, vibrant city life, neon lights',
            montanha: 'majestic mountain peaks, alpine scenery, pine forests, serene nature',
            rural: 'rolling hills, vineyards, pastoral landscape, peaceful countryside',
            cultural: 'ancient temples, historic monuments, rich heritage, mystical atmosphere',
            aventura: 'dramatic landscapes, rugged terrain, adventure setting, epic scenery',
            tropical: 'lush rainforest, exotic vegetation, vibrant ecosystem, paradise vibes',
            historico: 'colonial architecture, cobblestone streets, vintage charm, timeless beauty'
        };

        const lightingMap: Record<LightingMode, string> = {
            golden_hour: 'warm golden hour sunlight, soft shadows, magical glow',
            blue_hour: 'cinematic blue hour lighting, city lights starting to glow',
            noon: 'bright daylight, vivid colors, clear sky',
            night: 'night cityscape, dramatic lighting, stars visible',
            sunset: 'stunning sunset colors, orange and purple sky'
        };

        const atmosphere = atmosphereMap[vibe] || atmosphereMap.urbano;
        const lightingDesc = lightingMap[lighting] || lightingMap.golden_hour;

        // Add tags context if available
        const tagsContext = data.tags?.length
            ? `, featuring ${data.tags.slice(0, 3).join(', ')}`
            : '';

        return `Aerial cinematic view of ${data.destination}${tagsContext}. 
${atmosphere}. 
${lightingDesc}.
Left-side negative space for UI overlay, 8k ultra high quality, professional travel photography, 
National Geographic style, no text, no watermarks, no people in close-up, 
photorealistic, stunning composition, award-winning photography.`;
    }

    /**
     * Generate background for a trip
     */
    async generateBackground(trip: Trip, forceRegenerate = false): Promise<GeneratedBackground | null> {
        const cacheKey = `trip-bg-${trip.id}`;

        // Check if already has a generated image (unless forcing regeneration)
        if (!forceRegenerate && trip.generatedCoverImage) {
            console.log(`Using cached background for trip ${trip.id}`);
            return {
                url: trip.generatedCoverImage,
                prompt: '',
                vibe: trip.vibe || this.detectVibe(trip.destination),
                generatedAt: new Date().toISOString()
            };
        }

        const data: TripBackgroundData = {
            destination: trip.destination,
            vibe: trip.vibe || this.detectVibe(trip.destination),
            tags: trip.tags
        };

        const prompt = this.buildPrompt(data);
        console.log(`Generating background for "${trip.destination}" with vibe: ${data.vibe}`);
        console.log('Prompt:', prompt);

        try {
            // Generate image using existing Gemini service
            const imageDataUrl = await this.geminiService.generateImage(prompt, {
                aspectRatio: '16:9',
                imageSize: '2K'
            });

            if (!imageDataUrl) {
                console.warn('Failed to generate image, using fallback');
                return null;
            }

            // If it's a base64 data URL, upload to Supabase Storage
            let finalUrl = imageDataUrl;

            if (imageDataUrl.startsWith('data:')) {
                const storagePath = this.storageService.generatePath(
                    'ai-backgrounds',
                    trip.id,
                    'cover',
                    'png'
                );

                const uploadedUrl = await this.storageService.uploadBase64Image(
                    imageDataUrl,
                    storagePath
                );

                if (uploadedUrl) {
                    finalUrl = uploadedUrl;
                    console.log('Background uploaded to storage:', uploadedUrl);
                }
            }

            return {
                url: finalUrl,
                prompt,
                vibe: data.vibe!,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating trip background:', error);
            return null;
        }
    }

    /**
     * Generate backgrounds for multiple trips (batch)
     */
    async generateBackgroundsForTrips(
        trips: Trip[],
        onProgress?: (completed: number, total: number) => void
    ): Promise<Map<string, GeneratedBackground | null>> {
        const results = new Map<string, GeneratedBackground | null>();
        const total = trips.length;
        let completed = 0;

        // Process sequentially to avoid rate limits
        for (const trip of trips) {
            try {
                const result = await this.generateBackground(trip);
                results.set(trip.id, result);
            } catch (error) {
                console.error(`Failed to generate background for trip ${trip.id}:`, error);
                results.set(trip.id, null);
            }

            completed++;
            onProgress?.(completed, total);

            // Small delay between generations to respect rate limits
            if (completed < total) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return results;
    }

    /**
     * Get vibe info for display
     */
    getVibeInfo(vibe: DestinationVibe): { label: string; emoji: string; color: string } {
        const vibeInfo: Record<DestinationVibe, { label: string; emoji: string; color: string }> = {
            praia: { label: 'Praia', emoji: '🏖️', color: '#00BCD4' },
            urbano: { label: 'Urbano', emoji: '🏙️', color: '#607D8B' },
            montanha: { label: 'Montanha', emoji: '🏔️', color: '#4CAF50' },
            rural: { label: 'Rural', emoji: '🌾', color: '#8BC34A' },
            cultural: { label: 'Cultural', emoji: '🏛️', color: '#9C27B0' },
            aventura: { label: 'Aventura', emoji: '🧗', color: '#FF5722' },
            tropical: { label: 'Tropical', emoji: '🌴', color: '#4CAF50' },
            historico: { label: 'Histórico', emoji: '🏰', color: '#795548' }
        };

        return vibeInfo[vibe] || vibeInfo.urbano;
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let tripBackgroundServiceInstance: TripBackgroundService | null = null;

export function getTripBackgroundService(): TripBackgroundService {
    if (!tripBackgroundServiceInstance) {
        tripBackgroundServiceInstance = new TripBackgroundService();
    }
    return tripBackgroundServiceInstance;
}

export default TripBackgroundService;
