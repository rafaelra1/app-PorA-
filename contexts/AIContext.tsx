import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { City, CityGuide, Attraction, TypicalDish, ItineraryDay } from '../types';
import { getGeminiService } from '../services/geminiService';

interface AIContextType {
    // Itinerary state
    itinerary: ItineraryDay[];
    isGeneratingItinerary: boolean;

    // City guide state
    selectedCity: City | null;
    cityGuide: CityGuide | null;
    isLoadingGuide: boolean;

    // Grounding state
    groundingInfo: string;
    groundingLinks: any[];
    isGroundingLoading: boolean;

    // Image generation state
    genAspectRatio: string;
    genSize: string;

    // Actions
    generateItinerary: (destination: string, startDate: string, endDate: string) => Promise<void>;
    fetchCityGuide: (city: City) => Promise<void>;
    fetchGroundingInfo: (city: string) => Promise<void>;
    setSelectedCity: (city: City | null) => void;
    setGenAspectRatio: (ratio: string) => void;
    setGenSize: (size: string) => void;
    clearCityGuide: () => void;
}

const AIContext = createContext<AIContextType | null>(null);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
    const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);

    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [cityGuide, setCityGuide] = useState<CityGuide | null>(null);
    const [isLoadingGuide, setIsLoadingGuide] = useState(false);

    const [groundingInfo, setGroundingInfo] = useState<string>('');
    const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
    const [isGroundingLoading, setIsGroundingLoading] = useState(false);

    const [genAspectRatio, setGenAspectRatio] = useState<string>("4:3");
    const [genSize, setGenSize] = useState<string>("1K");

    const geminiService = getGeminiService();

    const generateItinerary = useCallback(async (destination: string, startDate: string, endDate: string) => {
        setIsGeneratingItinerary(true);
        try {
            const data = await geminiService.generateItinerary(destination, startDate, endDate);
            setItinerary(data);
        } catch (error) {
            console.error('Error generating itinerary:', error);
        } finally {
            setIsGeneratingItinerary(false);
        }
    }, []);

    const fetchCityGuide = useCallback(async (city: City) => {
        setIsLoadingGuide(true);
        try {
            const guide = await geminiService.generateCityGuide(city.name, city.country);
            setCityGuide(guide);
            // Note: generateAllImages is called inside here, but we should be careful about deps
            // For now, let's keep it simple as it's an action called by user interaction meistens
        } catch (error) {
            console.error('Error fetching city guide:', error);
        } finally {
            setIsLoadingGuide(false);
        }
    }, []);

    const fetchGroundingInfo = useCallback(async (city: string) => {
        setIsGroundingLoading(true);
        try {
            const info = await geminiService.fetchGroundingInfo(city);
            setGroundingInfo(info.text);
            setGroundingLinks(info.links);
        } catch (error) {
            console.error('Error fetching grounding info:', error);
        } finally {
            setIsGroundingLoading(false);
        }
    }, []);

    const clearCityGuide = useCallback(() => {
        setCityGuide(null);
        setSelectedCity(null);
        setGroundingInfo('');
        setGroundingLinks([]);
    }, []);

    const value = useMemo(() => ({
        itinerary,
        isGeneratingItinerary,
        selectedCity,
        cityGuide,
        isLoadingGuide,
        groundingInfo,
        groundingLinks,
        isGroundingLoading,
        genAspectRatio,
        genSize,
        generateItinerary,
        fetchCityGuide,
        fetchGroundingInfo,
        setSelectedCity,
        setGenAspectRatio,
        setGenSize,
        clearCityGuide,
    }), [
        itinerary,
        isGeneratingItinerary,
        selectedCity,
        cityGuide,
        isLoadingGuide,
        groundingInfo,
        groundingLinks,
        isGroundingLoading,
        genAspectRatio,
        genSize,
        generateItinerary,
        fetchCityGuide,
        fetchGroundingInfo,
        clearCityGuide
    ]);

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
};

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within AIProvider');
    }
    return context;
};
