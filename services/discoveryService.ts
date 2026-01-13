/**
 * Discovery Service - Hybrid AI + Google Places for Attraction Discovery
 * 
 * This service coordinates between Gemini AI (for curated suggestions) and
 * Google Places API (for real-world validation and enrichment).
 */

import { DiscoveryAttraction, Attraction } from '../types';
import { getGeminiService } from './geminiService';
import { googlePlacesService } from './googlePlacesService';

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// =============================================================================
// Types
// =============================================================================

interface AISuggestion {
    name: string;
    description: string;
    category: string;
    aiReason: string;
}

interface PlacesSearchResult {
    places?: Array<{
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        rating?: number;
        userRatingCount?: number;
        photos?: Array<{ name: string }>;
        currentOpeningHours?: {
            openNow?: boolean;
            weekdayDescriptions?: string[];
        };
        priceLevel?: string;
        location?: { latitude: number; longitude: number };
        types?: string[];
    }>;
}

// =============================================================================
// Main Service
// =============================================================================

export const discoveryService = {
    /**
     * Generate attraction suggestions using AI
     * Returns raw suggestions that will be validated with Google Places
     */
    generateSuggestions: async (
        cityName: string,
        country: string,
        existingAttractions: string[] = []
    ): Promise<DiscoveryAttraction[]> => {
        try {
            const geminiService = getGeminiService();

            const suggestions = await geminiService.generateAttractionSuggestions(cityName, country, existingAttractions);

            // Convert to DiscoveryAttraction format with pending status
            return suggestions.map((s: AISuggestion, index: number) => ({
                id: `discovery-${Date.now()}-${index}`,
                name: s.name,
                description: s.description,
                category: s.category,
                aiReason: s.aiReason || `Uma experiência única em ${cityName}`,
                photos: [],
                rating: 0,
                userRatingsTotal: 0,
                address: '',
                status: 'pending' as const,
            }));
        } catch (error) {
            console.error('Error generating suggestions:', error);
            // Return fallback suggestions
            return getDefaultSuggestions(cityName).map((s, index) => ({
                id: `discovery-${Date.now()}-${index}`,
                name: s.name,
                description: s.description,
                category: s.category,
                aiReason: s.aiReason,
                photos: [],
                rating: 0,
                userRatingsTotal: 0,
                address: '',
                status: 'pending' as const,
            }));
        }
    },


    /**
     * Validate and enrich a single attraction with Google Places data
     * This ensures we have real photos, ratings, and opening hours
     */
    validateWithPlaces: async (
        attraction: DiscoveryAttraction,
        cityName: string
    ): Promise<DiscoveryAttraction> => {
        if (!API_KEY) {
            console.warn('Google Places API key not configured');
            return {
                ...attraction,
                status: 'error',
                errorMessage: 'API key não configurada',
            };
        }

        try {
            // Search for the place
            const searchQuery = `${attraction.name} ${cityName}`;
            const searchResult = await searchPlaceAdvanced(searchQuery);

            if (!searchResult || !searchResult.places || searchResult.places.length === 0) {
                console.warn(`Place not found: ${attraction.name}`);
                return {
                    ...attraction,
                    status: 'error',
                    errorMessage: 'Local não encontrado no Google Maps',
                };
            }

            const place = searchResult.places[0];

            // Fetch multiple photos
            const photos = await getPlacePhotos(place.photos || [], 5);

            return {
                ...attraction,
                placeId: place.id,
                address: place.formattedAddress || '',
                rating: place.rating || 0,
                userRatingsTotal: place.userRatingCount || 0,
                photos: photos.length > 0 ? photos : [getFallbackImage(attraction.category)],
                openNow: place.currentOpeningHours?.openNow,
                openingHours: place.currentOpeningHours?.weekdayDescriptions,
                priceLevel: parsePriceLevel(place.priceLevel),
                location: place.location ? {
                    lat: place.location.latitude,
                    lng: place.location.longitude,
                } : undefined,
                status: 'validated',
            };
        } catch (error) {
            console.error(`Error validating ${attraction.name}:`, error);
            return {
                ...attraction,
                status: 'error',
                errorMessage: 'Erro ao buscar dados do local',
            };
        }
    },

    /**
     * Convert a validated DiscoveryAttraction to a regular Attraction
     * for saving to the repository
     */
    convertToAttraction: (discovery: DiscoveryAttraction): Attraction => {
        return {
            name: discovery.name,
            description: discovery.description,
            image: discovery.photos[0] || '',
            category: discovery.category,
            rating: discovery.rating,
            address: discovery.address,
            openingHours: discovery.openingHours?.join(' | '),
            price: formatPriceLevel(discovery.priceLevel),
            longDescription: discovery.aiReason,
        };
    },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Advanced place search using Google Places API (New)
 */
async function searchPlaceAdvanced(query: string): Promise<PlacesSearchResult | null> {
    if (!API_KEY) return null;

    try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos,places.currentOpeningHours,places.priceLevel,places.location,places.types',
            },
            body: JSON.stringify({
                textQuery: query,
                languageCode: 'pt-BR',
                maxResultCount: 1,
            }),
        });

        if (!response.ok) {
            throw new Error(`Places API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Places search error:', error);
        return null;
    }
}

/**
 * Get multiple photos for a place
 */
async function getPlacePhotos(photoRefs: Array<{ name: string }>, maxPhotos: number = 5): Promise<string[]> {
    if (!API_KEY || !photoRefs || photoRefs.length === 0) return [];

    const photos: string[] = [];
    const photosToFetch = photoRefs.slice(0, maxPhotos);

    for (const photo of photosToFetch) {
        if (photo.name) {
            const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=800&key=${API_KEY}`;
            photos.push(photoUrl);
        }
    }

    return photos;
}

/**
 * Parse price level from Google Places format
 */
function parsePriceLevel(priceLevel?: string): number {
    if (!priceLevel) return 0;

    const mapping: Record<string, number> = {
        'PRICE_LEVEL_FREE': 0,
        'PRICE_LEVEL_INEXPENSIVE': 1,
        'PRICE_LEVEL_MODERATE': 2,
        'PRICE_LEVEL_EXPENSIVE': 3,
        'PRICE_LEVEL_VERY_EXPENSIVE': 4,
    };

    return mapping[priceLevel] ?? 0;
}

/**
 * Format price level for display
 */
function formatPriceLevel(level?: number): string {
    if (level === undefined || level === 0) return 'Grátis';
    return '$'.repeat(level);
}

/**
 * Get fallback image based on category
 */
function getFallbackImage(category: string): string {
    const categoryImages: Record<string, string> = {
        'Museu': 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&q=80&w=800',
        'Parque': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&q=80&w=800',
        'Igreja': 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&q=80&w=800',
        'Monumento': 'https://images.unsplash.com/photo-1568797629192-789acf8e4df3?auto=format&fit=crop&q=80&w=800',
        'Praia': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
        'Mercado': 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9d?auto=format&fit=crop&q=80&w=800',
        'Mirante': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800',
    };

    return categoryImages[category] || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800';
}

/**
 * Default suggestions as fallback
 */
function getDefaultSuggestions(cityName: string): AISuggestion[] {
    return [
        {
            name: `Centro Histórico de ${cityName}`,
            description: 'Explore as ruas históricas e a arquitetura colonial.',
            category: 'Histórico',
            aiReason: 'Perfeito para sentir a essência cultural da cidade.',
        },
        {
            name: `Mercado Municipal de ${cityName}`,
            description: 'Sabores locais e artesanato típico em um só lugar.',
            category: 'Mercado',
            aiReason: 'Uma experiência gastronômica autêntica te espera.',
        },
        {
            name: `Mirante de ${cityName}`,
            description: 'Vista panorâmica da cidade e arredores.',
            category: 'Mirante',
            aiReason: 'As melhores fotos da viagem serão tiradas aqui.',
        },
    ];
}

export default discoveryService;
