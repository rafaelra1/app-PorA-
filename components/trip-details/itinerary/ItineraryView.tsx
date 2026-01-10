import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { ItineraryDay, Activity, ItineraryActivity, ItineraryActivityType, HotelReservation, Transport } from '../../../types';
import { Button, Card, Skeleton, SkeletonText } from '../../ui/Base';
import { getGeminiService } from '../../../services/geminiService';
import AddActivityModal from '../modals/AddActivityModal';
import ActivityDetailsModal from '../modals/ActivityDetailsModal';
import { JournalEntryModal } from '../modals/JournalEntryModal';
import { formatDate, parseDisplayDate } from '../../../lib/dateUtils';
import { generateItineraryFromDocuments, identifyItineraryGaps } from '../../../services/itineraryGenerationService';
import { useNotifications } from '../../../contexts/NotificationContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
    UniqueIdentifier
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { ItineraryActivityItem } from './ItineraryActivityItem';

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
    onDeleteActivity?: (id: string) => void;
    onUpdateActivity?: (activity: ItineraryActivity) => void;
    onUpdateCustomActivities?: (activities: ItineraryActivity[]) => void;
    isLoading?: boolean;
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
    onDeleteActivity,
    onUpdateActivity,
    onAddActivity,
    isLoading,
}) => {
    const [selectedDay, setSelectedDay] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ItineraryActivity | null>(null);
    const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
    const [isSyncingDocs, setIsSyncingDocs] = useState(false);
    const { preferences } = useNotifications();

    const handleSyncDocuments = async () => {
        if (!tripStartDate || isSyncingDocs) return;
        setIsSyncingDocs(true);
        try {
            const newActivities = generateItineraryFromDocuments(
                'current-trip',
                tripStartDate,
                {
                    documents: [], // Since we have entities, we primarily use those
                    transports,
                    accommodations: hotels,
                    carRentals: []
                }
            );

            // Merge with existing activities (avoid duplicates by documentId)
            const existingIds = new Set(customActivities.map(a => a.id));
            const toAdd = newActivities.filter(a => !existingIds.has(a.id));

            if (toAdd.length > 0 && onAddActivity) {
                for (const act of toAdd) {
                    await onAddActivity(act);
                }
            }
        } finally {
            setIsSyncingDocs(false);
        }
    };

    const handleFillGaps = async (day: number, date: string) => {
        if (isSyncingDocs) return;
        setIsSyncingDocs(true);
        try {
            const destination = cities.find(c => {
                const arr = new Date(c.arrivalDate);
                const dep = new Date(c.departureDate);
                const currDate = new Date(date + 'T00:00:00');
                return currDate >= arr && currDate <= dep;
            })?.name || 'seu destino';

            const existing = currentDayData?.itineraryActivities || [];
            const suggestions = await getGeminiService().fillItineraryGaps(destination, date, existing);

            if (suggestions && suggestions.length > 0 && onAddActivity) {
                for (const sug of suggestions) {
                    await onAddActivity({
                        day,
                        date,
                        time: sug.time,
                        title: sug.title,
                        notes: sug.description,
                        type: sug.type as any,
                        location: sug.location,
                        completed: false
                    });
                }
            }
        } finally {
            setIsSyncingDocs(false);
        }
    };

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // DND Handle Drag End
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Find source and destination days
        const sourceDayIndex = itineraryData.findIndex(d => d.itineraryActivities.some(a => a.id === active.id));
        const destDayIndex = itineraryData.findIndex(d => d.itineraryActivities.some(a => a.id === over.id));

        if (sourceDayIndex === -1 || destDayIndex === -1) return;

        const sourceDay = itineraryData[sourceDayIndex];
        const destDay = itineraryData[destDayIndex];

        const activeActivity = sourceDay.itineraryActivities.find(a => a.id === active.id);
        if (!activeActivity) return;

        // Calculate new index
        const oldIndex = sourceDay.itineraryActivities.findIndex(a => a.id === active.id);
        const newIndex = destDay.itineraryActivities.findIndex(a => a.id === over.id);

        if (sourceDayIndex === destDayIndex) {
            // Same day reordering
            const newActivities: ItineraryActivity[] = arrayMove(sourceDay.itineraryActivities, oldIndex, newIndex);

            // Calculate new time
            let newTime = activeActivity.time;
            const prevActivity = newActivities[newIndex - 1] as ItineraryActivity | undefined;
            const nextActivity = newActivities[newIndex + 1] as ItineraryActivity | undefined;

            if (prevActivity && nextActivity) {
                // Average time
                const prevMinutes = parseInt(prevActivity.time.split(':')[0]) * 60 + parseInt(prevActivity.time.split(':')[1]);
                const nextMinutes = parseInt(nextActivity.time.split(':')[0]) * 60 + parseInt(nextActivity.time.split(':')[1]);
                const avgMinutes = Math.floor((prevMinutes + nextMinutes) / 2);
                const h = Math.floor(avgMinutes / 60).toString().padStart(2, '0');
                const m = (avgMinutes % 60).toString().padStart(2, '0');
                newTime = `${h}:${m}`;
            } else if (prevActivity) {
                // Add 30 mins
                const prevMinutes = parseInt(prevActivity.time.split(':')[0]) * 60 + parseInt(prevActivity.time.split(':')[1]);
                const newMinutes = prevMinutes + 30;
                const h = Math.floor(newMinutes / 60).toString().padStart(2, '0');
                const m = (newMinutes % 60).toString().padStart(2, '0');
                newTime = `${h}:${m}`;
            } else if (nextActivity) {
                // Subtract 30 mins
                const nextMinutes = parseInt(nextActivity.time.split(':')[0]) * 60 + parseInt(nextActivity.time.split(':')[1]);
                const newMinutes = Math.max(0, nextMinutes - 30);
                const h = Math.floor(newMinutes / 60).toString().padStart(2, '0');
                const m = (newMinutes % 60).toString().padStart(2, '0');
                newTime = `${h}:${m}`;
            }

            // Optimistic update
            const updatedActivity = { ...activeActivity, time: newTime };
            setItineraryData(prev => {
                const newData = [...prev];
                newData[sourceDayIndex] = {
                    ...sourceDay,
                    itineraryActivities: newActivities.map(a => a.id === active.id ? updatedActivity : a)
                };
                return newData;
            });

            // Persist
            if (onUpdateActivity) {
                onUpdateActivity(updatedActivity);
            }
        } else {
            // Moved to another day
            // This is trickier with simple list sortable. 
            // We'll skip cross-day for now or implement if needed. 
            // Ideally we need to remove from source and add to dest.
        }
    };

    // Conflict Detection
    const detectConflicts = (activities: ItineraryActivity[]) => {
        const conflicts = new Set<string>();
        const sorted = [...activities].sort((a, b) => a.time.localeCompare(b.time));

        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            if (!current.duration) continue;

            const [h1, m1] = current.time.split(':').map(Number);
            const start1 = h1 * 60 + m1;
            const end1 = start1 + current.duration;

            for (let j = i + 1; j < sorted.length; j++) {
                const next = sorted[j];
                const [h2, m2] = next.time.split(':').map(Number);
                const start2 = h2 * 60 + m2;

                if (end1 > start2) {
                    conflicts.add(current.id);
                    conflicts.add(next.id);
                } else {
                    // Since sorted by time, subsequent activities will also start after this one ends (mostly)
                    // But wait, what if 'next' is very short? No, sorted by start time.
                    // If start2 >= end1, then all subsequent startN >= start2 >= end1.
                    // So we can break optimization.
                    break;
                }
            }
        }
        return conflicts;
    };

    // Details Modal State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedActivityForDetails, setSelectedActivityForDetails] = useState<ItineraryActivity | null>(null);

    // Journal Modal State
    const [journalModalOpen, setJournalModalOpen] = useState(false);
    const [selectedActivityForJournal, setSelectedActivityForJournal] = useState<ItineraryActivity | null>(null);

    const openDetailsModal = (activity: ItineraryActivity) => {
        setSelectedActivityForDetails(activity);
        setDetailsModalOpen(true);
    };

    const handleJournalEntry = (activity: ItineraryActivity) => {
        setSelectedActivityForJournal(activity);
        setJournalModalOpen(true);
    };

    const handleSaveJournalEntry = (entry: any) => {
        console.log('Saving journal entry:', entry, 'for activity:', selectedActivityForJournal);
        // TODO: Persist to Supabase or Context
        setJournalModalOpen(false);
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
                        time: transport.departureTime?.slice(0, 5),
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
            const dateCustomActivities = customActivities.filter(a => formatDate(a.date) === dateStr);
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
        if (onAddActivity) {
            onAddActivity(newActivity);
        } else {
            // Fallback for local state (demo mode)
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
        }
        setIsAddModalOpen(false);
    };

    // Edit existing activity
    const handleEditActivity = (updatedActivity: ItineraryActivity) => {
        if (onUpdateActivity) {
            onUpdateActivity(updatedActivity);
        } else {
            setItineraryData(prev => prev.map(day => ({
                ...day,
                itineraryActivities: day.itineraryActivities.map(act =>
                    act.id === updatedActivity.id ? updatedActivity : act
                ).sort((a, b) => a.time.localeCompare(b.time))
            })));
        }
        setEditingActivity(null);
        setIsAddModalOpen(false);
    };

    // Remove activity
    const handleRemoveActivity = (activityId: string) => {
        if (onDeleteActivity) {
            onDeleteActivity(activityId);
        } else if (customActivities.some(a => a.id === activityId) && onUpdateCustomActivities) {
            // Fallback
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


    if (isLoading) {
        return (
            <div className="space-y-4 pb-20 animate-in fade-in duration-300">
                {/* Global Filter Bar Skeleton */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-transparent p-1.5 rounded-2xl border border-gray-100">
                    <div className="flex gap-2 w-full md:w-auto overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} width={70} height={32} className="rounded-xl shrink-0" />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Skeleton width={120} height={32} className="rounded-xl hidden md:block" />
                        <Skeleton width={80} height={32} className="rounded-xl" />
                    </div>
                </div>

                {/* Day Skeletons */}
                {[1, 2].map(day => (
                    <div key={day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4">
                                <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton width={150} height={20} />
                                    <Skeleton width={100} height={14} />
                                </div>
                            </div>
                            <Skeleton variant="circular" width={32} height={32} />
                        </div>
                        <div className="p-5 pt-0 border-t border-gray-100 space-y-4 mt-4">
                            {[1, 2, 3].map(act => (
                                <div key={act} className="flex gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <Skeleton width={40} height={14} />
                                        <div className="w-0.5 h-16 bg-gray-100" />
                                    </div>
                                    <Card className="flex-1 p-4 border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton width="40%" height={16} />
                                                <Skeleton width="30%" height={12} />
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

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

                    {/* Smart Generate Button */}
                    <button
                        onClick={handleSyncDocuments}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold transition-all shadow-md active:scale-95 bubble-effect"
                    >
                        <span className="material-symbols-outlined text-base">auto_awesome</span>
                        Sincronizar Documentos
                    </button>
                </div>
            </div>

            {/* Mobile Search (Below bar on small screens if needed, but for now hidden on mobile or just wrapped) */}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {filteredItinerary.map((day) => {
                    const isExpanded = expandedDay === day.day;
                    const hasActivities = day.itineraryActivities.length > 0;
                    const conflicts = detectConflicts(day.itineraryActivities);

                    return (
                        <div
                            key={day.day}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 animate-slide-up"
                            style={{ animationDelay: `${day.day * 100}ms` }}
                        >
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
                                                <SortableContext
                                                    items={day.itineraryActivities.map(a => a.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {day.itineraryActivities.map((activity) => {
                                                        const config = activityTypeConfig[activity.type];
                                                        const hour = parseInt(activity.time.split(':')[0]);
                                                        const period = hour < 12 ? 'Manhã' : hour < 18 ? 'Tarde' : 'Noite';

                                                        return (
                                                            <ItineraryActivityItem
                                                                key={activity.id}
                                                                activity={activity}
                                                                dayCity={day.city}
                                                                config={config}
                                                                period={period}
                                                                onToggleComplete={toggleActivityComplete}
                                                                onDetails={openDetailsModal}
                                                                onReview={handleJournalEntry}
                                                                onGenerateImage={generateActivityImage}
                                                                onEdit={openEditModal}
                                                                onDelete={handleRemoveActivity}
                                                                deletingActivityId={deletingActivityId}
                                                                setDeletingActivityId={setDeletingActivityId}
                                                                isConflict={conflicts.has(activity.id)}
                                                            />
                                                        );
                                                    })}
                                                </SortableContext>
                                            ) : (
                                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    <div className="size-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-300">
                                                        <span className="material-symbols-outlined text-2xl">event_busy</span>
                                                    </div>
                                                    <p className="text-sm text-text-muted font-medium">Nenhuma atividade planejada</p>
                                                    <div className="flex flex-col gap-2 mt-3 items-center">
                                                        <button
                                                            onClick={() => onOpenAddActivityModal ? onOpenAddActivityModal(day.day, day.date) : setIsAddModalOpen(true)}
                                                            className="px-4 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-text-main hover:bg-gray-50 transition-all shadow-sm"
                                                        >
                                                            Manual
                                                        </button>
                                                        <button
                                                            onClick={() => handleFillGaps(day.day, day.date)}
                                                            className="px-4 py-1.5 rounded-xl bg-purple-50 text-purple-600 text-xs font-bold hover:bg-purple-100 transition-all flex items-center gap-1.5"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                            Sugerir com IA
                                                        </button>
                                                    </div>
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

            </DndContext>

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

            {/* Journal Modal */}
            <JournalEntryModal
                isOpen={journalModalOpen}
                onClose={() => setJournalModalOpen(false)}
                activity={selectedActivityForJournal}
                onSave={handleSaveJournalEntry}
            />
        </div >
    );
};

export default ItineraryView;
