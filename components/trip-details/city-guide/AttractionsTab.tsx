import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Attraction, CityGuide } from '../../../types';
import { Card, Badge } from '../../ui/Base';
import { Sparkles, Map, Plus, Search, Star, Heart, Clock, Ticket, MapPin, Loader2 } from 'lucide-react';
import PlaceCard from './PlaceCard';
import ImportAttractionsModal from '../modals/ImportAttractionsModal';
import AttractionDetailModal from '../modals/AttractionDetailModal';
import AddToItineraryModal from '../modals/AddToItineraryModal';
import { getGeminiService } from '../../../services/geminiService';
import { googlePlacesService } from '../../../services/googlePlacesService';

interface AttractionsTabProps {
    cityGuide: CityGuide | null;
    isLoadingGuide: boolean;
    attractionSearch: string;
    genAspectRatio: string;
    genSize: string;
    onSearchChange: (search: string) => void;
    onAspectRatioChange: (ratio: string) => void;
    onSizeChange: (size: string) => void;
    onRegenerateAll: () => void;
    onAttractionClick: (attraction: Attraction) => void;
    onEditImage: (type: 'attraction', index: number, data: any) => void;
    onShowMap: () => void;
    onAddManual: () => void;
    onSuggestAI: (category: string) => void;
    isSuggestingAI: boolean;
    onTabChange?: (tab: 'info' | 'attractions' | 'gastronomy' | 'tips' | 'timeline' | 'map') => void;
    tripStartDate?: string;
    tripEndDate?: string;
    onAddToItinerary?: (data: { itemName: string; itemType: 'restaurant' | 'attraction' | 'custom'; date: string; time: string; notes?: string; address?: string; image?: string; category?: string }) => void;
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
    onEditImage,
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
    // Modal States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAddToItineraryOpen, setIsAddToItineraryOpen] = useState(false);

    const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
    const [importedAttractions, setImportedAttractions] = useLocalStorage<Attraction[]>(`imported_attractions_${cityName}`, []);
    const [excludedAttractions, setExcludedAttractions] = useLocalStorage<string[]>(`excluded_attractions_${cityName}`, []);

    // Task Checklist State
    const [tasks, setTasks] = useState<TouristTask[]>([
        { id: '1', title: 'Solicitar visto de turista', dueDate: '15/01/2026', icon: 'card_travel', priority: 'urgent', completed: false },
        { id: '2', title: 'Reservar hotel em Sapa', dueDate: '20/01/2026', icon: 'hotel', priority: 'urgent', completed: false },
        { id: '3', title: 'Contratar seguro viagem', dueDate: '01/02/2026', icon: 'verified_user', priority: 'urgent', completed: false },
        { id: '4', title: 'Fazer check-in online', dueDate: '10/02/2026', icon: 'check_circle', priority: 'urgent', completed: false },
        { id: '5', title: 'Reservar tour guiado', dueDate: '25/01/2026', icon: 'tour', priority: 'normal', completed: true },
        { id: '6', title: 'Comprar ingressos museu', dueDate: '22/01/2026', icon: 'confirmation_number', priority: 'normal', completed: true },
        { id: '7', title: 'Baixar mapa offline', dueDate: '12/02/2026', icon: 'map', priority: 'normal', completed: true },
    ]);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // Visitor Guide State
    const [visitorGuideContent, setVisitorGuideContent] = useState<string | null>(null);
    const [isGeneratingVisitorGuide, setIsGeneratingVisitorGuide] = useState(false);

    // Store real images fetched from Google Places
    const [realImages, setRealImages] = useState<Record<string, string>>({});



    // Get city name from cityGuide or default


    // Persistence: Load from localStorage
    useEffect(() => {
        if (importedAttractions.length > 0) {
            setHasImported(true);
        }
    }, [importedAttractions]);

    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;

    const toggleTaskComplete = (taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
        ));
    };

    const addTask = () => {
        if (!newTaskTitle.trim()) return;
        const newTask: TouristTask = {
            id: `t-${Date.now()}`,
            title: newTaskTitle,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            icon: 'task_alt',
            priority: 'normal',
            completed: false
        };
        setTasks(prev => [...prev, newTask]);
        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    // Handler for generating visitor guide
    const handleGenerateVisitorGuide = async () => {
        setIsGeneratingVisitorGuide(true);
        try {
            const service = getGeminiService();
            const content = await service.generateVisitorGuide(cityName);
            setVisitorGuideContent(content);
        } catch (error) {
            console.error('Error generating visitor guide:', error);
        } finally {
            setIsGeneratingVisitorGuide(false);
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

    const [isGeneratingAttractions, setIsGeneratingAttractions] = useState(false);

    const handleGenerateAI = async () => {
        setIsGeneratingAttractions(true);
        try {
            const service = getGeminiService();
            // We use generateCityGuide to get a curated list of attractions
            const guide = await service.generateCityGuide(cityName, 'local');

            if (guide && guide.attractions) {
                // Enrich with rough IDs and ensure properties
                const newAttractions = guide.attractions.map((a, i) => ({
                    ...a,
                    id: `gen-${Date.now()}-${i}`,
                    // Ensure we have at least defaults if API misses something
                    rating: typeof a.rating === 'string' ? parseFloat(a.rating) : (a.rating || 4.5),
                    price: a.price || 'Consultar'
                }));

                setImportedAttractions(newAttractions);
                setHasImported(true);
            }
        } catch (error) {
            console.error("Error generating attractions:", error);
            alert("Não foi possível gerar as atrações. Tente novamente.");
        } finally {
            setIsGeneratingAttractions(false);
        }
    };

    const handleImportWrapper = (attractions: Attraction[]) => {
        setImportedAttractions(attractions);
        setHasImported(true); // Reveal the list
    };

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

            {/* Main Layout: Two Columns - Left (1/3) Visitor Guide, Right (2/3) Attractions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (1/3): Visitor Guide */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Visitor Guide Widget */}
                    <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
                        {/* Decorator */}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-blue-600">tour</span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">info</span> Guia do Visitante
                                </h3>
                                <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full shadow-sm">AI Dicas</span>
                            </div>

                            {visitorGuideContent ? (
                                <div
                                    className="prose prose-sm max-w-none text-text-muted leading-relaxed mb-3"
                                    dangerouslySetInnerHTML={{ __html: visitorGuideContent }}
                                />
                            ) : (
                                <>
                                    <p className="font-bold text-sm text-text-main mb-1">Antes de sair</p>
                                    <p className="text-xs text-text-muted line-clamp-2 mb-3">
                                        Ingressos, melhor horário, transporte e tudo que você precisa saber.
                                    </p>
                                </>
                            )}

                            <button
                                onClick={handleGenerateVisitorGuide}
                                disabled={isGeneratingVisitorGuide}
                                className="w-full py-1.5 bg-white rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isGeneratingVisitorGuide ? 'Gerando...' : visitorGuideContent ? 'Atualizar Dicas' : 'Gerar com IA'}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Boxes Row */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Map */}
                        <div
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
                        </div>

                        {/* Gastronomy */}
                        <div
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
                        </div>

                        {/* About City */}
                        <div
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
                        </div>
                    </div>
                </div>

                {/* Right Column (2/3): Attractions List */}
                <div className="lg:col-span-2">
                    {/* Attractions Grid/List */}
                    <div className={viewMode === 'grid'
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
                                            onEditImage={(e) => { e.stopPropagation(); onEditImage('attraction', idx, attr); }}
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
                    </div>


                    {/* Load More Footer */}
                    {!isLoadingGuide && filteredAttractions.length > 0 && (
                        <div className="mt-12 flex justify-center pb-8">
                            <button className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2">
                                Carregar Mais
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </button>
                        </div>
                    )}

                    {/* Empty State - Now handles initial import */}
                    {!isLoadingGuide && filteredAttractions.length === 0 && (
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
                                    onClick={handleGenerateAI}
                                    disabled={isGeneratingAttractions}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingAttractions ? (
                                        <>
                                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Gerando Roteiro...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-xl">auto_awesome</span>
                                            Gerar Sugestões com IA
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Modals */}
            <ImportAttractionsModal
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
        </div>
    );
};

export default AttractionsTab;
