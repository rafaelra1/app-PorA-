import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CityFilter } from '../../../ui/CityFilter';
import { QuickFactsGrid } from './QuickFactsGrid';
import { DifferencesSection } from './DifferencesSection';
import { CultureEtiquetteSection } from './CultureEtiquetteSection';
import { EntryRequirementsSection } from './EntryRequirementsSection';
import { MoneyCostsSection } from './MoneyCostsSection';
import { EmergencySafetySection } from './EmergencySafetySection';
import { UsefulPhrasesSection } from './UsefulPhrasesSection';
import { AppsResourcesSection } from './AppsResourcesSection';
import { WeatherSection } from './WeatherSection';
import { PORTUGAL_BRIEFING_DATA, GENERIC_BRIEFING_DATA } from '../../../../data/mockBriefingData';
import { Trip, City } from '../../../../types';
import { PreTripBriefingData } from '../../../../types/preTripBriefing';
import { BriefingService } from '../../../../services/briefingService';
import { getGeminiService } from '../../../../services/geminiService';
import { Loader2, Sparkles } from 'lucide-react';
import { CriticalAlerts } from '../CriticalAlerts';
import { ActiveAlertsBox } from '../ActiveAlertsBox';
import { useChecklist } from '../../../../contexts/ChecklistContext';
import { enrichTask } from '../../../../utils/smartTaskEnricher';

interface PreTripBriefingViewProps {
    trip?: Trip;
    cities?: City[];
}

type BriefingTab = 'differences' | 'culture' | 'entry' | 'money' | 'safety' | 'phrases' | 'apps' | 'weather';

export const PreTripBriefingView: React.FC<PreTripBriefingViewProps> = ({ trip, cities }) => {
    const [activeTab, setActiveTab] = useState<BriefingTab>('differences');
    const [selectedCity, setSelectedCity] = useState<City | null>(cities && cities.length > 0 ? cities[0] : null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiBriefingData, setAiBriefingData] = useState<PreTripBriefingData | null>(null);
    const { tasks } = useChecklist();

    const enrichedTasks = useMemo(() => {
        if (!trip) return [];
        return tasks.map(t => enrichTask(t, trip));
    }, [tasks, trip]);

    // Load briefing data (DB first, then AI)
    useEffect(() => {
        if (!selectedCity || !trip) return;

        const loadBriefing = async () => {
            setIsLoadingAI(true);
            try {
                // 1. Check persistence layer (Database) first
                const existingData = await BriefingService.getBriefing(trip.id, selectedCity.name, selectedCity.country);

                if (existingData) {
                    setAiBriefingData(existingData);
                    setIsLoadingAI(false);
                    return;
                }

                // 2. If no data in DB, generate via AI
                await generateAndSaveBriefing(trip.id, selectedCity);

            } catch (error) {
                console.error('Error loading briefing:', error);
                setIsLoadingAI(false);
            }
        };

        loadBriefing();
    }, [selectedCity, trip?.id]);

    const generateAndSaveBriefing = async (tripId: string, city: City) => {
        try {
            const geminiService = getGeminiService();
            const result = await geminiService.generateCityBriefing(
                city.name,
                city.country
            );

            if (result) {
                setAiBriefingData(result);
                // Save to DB for persistence
                await BriefingService.saveBriefing(tripId, city.name, city.country, result);
            }
        } catch (error) {
            console.error('Failed to generate AI briefing:', error);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleRegenerateBriefing = async () => {
        if (!selectedCity || !trip) return;
        setIsLoadingAI(true);
        await generateAndSaveBriefing(trip.id, selectedCity);
    };

    // Select data: AI-generated data (if available) or fallback to mock data
    const data: PreTripBriefingData = useMemo(() => {
        // If we have AI-generated data, use it
        if (aiBriefingData) {
            return aiBriefingData;
        }

        if (!trip) return PORTUGAL_BRIEFING_DATA;

        // Fallback to Portugal mock data if applicable
        const isPortugal = trip.destination.toLowerCase().includes('portugal') ||
            (selectedCity && selectedCity.country.toLowerCase() === 'portugal') ||
            (cities && cities.some(c => c.country.toLowerCase() === 'portugal'));

        const destinationDisplay = selectedCity ? selectedCity.name : (trip.destination || 'Destino');
        const citiesList = cities ? cities.map(c => c.name).join(', ') : '';

        if (isPortugal && selectedCity && selectedCity.country.toLowerCase() === 'portugal') {
            return {
                ...PORTUGAL_BRIEFING_DATA,
                destination: selectedCity.name,
                tripDuration: citiesList,
                season: trip.startDate ? 'Viagem confirmada' : '7 dias',
            };
        }

        // Generic template for other destinations
        return {
            ...GENERIC_BRIEFING_DATA,
            destination: destinationDisplay,
            tripDuration: citiesList,
            season: 'Verifique a estação',
            hookMessage: `Preparativos essenciais para: ${destinationDisplay}`,
            quickFacts: [
                { label: 'FUSO', value: 'Verificar', subValue: 'GMT+?', icon: 'schedule' },
                { label: 'MOEDA', value: 'Local', subValue: 'Cotação?', icon: 'euro', actionLabel: 'Pesquisar' },
                { label: 'IDIOMA', value: 'Inglês/Local', subValue: 'Básico', icon: 'translate' },
                { label: 'TOMADA', value: 'Universal', subValue: 'Levar adaptador', icon: 'power' },
                { label: 'CLIMA', value: 'Variável', subValue: 'Ver previsão', icon: 'thermostat' },
                { label: 'TELEFONE', value: 'Roaming', subValue: 'eSIM recomendado', icon: 'call' },
                { label: 'TRÂNSITO', value: 'Local', subValue: 'Cuidado', icon: 'directions_car' },
                { label: 'ÁGUA', value: 'Pesquisar', subValue: 'Garrafa segura', icon: 'water_drop' }
            ],
        };
    }, [trip, cities, selectedCity, aiBriefingData]);

    const renderActiveSection = () => {
        if (isLoadingAI) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                    <p className="text-sm font-medium">Gerando guia com IA...</p>
                    <p className="text-xs text-gray-400 mt-1">Preparando informações sobre {selectedCity?.name}</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'differences': return <DifferencesSection differences={data.differences} />;
            case 'culture': return <CultureEtiquetteSection culture={data.culture} />;
            case 'entry': return <EntryRequirementsSection entry={data.entry} />;
            case 'money': return <MoneyCostsSection money={data.money} />;
            case 'safety': return <EmergencySafetySection safety={data.safety} />;
            case 'phrases': return <UsefulPhrasesSection categories={data.phrases} />;
            case 'apps': return <AppsResourcesSection apps={data.apps} />;
            case 'weather': return <WeatherSection weather={data.weather} />;
            default: return null;
        }
    };

    const navItems: { id: BriefingTab; label: string; icon: string }[] = [
        { id: 'differences', label: 'Diferenças', icon: 'sync_alt' },
        { id: 'culture', label: 'Cultura', icon: 'theater_comedy' },
        { id: 'entry', label: 'Entrada', icon: 'passport' },
        { id: 'money', label: 'Custos', icon: 'euro' },
        { id: 'safety', label: 'Segurança', icon: 'sos' },
        { id: 'phrases', label: 'Frases', icon: 'translate' },
        { id: 'apps', label: 'Apps', icon: 'smartphone' },
        { id: 'weather', label: 'Clima', icon: 'partly_cloudy_day' },
    ];

    return (
        <div className="w-full mx-auto pb-20 px-4 md:px-6">

            {/* City Filter with AI indicator */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-4">
                <div className="flex items-center gap-3">
                    <CityFilter
                        cities={cities || []}
                        selectedCityId={selectedCity?.id || null}
                        onCityChange={setSelectedCity}
                    />
                    {aiBriefingData && !isLoadingAI && (
                        <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                            <Sparkles className="w-3 h-3" />
                            <span>IA</span>
                        </div>
                    )}
                </div>

                {/* Update Information Button */}
                {selectedCity && (
                    <button
                        onClick={handleRegenerateBriefing}
                        disabled={isLoadingAI}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                            ${isLoadingAI
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                            }`}
                    >
                        <span className={`material-symbols-outlined text-sm ${isLoadingAI ? 'animate-spin' : ''}`}>
                            refresh
                        </span>
                        {isLoadingAI ? 'Atualizando...' : 'Atualizar Informações'}
                    </button>
                )}
            </div>

            {/* Active Alerts (City/Country Specific) */}
            {data && trip && (
                <ActiveAlertsBox
                    data={data}
                    trip={trip}
                    city={selectedCity}
                />
            )}

            {/* Critical Alerts (Task Based) */}
            {trip && (
                <div className="mb-6">
                    <CriticalAlerts tasks={enrichedTasks} tripId={trip.id} />
                </div>
            )}

            {/* Quick Facts Grid */}
            <div className="mb-6">
                <QuickFactsGrid facts={data.quickFacts} />
            </div>

            {/* Horizontal Navigation Bar */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 mb-8 -mx-4 md:-mx-6 px-4 md:px-6 py-2 shadow-sm">
                <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            disabled={isLoadingAI}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${activeTab === item.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                } ${isLoadingAI ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className={`material-symbols-outlined text-lg ${activeTab === item.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[400px] animate-fadeIn">
                {renderActiveSection()}
            </div>

            {/* Footer Actions */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-4">
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined">share</span>
                    Compartilhar
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg">
                    <span className="material-symbols-outlined">download</span>
                    Baixar Guia Offline
                </button>
            </div>

        </div>
    );
};

export default PreTripBriefingView;
