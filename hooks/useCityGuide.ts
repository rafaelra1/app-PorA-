import { useState, useCallback } from 'react';
import { getGeminiService } from '../services/geminiService';
import { City, CityGuide, GroundingInfo } from '../types';

interface UseCityGuideReturn {
    cityGuide: CityGuide | null;
    groundingInfo: string;
    groundingLinks: any[];
    isLoadingGuide: boolean;
    isLoadingGrounding: boolean;
    error: string | null;
    fetchCityGuide: (city: City) => Promise<void>;
    fetchGroundingInfo: (cityName: string) => Promise<void>;
    reset: () => void;
}

/**
 * Custom hook for managing city guide data
 * Handles fetching city guide information and grounding data from AI service
 * 
 * @returns Object with city guide data, loading states, and fetch functions
 * 
 * @example
 * const { cityGuide, isLoadingGuide, fetchCityGuide } = useCityGuide();
 * await fetchCityGuide({ name: 'Paris', country: 'France', ... });
 */
export function useCityGuide(): UseCityGuideReturn {
    const [cityGuide, setCityGuide] = useState<CityGuide | null>(null);
    const [groundingInfo, setGroundingInfo] = useState<string>('');
    const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
    const [isLoadingGuide, setIsLoadingGuide] = useState(false);
    const [isLoadingGrounding, setIsLoadingGrounding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCityGuide = useCallback(async (city: City) => {
        setIsLoadingGuide(true);
        setError(null);

        try {
            const service = getGeminiService();
            const guide = await service.generateCityGuide(city.name, city.country);
            setCityGuide(guide);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch city guide';
            setError(errorMessage);
            console.error('Error fetching city guide:', err);
        } finally {
            setIsLoadingGuide(false);
        }
    }, []);

    const fetchGroundingInfo = useCallback(async (cityName: string) => {
        setIsLoadingGrounding(true);
        setError(null);

        try {
            const service = getGeminiService();
            const info = await service.fetchGroundingInfo(cityName);
            setGroundingInfo(info.text);
            setGroundingLinks(info.links);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grounding info';
            setError(errorMessage);
            console.error('Error fetching grounding info:', err);
        } finally {
            setIsLoadingGrounding(false);
        }
    }, []);

    const reset = useCallback(() => {
        setCityGuide(null);
        setGroundingInfo('');
        setGroundingLinks([]);
        setError(null);
        setIsLoadingGuide(false);
        setIsLoadingGrounding(false);
    }, []);

    return {
        cityGuide,
        groundingInfo,
        groundingLinks,
        isLoadingGuide,
        isLoadingGrounding,
        error,
        fetchCityGuide,
        fetchGroundingInfo,
        reset,
    };
}

export default useCityGuide;
