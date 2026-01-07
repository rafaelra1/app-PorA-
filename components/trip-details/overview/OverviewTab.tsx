import React, { useMemo, useState, useEffect } from 'react';
import { Trip, Expense, City, HotelReservation, Transport } from '../../../types';
import { Card, Button } from '../../ui/Base';
import AnimatedItineraryMap, { ItineraryStop } from '../itinerary/AnimatedItineraryMap';
import TravelCoverage from '../dashboard/TravelCoverage';
import { getGeminiService } from '../../../services/geminiService';
import { getInitialTasks } from '../../../data/checklistData';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface OverviewTabProps {
    trip: Trip;
    expenses: Expense[];
    cities: City[];
    hotels: HotelReservation[];
    transports: Transport[];
    totalBudget: number;
    onInvite?: () => void;
    onCityClick?: (city: City) => void;
    onAddCity?: () => void;
}

interface WidgetProps {
    icon: string;
    iconBg: string;
    label: string;
    value: string;
    subtext?: string;
}

interface TaskItem {
    id: string;
    text: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
}

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



const TRIP_HIGHLIGHTS: TripHighlight[] = [
    {
        id: 'h1',
        title: 'Templo Senso-ji',
        description: 'O templo budista mais antigo de Tóquio, com mais de 1.400 anos de história',
        image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop',
        icon: 'temple_buddhist'
    },
    {
        id: 'h2',
        title: 'Monte Fuji',
        description: 'Vista panorâmica do icônico vulcão sagrado do Japão',
        image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&h=300&fit=crop',
        icon: 'landscape'
    },
    {
        id: 'h3',
        title: 'Quioto Imperial',
        description: 'Explore jardins zen e palácios imperiais milenares',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop',
        icon: 'park'
    },
    {
        id: 'h4',
        title: 'Gastronomia Local',
        description: 'Experiência autêntica de ramen, sushi e kaiseki',
        image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=300&fit=crop',
        icon: 'ramen_dining'
    }
];

const TRIP_ALERTS: TripAlert[] = [
    {
        id: 'a1',
        type: 'danger',
        title: 'Vacina Obrigatória',
        message: 'Febre amarela obrigatória. Vacinar até 10 dias antes da viagem.',
        icon: 'vaccines'
    },
    {
        id: 'a2',
        type: 'warning',
        title: 'Temporada de Chuvas',
        message: 'Período de monções previsto. Recomendado levar capa de chuva e guarda-chuva.',
        icon: 'rainy'
    },
    {
        id: 'a3',
        type: 'info',
        title: 'Feriado Local',
        message: 'Dia 18/02 é feriado nacional - museus e bancos podem estar fechados.',
        icon: 'event'
    }
];

const PREPARATION_ITEMS = [
    { label: 'Voos', icon: 'flight', key: 'flights' },
    { label: 'Hotéis', icon: 'hotel', key: 'hotels' },
    { label: 'Transporte', icon: 'directions_car', key: 'transport' },
    { label: 'Documentos', icon: 'description', key: 'documents' },
];

// Demo stops data for animated map (with coordinates)
const DEMO_STOPS: ItineraryStop[] = [
    { id: 's1', title: 'São Paulo (GRU)', location: 'Aeroporto de Guarulhos', coordinates: [-23.4356, -46.4731], transportMode: 'plane', day: 0 },
    { id: 's2', title: 'Aeroporto Haneda', location: 'Tokyo, Japan', coordinates: [35.5494, 139.7798], transportMode: 'train', day: 1 },
    { id: 's3', title: 'Shinjuku', location: 'Hotel Gracery', coordinates: [35.6938, 139.7034], transportMode: 'walk', day: 1 },
    { id: 's4', title: 'Omoide Yokocho', location: 'Shinjuku', coordinates: [35.6936, 139.6999], transportMode: 'train', day: 1 },
    { id: 's5', title: 'Asakusa', location: 'Templo Senso-ji', coordinates: [35.7148, 139.7967], transportMode: 'walk', day: 2 },
    { id: 's6', title: 'Shibuya', location: 'Shibuya Crossing', coordinates: [35.6595, 139.7004], transportMode: 'train', day: 3 },
    { id: 's7', title: 'Kyoto', location: 'Quioto', coordinates: [35.0116, 135.7681], transportMode: 'train', day: 4 },
    { id: 's8', title: 'Osaka', location: 'Dotonbori', coordinates: [34.6687, 135.5031], transportMode: 'plane', day: 5 },
];

// =============================================================================
// Helper Functions
// =============================================================================

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

const CountdownWidget: React.FC<{ startDate: string }> = ({ startDate }) => {
    const countdown = calculateDaysUntilTrip(startDate);

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 shadow-soft border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`size-14 rounded-xl ${countdown.isOngoing ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-2xl">
                    {countdown.isOngoing ? 'flight_takeoff' : 'schedule'}
                </span>
            </div>
            <div>
                <p className="text-xs text-text-muted dark:text-gray-400 uppercase font-bold tracking-wider">
                    {countdown.isOngoing ? 'Viagem em Andamento' : 'Contagem Regressiva'}
                </p>
                {countdown.value === 0 ? (
                    <p className="text-xl font-black text-green-600 dark:text-green-400">Hoje é o dia!</p>
                ) : (
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-text-main dark:text-white">{countdown.value}</span>
                        <span className="text-sm text-text-muted dark:text-gray-400 font-medium">{countdown.label}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const BudgetWidget: React.FC<{ spent: number; total: number }> = ({ spent, total }) => {
    const percentage = Math.min(Math.round((spent / total) * 100), 100);
    const remaining = total - spent;
    const isOverBudget = spent > total;

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 shadow-soft border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted dark:text-gray-400 uppercase font-bold tracking-wider">Orçamento</p>
                        <p className="text-lg font-black text-text-main dark:text-white">{formatCurrency(total)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-bold ${isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining))}
                    </p>
                    <p className="text-xs text-text-muted dark:text-gray-400">{isOverBudget ? 'acima' : 'restante'}</p>
                </div>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <p className="text-xs text-text-muted dark:text-gray-400 mt-2">{percentage}% utilizado</p>
        </div>
    );
};

const WeatherWidget: React.FC<{ destination: string }> = ({ destination }) => (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 shadow-soft border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-4 hover:shadow-md transition-all">
        <div className="size-14 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-3xl">wb_sunny</span>
        </div>
        <div>
            <p className="text-xs text-text-muted dark:text-gray-400 uppercase font-bold tracking-wider">Clima Previsto</p>
            <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-text-main dark:text-white">24°</span>
                <span className="text-sm text-text-muted dark:text-gray-400 font-medium">Ensolarado</span>
            </div>
            <p className="text-xs text-text-muted dark:text-gray-400">{destination}</p>
        </div>
    </div>
);

// =============================================================================
// Sub-Components: Main Column
// =============================================================================

const NextStepCard: React.FC<{ transports: Transport[]; hotels: HotelReservation[] }> = ({ transports, hotels }) => {
    // Find the next upcoming event
    const nextFlight = transports.find(t => t.type === 'flight');
    const nextHotel = hotels[0];

    return (
        <Card className="p-6 border-l-4 border-l-primary">
            <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">priority_high</span>
                </div>
                <div className="flex-1">
                    <p className="text-xs text-primary uppercase font-bold tracking-widest mb-1">Próximo Passo</p>
                    <h4 className="text-lg font-bold text-text-main">
                        {nextFlight
                            ? `Check-in do voo ${nextFlight.reference}`
                            : nextHotel
                                ? `Confirmar reserva: ${nextHotel.name}`
                                : 'Adicionar seu primeiro transporte ou hotel'}
                    </h4>
                    <p className="text-sm text-text-muted mt-1">
                        {nextFlight
                            ? `${nextFlight.departureDate} às ${nextFlight.departureTime} - ${nextFlight.departureLocation} → ${nextFlight.arrivalLocation}`
                            : nextHotel
                                ? `Check-in: ${nextHotel.checkIn} às ${nextHotel.checkInTime}`
                                : 'Comece a planejar sua viagem adicionando reservas.'}
                    </p>
                </div>
                <Button variant="primary" className="!px-4 !py-2 !text-sm">
                    {nextFlight ? 'Fazer Check-in' : 'Ver Detalhes'}
                </Button>
            </div>
        </Card>
    );
};

const MacroTimeline: React.FC<{ cities: City[]; onCityClick?: (city: City) => void; onAddCity?: () => void }> = ({ cities, onCityClick, onAddCity }) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (cities.length === 0) {
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
                    {cities.map((city, index) => (
                        <React.Fragment key={city.id}>
                            <div
                                className="flex flex-col items-center w-[180px] shrink-0 cursor-pointer group"
                                onClick={() => onCityClick?.(city)}
                            >
                                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-0 shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                    <img
                                        src={city.image}
                                        alt={city.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

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

                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300">explore</span>
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
                    // Fallback if AI returns nothing
                    setAlerts([{
                        id: 'general-1',
                        type: 'info',
                        title: 'Viagem Planejada',
                        message: `Sua viagem para ${cities.map(c => c.name).join(', ')} está configurada. Boa viagem!`,
                        icon: 'flight_takeoff'
                    }]);
                }
            } catch (error) {
                console.error('Error generating trip alerts:', error);
                // Fallback on error
                setAlerts([{
                    id: 'fallback-1',
                    type: 'info',
                    title: 'Dica de Segurança',
                    message: 'Mantenha cópias digitais de documentos importantes durante sua viagem.',
                    icon: 'security'
                }]);
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

    if (cities.length === 0) return null;

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

const TripChecklist: React.FC = () => {
    // Initialize tasks with standard + random selection using useMemo to persist across renders
    const initialTasks = useMemo(() => {
        // Import dynamically or define interfaces to match
        // For now, we'll map the imported structure to the local state
        const generated = getInitialTasks();

        // Map to the component's internal state structure if needed, or use directly
        return generated.map(t => ({
            ...t,
            deadline: t.deadline || '', // Ensure deadline string
        }));
    }, []);

    const [tasks, setTasks] = React.useState(initialTasks);
    const [showAddInput, setShowAddInput] = React.useState(false);
    const [newTaskText, setNewTaskText] = React.useState('');
    const [newTaskDeadline, setNewTaskDeadline] = React.useState('');
    const [showCompleted, setShowCompleted] = React.useState(false);

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const clearCompleted = (e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(prev => prev.filter(t => !t.completed));
        setShowCompleted(false);
    };

    // Auto-classify task category based on text keywords
    const classifyTaskCategory = (text: string): 'visa' | 'booking' | 'health' | 'insurance' | 'packing' | 'other' => {
        const lowerText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Visa/Documents keywords
        if (/visto|passaporte|embaixada|consulado|visa|autorizacao|eta|esta/.test(lowerText)) {
            return 'visa';
        }

        // Booking keywords
        if (/reserva|hotel|hostel|airbnb|voo|passagem|aereo|check-in|checkout|transfer|aluguel|carro|confirmar|hospedagem|pousada|resort/.test(lowerText)) {
            return 'booking';
        }

        // Health keywords
        if (/vacina|medico|saude|exame|remedio|medicamento|consulta|dentista|hospital|clinica|receita|alergia/.test(lowerText)) {
            return 'health';
        }

        // Insurance keywords
        if (/seguro|apolice|cobertura|assistencia/.test(lowerText)) {
            return 'insurance';
        }

        // Packing keywords
        if (/mala|bagagem|arrumar|separar|empacotar|levar|roupa|documento|impresso|imprimir|organizar|preparar|fazer as malas|lista/.test(lowerText)) {
            return 'packing';
        }

        return 'other';
    };

    const addTask = () => {
        if (!newTaskText.trim()) return;

        // Format deadline if provided (from YYYY-MM-DD to DD/MM/YYYY)
        let formattedDeadline = '';
        if (newTaskDeadline) {
            const [year, month, day] = newTaskDeadline.split('-');
            formattedDeadline = `${day}/${month}/${year}`;
        }

        // Auto-classify the task category
        const detectedCategory = classifyTaskCategory(newTaskText);

        const newTask = {
            id: `custom-${Date.now()}`,
            text: newTaskText.trim(),
            completed: false,
            priority: 'medium' as const,
            isCritical: false,
            deadline: formattedDeadline,
            category: detectedCategory
        };

        setTasks(prev => [...prev, newTask]);
        setNewTaskText('');
        setNewTaskDeadline('');
        setShowAddInput(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addTask();
        } else if (e.key === 'Escape') {
            setShowAddInput(false);
            setNewTaskText('');
            setNewTaskDeadline('');
        }
    };

    // Filter tasks based on view mode
    const visibleTasks = tasks.filter(t => showCompleted ? true : !t.completed);
    const completedCount = tasks.filter(t => t.completed).length;

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'visa': return 'badge';
            case 'booking': return 'hotel';
            case 'health': return 'vaccines';
            case 'insurance': return 'health_and_safety';
            case 'packing': return 'inventory_2';
            default: return 'task_alt';
        }
    };

    const getCategoryColor = (category: string, isCritical: boolean) => {
        if (isCritical) {
            switch (category) {
                case 'visa': return 'text-violet-600 bg-violet-50';
                case 'booking': return 'text-blue-600 bg-blue-50';
                case 'health': return 'text-rose-600 bg-rose-50';
                case 'insurance': return 'text-emerald-600 bg-emerald-50';
                case 'packing': return 'text-teal-600 bg-teal-50';
                default: return 'text-amber-600 bg-amber-50';
            }
        }
        return 'text-gray-500 bg-gray-100';
    };

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-primary/30 rounded-full">
                    Checklist de Tarefas
                </span>
                <span className="text-xs text-text-muted">
                    {completedCount}/{tasks.length} concluídas
                </span>
            </div>

            {/* Add Task Input Box */}
            {showAddInput && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-base">add_task</span>
                        </div>
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Digite a descrição da tarefa..."
                            className="flex-1 text-sm bg-transparent border-none outline-none text-text-main placeholder:text-text-muted"
                            autoFocus
                        />
                        <button
                            onClick={() => { setShowAddInput(false); setNewTaskText(''); setNewTaskDeadline(''); }}
                            className="p-1.5 text-text-muted hover:text-text-main transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 ml-10">
                        <div className="flex items-center gap-2 flex-1">
                            <span className="material-symbols-outlined text-sm text-text-muted">calendar_today</span>
                            <input
                                type="date"
                                value={newTaskDeadline}
                                onChange={(e) => setNewTaskDeadline(e.target.value)}
                                className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-text-main focus:outline-none focus:border-primary"
                            />
                            <span className="text-xs text-text-muted">Prazo (opcional)</span>
                        </div>
                        <button
                            onClick={addTask}
                            disabled={!newTaskText.trim()}
                            className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            )}

            <div className={`space-y-2 max-h-[300px] overflow-y-auto pr-1 ${showCompleted ? 'scrollbar-thin' : ''}`}>
                {visibleTasks.map(task => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${task.completed
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : task.isCritical
                                ? 'bg-white border-amber-200 hover:border-amber-300'
                                : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${getCategoryColor(task.category, !!task.isCritical)}`}>
                            <span className="material-symbols-outlined text-base">{getCategoryIcon(task.category)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm text-text-main ${task.completed ? 'line-through' : ''}`}>
                                {task.text}
                            </p>
                            {task.deadline && (
                                <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                                    <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                                    Até {task.deadline}
                                </p>
                            )}
                        </div>
                        {task.isCritical && !task.completed && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                                URGENTE
                            </span>
                        )}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => deleteTask(task.id, e)}
                                className="size-6 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                title="Excluir tarefa"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                            <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.completed
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-gray-300 hover:border-primary'
                                }`}>
                                {task.completed && <span className="material-symbols-outlined text-white text-xs">check</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Task Button */}
            {!showAddInput && (
                <button
                    onClick={() => setShowAddInput(true)}
                    className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Adicionar Tarefa
                </button>
            )}

            {tasks.some(t => t.completed) && (
                <div className="flex items-center gap-2 mt-3">
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex-1 py-2 text-xs text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">
                            {showCompleted ? 'visibility_off' : 'visibility'}
                        </span>
                        {showCompleted ? 'Ocultar tarefas concluídas' : `Ver ${completedCount} tarefas concluídas`}
                    </button>
                    {showCompleted && (
                        <button
                            onClick={clearCompleted}
                            className="px-3 py-2 text-xs font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                            title="Limpar todas as tarefas concluídas"
                        >
                            <span className="material-symbols-outlined text-sm">delete_sweep</span>
                            Limpar
                        </button>
                    )}
                </div>
            )}
        </Card>
    );
};

// =============================================================================
// Luggage Checklist Component
// =============================================================================

interface LuggageItem {
    id: string;
    text: string;
    packed: boolean;
    category: 'documents' | 'clothes' | 'hygiene' | 'electronics' | 'other';
}

const INITIAL_LUGGAGE_ITEMS: LuggageItem[] = [
    { id: 'l1', text: 'Passaporte', packed: true, category: 'documents' },
    { id: 'l2', text: 'RG / CNH', packed: true, category: 'documents' },
    { id: 'l3', text: 'Cartão de crédito', packed: false, category: 'documents' },
    { id: 'l4', text: 'Seguro viagem (impresso)', packed: false, category: 'documents' },
    { id: 'l5', text: 'Casaco / Jaqueta', packed: false, category: 'clothes' },
    { id: 'l6', text: 'Roupas íntimas', packed: true, category: 'clothes' },
    { id: 'l7', text: 'Calçados confortáveis', packed: false, category: 'clothes' },
    { id: 'l8', text: 'Escova de dente', packed: false, category: 'hygiene' },
    { id: 'l9', text: 'Protetor solar', packed: false, category: 'hygiene' },
    { id: 'l10', text: 'Medicamentos pessoais', packed: false, category: 'hygiene' },
    { id: 'l11', text: 'Carregador de celular', packed: true, category: 'electronics' },
    { id: 'l12', text: 'Adaptador de tomada', packed: false, category: 'electronics' },
    { id: 'l13', text: 'Câmera fotográfica', packed: false, category: 'electronics' },
];

const LuggageChecklist: React.FC = () => {
    const [items, setItems] = React.useState<LuggageItem[]>(INITIAL_LUGGAGE_ITEMS);
    const [showAddInput, setShowAddInput] = React.useState(false);
    const [newItemText, setNewItemText] = React.useState('');
    const [activeCategory, setActiveCategory] = React.useState<LuggageItem['category'] | 'all'>('all');
    const [showImportInput, setShowImportInput] = React.useState(false);
    const [importText, setImportText] = React.useState('');

    // Auto-classify luggage item category based on text keywords
    const classifyLuggageCategory = (text: string): LuggageItem['category'] => {
        const lowerText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Documents keywords
        if (/passaporte|rg|cnh|cartao|cartoes|carteira|documento|identidade|cpf|certidao|seguro|apolice|voucher|reserva|ingresso|ticket|bilhete|visto|visa/.test(lowerText)) {
            return 'documents';
        }

        // Clothes keywords (with plural variations)
        if (/roupa|camisa|camiseta|calca|short|bermuda|vestido|saia|casaco|jaqueta|blusa|moletom|pijama|cueca|calcinha|meia|sapato|tenis|sandalia|chinelo|bota|bone|chapeu|oculos|cinto|gravata|terno|blazer|intima|biquini|maio|sunga|canga|regata|cropped|top|legging|cachecol|luva|gorro|sobretudo|colete|jardineira|macacao|conjunto/.test(lowerText)) {
            return 'clothes';
        }

        // Hygiene keywords
        if (/escova|pasta|shampoo|condicionador|sabonete|desodorante|perfume|protetor|filtro|creme|hidratante|maquiagem|remedio|medicamento|band-aid|curativo|absorvente|fio dental|cotonete|gilete|barbeador|toalha|lenco|algodao|acetona|esmalte|lixa|pincel|pente|secador/.test(lowerText)) {
            return 'hygiene';
        }

        // Electronics keywords
        if (/celular|carregador|cabo|fone|headphone|airpod|camera|notebook|laptop|tablet|ipad|kindle|powerbank|bateria|adaptador|tomada|relogio|smartwatch|gopro|drone|pendrive|hd externo|caixa de som|controle|mouse|teclado/.test(lowerText)) {
            return 'electronics';
        }

        return 'other';
    };

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
            category: classifyLuggageCategory(line.trim())
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

        // Auto-classify the item category based on text
        const detectedCategory = classifyLuggageCategory(newItemText);

        const newItem: LuggageItem = {
            id: `luggage-${Date.now()}`,
            text: newItemText.trim(),
            packed: false,
            category: detectedCategory
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
                {filteredItems.map(item => (
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
                ))}
            </div>

            {/* Add Item Input */}
            {showAddInput && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5">
                        {/* Preview detected category icon */}
                        {newItemText.trim() && (
                            <div className={`size-6 rounded-md flex items-center justify-center shrink-0 ${getCategoryColor(classifyLuggageCategory(newItemText))}`}>
                                <span className="material-symbols-outlined text-xs">{getCategoryIcon(classifyLuggageCategory(newItemText))}</span>
                            </div>
                        )}
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
                            onClick={addItem}
                            disabled={!newItemText.trim()}
                            className="px-2 py-1 text-[10px] font-semibold bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Adicionar
                        </button>
                        <button
                            onClick={() => { setShowAddInput(false); setNewItemText(''); }}
                            className="p-1 text-text-muted hover:text-text-main transition-colors shrink-0"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
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

const TripHighlights: React.FC<{ cities: City[] }> = ({ cities }) => {
    // City-specific highlights database
    const cityHighlightsDB: { [key: string]: TripHighlight[] } = {
        'Berlin': [
            { id: 'berlin-1', title: 'Portão de Brandenburgo', description: 'Símbolo icônico da reunificação alemã', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=300&fit=crop', icon: 'account_balance' },
            { id: 'berlin-2', title: 'East Side Gallery', description: 'A maior galeria de arte a céu aberto do mundo', image: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=400&h=300&fit=crop', icon: 'palette' },
            { id: 'berlin-3', title: 'Ilha dos Museus', description: 'Patrimônio da UNESCO com 5 museus de classe mundial', image: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=400&h=300&fit=crop', icon: 'museum' },
        ],
        'Paris': [
            { id: 'paris-1', title: 'Torre Eiffel', description: 'O monumento mais visitado do mundo', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop', icon: 'cell_tower' },
            { id: 'paris-2', title: 'Museu do Louvre', description: 'Lar da Mona Lisa e obras-primas da arte', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop', icon: 'museum' },
            { id: 'paris-3', title: 'Montmartre', description: 'Bairro artístico com vistas deslumbrantes', image: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=400&h=300&fit=crop', icon: 'palette' },
        ],
        'Tokyo': [
            { id: 'tokyo-1', title: 'Templo Senso-ji', description: 'O templo budista mais antigo de Tóquio', image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop', icon: 'temple_buddhist' },
            { id: 'tokyo-2', title: 'Shibuya Crossing', description: 'O cruzamento mais movimentado do mundo', image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=300&fit=crop', icon: 'directions_walk' },
            { id: 'tokyo-3', title: 'Monte Fuji', description: 'Vista panorâmica do vulcão sagrado', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&h=300&fit=crop', icon: 'landscape' },
        ],
        'London': [
            { id: 'london-1', title: 'Big Ben & Westminster', description: 'Ícones do parlamento britânico', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop', icon: 'schedule' },
            { id: 'london-2', title: 'Tower Bridge', description: 'A ponte mais famosa de Londres', image: 'https://images.unsplash.com/photo-1483972535757-f9e8cdeed1e0?w=400&h=300&fit=crop', icon: 'directions' },
            { id: 'london-3', title: 'British Museum', description: 'Tesouros de todas as civilizações', image: 'https://images.unsplash.com/photo-1574248308584-f4fd8ebff5b5?w=400&h=300&fit=crop', icon: 'museum' },
        ],
        'Rome': [
            { id: 'rome-1', title: 'Coliseu', description: 'O maior anfiteatro do mundo antigo', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop', icon: 'stadium' },
            { id: 'rome-2', title: 'Vaticano', description: 'Centro espiritual do catolicismo', image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&h=300&fit=crop', icon: 'church' },
            { id: 'rome-3', title: 'Fontana di Trevi', description: 'A fonte mais famosa do mundo', image: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=400&h=300&fit=crop', icon: 'water_drop' },
        ],
        'New York': [
            { id: 'ny-1', title: 'Estátua da Liberdade', description: 'Símbolo da liberdade e democracia', image: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=400&h=300&fit=crop', icon: 'attractions' },
            { id: 'ny-2', title: 'Central Park', description: 'Oásis verde no coração de Manhattan', image: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&h=300&fit=crop', icon: 'park' },
            { id: 'ny-3', title: 'Times Square', description: 'O cruzamento do mundo', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop', icon: 'wb_twilight' },
        ],
        'Barcelona': [
            { id: 'bcn-1', title: 'Sagrada Família', description: 'Obra-prima inacabada de Gaudí', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop', icon: 'church' },
            { id: 'bcn-2', title: 'Park Güell', description: 'Jardins coloridos de mosaicos', image: 'https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=400&h=300&fit=crop', icon: 'park' },
            { id: 'bcn-3', title: 'La Rambla', description: 'Passeio vibrante no coração da cidade', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', icon: 'directions_walk' },
        ],
        'Amsterdam': [
            { id: 'ams-1', title: 'Canais de Amsterdam', description: 'Patrimônio UNESCO e passeios de barco', image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=300&fit=crop', icon: 'sailing' },
            { id: 'ams-2', title: 'Museu Van Gogh', description: 'A maior coleção do pintor holandês', image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=400&h=300&fit=crop', icon: 'palette' },
            { id: 'ams-3', title: 'Casa de Anne Frank', description: 'Museu histórico da Segunda Guerra', image: 'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=400&h=300&fit=crop', icon: 'history_edu' },
        ],
        'Napoli': [
            { id: 'napoli-1', title: 'Pompeia', description: 'Ruínas preservadas pelo Vesúvio', image: 'https://images.unsplash.com/photo-1594735649946-48bf0cc31abe?w=400&h=300&fit=crop', icon: 'account_balance' },
            { id: 'napoli-2', title: 'Costa Amalfitana', description: 'Vilas coloridas à beira-mar', image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=400&h=300&fit=crop', icon: 'beach_access' },
            { id: 'napoli-3', title: 'Pizza Napoletana', description: 'Berço da pizza original italiana', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', icon: 'local_pizza' },
        ],
    };

    // Generate highlights based on cities
    const generateHighlights = (): TripHighlight[] => {
        if (cities.length === 0) return [];

        const highlights: TripHighlight[] = [];

        cities.forEach(city => {
            const cityName = city.name;
            const cityHighlights = cityHighlightsDB[cityName];

            if (cityHighlights) {
                // Add up to 2 highlights per city
                highlights.push(...cityHighlights.slice(0, 2));
            } else {
                // Generic highlight for unknown cities
                highlights.push({
                    id: `generic-${city.id}`,
                    title: `Explore ${cityName}`,
                    description: `Descubra as maravilhas e cultura local de ${cityName}`,
                    image: city.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
                    icon: 'explore'
                });
            }
        });

        // Limit to 4 highlights max for display
        return highlights.slice(0, 4);
    };

    const highlights = generateHighlights();

    if (highlights.length === 0) return null;

    return (
        <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="size-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-text-main dark:text-white">Destaques da Viagem</h4>
                    <p className="text-sm text-text-muted dark:text-gray-400">Experiências imperdíveis que definem esta aventura</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {highlights.map(highlight => (
                    <div
                        key={highlight.id}
                        className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer"
                    >
                        <img
                            src={highlight.image}
                            alt={highlight.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="material-symbols-outlined text-amber-400 text-sm">{highlight.icon}</span>
                                <h5 className="font-bold text-white text-sm truncate">{highlight.title}</h5>
                            </div>
                            <p className="text-xs text-white/80 line-clamp-2">{highlight.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const AlertsSection: React.FC = () => {
    if (TRIP_ALERTS.length === 0) return null;

    const getAlertStyles = (type: TripAlert['type']) => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
                    icon: 'text-rose-600 dark:text-rose-400',
                    title: 'text-rose-800 dark:text-rose-300',
                    text: 'text-rose-700 dark:text-rose-400'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
                    icon: 'text-amber-600 dark:text-amber-400',
                    title: 'text-amber-800 dark:text-amber-300',
                    text: 'text-amber-700 dark:text-amber-400'
                };
            case 'info':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                    icon: 'text-blue-600 dark:text-blue-400',
                    title: 'text-blue-800 dark:text-blue-300',
                    text: 'text-blue-700 dark:text-blue-400'
                };
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="size-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">warning</span>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-text-main dark:text-white">Alertas e Avisos</h4>
                    <p className="text-sm text-text-muted dark:text-gray-400">Informações importantes para sua viagem</p>
                </div>
            </div>

            <div className="space-y-3">
                {TRIP_ALERTS.map(alert => {
                    const styles = getAlertStyles(alert.type);
                    return (
                        <div
                            key={alert.id}
                            className={`flex items-start gap-4 p-4 rounded-xl border ${styles.bg}`}
                        >
                            <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${styles.icon} bg-white/50 dark:bg-black/20`}>
                                <span className="material-symbols-outlined text-xl">{alert.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${styles.title}`}>{alert.title}</p>
                                <p className={`text-sm mt-0.5 ${styles.text}`}>{alert.message}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

// =============================================================================
// Sub-Components: Sidebar
// =============================================================================

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
    const initialTasks = useMemo(() => getInitialTasks().map(t => ({ ...t, deadline: t.deadline || '' })), []);
    const [tasks, setTasks] = React.useState(initialTasks);

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
                {pendingTasks.map(task => (
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
                ))}
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

const OverviewTab: React.FC<OverviewTabProps> = ({ trip, expenses, cities, hotels, transports, totalBudget, onInvite, onCityClick, onAddCity }) => {
    const [showAnimatedMap, setShowAnimatedMap] = useState(false);
    const [realStops, setRealStops] = useState<ItineraryStop[]>([]);
    const [isLoadingStops, setIsLoadingStops] = useState(false);

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

                setRealStops(uniqueStops.length > 0 ? uniqueStops : DEMO_STOPS);
                setIsLoadingStops(false);
            };

            generateStops();
        }
    }, [showAnimatedMap, cities, transports]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* NEW HEADER SECTION */}
            <div className="space-y-6">
                {/* Timeline + Animated Map Row (with Quem Vai + Coverage on right) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Timeline Row */}
                        <MacroTimeline cities={cities} onCityClick={onCityClick} onAddCity={onAddCity} />
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

                {/* Third Row: Checklist on left + Luggage on right */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <TripChecklist />
                    </div>
                    <div className="lg:col-span-1">
                        <LuggageChecklist />
                    </div>
                </div>
            </div>

            {/* Fourth Row: Trip Highlights (Full Width) */}
            <TripHighlights cities={cities} />

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
                                        stops={realStops.length > 0 ? realStops : DEMO_STOPS}
                                        animationSpeed={5}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default OverviewTab;
