import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Attraction, CityGuide, DiscoveryAttraction } from '../../../types';
import { Card, Badge } from '../../ui/Base';
import { Sparkles, Map, Plus, Search, Star, Heart, Clock, Ticket, MapPin, Loader2, ChevronLeft, ChevronRight, Info, Calendar, X, Camera, ExternalLink, Bookmark } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PlaceCard from './PlaceCard';
import ImportAttractionsModal from '../modals/ImportAttractionsModal';
import AttractionDetailModal from '../modals/AttractionDetailModal';
import AddToItineraryModal from '../modals/AddToItineraryModal';
import DiscoveryMode from './DiscoveryMode';
import { getGeminiService } from '../../../services/geminiService';
import { googlePlacesService } from '../../../services/googlePlacesService';
import discoveryService from '../../../services/discoveryService';

// Import animations
import '../../../styles/discovery-mode.css';

interface AttractionsTabProps {
    cityGuide: CityGuide | null;
    isLoadingGuide: boolean;
    attractionSearch: string;
    genAspectRatio: string;
    genSize: string;
    onSearchChange: (search: string) => void;
    onAspectRatioChange: (ratio: string) => void;
    onSizeChange: (size: string) => void;
    onAttractionClick: (attraction: Attraction) => void;
    onShowMap: () => void;
    onAddManual: () => void;
    onSuggestAI: (category: string) => void;
    isSuggestingAI: boolean;
    onTabChange?: (tab: 'info' | 'attractions' | 'gastronomy' | 'tips' | 'timeline' | 'map') => void;
    tripStartDate?: string;
    tripEndDate?: string;
    onAddToItinerary?: (data: { itemName: string; itemType: 'restaurant' | 'attraction' | 'custom'; date: string; time: string; notes?: string; address?: string; image?: string; category?: string }) => Promise<void>;
    cityName?: string;
}

const CATEGORY_FILTERS = [
    { id: 'all', label: 'Todas' },
    { id: 'history', label: 'Histórico' },
    { id: 'nature', label: 'Natureza' },
    { id: 'urban', label: 'Urbano' },
];

// Task Checklist Types
interface TouristTask {
    id: string;
    title: string;
    dueDate: string;
    icon: string;
    priority: 'urgent' | 'normal';
    completed: boolean;
}


interface TopAttraction {
    name: string;
    description: string;
    tags: { label: string; value: string }[];
    history_trivia: string;
    category: string;
}

// Helper to get icon and color based on category
const getCategoryIcon = (category: string = '') => {
    const cat = category.toLowerCase();

    // Nature & Outdoors
    if (cat.match(/parque|jardim|nature|floresta|montanha|trilh|praia|beach|garden|park/)) {
        return { icon: 'park', color: 'emerald' };
    }

    // History & Culture
    if (cat.match(/museu|galeria|museum|gallery|art|arte|cultura/)) {
        return { icon: 'museum', color: 'purple' };
    }
    if (cat.match(/históric|historic|antig|ancient|ruína|ruin|arqueol|archaeol/)) {
        return { icon: 'history_edu', color: 'amber' };
    }
    if (cat.match(/palácio|palace|castelo|castle|forte|fort/)) {
        return { icon: 'castle', color: 'rose' };
    }
    if (cat.match(/igreja|church|catedral|cathedral|templo|temple|religi|sagrad/)) {
        return { icon: 'church', color: 'indigo' };
    }

    // Urban & Entertainment
    if (cat.match(/praça|square|mercado|market|rua|street|avenida/)) {
        return { icon: 'storefront', color: 'orange' };
    }
    if (cat.match(/shop|compras|mall/)) {
        return { icon: 'shopping_bag', color: 'pink' };
    }
    if (cat.match(/teatro|theatre|cinema|show|espetáculo/)) {
        return { icon: 'theater_comedy', color: 'red' };
    }
    if (cat.match(/estádio|stadium|esporte|sport|arena/)) {
        return { icon: 'sports_soccer', color: 'blue' };
    }

    // Landmarks & Views
    if (cat.match(/mirante|view|vista|torre|tower|observat/)) {
        return { icon: 'visibility', color: 'cyan' };
    }
    if (cat.match(/monumento|monument|marco|landmark|estátua|statue/)) {
        return { icon: 'assistant_photo', color: 'slate' };
    }

    // Water
    if (cat.match(/rio|river|lago|lake|mar|sea|barco|boat|cruzeiro|cruise/)) {
        return { icon: 'sailing', color: 'blue' };
    }

    return { icon: 'attractions', color: 'indigo' };
};

const AttractionsTab: React.FC<AttractionsTabProps> = ({
    cityGuide,
    isLoadingGuide,
    attractionSearch,
    onSearchChange,
    onAttractionClick,
    onShowMap,
    onAddManual,
    onSuggestAI,
    isSuggestingAI,
    onTabChange,
    tripStartDate,
    tripEndDate,
    onAddToItinerary,
    cityName = 'esta cidade'
}) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [hasImported, setHasImported] = useState(false);

    // Discovery Mode State
    const [isDiscoveryMode, setIsDiscoveryMode] = useState(false);

    // Modal States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAddToItineraryOpen, setIsAddToItineraryOpen] = useState(false);

    const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
    const [importedAttractions, setImportedAttractions] = useLocalStorage<Attraction[]>(`imported_attractions_${cityName}`, []);
    const [excludedAttractions, setExcludedAttractions] = useLocalStorage<string[]>(`excluded_attractions_${cityName}`, []);

    // Top Attractions State
    const [topAttractions, setTopAttractions] = useLocalStorage<TopAttraction[]>(`porai_city_${cityName}_top_attractions`, []);
    const [isLoadingTopAttractions, setIsLoadingTopAttractions] = useState(false);
    const [selectedTopAttraction, setSelectedTopAttraction] = useState<TopAttraction | null>(null);

    // Store real images fetched from Google Places
    const [realImages, setRealImages] = useState<Record<string, string>>({});

    // Persistence: Load from localStorage
    useEffect(() => {
        if (importedAttractions.length > 0) {
            setHasImported(true);
        }
    }, [importedAttractions]);

    // Chat Box State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
        { role: 'model', text: `Olá! Sou seu guia turístico em ${cityName}. Pergunte-me sobre ingressos, horários, ou a história dos pontos turísticos!` }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    React.useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendChatMessage = async () => {
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsChatLoading(true);

        try {
            const service = getGeminiService();
            // Convert chat history format for service
            const history = chatMessages.map(m => ({ role: m.role, content: m.text }));

            // Pass simple trip context with city name to ensure relevant answers
            const response = await service.chat(userMsg, history, { destination: cityName });

            setChatMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            console.error('Error in chat:', error);
            setChatMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um problema ao processar sua pergunta. Tente novamente.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleDeleteAttraction = (attr: Attraction) => {
        // If it's an imported attraction, removing by name or unique ID if exists
        if (importedAttractions.some(a => a.name === attr.name)) {
            setImportedAttractions(prev => prev.filter(a => a.name !== attr.name));
        } else {
            // If it's from city guide, add to excluded list
            setExcludedAttractions(prev => [...prev, attr.name]);
        }
    };

    const handleAttractionClick = (attr: Attraction) => {
        setSelectedAttraction(attr);
        setIsDetailModalOpen(true);
    };

    const handleOpenAddToItinerary = (attr: Attraction) => {
        setSelectedAttraction(attr);
        setIsAddToItineraryOpen(true);
    };

    const handleConfirmItinerary = (data: any) => {
        if (onAddToItinerary && selectedAttraction) {
            onAddToItinerary({
                ...data,
                address: selectedAttraction.address || '',
                image: selectedAttraction.image,
                category: selectedAttraction.category
            });
        }
        setIsAddToItineraryOpen(false);
    };

    // Callback for saving discovery mode items
    const handleSaveDiscovery = (discoveryAttr: DiscoveryAttraction) => {
        const converted = discoveryService.convertToAttraction(discoveryAttr);

        // Add if not already present
        if (!importedAttractions.some(a => a.name === converted.name)) {
            setImportedAttractions(prev => [...prev, converted]);
            setHasImported(true);
        }
    };

    const handleTopAttractionAddToItinerary = () => {
        if (!selectedTopAttraction) return;

        // Convert TopAttraction to Attraction-like structure for the modal
        const attractionLike = {
            name: selectedTopAttraction.name,
            address: '',
            image: '', // Will let the modal handle image search or use placeholder
            category: selectedTopAttraction.category
        };

        setSelectedAttraction(attractionLike as any);
        setSelectedTopAttraction(null); // Close detail modal
        setIsAddToItineraryOpen(true);
    };

    const filteredAttractions = useMemo(() => {
        // Start with imported attractions if any, otherwise use city guide attractions
        let baseAttractions = importedAttractions.length > 0 ? importedAttractions : (cityGuide?.attractions || []);

        // Filter out excluded attractions
        baseAttractions = baseAttractions.filter(attr => !excludedAttractions.includes(attr.name));

        if (baseAttractions.length === 0) return [];

        // If not imported yet (and no manual imports), return empty to hide initial list
        if (!hasImported && importedAttractions.length === 0) return [];

        let filtered = baseAttractions.map(attr => ({
            ...attr,
            // Only add mock data if missing
            rating: attr.rating || parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
            time: attr.time || (Math.random() > 0.5 ? '09:00 - 17:00' : '24 Horas'),
            price: attr.price || (Math.random() > 0.7 ? '€ 15' : 'Grátis'),
            type: attr.type || (Math.random() > 0.5 ? 'Patrimônio' : 'Passeio')
        }));

        if (attractionSearch) {
            filtered = filtered.filter(a => a.name.toLowerCase().includes(attractionSearch.toLowerCase()));
        }

        if (activeFilter !== 'all') {
            if (activeFilter === 'history') {
                filtered = filtered.filter(a => !a.category || a.category.toLowerCase().match(/hist|museu|templ|igreja|ruin/));
            } else if (activeFilter === 'nature') {
                filtered = filtered.filter(a => a.category?.toLowerCase().match(/parque|jardim|praia|nature|trilh/));
            } else if (activeFilter === 'urban') {
                filtered = filtered.filter(a => a.category?.toLowerCase().match(/shop|rua|praça|modern|teatro/));
            }
        }

        return filtered;
    }, [cityGuide, attractionSearch, activeFilter, hasImported, importedAttractions]);

    // Fetch real images for attractions that appear to be placeholders
    useEffect(() => {
        const fetchImages = async () => {
            const attractionsToFetch = filteredAttractions.filter(attr => {
                // Check if we already have a real image
                if (realImages[attr.name]) return false;

                // If the current image is likely generic/bad (loremflickr, or just missing)
                const isGeneric = !attr.image || attr.image.includes('loremflickr') || attr.image.includes('placeholder');
                return isGeneric;
            });

            if (attractionsToFetch.length === 0) return;

            // Process in batches to avoid rate limits
            const processBatch = async (items: Attraction[]) => {
                const updates: Record<string, string> = {};

                await Promise.all(items.map(async (attr) => {
                    try {
                        const searchQuery = `${attr.name} ${cityName}`;
                        const placeData = await googlePlacesService.searchPlace(searchQuery);
                        if (placeData && placeData.image && !placeData.image.includes('unsplash')) {
                            updates[attr.name] = placeData.image;
                        }
                    } catch (e) {
                        console.error(`Failed to fetch image for ${attr.name}`, e);
                    }
                }));

                setRealImages(prev => ({ ...prev, ...updates }));
            };

            // Run for first 5 immediately
            await processBatch(attractionsToFetch.slice(0, 5));
        };

        const timeoutId = setTimeout(() => {
            fetchImages();
        }, 1000); // Small delay to let initial render settle

        return () => clearTimeout(timeoutId);
    }, [filteredAttractions, cityName, realImages]);

    const handleImportWrapper = (attractions: Attraction[]) => {
        setImportedAttractions(prev => {
            // Filter out duplicates based on name
            const newAttractions = attractions.filter(
                newAttr => !prev.some(existing => existing.name.toLowerCase() === newAttr.name.toLowerCase())
            );
            return [...prev, ...newAttractions];
        });
        setHasImported(true); // Reveal the list
    };

    // Render Discovery Mode if active
    if (isDiscoveryMode) {
        return (
            <DiscoveryMode
                cityName={cityName}
                country={cityGuide?.essentials ? 'local' : 'local'} // Fallback country
                existingAttractions={importedAttractions}
                tripStartDate={tripStartDate}
                tripEndDate={tripEndDate}
                onSaveToRepository={handleSaveDiscovery}
                onAddToItinerary={async (data) => { if (onAddToItinerary) await onAddToItinerary(data); }}
                onExit={() => setIsDiscoveryMode(false)}
            />
        );
    }

    return (
        <div className="w-full animate-in fade-in duration-300">
            {/* Header: Title + Filters + View Toggle - Now FULL WIDTH at the top */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <span className="material-symbols-outlined text-xl">attractions</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Principais Atrações</h2>
                </div>

                <div className="flex gap-4 items-center">
                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                        {CATEGORY_FILTERS.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm whitespace-nowrap ${activeFilter === filter.id
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-700 border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="bg-white p-1 border border-gray-100 rounded-lg shadow-sm flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Lista"
                        >
                            <span className="material-symbols-outlined text-xl">view_list</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Grid"
                        >
                            <span className="material-symbols-outlined text-xl">grid_view</span>
                        </button>
                    </div>

                    {/* Import/Add Button - ALWAYS VISIBLE */}
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center"
                        title="Adicionar ou Importar Atrações"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>


            {/* Top Attractions Carousel */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Star className="w-5 h-5 fill-indigo-600" />
                        </span>
                        Destaques Imperdíveis da Cidade
                    </h3>
                </div>

                <div className="relative group/carousel">
                    {/* Scroll Buttons */}
                    <button
                        onClick={() => {
                            const container = document.getElementById('attractions-carousel');
                            if (container) container.scrollBy({ left: -250, behavior: 'smooth' });
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => {
                            const container = document.getElementById('attractions-carousel');
                            if (container) container.scrollBy({ left: 250, behavior: 'smooth' });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div id="attractions-carousel" className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x hide-scrollbar px-1 scroll-smooth">
                        {isLoadingTopAttractions ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="min-w-[200px] h-32 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
                            ))
                        ) : topAttractions.length > 0 ? (
                            topAttractions.map((attr, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedTopAttraction(attr)}
                                    className="min-w-[200px] max-w-[200px] bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group/card snap-start"
                                >
                                    <div>
                                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-3 group-hover/card:scale-110 transition-transform">
                                            <Ticket className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-gray-800 leading-tight mb-1">{attr.name}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2">{attr.description}</p>
                                    </div>
                                    <div className="mt-3 flex items-center text-xs font-semibold text-indigo-600">
                                        Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                Nenhum destaque encontrado.
                            </div>
                        )}
                    </div>
                    {/* Gradient Overlays for scroll indication */}
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
                </div>
            </div>

            {/* Top Attraction Detail Modal */}
            <AnimatePresence>
                {
                    selectedTopAttraction && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedTopAttraction(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10"
                            >
                                {/* Header Image Placeholder */}
                                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                                        <MapPin className="w-40 h-40 text-black" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyMCI+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIxIiBkPSJNMCwyMjRMMjQsMjEzLjNDNDgsMjAzLDk2LDE4MSwxNDQsMTgxLjNDMTkyLDE4MSwyNDAsMjAzLDI4OCwyMjRMMzM2LDI0NSI+PC9wYXRoPjwvc3ZnPg==')] bg-cover bg-bottom opacity-30"></div>
                                    <h2 className="text-2xl font-black text-white text-center relative z-10 drop-shadow-md px-4">
                                        {selectedTopAttraction.name}
                                    </h2>
                                    <button
                                        onClick={() => setSelectedTopAttraction(null)}
                                        className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-6">
                                        {/* Description */}
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sobre o Local</h3>
                                            <p className="text-gray-700 leading-relaxed text-sm">
                                                {selectedTopAttraction.description}
                                            </p>
                                        </div>

                                        {/* Highlights Tags */}
                                        {selectedTopAttraction.tags && selectedTopAttraction.tags.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Destaques & Info</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedTopAttraction.tags.map((tag, i) => (
                                                        <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100 flex items-center gap-1">
                                                            <span className="opacity-70 font-normal">{tag.label}:</span>
                                                            {tag.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* History/Trivia Box */}
                                        {selectedTopAttraction.history_trivia && (
                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                <div className="flex items-start gap-2">
                                                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                                    <div>
                                                        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Por que visitar?</h3>
                                                        <p className="text-xs text-amber-900 leading-relaxed italic">
                                                            "{selectedTopAttraction.history_trivia}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex items-center gap-3">
                                        <button
                                            onClick={handleTopAttractionAddToItinerary}
                                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            Adicionar ao Roteiro
                                        </button>

                                        {/* Google Maps Button */}
                                        <button
                                            onClick={() => {
                                                const query = encodeURIComponent(`${selectedTopAttraction.name} ${cityName}`);
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                                            }}
                                            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-indigo-600 rounded-xl border border-gray-100 transition-colors"
                                            title="Ver no Google Maps"
                                        >
                                            <MapPin className="w-5 h-5" />
                                        </button>

                                        {/* Save to List Button */}
                                        <button
                                            onClick={() => {
                                                const newAttr: Attraction = {
                                                    name: selectedTopAttraction.name,
                                                    description: selectedTopAttraction.description,
                                                    image: '', // Will be fetched/handled by list logic
                                                    category: selectedTopAttraction.category,
                                                    rating: 4.8, // Mock high rating for top attractions
                                                    price: selectedTopAttraction.tags.find(t => t.label === 'Entrada')?.value,
                                                    time: selectedTopAttraction.tags.find(t => t.label === 'Tempo')?.value,
                                                };

                                                if (!importedAttractions.some(a => a.name === newAttr.name)) {
                                                    setImportedAttractions(prev => [...prev, newAttr]);
                                                    setHasImported(true);
                                                    // Ideally show a toast here, but for now the visual feedback of the button or list update will do
                                                }
                                            }}
                                            className={`p-3 rounded-xl border transition-colors ${importedAttractions.some(a => a.name === selectedTopAttraction.name)
                                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-100 hover:text-indigo-600'
                                                }`}
                                            title="Salvar na lista"
                                        >
                                            <Bookmark className={`w-5 h-5 ${importedAttractions.some(a => a.name === selectedTopAttraction.name) ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Main Layout: Two Columns - Left (1/3) Visitor Guide, Right (2/3) Attractions */}
            < div className="grid grid-cols-1 lg:grid-cols-3 gap-8" >
                {/* Left Column (1/3): Visitor Guide */}
                < div className="lg:col-span-1 space-y-4" >
                    {/* Visitor Guide Widget */}
                    {/* Attractions Chat Widget */}
                    <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100 shadow-sm relative overflow-hidden flex flex-col h-[400px]">
                        {/* Decorator */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <span className="material-symbols-outlined text-6xl text-blue-600">tour</span>
                        </div>

                        <div className="relative z-10 flex-none">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">forum</span> Chat do Visitante
                                </h3>
                                <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full shadow-sm">Gemini 3 Flash</span>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-3 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-700 shadow-sm rounded-tl-none border border-blue-100'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white text-gray-500 shadow-sm rounded-2xl rounded-tl-none border border-blue-100 px-3 py-2 text-xs flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="relative mt-auto flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                                placeholder="Pergunte sobre atrações..."
                                className="flex-1 bg-white border border-blue-200 text-gray-700 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400"
                                disabled={isChatLoading}
                            />
                            <button
                                onClick={handleSendChatMessage}
                                disabled={!chatInput.trim() || isChatLoading}
                                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Boxes Row */}
                    < div className="grid grid-cols-3 gap-2" >
                        {/* Map */}
                        < div
                            onClick={onShowMap}
                            className="relative h-24 rounded-2xl overflow-hidden group shadow-sm cursor-pointer hover:shadow-md transition-all block"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt="Mapa"
                            />
                            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-1 drop-shadow-md">
                                <span className="material-symbols-outlined text-2xl mb-0.5">map</span>
                                <span className="text-[10px] font-bold">Mapa</span>
                            </div>
                        </div >

                        {/* Gastronomy */}
                        < div
                            onClick={() => onTabChange && onTabChange('gastronomy')}
                            className="relative h-24 rounded-2xl overflow-hidden group shadow-sm cursor-pointer hover:shadow-md transition-all"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt="Comida"
                            />
                            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-1 drop-shadow-md">
                                <span className="material-symbols-outlined text-2xl mb-0.5">restaurant</span>
                                <span className="text-[10px] font-bold">Comida</span>
                            </div>
                        </div >

                        {/* About City */}
                        < div
                            onClick={() => onTabChange && onTabChange('info')}
                            className="relative h-24 rounded-2xl overflow-hidden group shadow-sm cursor-pointer hover:shadow-md transition-all"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=400"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt="Sobre a Cidade"
                            />
                            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-1 drop-shadow-md">
                                <span className="material-symbols-outlined text-2xl mb-0.5">location_city</span>
                                <span className="text-[10px] font-bold leading-tight">Sobre a<br />Cidade</span>
                            </div>
                        </div >
                    </div >
                </div >

                {/* Right Column (2/3): Attractions List */}
                < div className="lg:col-span-2" >
                    {/* Attractions Grid/List */}
                    < div className={viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                        : "grid grid-cols-1 gap-4"
                    }>
                        {isLoadingGuide ? [1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-[1.5rem] animate-pulse"></div>) : (
                            <>
                                {filteredAttractions.map((attr, idx) => {
                                    const style = getCategoryIcon(attr.category);
                                    return (
                                        <PlaceCard
                                            key={idx}
                                            title={attr.name}
                                            description={attr.description}
                                            longDescription={attr.longDescription}
                                            reviewSummary={attr.reviewSummary}
                                            image={realImages[attr.name] || attr.aiImage || attr.image}
                                            category={attr.category}
                                            rating={attr.rating}
                                            time={attr.time}
                                            price={attr.price}
                                            icon={style.icon}
                                            color={style.color}
                                            variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
                                            onClick={() => handleAttractionClick(attr)}
                                            onMapClick={(e) => {
                                                e.stopPropagation();
                                                const query = encodeURIComponent(`${attr.name} ${cityName}`);
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                                            }}
                                            onAddToItinerary={(e) => { e.stopPropagation(); handleOpenAddToItinerary(attr); }}
                                            onDelete={(e) => { e.stopPropagation(); handleDeleteAttraction(attr); }}
                                            isGenerating={attr.isGenerating}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </div >


                    {/* Load More Footer */}
                    {
                        !isLoadingGuide && filteredAttractions.length > 0 && (
                            <div className="mt-12 flex justify-center pb-8">
                                <button className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2">
                                    Carregar Mais
                                    <span className="material-symbols-outlined text-lg">expand_more</span>
                                </button>
                            </div>
                        )
                    }

                    {/* Empty State - Now handles initial import */}
                    {
                        !isLoadingGuide && filteredAttractions.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl">add_location_alt</span>
                                </div>
                                <h3 className="text-gray-900 font-bold text-lg mb-2">Comece a planejar suas visitas</h3>
                                <p className="text-gray-500 font-medium max-w-md mx-auto mb-6">
                                    Você ainda não tem atrações listadas. Adicione manualmente ou importe nossa lista curada.
                                </p>
                                <div className="flex items-center justify-center gap-4 flex-wrap">
                                    <button
                                        onClick={onAddManual} // Note: This assumes onAddManual is available
                                        className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-xl">add</span>
                                        Adicionar Manualmente
                                    </button>
                                    <button
                                        onClick={() => setIsImportModalOpen(true)}
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                                    >
                                        Importar Lista de Atrações
                                    </button>
                                    <button
                                        onClick={() => setIsDiscoveryMode(true)}
                                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-xl">auto_awesome</span>
                                        Gerar Sugestões com IA
                                    </button>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >
            {/* Modals */}
            < ImportAttractionsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportWrapper}
                cityName={cityName}
            />

            <AttractionDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                attraction={selectedAttraction}
                onAddToItinerary={(attr) => {
                    setIsDetailModalOpen(false);
                    handleOpenAddToItinerary(attr);
                }}
            />

            <AddToItineraryModal
                isOpen={isAddToItineraryOpen}
                onClose={() => setIsAddToItineraryOpen(false)}
                item={selectedAttraction ? {
                    name: selectedAttraction.name,
                    image: selectedAttraction.aiImage || selectedAttraction.image,
                    category: selectedAttraction.category,
                    type: 'attraction'
                } : null}
                onConfirm={handleConfirmItinerary}
                minDate={tripStartDate}
                maxDate={tripEndDate}
            />
        </div >
    );
};

export default AttractionsTab;
