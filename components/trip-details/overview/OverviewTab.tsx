import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { Trip, Expense, City, HotelReservation, Transport, TaskItem, LuggageItem, ItineraryActivity } from '../../../types';
import { Card, Button, Skeleton, SkeletonText } from '../../ui/Base';
import AnimatedItineraryMap, { ItineraryStop } from '../itinerary/AnimatedItineraryMap';
import TravelCoverage from '../dashboard/TravelCoverage';
import { getGeminiService } from '../../../services/geminiService';
import { useTrips } from '../../../contexts/TripContext';
import { EmptyState } from '../../ui/EmptyState';
import { YouTubeVideo } from '../../../types';
import { VideoGallery } from './VideoGallery';
import useImageGeneration from '../../../hooks/useImageGeneration';
import ActivityDetailsModal from '../modals/ActivityDetailsModal';
import SmartChecklist from '../SmartChecklist';
import {
    CountdownWidget,
    BudgetWidget,
    CitiesWidget,
    TransportsWidget,
    TimelineWidget,
    WeatherWidget
} from './widgets';

// Helper for activity labels
const getActivityTypeLabel = (type: string) => {
    const config: Record<string, string> = {
        transport: 'Transporte',
        accommodation: 'Acomodação',
        meal: 'Refeição',
        food: 'Gastronomia',
        sightseeing: 'Passeio',
        culture: 'Cultura',
        nature: 'Natureza',
        shopping: 'Compras',
        nightlife: 'Vida Noturna',
        other: 'Outro',
    };
    return config[type] || 'Atividade';
};

// =============================================================================
// Types & Interfaces
// =============================================================================

interface OverviewTabProps {
    trip: Trip;
    expenses: Expense[];
    cities: City[];
    hotels: HotelReservation[];
    transports: Transport[];
    activities?: ItineraryActivity[];
    totalBudget: number;
    onInvite?: () => void;
    onCityClick?: (city: City) => void;
    onAddCity?: () => void;
    onUpdateCity?: (updatedCity: City) => void;
    onDeleteCity?: (city: City) => void;
    onTabChange?: (tab: any) => void;
    isLoading?: boolean;
}

interface WidgetProps {
    icon: string;
    iconBg: string;
    label: string;
    value: string;
    subtext?: string;
}

// TaskItem and CriticalTask interfaces removed as they are now imported/handled by types.ts
// adapting to use importing types

interface CriticalTask {
    id: string;
    text: string;
    deadline: string;
    completed: boolean;
    category: 'visa' | 'booking' | 'health' | 'insurance' | 'other';
}

interface TripHighlight {
    id: string;
    title: string;
    description: string;
    image: string;
    icon: string;
}

interface TripAlert {
    id: string;
    type: 'warning' | 'info' | 'danger';
    title: string;
    message: string;
    icon: string;
}

interface TimelineStop {
    city: string;
    dates: string;
    nights: number;
    image: string;
    isActive?: boolean;
}

// =============================================================================
// Constants
// =============================================================================




const PREPARATION_ITEMS = [
    { label: 'Voos', icon: 'flight', key: 'flights' },
    { label: 'Hotéis', icon: 'hotel', key: 'hotels' },
    { label: 'Transporte', icon: 'directions_car', key: 'transport' },
    { label: 'Documentos', icon: 'description', key: 'documents' },
];

const calculateDaysUntilTrip = (startDate: string): { value: number; label: string; isOngoing: boolean } => {
    const start = new Date(startDate.split('/').reverse().join('-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { value: Math.abs(diffDays), label: 'dias atrás', isOngoing: true };
    } else if (diffDays === 0) {
        return { value: 0, label: 'Hoje!', isOngoing: true };
    } else if (diffDays === 1) {
        return { value: 1, label: 'dia restante', isOngoing: false };
    }
    return { value: diffDays, label: 'dias restantes', isOngoing: false };
};

const formatCurrency = (value: number): string =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// =============================================================================
// Sub-Components: Widgets
// =============================================================================

const StatusWidget: React.FC<WidgetProps> = ({ icon, iconBg, label, value, subtext }) => (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 shadow-soft border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-4 hover:shadow-md transition-all">
        <div className={`size-14 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="min-w-0">
            <p className="text-xs text-text-muted dark:text-gray-400 uppercase font-bold tracking-wider">{label}</p>
            <p className="text-xl font-black text-text-main dark:text-white truncate">{value}</p>
            {subtext && <p className="text-xs text-text-muted dark:text-gray-400 truncate">{subtext}</p>}
        </div>
    </div>
);

// Old inline widgets removed - now using modular widgets from ./widgets/



// =============================================================================
// Sub-Components: Main Column
// =============================================================================
interface MacroTimelineProps {
    cities: City[];
    onCityClick?: (city: City) => void;
    onAddCity?: () => void;
    onUpdateCity?: (updatedCity: City) => void;
    onTabChange?: (tab: any) => void;
}

const NextStepCard: React.FC<{
    transports: Transport[];
    hotels: HotelReservation[];
    activities?: ItineraryActivity[];
    onTabChange?: (tab: any) => void;
    onViewDetails?: (activity: ItineraryActivity) => void;
}> = ({ transports, hotels, activities = [], onTabChange, onViewDetails }) => {
    // Find the next upcoming event
    const nextFlight = transports.find(t => t.type === 'flight');
    const nextHotel = hotels[0];

    // Find next activity (that is not completed)
    const nextActivity = activities.filter(a => !a.completed).sort((a, b) => {
        // Sort by date then time
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    })[0];

    const events: { type: 'flight' | 'hotel' | 'activity', data: any, dateStr: string, timeStr?: string }[] = [];

    if (nextFlight) events.push({ type: 'flight', data: nextFlight, dateStr: nextFlight.departureDate, timeStr: nextFlight.departureTime });
    if (nextHotel) events.push({ type: 'hotel', data: nextHotel, dateStr: nextHotel.checkIn, timeStr: nextHotel.checkInTime });
    if (nextActivity) events.push({ type: 'activity', data: nextActivity, dateStr: nextActivity.date, timeStr: nextActivity.time });

    // Sort all events by date
    events.sort((a, b) => {
        if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
        return (a.timeStr || '').localeCompare(b.timeStr || '');
    });

    const priorityEvent = events[0];

    const handleViewItinerary = () => {
        if (onTabChange) {
            onTabChange('itinerary');
        }
    };

    // Default state if nothing found
    if (!priorityEvent) {
        return (
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined text-6xl text-gray-400">explore</span>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-500">explore</span> Sem Atividades
                        </h3>
                    </div>
                    <p className="font-bold text-sm text-text-main mb-1">Comece a planejar</p>
                    <p className="text-xs text-text-muted line-clamp-2">Adicione voos, hotéis ou atividades para ver seu próximo passo aqui.</p>
                </div>
            </div>
        );
    }

    // Determine content based on event type
    let title = '';
    let subtext = '';
    let icon = '';
    let mainActionText = '';
    let topActionText = '';
    let onMainAction = () => { };
    let onTopAction = () => { };

    if (priorityEvent.type === 'activity') {
        const act = priorityEvent.data as ItineraryActivity;
        title = act.title;
        subtext = `${new Date(act.date).toLocaleDateString('pt-BR')} às ${act.time} - ${act.location || 'Local a definir'}`;
        icon = act.type === 'food' ? 'restaurant' : act.type === 'sightseeing' ? 'attractions' : 'event';

        // USER REQUEST: Swap "Confirmed" (Badge) with "Ver Roteiro" (Action)
        // Top right action: Ver Roteiro
        topActionText = 'Ver Roteiro';
        onTopAction = handleViewItinerary;

        // Main action (bottom): "Ver Detalhes" opens the modal
        mainActionText = 'Ver Detalhes';
        onMainAction = () => {
            if (onViewDetails) {
                onViewDetails(act);
            } else {
                handleViewItinerary();
            }
        };

    } else if (priorityEvent.type === 'flight') {
        const flight = priorityEvent.data as Transport;
        title = `Voo ${flight.reference || ''}`;
        subtext = `${flight.departureDate} às ${flight.departureTime?.slice(0, 5)} - ${flight.departureLocation} → ${flight.arrivalLocation}`;
        icon = 'flight';
        topActionText = 'Viajando';
        mainActionText = 'Ver Passagens';
        onMainAction = () => {
            if (onTabChange) onTabChange('transport');
        };
    } else {
        const hotel = priorityEvent.data as HotelReservation;
        title = hotel.name;
        subtext = `Check-in: ${hotel.checkIn} às ${hotel.checkInTime}`;
        icon = 'hotel';
        topActionText = 'Hospedagem';
        mainActionText = 'Ver Reserva';
        onMainAction = () => {
            if (onTabChange) onTabChange('accommodation'); // Navigate to accommodation
        };
    }

    return (
        <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer" onClick={onMainAction}>
            {/* Decorator */}
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                <span className="material-symbols-outlined text-[100px] text-indigo-600">{icon}</span>
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">{icon}</span> Próxima Atividade
                    </h3>

                    {/* Top Right Action / Badge */}
                    {topActionText && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTopAction();
                            }}
                            className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-sm transition-colors ${topActionText === 'Ver Roteiro'
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                                : 'bg-white text-indigo-600 cursor-default'
                                }`}
                        >
                            {topActionText}
                        </button>
                    )}
                </div>

                <div className="mb-4">
                    <h4 className="font-bold text-lg text-text-main mb-1 line-clamp-1">{title}</h4>
                    <p className="text-xs text-text-muted line-clamp-2">{subtext}</p>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMainAction();
                    }}
                    className="w-full py-2 bg-white rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm"
                >
                    {mainActionText}
                </button>
            </div>
        </div>
    );
};


interface MacroTimelineProps {
    cities: City[];
    onCityClick?: (city: City) => void;
    onAddCity?: () => void;
    onUpdateCity?: (city: City) => void;
    onDeleteCity?: (city: City) => void;
}

const MacroTimeline: React.FC<MacroTimelineProps> = ({ cities, onCityClick, onAddCity, onUpdateCity, onDeleteCity }) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const { generateImage, isGenerating, isUploading } = useImageGeneration();
    const [generatingCityId, setGeneratingCityId] = React.useState<string | null>(null);

    // Sort cities by arrival date
    const sortedCities = useMemo(() => {
        return [...cities].sort((a, b) => {
            const dateA = new Date(a.arrivalDate.split('/').reverse().join('-'));
            const dateB = new Date(b.arrivalDate.split('/').reverse().join('-'));
            return dateA.getTime() - dateB.getTime();
        });
    }, [cities]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleGenerateImage = async (city: City, e: React.MouseEvent) => {
        e.stopPropagation();
        if (generatingCityId) return;

        setGeneratingCityId(city.id);

        try {
            const prompt = `Cinematic travel photography of ${city.name}, ${city.country}, iconic landmarks, high resolution, 4k, golden hour, photorealistic`;
            // Use wide aspect ratio for better fit in the card
            const result = await generateImage(prompt, { aspectRatio: '3:4' }, true, `cities/${city.id}-${Date.now()}.png`);

            if (result && result.url && onUpdateCity) {
                onUpdateCity({
                    ...city,
                    image: result.url
                });
            }
        } catch (error) {
            console.error("Failed to generate city image", error);
        } finally {
            setGeneratingCityId(null);
        }
    };

    if (sortedCities.length === 0) {
        return (
            <Card className="p-6">
                <h4 className="font-bold text-lg text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">timeline</span>
                    Linha do Tempo
                </h4>
                <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">add_location</span>
                    <p className="text-text-muted">Adicione cidades para ver sua linha do tempo</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-primary/20 rounded-full">
                    Linha do Tempo
                </span>
                <div className="flex items-center gap-2">
                    {/* Navigation Arrows */}
                    <button
                        onClick={() => scroll('left')}
                        className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                        title="Anterior"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                        title="Próximo"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                    {/* Add City Button */}
                    <button
                        onClick={onAddCity}
                        className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                        title="Adicionar Cidade"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                </div>
            </div>
            <div className="relative -mx-5">
                <div
                    ref={scrollContainerRef}
                    className="flex items-start gap-4 overflow-x-auto pb-4 px-5 hide-scrollbar scroll-smooth"
                >
                    {sortedCities.map((city, index) => (
                        <React.Fragment key={city.id}>
                            <div
                                className="flex flex-col items-center w-[180px] shrink-0 cursor-pointer group"
                                onClick={() => onCityClick?.(city)}
                            >
                                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-0 shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 bg-gray-100">
                                    <img
                                        src={city.image}
                                        alt={city.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />

                                    {/* AI Generation Overlay */}
                                    {generatingCityId === city.id && (
                                        <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center gap-2 text-white">
                                            <div className="size-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="text-xs font-bold animate-pulse">Criando Arte...</span>
                                        </div>
                                    )}

                                    {/* AI Generate Button - Visible on Hover */}
                                    {!generatingCityId && onUpdateCity && (
                                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                                            <button
                                                onClick={(e) => handleGenerateImage(city, e)}
                                                className="p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-primary shadow-lg translate-y-2 group-hover:translate-y-0"
                                                title="Gerar nova capa com IA"
                                            >
                                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Tem certeza que deseja excluir ${city.name} do seu roteiro?`)) {
                                                        onDeleteCity?.(city);
                                                    }
                                                }}
                                                className="p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-lg translate-y-2 group-hover:translate-y-0 delay-75"
                                                title="Excluir cidade"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                                        <p className="text-white font-bold text-base leading-tight drop-shadow-md mb-0.5">{city.name}</p>
                                        <div className="flex flex-col gap-0.5 text-[10px] sm:text-[11px] text-gray-200 font-medium opacity-90">
                                            <span>
                                                {(() => {
                                                    const parseLocalDate = (dateStr: string) => {
                                                        if (!dateStr) return null;
                                                        if (dateStr.includes('-') && dateStr.length === 10) {
                                                            const [year, month, day] = dateStr.split('-').map(Number);
                                                            return new Date(year, month - 1, day);
                                                        }
                                                        if (dateStr.includes('/')) {
                                                            const [day, month, year] = dateStr.split('/').map(Number);
                                                            return new Date(year, month - 1, day);
                                                        }
                                                        return new Date(dateStr);
                                                    };
                                                    const arrival = parseLocalDate(city.arrivalDate);
                                                    const departure = parseLocalDate(city.departureDate);
                                                    const formatDate = (d: Date | null) => d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
                                                    return `${formatDate(arrival)} - ${formatDate(departure)}`;
                                                })()}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                                <span>{city.nights} noites</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {index < cities.length - 1 && (
                                <div className="flex items-center shrink-0 self-center mt-[-20px]">
                                    <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </Card>
    );
};

// AI-powered Travel Alerts Component
const CityAlertsBox: React.FC<{ cities: City[]; tripStartDate: string }> = ({ cities, tripStartDate }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [alerts, setAlerts] = React.useState<{
        id: string;
        type: 'warning' | 'info' | 'danger';
        title: string;
        message: string;
        icon: string;
        city?: string;
        details?: string;
        isExpanded?: boolean;
        isLoadingDetails?: boolean;
    }[]>([]);

    // Generate mock alerts based on cities (in production, this would call Gemini API)
    React.useEffect(() => {
        if (cities.length === 0) {
            setAlerts([]);
            return;
        }

        setIsLoading(true);

        const fetchAlerts = async () => {
            try {
                const geminiService = getGeminiService();
                const citiesData = cities.map(c => ({ name: c.name, country: c.country }));
                const generatedAlerts = await geminiService.generateTripAlerts(citiesData);

                if (generatedAlerts && generatedAlerts.length > 0) {
                    setAlerts(generatedAlerts.map(alert => ({
                        ...alert,
                        city: alert.cities?.join(', '),
                    })));
                } else {
                    setAlerts([]);
                }
            } catch (error) {
                console.error('Error generating trip alerts:', error);
                setAlerts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlerts();
    }, [cities]);

    const generateMoreDetails = async (alertId: string) => {
        const targetAlert = alerts.find(a => a.id === alertId);
        if (!targetAlert) return;

        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, isLoadingDetails: true } : a
        ));

        try {
            const geminiService = getGeminiService();
            const details = await geminiService.generateAlertDetails(
                targetAlert.title,
                targetAlert.message,
                targetAlert.city
            );

            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, details, isExpanded: true, isLoadingDetails: false } : a
            ));
        } catch (error) {
            console.error('Error generating details:', error);
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, isLoadingDetails: false } : a
            ));
        }
    };

    const toggleExpand = (alertId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, isExpanded: !a.isExpanded } : a
        ));
    };

    const getAlertStyle = (type: 'warning' | 'info' | 'danger') => {
        switch (type) {
            case 'danger':
                return 'bg-red-50 border-l-red-500 text-red-800';
            case 'warning':
                return 'bg-amber-50 border-l-amber-500 text-amber-800';
            case 'info':
            default:
                return 'bg-blue-50 border-l-blue-500 text-blue-800';
        }
    };

    const getIconBg = (type: 'warning' | 'info' | 'danger') => {
        switch (type) {
            case 'danger':
                return 'bg-red-100 text-red-600';
            case 'warning':
                return 'bg-amber-100 text-amber-600';
            case 'info':
            default:
                return 'bg-blue-100 text-blue-600';
        }
    };

    if (cities.length === 0 || (!isLoading && alerts.length === 0)) return null;

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-primary/30 rounded-full">
                    Alertas & Avisos IA
                </span>
                <div className="flex items-center gap-1 text-xs text-text-muted">
                    <span className="material-symbols-outlined text-sm text-primary">smart_toy</span>
                    Assistente de Viagem
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-text-muted">Analisando destinos...</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <div
                            key={alert.id}
                            className="bg-gray-50 rounded-xl overflow-hidden transition-all"
                        >
                            <div className="flex items-start gap-3 p-3 hover:bg-gray-100 transition-colors">
                                <div className={`size-10 rounded-xl ${getIconBg(alert.type)} flex items-center justify-center shrink-0`}>
                                    <span className="material-symbols-outlined text-xl">
                                        {alert.icon}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 py-0.5">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h5 className="font-semibold text-sm text-text-main">{alert.title}</h5>
                                        {alert.city && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                                {alert.city}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-muted leading-relaxed">{alert.message}</p>


                                </div>

                                {/* AI Info Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        alert.details ? toggleExpand(alert.id) : generateMoreDetails(alert.id);
                                    }}
                                    disabled={alert.isLoadingDetails}
                                    className={`p-2 rounded-lg transition-all shrink-0 ${alert.isExpanded
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted hover:text-primary hover:bg-primary/10'
                                        }`}
                                    title="Gerar explicação detalhada com IA"
                                >
                                    {alert.isLoadingDetails ? (
                                        <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">
                                            {alert.isExpanded ? 'expand_less' : 'auto_awesome'}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Expanded Details */}
                            {alert.isExpanded && alert.details && (
                                <div className="px-4 pb-4 ml-12">
                                    <div className="p-3 bg-white rounded-lg border border-gray-100 text-xs text-text-main leading-relaxed whitespace-pre-line">
                                        {alert.details.split('\n').map((line, i) => (
                                            <p key={i} className={line.startsWith('**') ? 'font-bold mb-2' : 'mb-1'}>
                                                {line.replace(/\*\*/g, '')}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const TripSummaryCard: React.FC<{ trip: Trip; cities: City[] }> = ({ trip, cities }) => {
    const totalNights = cities.reduce((sum, c) => sum + c.nights, 0);

    return (
        <Card className="p-5 h-full">
            <span className="inline-block px-3 py-1.5 mb-4 text-xs font-bold text-text-main bg-primary/30 rounded-full">
                Resumo
            </span>

            <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-black text-text-main">{cities.length}</p>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wide">Cidades</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-black text-text-main">{totalNights}</p>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wide">Noites</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-black text-text-main">{trip.participants?.length || 1}</p>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wide">Viajantes</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-black text-text-main">0</p>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wide">Fotos</p>
                </div>
            </div>
        </Card>
    );
};

// =============================================================================
// NEW: Executive Dashboard Components
// =============================================================================

const PlanningStatusWidget: React.FC<{ hotels: HotelReservation[]; transports: Transport[]; cities: City[]; totalBudget: number; spent: number }> = ({ hotels, transports, cities, totalBudget, spent }) => {
    const hasFlights = transports.some(t => t.type === 'flight');
    const hotelsBooked = hotels.length;
    const totalCities = cities.length || 1;
    const budgetPercentage = Math.min(Math.round((spent / totalBudget) * 100), 100);

    const dimensions = [
        {
            label: 'Voos',
            icon: 'flight',
            status: hasFlights ? 'confirmed' : 'pending',
            detail: hasFlights ? 'Confirmado' : 'Pendente',
            color: hasFlights ? 'emerald' : 'amber'
        },
        {
            label: 'Hotéis',
            icon: 'hotel',
            status: hotelsBooked > 0 ? 'partial' : 'pending',
            detail: `${hotelsBooked} de ${totalCities} cidades`,
            color: hotelsBooked >= totalCities ? 'emerald' : hotelsBooked > 0 ? 'blue' : 'amber'
        },
        {
            label: 'Documentação',
            icon: 'description',
            status: 'partial',
            detail: 'Passaporte ok, visto pendente',
            color: 'blue'
        },
        {
            label: 'Orçamento',
            icon: 'payments',
            status: budgetPercentage >= 80 ? 'confirmed' : 'partial',
            detail: `${budgetPercentage}% alocado`,
            color: budgetPercentage >= 80 ? 'emerald' : 'blue'
        },
    ];

    const confirmedCount = dimensions.filter(d => d.status === 'confirmed').length;
    const overallPercentage = Math.round(((confirmedCount + dimensions.filter(d => d.status === 'partial').length * 0.5) / dimensions.length) * 100);

    return (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/20 border-primary/20">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">checklist</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-text-main dark:text-white">Status do Planejamento</h4>
                        <p className="text-sm text-text-muted dark:text-gray-400">Planejamento {overallPercentage}% completo</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${overallPercentage}%` }}
                        />
                    </div>
                    <span className="text-sm font-bold text-primary">{overallPercentage}%</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dimensions.map((dim, i) => (
                    <div
                        key={i}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 transition-all hover:shadow-md ${dim.color === 'emerald' ? 'border-l-emerald-500' :
                            dim.color === 'blue' ? 'border-l-blue-500' :
                                'border-l-amber-500'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`material-symbols-outlined text-lg ${dim.color === 'emerald' ? 'text-emerald-500' :
                                dim.color === 'blue' ? 'text-blue-500' :
                                    'text-amber-500'
                                }`}>{dim.icon}</span>
                            <span className="font-bold text-sm text-text-main dark:text-white">{dim.label}</span>
                        </div>
                        <p className={`text-xs font-medium ${dim.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                            dim.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                'text-amber-600 dark:text-amber-400'
                            }`}>
                            {dim.detail}
                        </p>
                    </div>
                ))}
            </div>
        </Card>
    );
};



// =============================================================================
// Luggage Checklist Component
// =============================================================================

// LuggageItem interface removed as it is now imported from types.ts

const LuggageChecklist: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { updateTrip } = useTrips();
    const [items, setItems] = React.useState<LuggageItem[]>(trip.luggage || []);

    const SUGGESTED_ITEMS: LuggageItem[] = [
        { id: 's1', text: 'Passaporte', packed: false, category: 'documents' },
        { id: 's2', text: 'RG / CNH', packed: false, category: 'documents' },
        { id: 's3', text: 'Cartão de crédito', packed: false, category: 'documents' },
        { id: 's4', text: 'Seguro viagem', packed: false, category: 'documents' },
        { id: 's5', text: 'Carregador de celular', packed: false, category: 'electronics' },
        { id: 's6', text: 'Adaptador de tomada', packed: false, category: 'electronics' },
        { id: 's7', text: 'Escova de dente', packed: false, category: 'hygiene' },
        { id: 's8', text: 'Protetor solar', packed: false, category: 'hygiene' },
        { id: 's9', text: 'Calçados confortáveis', packed: false, category: 'clothes' },
        { id: 's10', text: 'Medicamentos pessoais', packed: false, category: 'hygiene' },
    ];

    const loadSuggestions = () => {
        const timestamp = Date.now();
        const newItems = SUGGESTED_ITEMS.map((item, idx) => ({
            ...item,
            id: `suggestion-${timestamp}-${idx}`
        }));
        setItems(prev => [...prev, ...newItems]);
    };

    // Persist luggage on change
    useEffect(() => {
        if (JSON.stringify(items) !== JSON.stringify(trip.luggage)) {
            const timer = setTimeout(() => {
                updateTrip({ ...trip, luggage: items });
            }, 1000); // Debounce
            return () => clearTimeout(timer);
        }
    }, [items, trip, updateTrip]);
    const [showAddInput, setShowAddInput] = React.useState(false);
    const [newItemText, setNewItemText] = React.useState('');
    const [newItemCategory, setNewItemCategory] = React.useState<LuggageItem['category']>('other');
    const [activeCategory, setActiveCategory] = React.useState<LuggageItem['category'] | 'all'>('all');
    const [showImportInput, setShowImportInput] = React.useState(false);
    const [importText, setImportText] = React.useState('');

    const toggleItem = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, packed: !item.packed } : item
        ));
    };

    const importList = () => {
        if (!importText.trim()) return;

        const lines = importText.split('\n').filter(line => line.trim());
        const newItems: LuggageItem[] = lines.map((line, index) => ({
            id: `luggage-import-${Date.now()}-${index}`,
            text: line.trim(),
            packed: false,
            category: newItemCategory
        }));

        setItems(prev => [...prev, ...newItems]);
        setImportText('');
        setShowImportInput(false);
    };

    const deleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const clearCompleted = () => {
        setItems(prev => prev.filter(item => !item.packed));
    };

    const clearAll = () => {
        setItems([]);
    };

    const addItem = () => {
        if (!newItemText.trim()) return;

        const newItem: LuggageItem = {
            id: `luggage-${Date.now()}`,
            text: newItemText.trim(),
            packed: false,
            category: newItemCategory
        };

        setItems(prev => [...prev, newItem]);
        setNewItemText('');
        setShowAddInput(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') addItem();
        if (e.key === 'Escape') {
            setShowAddInput(false);
            setNewItemText('');
        }
    };

    const getCategoryIcon = (category: LuggageItem['category']) => {
        switch (category) {
            case 'documents': return 'description';
            case 'clothes': return 'checkroom';
            case 'hygiene': return 'spa';
            case 'electronics': return 'devices';
            default: return 'inventory_2';
        }
    };

    const getCategoryColor = (category: LuggageItem['category']) => {
        switch (category) {
            case 'documents': return 'bg-blue-100 text-blue-600';
            case 'clothes': return 'bg-purple-100 text-purple-600';
            case 'hygiene': return 'bg-pink-100 text-pink-600';
            case 'electronics': return 'bg-amber-100 text-amber-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const categories = [
        { id: 'all' as const, label: 'Todos', icon: 'list' },
        { id: 'documents' as const, label: 'Docs', icon: 'description' },
        { id: 'clothes' as const, label: 'Roupas', icon: 'checkroom' },
        { id: 'hygiene' as const, label: 'Higiene', icon: 'spa' },
        { id: 'electronics' as const, label: 'Eletr.', icon: 'devices' },
        { id: 'other' as const, label: 'Outros', icon: 'inventory_2' },
    ];

    const filteredItems = activeCategory === 'all'
        ? items
        : items.filter(item => item.category === activeCategory);

    const packedCount = items.filter(i => i.packed).length;
    const totalCount = items.length;
    const progressPercentage = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-primary/30 rounded-full">
                    Checklist da Bagagem
                </span>
                <span className="text-xs text-text-muted">
                    {packedCount}/{totalCount} itens
                </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text-muted">Progresso</span>
                    <span className={`text-xs font-bold ${progressPercentage === 100 ? 'text-emerald-600' : 'text-primary'}`}>
                        {progressPercentage}%
                    </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${progressPercentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-blue-500'}`}
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${activeCategory === cat.id
                            ? 'bg-text-main text-white'
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Items List */}
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                        <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-3xl text-gray-300">inventory_2</span>
                        </div>
                        <h5 className="font-bold text-sm text-text-main mb-1">Lista de bagagem vazia</h5>
                        <p className="text-xs text-text-muted mb-4 max-w-[200px]">Adicione itens que você precisa levar ou carregue sugestões comuns.</p>
                        <button
                            onClick={loadSuggestions}
                            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">magic_button</span>
                            Carregar Sugestões
                        </button>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <div
                            key={item.id}
                            className={`group/item flex items-center gap-2 p-2.5 rounded-xl border transition-all hover:shadow-sm ${item.packed
                                ? 'bg-emerald-50/50 border-emerald-200 opacity-70'
                                : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <div
                                onClick={() => toggleItem(item.id)}
                                className={`size-6 rounded-md flex items-center justify-center shrink-0 cursor-pointer ${getCategoryColor(item.category)}`}
                            >
                                <span className="material-symbols-outlined text-xs">{getCategoryIcon(item.category)}</span>
                            </div>
                            <span
                                onClick={() => toggleItem(item.id)}
                                className={`flex-1 text-xs font-medium text-text-main cursor-pointer ${item.packed ? 'line-through text-text-muted' : ''}`}
                            >
                                {item.text}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteItem(item.id);
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 p-1 text-text-muted hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                                    title="Excluir item"
                                >
                                    <span className="material-symbols-outlined text-xs">delete</span>
                                </button>
                                <div
                                    onClick={() => toggleItem(item.id)}
                                    className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${item.packed
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-gray-300 hover:border-primary'
                                        }`}
                                >
                                    {item.packed && <span className="material-symbols-outlined text-white text-[8px]">check</span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Item Input */}
            {showAddInput && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5 mb-2">
                        <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Nome do item..."
                            className="flex-1 min-w-0 text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                            autoFocus
                        />
                        <button
                            onClick={() => { setShowAddInput(false); setNewItemText(''); }}
                            className="p-1 text-text-muted hover:text-text-main transition-colors shrink-0"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <select
                            value={newItemCategory}
                            onChange={(e) => setNewItemCategory(e.target.value as LuggageItem['category'])}
                            className="text-[10px] bg-white border border-gray-200 rounded-md px-1.5 py-1 text-text-main focus:outline-none focus:border-primary"
                        >
                            <option value="documents">Docs</option>
                            <option value="clothes">Roupas</option>
                            <option value="hygiene">Higiene</option>
                            <option value="electronics">Eletr.</option>
                            <option value="other">Outros</option>
                        </select>
                        <button
                            onClick={addItem}
                            disabled={!newItemText.trim()}
                            className="ml-auto px-2 py-1 text-[10px] font-semibold bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            )}

            {/* Add Item Button */}
            {!showAddInput && !showImportInput && (
                <div className="flex flex-col gap-2 mt-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddInput(true)}
                            className="flex-1 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Adicionar Item
                        </button>
                        <button
                            onClick={() => setShowImportInput(true)}
                            className="px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center"
                            title="Importar Lista"
                        >
                            <span className="material-symbols-outlined text-lg">format_list_bulleted_add</span>
                        </button>
                    </div>

                    {/* Clear Options */}
                    {items.length > 0 && (
                        <div className="flex gap-2 justify-end">
                            {packedCount > 0 && (
                                <button
                                    onClick={clearCompleted}
                                    className="text-[10px] text-text-muted hover:text-rose-500 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50"
                                >
                                    <span className="material-symbols-outlined text-sm">remove_done</span>
                                    Limpar Concluídos
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (window.confirm('Tem certeza que deseja limpar toda a lista?')) {
                                        clearAll();
                                    }
                                }}
                                className="text-[10px] text-text-muted hover:text-rose-500 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50"
                            >
                                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                Limpar Tudo
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Import List Input */}
            {showImportInput && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-text-main">Importar Lista de Itens</span>
                        <button
                            onClick={() => { setShowImportInput(false); setImportText(''); }}
                            className="p-1 text-text-muted hover:text-text-main transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                    <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Cole sua lista aqui (um item por linha)..."
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary min-h-[100px] mb-2 resize-y"
                    />
                    <div className="flex items-center gap-2 justify-end">
                        <select
                            value={newItemCategory}
                            onChange={(e) => setNewItemCategory(e.target.value as LuggageItem['category'])}
                            className="text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-text-main focus:outline-none focus:border-primary"
                        >
                            <option value="documents">Docs</option>
                            <option value="clothes">Roupas</option>
                            <option value="hygiene">Higiene</option>
                            <option value="electronics">Eletr.</option>
                            <option value="other">Outros</option>
                        </select>
                        <button
                            onClick={importList}
                            disabled={!importText.trim()}
                            className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Adicionar Itens
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
};



// PreparationProgress component removed/merged...
const PreparationProgress: React.FC<{ hotels: HotelReservation[]; transports: Transport[] }> = ({ hotels, transports }) => {
    const items = [
        { label: 'Voos', checked: transports.some(t => t.type === 'flight'), icon: 'flight' },
        { label: 'Hotéis', checked: hotels.length > 0, icon: 'hotel' },
        { label: 'Transporte Local', checked: transports.some(t => t.type === 'car' || t.type === 'transfer'), icon: 'directions_car' },
        { label: 'Seguro Viagem', checked: false, icon: 'health_and_safety' },
    ];

    const completedCount = items.filter(i => i.checked).length;
    const percentage = Math.round((completedCount / items.length) * 100);

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-text-main">Preparação</h4>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${percentage === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {percentage}%
                </span>
            </div>

            {/* Progress Ring */}
            <div className="flex justify-center mb-4">
                <div className="relative size-24">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="text-gray-100"
                            strokeDasharray="100, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            className="text-primary"
                            strokeDasharray={`${percentage}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-black text-text-main">{completedCount}/{items.length}</span>
                    </div>
                </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                        <div className={`size-5 rounded-full border-2 flex items-center justify-center ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            {item.checked && <span className="material-symbols-outlined text-white text-sm">check</span>}
                        </div>
                        <span className={`text-sm ${item.checked ? 'text-text-muted line-through' : 'text-text-main font-medium'}`}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const PendingTasksList: React.FC = () => {
    // Determine unrelated/separate instance of tasks for this sidebar widget
    const [tasks, setTasks] = React.useState<TaskItem[]>([]);

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const pendingTasks = tasks.filter(t => !t.completed).slice(0, 4);

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-text-main">Tarefas Pendentes</h4>
                <span className="text-xs text-text-muted">{pendingTasks.length} restantes</span>
            </div>
            <div className="space-y-2">
                {tasks.length === 0 ? (
                    <EmptyState
                        variant="minimal"
                        title="Tudo pronto!"
                        description="Nenhuma tarefa pendente."
                        icon="check_circle"
                    />
                ) : (
                    pendingTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <div className={`size-5 rounded border-2 flex items-center justify-center shrink-0 ${task.priority === 'high' ? 'border-rose-400' : task.priority === 'medium' ? 'border-amber-400' : 'border-gray-300'
                                }`}>
                            </div>
                            <span className="text-sm text-text-main truncate">{task.text}</span>
                        </div>
                    ))
                )}
            </div>
            <Button variant="ghost" className="w-full mt-3 !text-xs !text-primary !py-2">
                Ver todas as tarefas
            </Button>
        </Card>
    );
};

const ParticipantsList: React.FC<{ participants?: any[]; onInvite?: () => void }> = ({ participants = [], onInvite }) => {
    const [showInviteModal, setShowInviteModal] = React.useState(false);
    const [inviteEmail, setInviteEmail] = React.useState('');
    const [inviteMessage, setInviteMessage] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const [linkCopied, setLinkCopied] = React.useState(false);

    // Define colors for avatars
    const avatarColors = [
        'bg-blue-100 text-blue-600',
        'bg-purple-100 text-purple-600',
        'bg-amber-100 text-amber-600',
        'bg-green-100 text-green-600',
        'bg-pink-100 text-pink-600',
    ];

    const handleSendInvite = () => {
        if (!inviteEmail.trim()) return;

        setIsSending(true);

        // Simulate sending invite
        setTimeout(() => {
            setIsSending(false);
            setInviteEmail('');
            setInviteMessage('');
            setShowInviteModal(false);
            // Show success feedback
            alert(`Convite enviado para ${inviteEmail}!`);
        }, 1000);
    };

    const handleCopyLink = () => {
        const inviteLink = `https://porai.app/trip/invite/${Date.now()}`;
        navigator.clipboard.writeText(inviteLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    return (
        <>
            <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-primary/30 rounded-full">
                        Quem Vai
                    </span>
                    <button className="text-xs text-primary font-semibold hover:underline">
                        Ver todos
                    </button>
                </div>
                <div className="space-y-3">
                    {participants.length > 0 ? (
                        participants.slice(0, 5).map((p, i) => (
                            <div key={i} className="flex items-center gap-3 group cursor-pointer">
                                <div className={`size-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-sm font-bold shrink-0`}>
                                    {p.avatar ? (
                                        <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        p.initials || p.name?.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                                        {p.name}
                                    </p>
                                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">star</span>
                                        {p.role || 'Viajante'}
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                        {p.trips || 1} viagem
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4">
                            <div className="size-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined text-2xl">person_add</span>
                            </div>
                            <p className="text-sm text-text-muted">Nenhum participante ainda</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full mt-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Convidar
                </button>
            </Card>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <span className="material-symbols-outlined">person_add</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-text-main">Convidar Participantes</h3>
                                        <p className="text-xs text-text-muted">Adicione amigos à sua viagem</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-text-muted transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-2">
                                    Email do convidado
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">mail</span>
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="email@exemplo.com"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Message Input (Optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-2">
                                    Mensagem personalizada <span className="text-text-muted font-normal">(opcional)</span>
                                </label>
                                <textarea
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    placeholder="Adicione uma mensagem para o convite..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                />
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-text-muted">ou</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Copy Link */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm font-semibold text-text-main mb-2">Compartilhar link de convite</p>
                                <button
                                    onClick={handleCopyLink}
                                    className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${linkCopied
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-white border border-gray-200 text-text-main hover:border-primary hover:text-primary'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {linkCopied ? 'check' : 'link'}
                                    </span>
                                    {linkCopied ? 'Link copiado!' : 'Copiar link de convite'}
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-text-main hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSendInvite}
                                disabled={!inviteEmail.trim() || isSending}
                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isSending ? (
                                    <>
                                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">send</span>
                                        Enviar Convite
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// =============================================================================
// Main Component
// =============================================================================

const OverviewTab: React.FC<OverviewTabProps> = ({ trip, expenses, cities, hotels, transports, activities, totalBudget, onInvite, onCityClick, onAddCity, onUpdateCity, onDeleteCity, onTabChange, isLoading }) => {
    const [showAnimatedMap, setShowAnimatedMap] = useState(false);
    const [realStops, setRealStops] = useState<ItineraryStop[]>([]);
    const [isLoadingStops, setIsLoadingStops] = useState(false);
    const { updateTrip } = useTrips();

    // Details Modal State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedActivityForDetails, setSelectedActivityForDetails] = useState<ItineraryActivity | null>(null);

    const openDetailsModal = (activity: ItineraryActivity) => {
        setSelectedActivityForDetails(activity);
        setDetailsModalOpen(true);
    };

    const getYouTubeID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleAddVideo = async (url: string) => {
        const videoId = getYouTubeID(url);
        if (!videoId) return;

        const newVideo: YouTubeVideo = {
            id: `video-${Date.now()}`,
            url: url,
            title: 'Vídeo do YouTube',
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            addedAt: new Date().toISOString()
        };

        const updatedTrip = {
            ...trip,
            videos: [...(trip.videos || []), newVideo]
        };

        await updateTrip(updatedTrip);
    };

    const handleRemoveVideo = async (id: string) => {
        const updatedTrip = {
            ...trip,
            videos: (trip.videos || []).filter(v => v.id !== id)
        };
        await updateTrip(updatedTrip);
    };

    const totalSpent = useMemo(() =>
        expenses.filter(e => e.type === 'saida').reduce((sum, e) => sum + e.amount, 0),
        [expenses]
    );

    // Fallback coordinates for common cities to ensure demo works smoothly without API calls
    const CITY_COORDINATES_DB: Record<string, [number, number]> = {
        'São Paulo': [-23.5505, -46.6333],
        'Rio de Janeiro': [-22.9068, -43.1729],
        'London': [51.5074, -0.1278],
        'Londres': [51.5074, -0.1278],
        'Paris': [48.8566, 2.3522],
        'Tokyo': [35.6762, 139.6503],
        'Tóquio': [35.6762, 139.6503],
        'Kyoto': [35.0116, 135.7681],
        'Quioto': [35.0116, 135.7681],
        'Osaka': [34.6937, 135.5023],
        'New York': [40.7128, -74.0060],
        'Nova York': [40.7128, -74.0060],
        'Rome': [41.9028, 12.4964],
        'Roma': [41.9028, 12.4964],
        'Barcelona': [41.3851, 2.1734],
        'Madrid': [40.4168, -3.7038],
        'Lisbon': [38.7223, -9.1393],
        'Lisboa': [38.7223, -9.1393],
        'Amsterdam': [52.3676, 4.9041],
        'Berlin': [52.5200, 13.4050],
        'Berlim': [52.5200, 13.4050],
        'Athens': [37.9838, 23.7275],
        'Atenas': [37.9838, 23.7275],
        'Dubai': [25.2048, 55.2708],
        'Singapore': [1.3521, 103.8198],
        'Singapura': [1.3521, 103.8198],
        'Bangkok': [13.7563, 100.5018],
        'Sydney': [-33.8688, 151.2093],
        'Cairo': [30.0444, 31.2357],
        'Buenos Aires': [-34.6037, -58.3816],
        'Santiago': [-33.4489, -70.6693],
        'Lima': [-12.0464, -77.0428],
        'Cape Town': [-33.9249, 18.4241],
        'Cidade do Cabo': [-33.9249, 18.4241]
    };

    // Helper to determine transport mode between two cities
    const getTransportMode = (fromCity: City, toCity: City): 'plane' | 'train' | 'car' | 'bus' | 'ferry' => {
        // 1. Check if there's a specific transport record connecting these
        const connectingTransport = transports.find(t => {
            const fromCheck = t.departureCity?.toLowerCase().includes(fromCity.name.toLowerCase()) ||
                t.departureLocation.toLowerCase().includes(fromCity.name.toLowerCase());
            const toCheck = t.arrivalCity?.toLowerCase().includes(toCity.name.toLowerCase()) ||
                t.arrivalLocation.toLowerCase().includes(toCity.name.toLowerCase());
            return fromCheck && toCheck;
        });

        if (connectingTransport) {
            switch (connectingTransport.type) {
                case 'flight': return 'plane';
                case 'train': return 'train';
                case 'car':
                case 'transfer': return 'car';
                case 'bus': return 'bus';
                case 'ferry': return 'ferry';
                default: return 'plane';
            }
        }

        // 2. Fallback heuristic based on distance (simplified) or name
        // For now, we default to 'plane' for most international trips unless cities are known close pairs
        // This could be enhanced with real distance calculation if coordinates are available immediately

        return 'plane';
    };

    // Generate real stops when modal opens
    // Generate real stops when modal opens
    useEffect(() => {
        if (showAnimatedMap && cities.length > 0) {
            const generateStops = async () => {
                setIsLoadingStops(true);
                const finalStops: ItineraryStop[] = [];

                // Helper to get coordinates
                const getCoords = async (locationName: string): Promise<[number, number]> => {
                    const cleanName = locationName.split('(')[0].trim().replace('Intl.', '').replace('International', '').trim();

                    // Direct DB match
                    if (CITY_COORDINATES_DB[cleanName]) return CITY_COORDINATES_DB[cleanName];
                    if (CITY_COORDINATES_DB[locationName]) return CITY_COORDINATES_DB[locationName];

                    // Fallback map for specific airports/codes often used
                    const AIRPORT_DB: Record<string, [number, number]> = {
                        'Guarulhos': [-23.4356, -46.4731],
                        'GRU': [-23.4356, -46.4731],
                        'Congonhas': [-23.6273, -46.6566],
                        'Galeão': [-22.8089, -43.2436],
                        'Santos Dumont': [-22.9105, -43.1631],
                        'Brasilia': [-15.8697, -47.9172],
                        'Heathrow': [51.4700, -0.4543],
                        'Gatwick': [51.1537, -0.1821],
                        'JFK': [40.6413, -73.7781],
                        'Charles de Gaulle': [49.0097, 2.5479],
                        'Orly': [48.7262, 2.3652],
                        'Dubai': [25.2532, 55.3657],
                        'Johannesburg': [-26.1367, 28.2411],
                        'Johannesburgo': [-26.1367, 28.2411],
                        'O.R. Tambo': [-26.1367, 28.2411],
                        'Cape Town': [-33.9389, 18.6056],
                    };

                    for (const key in AIRPORT_DB) {
                        if (cleanName.includes(key) || locationName.includes(key)) return AIRPORT_DB[key];
                    }

                    // Try Google Places
                    try {
                        const { googlePlacesService } = await import('../../../services/googlePlacesService');
                        const place = await googlePlacesService.searchPlace(cleanName);
                        if (place.location) {
                            return [place.location.latitude, place.location.longitude];
                        }
                    } catch (e) {
                        console.error(`Failed to geocode ${locationName}`, e);
                    }

                    return [0, 0];
                };

                // Helper to normalize names for comparison
                const normalize = (s: string) => s.toLowerCase().trim();
                const isSameLocation = (loc1: string, loc2: string) => {
                    // Check if one contains the other (e.g. "São Paulo" and "São Paulo (GRU)")
                    const n1 = normalize(loc1);
                    const n2 = normalize(loc2);
                    return n1.includes(n2) || n2.includes(n1) || (n1.includes('são paulo') && n2.includes('guarulhos')) || (n2.includes('são paulo') && n1.includes('guarulhos'));
                };

                // START BUILDING THE PATH
                // 1. Add First City
                const firstCity = cities[0];
                const firstCoords = await getCoords(firstCity.name);

                finalStops.push({
                    id: firstCity.id,
                    title: firstCity.name,
                    location: firstCity.country,
                    coordinates: firstCoords,
                    transportMode: 'car', // Initial state
                    day: 1
                });

                // Iterate through segments between main cities
                for (let i = 0; i < cities.length - 1; i++) {
                    const startCity = cities[i];
                    const endCity = cities[i + 1];

                    // Logic: Find a chain of transports from Start -> ... -> End
                    let currentLocationName = startCity.name;
                    let foundPath = false;
                    let segmentStops: ItineraryStop[] = [];

                    // We try to find up to 3 connecting legs max to avoid infinite loops
                    for (let leg = 0; leg < 3; leg++) {
                        // Find transport departing from currentLocation
                        // We filter for transport that is somewhat related to this trip leg
                        // Heuristic: matching departure name OR date proximity if distinct names failed? 
                        // For safety, let's stick to name matching + transport list is usually small

                        const transport = transports.find(t => isSameLocation(t.departureLocation, currentLocationName) || isSameLocation(t.departureCity || '', currentLocationName));

                        if (transport) {
                            // Determine mode
                            let outputMode: 'plane' | 'train' | 'car' | 'bus' | 'ferry' = 'plane';
                            if (transport.type === 'flight') outputMode = 'plane';
                            else if (transport.type === 'train') outputMode = 'train';
                            else if (transport.type === 'bus') outputMode = 'bus';
                            else if (transport.type === 'ferry') outputMode = 'ferry';
                            else outputMode = 'car';

                            // The previous stop (which is the start of this transport) gets this mode assigned as its "outgoing" mode
                            if (segmentStops.length > 0) {
                                segmentStops[segmentStops.length - 1].transportMode = outputMode;
                            } else {
                                // Provide mode to the last committed stop (the start city)
                                finalStops[finalStops.length - 1].transportMode = outputMode;
                            }

                            // Is the arrival the destination city?
                            if (isSameLocation(transport.arrivalLocation, endCity.name) || isSameLocation(transport.arrivalCity || '', endCity.name)) {
                                // Direct hit or final leg found
                                foundPath = true;
                                break; // We will add the End City at the outer loop
                            } else {
                                // Intermediate stop! (e.g. GRU)
                                // Only add if it's not basically the same city we just left (redundancy check)
                                if (!isSameLocation(transport.arrivalLocation, currentLocationName)) {
                                    const coords = await getCoords(transport.arrivalLocation);
                                    segmentStops.push({
                                        id: `stop-${transport.id}`,
                                        title: transport.arrivalLocation.split('(')[0], // "São Paulo "
                                        location: 'Conexão',
                                        coordinates: coords,
                                        transportMode: 'plane', // Temporary, will be updated if there is a next leg
                                        day: i + 1
                                    });
                                    currentLocationName = transport.arrivalLocation;
                                } else {
                                    // Verify if we moved at all? If yes, break to avoid loop
                                    break;
                                }
                            }
                        } else {
                            // No transport found from this location.
                            // If we are at the start city, checking distance heuristic
                            if (segmentStops.length === 0) {
                                const distMode = getTransportMode(startCity, endCity);
                                finalStops[finalStops.length - 1].transportMode = distMode;
                            }
                            break;
                        }
                    }

                    // Add any intermediate stops found
                    finalStops.push(...segmentStops);

                    // Add End City
                    const endCoords = await getCoords(endCity.name);
                    finalStops.push({
                        id: endCity.id,
                        title: endCity.name,
                        location: endCity.country,
                        coordinates: endCoords,
                        transportMode: 'car', // Default for arrival
                        day: i + 2
                    });
                }

                // Filter out invalid coords
                const validStops = finalStops.filter(s => s.coordinates[0] !== 0 || s.coordinates[1] !== 0);

                // Remove adjacent duplicates (if start city same as first transport start)
                const uniqueStops = validStops.filter((stop, idx) => {
                    if (idx === 0) return true;
                    const prev = validStops[idx - 1];
                    const dist = Math.sqrt(Math.pow(stop.coordinates[0] - prev.coordinates[0], 2) + Math.pow(stop.coordinates[1] - prev.coordinates[1], 2));
                    return dist > 0.001; // Filter out identical locations
                });

                setRealStops(uniqueStops.length > 0 ? uniqueStops : []);
                setIsLoadingStops(false);
            };

            generateStops();
        }
    }, [showAnimatedMap, cities, transports]);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Next Step Skeleton */}
                <Card className="p-5 border border-indigo-100 bg-indigo-50/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Skeleton variant="circular" width={24} height={24} />
                            <Skeleton width={120} height={20} />
                        </div>
                    </div>
                    <Skeleton width="60%" height={28} className="mb-2" />
                    <Skeleton width="40%" height={16} className="mb-4" />
                    <Skeleton width="100%" height={40} className="rounded-xl" />
                </Card>

                {/* Widgets Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="p-5 flex items-center gap-4">
                            <Skeleton variant="rectangular" width={56} height={56} className="rounded-xl" />
                            <div className="flex-1">
                                <Skeleton width={60} height={12} className="mb-2" />
                                <Skeleton width={100} height={24} />
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Timeline Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <Card className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton width={100} height={24} className="rounded-full" />
                                <div className="flex gap-2">
                                    <Skeleton variant="circular" width={32} height={32} />
                                    <Skeleton variant="circular" width={32} height={32} />
                                </div>
                            </div>
                            <div className="flex gap-4 overflow-hidden">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-[180px] shrink-0">
                                        <Skeleton variant="rectangular" width="100%" height={225} className="rounded-2xl" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton variant="rectangular" width="100%" height="100%" className="rounded-2xl min-h-[150px]" />
                    </div>
                </div>

                {/* Alerts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <Card className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton width={120} height={24} className="rounded-full" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="flex gap-3">
                                        <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl" />
                                        <div className="flex-1">
                                            <Skeleton width="40%" height={16} className="mb-2" />
                                            <Skeleton width="90%" height={12} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="p-5">
                            <Skeleton width={80} height={24} className="rounded-full mb-4" />
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton variant="circular" width={36} height={36} />
                                        <Skeleton width={100} height={16} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* NEW HEADER SECTION */}
            <div className="space-y-6">
                {/* Top Row: Next Step */}
                <div className="grid grid-cols-1">
                    <NextStepCard transports={transports} hotels={hotels} activities={activities} onTabChange={onTabChange} onViewDetails={openDetailsModal} />
                </div>

                {/* NEW: Dashboard Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <CountdownWidget
                            startDate={trip.startDate}
                            onNavigate={() => onTabChange?.('itinerary')}
                        />
                    </div>
                    <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <BudgetWidget
                            spent={expenses.reduce((sum, e) => sum + e.amount, 0)}
                            total={totalBudget}
                            onNavigate={() => onTabChange?.('budget')}
                        />
                    </div>
                    <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                        <CitiesWidget
                            cities={cities}
                            onCityClick={onCityClick}
                            onNavigate={() => onTabChange?.('cities')}
                        />
                    </div>
                    <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
                        <TransportsWidget
                            transports={transports}
                            onNavigate={() => onTabChange?.('logistics')}
                        />
                    </div>
                </div>

                {/* Row 2: Timeline + Weather (2 columns each) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
                        <TimelineWidget
                            transports={transports}
                            hotels={hotels}
                            activities={activities}
                            onNavigate={() => onTabChange?.('itinerary')}
                        />
                    </div>
                    <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
                        <WeatherWidget
                            cityName={cities[0]?.name || trip.destination?.split(',')[0] || 'Destino'}
                        />
                    </div>
                </div>

                {/* Timeline + Animated Map Row (with Quem Vai + Coverage on right) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Timeline Row */}
                        <MacroTimeline
                            cities={cities}
                            onCityClick={onCityClick}
                            onAddCity={onAddCity}
                            onUpdateCity={onUpdateCity}
                            onDeleteCity={onDeleteCity}
                        />
                    </div>

                    {/* Right Side: Animated Map (1 col) */}
                    <div className="lg:col-span-1">
                        <Card className="p-5 h-full flex flex-col justify-center items-center cursor-pointer group hover:shadow-lg transition-all" onClick={() => setShowAnimatedMap(true)}>
                            <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                                <span className="material-symbols-outlined text-3xl">play_circle</span>
                            </div>
                            <h4 className="font-bold text-sm text-text-main text-center mb-1">Roteiro Animado</h4>
                            <p className="text-xs text-text-muted text-center">Visualize sua jornada</p>
                        </Card>
                    </div>
                </div>

                {/* Second Row: Alerts on left + Quem Vai + Coverage on right */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Side: City Alerts (3 cols) */}
                    <div className="lg:col-span-3">
                        <CityAlertsBox cities={cities} tripStartDate={trip.startDate} />
                    </div>

                    {/* Right Side: Quem Vai + Coverage Status (1 col) */}
                    <div className="lg:col-span-1 space-y-4">
                        <ParticipantsList participants={trip.participants} onInvite={onInvite} />

                        {/* Coverage Status */}
                        <Card className="p-5">
                            <span className="inline-block px-3 py-1.5 mb-4 text-xs font-bold text-text-main bg-primary/30 rounded-full">
                                Status da Cobertura
                            </span>
                            <TravelCoverage
                                trip={trip}
                                hotels={hotels}
                                transports={transports}
                            />
                        </Card>
                    </div>
                </div>

                {/* Top Cards Row: Next Step + Status + Countdown + Weather */}
                {/* Third Row: Checklist on left + Luggage on right */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <SmartChecklist />
                    </div>
                    <div className="lg:col-span-1">
                        <LuggageChecklist trip={trip} />
                    </div>
                </div>
            </div>

            {/* Fourth Row: Trip Highlights (Full Width) */}
            {/* Fourth Row: Video Gallery (Full Width) replace Trip Highlights */}
            <VideoGallery
                videos={trip.videos || []}
                onAddVideo={handleAddVideo}
                onRemoveVideo={handleRemoveVideo}
            />

            {/* Animated Map Modal */}
            {
                showAnimatedMap && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">route</span>
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg text-text-main dark:text-white">Animação do Roteiro</h2>
                                        <p className="text-sm text-text-muted dark:text-gray-400">
                                            {isLoadingStops ? 'Gerando rota...' : 'Acompanhe sua viagem no mapa'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAnimatedMap(false)}
                                    className="size-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-text-muted transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Map */}
                            <div className="flex-1 p-4 relative">
                                {isLoadingStops ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-sm font-semibold text-text-muted">Calculando rota...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <AnimatedItineraryMap
                                        stops={realStops}
                                        animationSpeed={5}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Activity Details Modal */}
            <ActivityDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                title={selectedActivityForDetails?.title || ''}
                location={selectedActivityForDetails?.location}
                type={selectedActivityForDetails ? getActivityTypeLabel(selectedActivityForDetails.type) : ''}
            />
        </div >
    );
};

export default OverviewTab;
