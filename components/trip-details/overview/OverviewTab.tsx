import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { Trip, City, HotelReservation, Transport, TaskItem, ItineraryActivity } from '../../../types';
import { Card, Button, Skeleton, SkeletonText } from '../../ui/Base';
import { getGeminiService } from '../../../services/geminiService';
import { useTrips } from '@/contexts/TripContext';
import { EmptyState } from '../../ui/EmptyState';
import useImageGeneration from '../../../hooks/useImageGeneration';
import { TimelineWidget, EssentialQuestionsWidget } from './widgets';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface OverviewTabProps {
    trip: Trip;
    cities: City[];
    hotels: HotelReservation[];
    transports: Transport[];
    activities?: ItineraryActivity[];
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
    hotels?: HotelReservation[];
    onCityClick?: (city: City) => void;
    onAddCity?: () => void;
    onUpdateCity?: (city: City) => void;
    onDeleteCity?: (city: City) => void;
}

const MacroTimeline: React.FC<MacroTimelineProps> = ({ cities, hotels = [], onCityClick, onAddCity, onUpdateCity, onDeleteCity }) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const { generateImage, isGenerating, isUploading } = useImageGeneration();

    // Get hotels for a specific city
    const getHotelsForCity = (city: City): HotelReservation[] => {
        return hotels.filter(h => h.cityId === city.id);
    };
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
                                            <span className="text-xs font-bold animate-pulse">Gerando imagem mágica...</span>
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
                                            {/* Hotel info for this city */}
                                            {getHotelsForCity(city).length > 0 && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="material-symbols-outlined text-[10px] text-amber-300">hotel</span>
                                                    <span className="truncate max-w-[120px]">
                                                        {getHotelsForCity(city)[0].name}
                                                    </span>
                                                </div>
                                            )}
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

    // Generate alerts based on cities - delayed to prevent request overload
    React.useEffect(() => {
        if (cities.length === 0) {
            setAlerts([]);
            return;
        }

        // Delay this API call to stagger requests and prevent ERR_INSUFFICIENT_RESOURCES
        const timeoutId = setTimeout(() => {
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
        }, 1000); // 1 second delay to let other critical requests complete first

        return () => clearTimeout(timeoutId);
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
                <div className="relative -mx-5">
                    <div className="flex gap-4 overflow-x-auto pb-3 px-5 hide-scrollbar scroll-smooth">
                        {alerts.map(alert => (
                            <div
                                key={alert.id}
                                className="bg-gray-50 rounded-xl overflow-hidden transition-all min-w-[280px] max-w-[320px] shrink-0 flex flex-col"
                            >
                                <div className="flex items-start gap-3 p-3 hover:bg-gray-100 transition-colors flex-1">
                                    <div className={`size-10 rounded-xl ${getIconBg(alert.type)} flex items-center justify-center shrink-0`}>
                                        <span className="material-symbols-outlined text-xl">
                                            {alert.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 py-0.5">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <h5 className="font-semibold text-sm text-text-main">{alert.title}</h5>
                                            {alert.city && (
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                                    {alert.city}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{alert.message}</p>
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
                                    <div className="px-3 pb-3">
                                        <div className="p-3 bg-white rounded-lg border border-gray-100 text-xs text-text-main leading-relaxed whitespace-pre-line max-h-[150px] overflow-y-auto">
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

// =============================================================================
// Main Component
// =============================================================================

const OverviewTab: React.FC<OverviewTabProps> = ({ trip, cities, hotels, transports, activities, onCityClick, onAddCity, onUpdateCity, onDeleteCity, onTabChange, isLoading }) => {
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
            {/* Section 1: Próximos Eventos (1/3) + Linha do Tempo (2/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                {/* Próximos Eventos - 1/3 da largura */}
                <div className="lg:col-span-1">
                    <TimelineWidget
                        transports={transports}
                        hotels={hotels}
                        activities={activities}
                        onNavigate={() => onTabChange?.('itinerary')}
                    />
                </div>

                {/* Linha do Tempo das Cidades - 2/3 da largura */}
                <div className="lg:col-span-2">
                    <MacroTimeline
                        cities={cities}
                        hotels={hotels}
                        onCityClick={onCityClick}
                        onAddCity={onAddCity}
                        onUpdateCity={onUpdateCity}
                        onDeleteCity={onDeleteCity}
                    />
                </div>
            </div>

            {/* Section 2: Perguntas Essenciais (Full Width) */}
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                <EssentialQuestionsWidget cities={cities} hotels={hotels} transports={transports} />
            </div>


        </div >
    );
};

export default OverviewTab;
