import React, { useState, useMemo, useEffect } from 'react';
import { ItineraryDay, Activity, ItineraryActivity, ItineraryActivityType, HotelReservation, Transport } from '../../../types';
import { Button, Card } from '../../ui/Base';
import { getGeminiService } from '../../../services/geminiService';
import AddActivityModal from '../modals/AddActivityModal';
import ActivityDetailsModal from '../modals/ActivityDetailsModal';
import { formatDate, parseDisplayDate } from '../../../lib/dateUtils';

interface ItineraryViewProps {
    itinerary: ItineraryDay[];
    activities: Activity[];
    isGenerating: boolean;
    onGenerate: () => void;
    onAddActivity?: (activity: Omit<ItineraryActivity, 'id'>) => void;
    onOpenAddActivityModal?: (day: number, date: string) => void;
    // New props for integration
    tripStartDate?: string;
    tripEndDate?: string;
    hotels?: HotelReservation[];
    transports?: Transport[];
    cities?: { name: string; arrivalDate: string | Date; departureDate: string | Date }[];
    customActivities?: ItineraryActivity[];
    onUpdateCustomActivities?: (activities: ItineraryActivity[]) => void;
}

// Activity type configuration for colors and icons
const activityTypeConfig: Record<ItineraryActivityType, { icon: string; label: string; bgColor: string; textColor: string; dotColor: string }> = {
    transport: { icon: 'flight', label: 'Transporte', bgColor: 'bg-blue-100', textColor: 'text-blue-700', dotColor: 'bg-blue-500' },
    accommodation: { icon: 'hotel', label: 'Acomodação', bgColor: 'bg-indigo-100', textColor: 'text-indigo-700', dotColor: 'bg-indigo-500' },
    meal: { icon: 'restaurant', label: 'Refeição', bgColor: 'bg-orange-100', textColor: 'text-orange-700', dotColor: 'bg-orange-500' },
    food: { icon: 'restaurant', label: 'Gastronomia', bgColor: 'bg-orange-100', textColor: 'text-orange-700', dotColor: 'bg-orange-500' },
    sightseeing: { icon: 'photo_camera', label: 'Passeio', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500' },
    culture: { icon: 'museum', label: 'Cultura', bgColor: 'bg-purple-100', textColor: 'text-purple-700', dotColor: 'bg-purple-500' },
    nature: { icon: 'park', label: 'Natureza', bgColor: 'bg-green-100', textColor: 'text-green-700', dotColor: 'bg-green-500' },
    shopping: { icon: 'shopping_bag', label: 'Compras', bgColor: 'bg-pink-100', textColor: 'text-pink-700', dotColor: 'bg-pink-500' },
    nightlife: { icon: 'local_bar', label: 'Vida Noturna', bgColor: 'bg-slate-100', textColor: 'text-slate-700', dotColor: 'bg-slate-500' },
    other: { icon: 'star', label: 'Outro', bgColor: 'bg-gray-100', textColor: 'text-gray-700', dotColor: 'bg-gray-500' },
};

// Demo itinerary data
const demoItinerary: (ItineraryDay & { itineraryActivities: ItineraryActivity[] })[] = [];

const ItineraryView: React.FC<ItineraryViewProps> = ({
    itinerary,
    activities,
    isGenerating,
    onGenerate,
    onOpenAddActivityModal,
    tripStartDate,
    tripEndDate,
    hotels = [],
    transports = [],
    cities = [],
    customActivities = [],
    onUpdateCustomActivities,
}) => {
    const [selectedDay, setSelectedDay] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ItineraryActivity | null>(null);
    const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

    // Details Modal State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedActivityForDetails, setSelectedActivityForDetails] = useState<ItineraryActivity | null>(null);

    const openDetailsModal = (activity: ItineraryActivity) => {
        setSelectedActivityForDetails(activity);
        setDetailsModalOpen(true);
    };

    const handleJournalEntry = (activity: ItineraryActivity) => {
        // Future: Open Journal Modal pre-filled with this activity context
        alert(`Abrir diário para avaliar: ${activity.title}`);
    };

    // Generate itinerary days from trip dates with integrated data
    const generatedItinerary = useMemo(() => {
        if (!tripStartDate || !tripEndDate) return demoItinerary;

        // Use new Date directly if YYYY-MM-DD, or parseDisplayDate helper if DD/MM/YYYY
        const startStr = tripStartDate.includes('/') ? parseDisplayDate(tripStartDate) : tripStartDate;
        const endStr = tripEndDate.includes('/') ? parseDisplayDate(tripEndDate) : tripEndDate;

        const start = new Date(startStr + 'T00:00:00'); // Ensure local time midnight
        const end = new Date(endStr + 'T00:00:00');
        const days: (ItineraryDay & { itineraryActivities: ItineraryActivity[] })[] = [];

        let dayNumber = 1;
        const current = new Date(start);

        while (current <= end) {
            const dateStr = formatDate(current.toISOString().split('T')[0]); // Use shared formatDate which expects YYYY-MM-DD or date string

            // Determine city for this day
            const currentCity = cities.find(c => {
                const arr = new Date(c.arrivalDate);
                const dep = new Date(c.departureDate);
                // Simple inclusion check
                const currDate = new Date(dateStr + 'T00:00:00'); // Ensuring comparable time
                const arrDate = new Date(arr.toISOString().split('T')[0] + 'T00:00:00');
                const depDate = new Date(dep.toISOString().split('T')[0] + 'T00:00:00');
                return currDate >= arrDate && currDate <= depDate;
            });

            const dayActivities: ItineraryActivity[] = [];

            // Add check-in activities for hotels
            hotels.forEach(hotel => {
                if (hotel.checkIn === dateStr) {
                    dayActivities.push({
                        id: `hotel-checkin-${hotel.id}`,
                        day: dayNumber,
                        date: dateStr,
                        time: hotel.checkInTime || '15:00',
                        title: `Check-in: ${hotel.name}`,
                        location: hotel.address,
                        type: 'accommodation',
                        completed: false,
                        notes: `Confirmação: ${hotel.confirmation}`,
                        image: hotel.image,
                    });
                }
                if (hotel.checkOut === dateStr) {
                    dayActivities.push({
                        id: `hotel-checkout-${hotel.id}`,
                        day: dayNumber,
                        date: dateStr,
                        time: hotel.checkOutTime || '11:00',
                        title: `Check-out: ${hotel.name}`,
                        location: hotel.address,
                        type: 'accommodation',
                        completed: false,
                        notes: `Confirmação: ${hotel.confirmation}`,
                    });
                }
            });

            // Add transport activities
            transports.forEach(transport => {
                if (transport.departureDate === dateStr) {
                    dayActivities.push({
                        id: `transport-${transport.id}`,
                        day: dayNumber,
                        date: dateStr,
                        time: transport.departureTime,
                        title: `${transport.operator} ${transport.reference}`,
                        location: transport.departureLocation,
                        locationDetail: transport.route || `→ ${transport.arrivalLocation}`,
                        type: 'transport',
                        completed: false,
                        notes: transport.class ? `Classe: ${transport.class}${transport.seat ? ` | Assento: ${transport.seat}` : ''}` : undefined,
                    });
                }
            });

            // Add custom activities (from City Guide / persisted manual additions)
            const dateCustomActivities = customActivities.filter(a => a.date === dateStr);
            dateCustomActivities.forEach(act => {
                dayActivities.push(act);
            });

            // Sort activities by time
            dayActivities.sort((a, b) => a.time.localeCompare(b.time));

            days.push({
                day: dayNumber,
                title: `Dia ${dayNumber}`,
                date: dateStr,
                city: currentCity?.name || '',
                activities: [],
                itineraryActivities: dayActivities,
            });

            current.setDate(current.getDate() + 1);
            dayNumber++;
        }

        return days;
    }, [tripStartDate, tripEndDate, hotels, transports, cities, customActivities]);

    // Use generated itinerary if available, otherwise use local state
    const [itineraryData, setItineraryData] = useState(demoItinerary);

    useEffect(() => {
        if (generatedItinerary.length > 0) {
            setItineraryData(generatedItinerary);
        }
    }, [generatedItinerary]);

    // Get current day data
    const currentDayData = useMemo(() => {
        return itineraryData.find(d => d.day === selectedDay) || itineraryData[0];
    }, [selectedDay, itineraryData]);

    // Toggle activity completion
    const toggleActivityComplete = (activityId: string) => {
        setItineraryData(prev => prev.map(day => ({
            ...day,
            itineraryActivities: day.itineraryActivities.map(act =>
                act.id === activityId ? { ...act, completed: !act.completed } : act
            )
        })));
    };

    // Generate image for activity
    const generateActivityImage = async (activityId: string) => {
        const activity = currentDayData?.itineraryActivities.find(a => a.id === activityId);
        if (!activity) return;

        // Set generating state
        setItineraryData(prev => prev.map(day => ({
            ...day,
            itineraryActivities: day.itineraryActivities.map(act =>
                act.id === activityId ? { ...act, isGeneratingImage: true } : act
            )
        })));

        try {
            const prompt = `${activity.title}, ${activity.location}, Japan travel photography, beautiful landscape`;
            const imageUrl = await getGeminiService().generateImage(prompt);

            setItineraryData(prev => prev.map(day => ({
                ...day,
                itineraryActivities: day.itineraryActivities.map(act =>
                    act.id === activityId ? { ...act, image: imageUrl || undefined, isGeneratingImage: false } : act
                )
            })));
        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            setItineraryData(prev => prev.map(day => ({
                ...day,
                itineraryActivities: day.itineraryActivities.map(act =>
                    act.id === activityId ? { ...act, isGeneratingImage: false } : act
                )
            })));
        }
    };

    // Add new activity
    const handleAddActivity = (newActivity: Omit<ItineraryActivity, 'id'>) => {
        const id = `a-${Math.random().toString(36).substr(2, 9)}`;
        setItineraryData(prev => prev.map(day => {
            if (day.day === newActivity.day) {
                return {
                    ...day,
                    itineraryActivities: [...day.itineraryActivities, { ...newActivity, id }].sort((a, b) => a.time.localeCompare(b.time))
                };
            }
            return day;
        }));
        setIsAddModalOpen(false);
    };

    // Edit existing activity
    const handleEditActivity = (updatedActivity: ItineraryActivity) => {
        setItineraryData(prev => prev.map(day => ({
            ...day,
            itineraryActivities: day.itineraryActivities.map(act =>
                act.id === updatedActivity.id ? updatedActivity : act
            ).sort((a, b) => a.time.localeCompare(b.time))
        })));
        setEditingActivity(null);
        setIsAddModalOpen(false);
    };

    // Remove activity
    const handleRemoveActivity = (activityId: string) => {
        // Check if it's a custom activity
        if (customActivities.some(a => a.id === activityId) && onUpdateCustomActivities) {
            onUpdateCustomActivities(customActivities.filter(a => a.id !== activityId));
        }

        setItineraryData(prev => prev.map(day => ({
            ...day,
            itineraryActivities: day.itineraryActivities.filter(act => act.id !== activityId)
        })));
        setDeletingActivityId(null);
    };

    // Open edit modal
    const openEditModal = (activity: ItineraryActivity) => {
        setEditingActivity(activity);
        setIsAddModalOpen(true);
    };

    // Close modal and reset editing state
    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingActivity(null);
    };

    const [expandedDay, setExpandedDay] = useState<number | null>(1);

    // Toggle day expansion
    const toggleDay = (dayNumber: number) => {
        setExpandedDay(prev => prev === dayNumber ? null : dayNumber);
    };

    // =============================================================================
    // Filter Logic
    // =============================================================================
    const [filterType, setFilterType] = useState<'tudo' | 'reservas' | 'restaurantes' | 'vida_noturna' | 'passeios' | 'compras' | 'outros'>('tudo');
    const [searchQuery, setSearchQuery] = useState('');

    const getCategoryForType = (type: ItineraryActivityType): 'reservas' | 'restaurantes' | 'vida_noturna' | 'passeios' | 'compras' | 'outros' => {
        // Reservas (Logistics)
        if (['transport', 'accommodation', 'check-in', 'check-out'].includes(type) || type === 'accommodation' || type === 'transport') return 'reservas';

        // Food
        if (['food', 'meal'].includes(type)) return 'restaurantes';

        // Nightlife
        if (type === 'nightlife') return 'vida_noturna';

        // Sightseeing / Tours
        if (['sightseeing', 'culture', 'nature', 'tour'].includes(type)) return 'passeios';

        // Shopping
        if (type === 'shopping') return 'compras';

        return 'outros';
    };

    const filteredItinerary = useMemo(() => {
        return itineraryData.map(day => {
            const filteredActivities = day.itineraryActivities.filter(activity => {
                // Type Filter
                if (filterType !== 'tudo') {
                    if (getCategoryForType(activity.type) !== filterType) return false;
                }

                // Search Filter
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const matchesTitle = activity.title.toLowerCase().includes(query);
                    const matchesLocation = activity.location?.toLowerCase().includes(query);
                    const matchesNotes = activity.notes?.toLowerCase().includes(query);

                    if (!matchesTitle && !matchesLocation && !matchesNotes) return false;
                }

                return true;
            });

            return {
                ...day,
                itineraryActivities: filteredActivities
            };
        }).filter(day => day.itineraryActivities.length > 0 || filterType === 'tudo');
    }, [itineraryData, filterType, searchQuery]);

    const filterTabs = [
        { id: 'tudo', label: 'Tudo' },
        { id: 'reservas', label: 'Reservas' },
        { id: 'restaurantes', label: 'Restaurantes' },
        { id: 'vida_noturna', label: 'Vida Noturna' },
        { id: 'passeios', label: 'Passeios' },
        { id: 'compras', label: 'Compras' },
        { id: 'outros', label: 'Outros' },
    ] as const;


    return (
        <div className="animate-in fade-in duration-300 space-y-4 pb-20">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 sticky top-0 z-20 backdrop-blur-sm">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto px-1">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterType(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap ${filterType === tab.id
                                ? 'bg-text-main text-white'
                                : 'bg-white text-text-muted hover:bg-gray-100 border border-gray-200/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
                    {/* Search */}
                    <div className="relative hidden md:block w-48">
                        <span className="material-symbols-outlined absolute left-2.5 top-2 text-gray-400 text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200/50 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    {/* Sort */}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200/50 hover:bg-gray-50 text-xs font-bold text-text-muted transition-all shadow-sm">
                        <span className="material-symbols-outlined text-base">swap_vert</span>
                        <span className="hidden sm:inline">Data</span>
                    </button>

                    {/* View Toggle */}
                    <div className="flex bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                        <button className="p-1 rounded-lg bg-gray-100 text-text-main transition-all shadow-sm">
                            <span className="material-symbols-outlined text-lg">list</span>
                        </button>
                        <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
                            <span className="material-symbols-outlined text-lg">grid_view</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Search (Below bar on small screens if needed, but for now hidden on mobile or just wrapped) */}

            {filteredItinerary.map((day) => {
                const isExpanded = expandedDay === day.day;
                const hasActivities = day.itineraryActivities.length > 0;

                return (
                    <div key={day.day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                        {/* Day Header - Click to toggle */}
                        <div
                            onClick={() => toggleDay(day.day)}
                            className={`flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50/50' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex flex-col items-center justify-center size-12 rounded-xl border transition-colors ${isExpanded
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                    : 'bg-white text-text-main border-gray-200'
                                    }`}>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isExpanded ? 'text-white/80' : 'text-text-muted'}`}>Dia</span>
                                    <span className="text-xl font-black leading-none">{day.day}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-main">{day.date}</h3>
                                    <p className="text-sm text-text-muted flex items-center gap-1">
                                        {day.city ? (
                                            <>
                                                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                                <span className="font-medium text-text-main">{day.city}</span>
                                                <span className="text-gray-300 mx-1">•</span>
                                            </>
                                        ) : (
                                            <span className="material-symbols-outlined text-sm text-gray-400">flag</span>
                                        )}
                                        <span>{hasActivities ? `${day.itineraryActivities.length} atividades` : 'Destino da Viagem'}</span>
                                    </p>
                                </div>
                            </div>
                            <div className={`size-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-gray-200' : 'bg-gray-100'}`}>
                                <span className="material-symbols-outlined text-text-muted">keyboard_arrow_down</span>
                            </div>
                        </div>

                        {/* Accordion Body */}
                        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                            <div className="overflow-hidden">
                                <div className="p-5 pt-0 border-t border-gray-100">
                                    <div className="space-y-3 mt-4">
                                        {hasActivities ? (
                                            day.itineraryActivities.map((activity) => {
                                                const config = activityTypeConfig[activity.type];
                                                const hour = parseInt(activity.time.split(':')[0]);
                                                const period = hour < 12 ? 'Manhã' : hour < 18 ? 'Tarde' : 'Noite';

                                                return (
                                                    <div key={activity.id} className="group flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all bg-white">
                                                        {/* Left: Time & Type Decoration */}
                                                        <div className="flex flex-col items-center gap-2 min-w-[70px] border-r border-gray-100 pr-4">
                                                            <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}>
                                                                {activity.time}
                                                            </div>
                                                            <div className="flex-1 w-0.5 bg-gray-100 rounded-full my-1 group-hover:bg-gray-200 transition-colors" />
                                                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${config.bgColor} text-${config.textColor}`}>
                                                                <span className={`material-symbols-outlined text-lg ${config.textColor}`}>{config.icon}</span>
                                                            </div>
                                                        </div>

                                                        {/* Right: Content */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Header */}
                                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{period} • {config.label}</span>
                                                                        {activity.completed && (
                                                                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                                                                <span className="material-symbols-outlined text-[10px]">check</span>
                                                                                Feito
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <h4 className={`font-bold text-text-main leading-tight ${activity.completed ? 'line-through text-text-muted' : ''}`}>
                                                                        {activity.title}
                                                                    </h4>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleActivityComplete(activity.id); }}
                                                                    className={`size-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${activity.completed
                                                                        ? 'bg-green-500 border-green-500 text-white'
                                                                        : 'border-gray-200 text-gray-300 hover:border-green-400 hover:text-green-400'
                                                                        }`}
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                                </button>
                                                            </div>

                                                            {/* Details */}
                                                            {activity.location && (
                                                                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
                                                                    <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                                                                    <span className="truncate">{activity.location}</span>
                                                                    {activity.locationDetail && (
                                                                        <>
                                                                            <span className="text-gray-300">•</span>
                                                                            <span className="truncate">{activity.locationDetail}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Notes */}
                                                            {activity.notes && (
                                                                <div className="p-2 bg-gray-50 rounded-lg text-xs text-gray-600 italic border border-gray-100 mb-2">
                                                                    {activity.notes}
                                                                </div>
                                                            )}

                                                            {/* Image */}
                                                            {activity.image && (
                                                                <div className="rounded-lg overflow-hidden mb-2 relative group/image h-32 w-full">
                                                                    <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent p-3 flex items-end">
                                                                        <span className="text-[10px] text-white font-medium bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full">Foto IA</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        </div>

                                                        {/* Actions Bar - Enhanced */}
                                                        {/* Actions Bar */}
                                                        <div className="flex items-center flex-wrap gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {/* Google Maps Link */}
                                                            <a
                                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((activity.location || activity.title) + (day.city ? ` ${day.city}` : ''))}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">directions</span>
                                                                Como chegar
                                                            </a>

                                                            {/* Details Button */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openDetailsModal(activity); }}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">info</span>
                                                                Detalhes
                                                            </button>

                                                            {/* Journal/Review Button */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleJournalEntry(activity); }}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">rate_review</span>
                                                                Avaliar
                                                            </button>

                                                            {/* Generate Photo Button */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); generateActivityImage(activity.id); }}
                                                                disabled={activity.isGeneratingImage}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                                                            >
                                                                <span className={`material-symbols-outlined text-xs ${activity.isGeneratingImage ? 'animate-spin' : ''}`}>
                                                                    {activity.isGeneratingImage ? 'progress_activity' : 'auto_awesome'}
                                                                </span>
                                                                {activity.isGeneratingImage ? 'Gerando...' : 'Gerar Foto'}
                                                            </button>

                                                            {/* Edit Button */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openEditModal(activity); }}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">edit</span>
                                                                Editar
                                                            </button>

                                                            {/* Delete Button */}
                                                            {deletingActivityId === activity.id ? (
                                                                <div className="flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-right-2">
                                                                    <button onClick={() => handleRemoveActivity(activity.id)} className="size-6 bg-rose-500 text-white rounded flex items-center justify-center hover:bg-rose-600 shadow-sm"><span className="material-symbols-outlined text-[10px]">check</span></button>
                                                                    <button onClick={() => setDeletingActivityId(null)} className="size-6 bg-gray-200 text-gray-600 rounded flex items-center justify-center hover:bg-gray-300"><span className="material-symbols-outlined text-[10px]">close</span></button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDeletingActivityId(activity.id); }}
                                                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">delete</span>
                                                                    Remover
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <div className="size-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-300">
                                                    <span className="material-symbols-outlined text-2xl">event_busy</span>
                                                </div>
                                                <p className="text-sm text-text-muted font-medium">Nenhuma atividade planejada</p>
                                                <button
                                                    onClick={() => onOpenAddActivityModal ? onOpenAddActivityModal(day.day, day.date) : setIsAddModalOpen(true)}
                                                    className="text-xs font-bold text-primary hover:underline mt-1"
                                                >
                                                    Adicionar a primeira
                                                </button>
                                            </div>
                                        )}

                                        {/* Add Activity Button (Bottom of list) */}
                                        {hasActivities && (
                                            <button
                                                onClick={() => onOpenAddActivityModal ? onOpenAddActivityModal(day.day, day.date) : setIsAddModalOpen(true)}
                                                className="w-full flex items-center justify-center gap-2 p-3 mt-2 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group"
                                            >
                                                <div className="size-6 rounded-full bg-gray-100 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                </div>
                                                <span className="text-xs font-bold">Adicionar atividade no Dia {day.day}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Empty State if no days generated */}
            {
                itineraryData.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-text-muted">Nenhum dia de itinerário gerado.</p>
                    </div>
                )
            }

            {/* Add/Edit Activity Modal */}
            <AddActivityModal
                isOpen={isAddModalOpen}
                onClose={closeModal}
                onAdd={handleAddActivity}
                onEdit={handleEditActivity}
                selectedDay={editingActivity?.day || expandedDay || 1}
                selectedDate={editingActivity?.date || itineraryData.find(d => d.day === expandedDay)?.date || ''}
                editingActivity={editingActivity}
            />
            {/* Details Modal */}
            <ActivityDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                title={selectedActivityForDetails?.title || ''}
                location={selectedActivityForDetails?.location}
                type={selectedActivityForDetails ? activityTypeConfig[selectedActivityForDetails.type]?.label : ''}
            />
        </div >
    );
};

export default ItineraryView;
