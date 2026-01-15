import React, { useState, useEffect } from 'react';
import { DailyMagazineSpread, TripMagazine } from '../../../types/magazine';
import { Trip, ItineraryActivity, City } from '../../../types';
import { generateFullMagazine, TripContextForMagazine } from '../../../services/magazineItineraryService';
import DaySpread from './DaySpread';
import { Skeleton } from '../../ui/Base';

interface MagazineViewProps {
    trip: Trip;
    cities: City[];
    itineraryActivities: ItineraryActivity[];
    travelerProfile?: string;
    interests?: string[];
}

/**
 * MagazineView - Container for the magazine-style itinerary view.
 * Displays trip days as editorial "magazine spreads".
 */
const MagazineView: React.FC<MagazineViewProps> = ({
    trip,
    cities,
    itineraryActivities,
    travelerProfile,
    interests,
}) => {
    const [magazine, setMagazine] = useState<TripMagazine | null>(null);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Generate magazine on mount
    useEffect(() => {
        const generateMagazine = async () => {
            if (!trip || itineraryActivities.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const context: TripContextForMagazine = {
                    trip,
                    cities,
                    itineraryActivities,
                    travelerProfile,
                    interests,
                };

                const result = await generateFullMagazine(context);
                setMagazine(result);
            } catch (err) {
                console.error('Failed to generate magazine:', err);
                setError('Não foi possível gerar a visualização em revista.');
            } finally {
                setIsLoading(false);
            }
        };

        generateMagazine();
    }, [trip, cities, itineraryActivities, travelerProfile, interests]);

    // Navigation handlers
    const goToPreviousDay = () => {
        if (currentDayIndex > 0) {
            setCurrentDayIndex(currentDayIndex - 1);
        }
    };

    const goToNextDay = () => {
        if (magazine && currentDayIndex < magazine.days.length - 1) {
            setCurrentDayIndex(currentDayIndex + 1);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="animate-in fade-in duration-300 space-y-6 pb-20">
                {/* Hero Skeleton */}
                <div className="relative rounded-2xl overflow-hidden">
                    <Skeleton height={320} className="w-full rounded-2xl" />
                </div>

                {/* Content Skeleton */}
                <div className="space-y-4">
                    <Skeleton width="60%" height={32} className="rounded-lg" />
                    <Skeleton width="40%" height={20} className="rounded-lg" />
                    <div className="mt-6 space-y-3">
                        <Skeleton height={80} className="rounded-xl" />
                        <Skeleton height={80} className="rounded-xl" />
                        <Skeleton height={80} className="rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">error</span>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Ops! Algo deu errado</h3>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    // Empty state
    if (!magazine || magazine.days.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">auto_stories</span>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum roteiro disponível</h3>
                <p className="text-sm text-gray-500">
                    Adicione atividades ao seu roteiro para visualizar como uma revista.
                </p>
            </div>
        );
    }

    const currentDay = magazine.days[currentDayIndex];
    const totalDays = magazine.days.length;

    // Refresh handler
    const handleRefresh = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const context: TripContextForMagazine = {
                trip,
                cities,
                itineraryActivities,
                travelerProfile,
                interests,
            };

            // Force regeneration (skip cache)
            const result = await generateFullMagazine(context);
            setMagazine(result);
        } catch (err) {
            console.error('Failed to refresh magazine:', err);
            setError('Não foi possível atualizar a revista.');
        } finally {
            setIsLoading(false);
        }
    };

    // Export placeholder
    const handleExport = async () => {
        alert('Exportação em PDF em breve! 📄');
        // TODO: Implement PDF export with jsPDF or similar
    };

    return (
        <div className="animate-in fade-in duration-300 pb-20">
            {/* Magazine Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">auto_stories</span>
                        Sua Revista de Viagem
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {magazine.destination} • {totalDays} dias de aventura
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                        title="Regenerar conteúdo editorial"
                    >
                        <span className={`material-symbols-outlined text-base ${isLoading ? 'animate-spin' : ''}`}>
                            refresh
                        </span>
                        <span className="hidden sm:inline">Atualizar</span>
                    </button>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
                        title="Exportar como PDF"
                    >
                        <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                        <span className="hidden sm:inline">Exportar</span>
                    </button>

                    {/* Day Indicator Dots */}
                    <div className="flex items-center gap-1.5 ml-4">
                        {magazine.days.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentDayIndex(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentDayIndex
                                    ? 'bg-primary scale-125'
                                    : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                aria-label={`Dia ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Current Day Spread */}
            <DaySpread spread={currentDay} />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                    onClick={goToPreviousDay}
                    disabled={currentDayIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${currentDayIndex === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                    Dia Anterior
                </button>

                <span className="text-sm font-medium text-gray-500">
                    Dia {currentDayIndex + 1} de {totalDays}
                </span>

                <button
                    onClick={goToNextDay}
                    disabled={currentDayIndex === totalDays - 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${currentDayIndex === totalDays - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    Próximo Dia
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
            </div>
        </div>
    );
};

export default MagazineView;
