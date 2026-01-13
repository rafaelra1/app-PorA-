import React, { useState, useMemo, useRef } from 'react';
import { CityGuide, Restaurant } from '../../../types';
import { Button } from '../../ui/Base';
import { ChevronDown, Sparkles, FileText, X, ChevronRight, Utensils, ChefHat, Search, ChevronLeft } from 'lucide-react';
import { getGeminiService } from '../../../services/geminiService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import RestaurantDetailModal from '../modals/RestaurantDetailModal';
import AddToItineraryModal from '../modals/AddToItineraryModal';
import PlaceCard from './PlaceCard';
import GastronomyDiscoveryMode from './GastronomyDiscoveryMode';

import { AnimatePresence, motion } from 'framer-motion';

interface TypicalDish {
    name: string;
    description: string;
    ingredients: string[];
    history: string;
}

interface GastronomyTabProps {
    cityGuide: CityGuide | null;
    isLoadingGuide: boolean;
    cityName?: string;
    onAddToItinerary?: (data: { itemName: string; itemType: 'restaurant' | 'attraction'; date: string; time: string; notes?: string; address?: string; image?: string; category?: string }) => void;
    onTabChange?: (tab: 'info' | 'attractions' | 'gastronomy' | 'tips' | 'timeline' | 'map') => void;
    tripStartDate?: string;
    tripEndDate?: string;
}


// Removed MOCK_RESTAURANTS and CATEGORY_FILTERS as per new requirement

// Helper to get icon and color based on category
const getCategoryStyle = (category: string = '') => {
    const cat = category.toLowerCase();

    if (cat.includes('japones') || cat.includes('sushi') || cat.includes('asian') || cat.includes('oriental')) return { icon: 'ramen_dining', color: 'rose' };
    if (cat.includes('italiana') || cat.includes('pizza') || cat.includes('massas')) return { icon: 'local_pizza', color: 'orange' };
    if (cat.includes('hambturguer') || cat.includes('burger') || cat.includes('americana') || cat.includes('lanche')) return { icon: 'lunch_dining', color: 'amber' };
    if (cat.includes('café') || cat.includes('coffee') || cat.includes('padaria') || cat.includes('brunch')) return { icon: 'local_cafe', color: 'brown' };
    if (cat.includes('bar') || cat.includes('pub') || cat.includes('drink') || cat.includes('cervejaria')) return { icon: 'local_bar', color: 'purple' };
    if (cat.includes('churrasco') || cat.includes('steak') || cat.includes('carne') || cat.includes('grelhados')) return { icon: 'outdoor_grill', color: 'red' };
    if (cat.includes('vegetariana') || cat.includes('vegan') || cat.includes('saudável') || cat.includes('salada')) return { icon: 'eco', color: 'green' };
    if (cat.includes('sobremesa') || cat.includes('doce') || cat.includes('sorvete') || cat.includes('confeitaria')) return { icon: 'icecream', color: 'pink' };
    if (cat.includes('francesa') || cat.includes('bistrô') || cat.includes('requintad')) return { icon: 'wine_bar', color: 'indigo' };
    if (cat.includes('alemã') || cat.includes('salsicha')) return { icon: 'sports_bar', color: 'yellow' }; // sports_bar icon looks like a beer mug
    if (cat.includes('mexicana') || cat.includes('tacos')) return { icon: 'tapas', color: 'emerald' };

    return { icon: 'restaurant', color: 'indigo' }; // Default
};

const GastronomyTab: React.FC<GastronomyTabProps> = ({
    cityGuide,
    isLoadingGuide,
    cityName = 'Atenas',
    onAddToItinerary,
    onTabChange,
    tripStartDate,
    tripEndDate
}) => {
    const [activeFilter, setActiveFilter] = useState('all'); // Keeping state specifically if we eventually re-introduce filters, but removing UI
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showAddToItinerary, setShowAddToItinerary] = useState(false);
    const [itemToAdd, setItemToAdd] = useState<Restaurant | null>(null);

    // Search & Generation State
    const [searchQuery, setSearchQuery] = useState(cityName || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedRestaurants, setGeneratedRestaurants] = useLocalStorage<Restaurant[]>(`porai_city_${cityName}_restaurants`, []);

    // Discovery Mode State
    const [showDiscoveryMode, setShowDiscoveryMode] = useState(false);

    // AI Overview State
    const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
    const [gastronomyOverview, setGastronomyOverview] = useState<{
        description: string;
        goldenTip: string;
    } | null>(null);

    // Exclusion State
    const [excludedRestaurants, setExcludedRestaurants] = useState<string[]>([]);

    // Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Gastronomy Guide State
    const [gastronomyGuideContent, setGastronomyGuideContent] = useState<string | null>(null);
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

    // Typical Dishes State
    const [typicalDishes, setTypicalDishes] = useLocalStorage<TypicalDish[]>(`porai_city_${cityName}_dishes`, []);
    const [isLoadingDishes, setIsLoadingDishes] = useState(false);
    const [selectedDish, setSelectedDish] = useState<TypicalDish | null>(null);

    // Generate Typical Dishes on mount if empty
    React.useEffect(() => {
        const loadDishes = async () => {
            if (typicalDishes.length === 0 && !isLoadingDishes && cityName) {
                setIsLoadingDishes(true);
                try {
                    const service = getGeminiService();
                    const dishes = await service.generateTypicalDishes(cityName);
                    if (dishes) {
                        setTypicalDishes(dishes);
                    }
                } catch (e) {
                    console.error('Error loading typical dishes:', e);
                } finally {
                    setIsLoadingDishes(false);
                }
            }
        };
        loadDishes();
    }, [cityName]);

    const handleSearchDish = (dishName: string) => {
        setSearchQuery(dishName);
        setSelectedDish(null);
        // Scroll to restaurants section
        const element = document.getElementById('restaurants-grid');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Handler for generating AI gastronomy overview and restaurants
    const handleGenerateCuration = async () => {
        setIsGenerating(true);
        setIsGeneratingOverview(true);
        setGeneratedRestaurants([]); // Clear previous

        try {
            const service = getGeminiService();
            const result = await service.generateGastronomyCuration(cityName);

            if (result) {
                // Update Overview
                setGastronomyOverview(result.overview);

                // Update Restaurants
                const mappedRestaurants: Restaurant[] = result.restaurants.map((r, index) => ({
                    id: `ai-gen-${Date.now()}-${index}`,
                    name: r.name,
                    city: cityName,
                    category: r.category,
                    description: r.description,
                    price: r.price,
                    rating: 4.5 + (Math.random() * 0.5), // Mock high rating as these are curated
                    image: '', // Use icon instead of random image
                    address: r.location,
                    hours: { open: '', close: '', text: r.hours },
                    specialty: r.specialty,
                    highlight: r.highlight,
                    reviewSummary: r.reviewSummary,
                    isOpen: true
                }));

                setGeneratedRestaurants(mappedRestaurants);
            }
        } catch (error) {
            console.error('Error generating curation:', error);
            // Optionally handle error state here
        } finally {
            setIsGenerating(false);
            setIsGeneratingOverview(false);
        }
    };

    // Persistence: Load from localStorage
    // Persistence: Load from localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedExcluded = localStorage.getItem(`excluded_restaurants_${cityName}`);
            if (savedExcluded) {
                try {
                    const parsed = JSON.parse(savedExcluded);
                    if (Array.isArray(parsed)) {
                        setExcludedRestaurants(parsed);
                    }
                } catch (e) {
                    console.error('Error parsing excluded restaurants:', e);
                }
            }
        }
    }, [cityName]);

    // Persistence: Save to localStorage
    // Persistence: Save to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`excluded_restaurants_${cityName}`, JSON.stringify(excludedRestaurants));
        }
    }, [excludedRestaurants, cityName]);

    const handleDeleteRestaurant = (restaurant: Restaurant) => {
        setExcludedRestaurants(prev => [...prev, restaurant.name]);
    };

    const handleGoogleMaps = (e: React.MouseEvent, restaurant?: Restaurant) => {
        if (!restaurant) return;
        const query = encodeURIComponent(`${restaurant.name} ${restaurant.address || ''} ${restaurant.city || ''}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    // Handler for adding to itinerary
    const handleAddToItinerary = (restaurant: Restaurant) => {
        setItemToAdd(restaurant);
        setShowAddToItinerary(true);
        setSelectedRestaurant(null); // Close detail modal
    };

    const handleConfirmAddToItinerary = (data: { itemName: string; itemType: 'restaurant' | 'attraction'; date: string; time: string; notes?: string; address?: string }) => {
        if (onAddToItinerary) {
            onAddToItinerary({
                ...data,
                address: itemToAdd?.address,
                image: itemToAdd?.image,
                category: itemToAdd?.category
            });
        }
        console.log('Added to itinerary:', data);
    };

    // Handler for Discovery Mode actions
    const handleDiscoverySave = (restaurant: Restaurant) => {
        // Check if already exists by name to avoid duplicates
        if (!generatedRestaurants.some(r => r.name === restaurant.name)) {
            setGeneratedRestaurants(prev => [restaurant, ...prev]);
        }
    };

    const handleDiscoverySchedule = (restaurant: Restaurant) => {
        // Add to main list first if not there
        handleDiscoverySave(restaurant);
        // Open schedule modal
        setItemToAdd(restaurant);
        setShowAddToItinerary(true);
    };

    const handleImportList = async () => {
        if (!importText.trim()) return;

        setIsImporting(true);
        try {
            const service = getGeminiService();
            const importedRestaurants = await service.importRestaurantList(cityName, importText);

            if (importedRestaurants && importedRestaurants.length > 0) {
                const mapped: Restaurant[] = importedRestaurants.map((r, index) => ({
                    id: `imported-${Date.now()}-${index}`,
                    name: r.name,
                    city: cityName,
                    category: r.category,
                    description: r.description,
                    price: r.price,
                    rating: 4.5, // Default for imported
                    image: '', // Use icon instead of random image
                    address: r.location,
                    hours: { open: '', close: '', text: r.hours },
                    specialty: r.specialty,
                    highlight: r.highlight,
                    reviewSummary: r.description, // Fallback as import might not have specific review summary yet
                    isOpen: true
                }));

                setGeneratedRestaurants(prev => [...prev, ...mapped]);
                setShowImportModal(false);
                setImportText('');
            }
        } catch (error) {
            console.error('Error importing list:', error);
        } finally {
            setIsImporting(false);
        }
    };

    // Handler for generating gastronomy guide
    const handleGenerateGastronomyGuide = async () => {
        setIsGeneratingGuide(true);
        try {
            const service = getGeminiService();
            const content = await service.generateGastronomyGuide(cityName);
            setGastronomyGuideContent(content);
        } catch (error) {
            console.error('Error generating gastronomy guide:', error);
        } finally {
            setIsGeneratingGuide(false);
        }
    };

    // Simplified restaurant source logic
    // Simplified restaurant source logic
    const filteredRestaurants = useMemo(() => {
        if (generatedRestaurants.length > 0) {
            return generatedRestaurants.filter(r => !excludedRestaurants.includes(r.name));
        }
        return [];
    }, [cityGuide, generatedRestaurants, excludedRestaurants]);

    return (
        <div className="w-full animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <span className="material-symbols-outlined text-xl">restaurant</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Gastronomia em {cityName}</h2>
                    </div>
                    <p className="text-xs text-gray-500 font-medium ml-11">Os melhores lugares para saborear a cultura local.</p>
                </div>

                <div className="flex gap-4 items-center">
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
                </div>
            </div>

            {/* Typical Dishes Section */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                            <ChefHat className="w-5 h-5" />
                        </span>
                        Pratos Típicos da Região
                    </h3>
                </div>

                <div className="relative group/carousel">
                    {/* Scroll Buttons */}
                    <button
                        onClick={() => {
                            const container = document.getElementById('dishes-carousel');
                            if (container) container.scrollBy({ left: -250, behavior: 'smooth' });
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => {
                            const container = document.getElementById('dishes-carousel');
                            if (container) container.scrollBy({ left: 250, behavior: 'smooth' });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div id="dishes-carousel" className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x hide-scrollbar px-1 scroll-smooth">
                        {isLoadingDishes ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="min-w-[200px] h-32 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
                            ))
                        ) : typicalDishes.length > 0 ? (
                            typicalDishes.map((dish, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDish(dish)}
                                    className="min-w-[200px] max-w-[200px] bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group/card snap-start"
                                >
                                    <div>
                                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-3 group-hover/card:scale-110 transition-transform">
                                            <Utensils className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-gray-800 leading-tight mb-1">{dish.name}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2">{dish.description}</p>
                                    </div>
                                    <div className="mt-3 flex items-center text-xs font-semibold text-orange-600">
                                        Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                Nenhum prato típico encontrado.
                            </div>
                        )}
                    </div>
                    {/* Gradient Overlays for scroll indication */}
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
                </div>
            </div>

            {/* Dish Detail Modal */}
            <AnimatePresence>
                {selectedDish && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDish(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10"
                        >
                            {/* Header Image Placeholder */}
                            <div className="h-32 bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                                    <ChefHat className="w-40 h-40 text-black" />
                                </div>
                                <h2 className="text-2xl font-black text-white text-center relative z-10 drop-shadow-md">
                                    {selectedDish.name}
                                </h2>
                                <button
                                    onClick={() => setSelectedDish(null)}
                                    className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-6">
                                    {/* Description */}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sobre o Prato</h3>
                                        <p className="text-gray-700 leading-relaxed text-sm">
                                            {selectedDish.description}
                                        </p>
                                    </div>

                                    {/* Ingredients */}
                                    {selectedDish.ingredients && selectedDish.ingredients.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ingredientes Principais</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedDish.ingredients.map((ing, i) => (
                                                    <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-medium border border-orange-100">
                                                        {ing}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* History */}
                                    {selectedDish.history && (
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                            <div className="flex items-start gap-2">
                                                <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Origem & História</h3>
                                                    <p className="text-xs text-amber-900 leading-relaxed italic">
                                                        "{selectedDish.history}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <button
                                        onClick={() => handleSearchDish(selectedDish.name)}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                                    >
                                        <Search className="w-4 h-4" />
                                        Buscar restaurantes com este prato
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Two Boxes Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Left Column Container */}
                <div className="flex flex-col gap-4">
                    {/* Gastronomy Guide Widget */}
                    <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100 shadow-sm relative overflow-hidden">
                        {/* Decorator */}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-amber-600">restaurant</span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-600">local_dining</span> Guia Gastronômico Local
                                </h3>
                                <span className="text-[10px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded-full shadow-sm">AI Dicas</span>
                            </div>

                            {gastronomyGuideContent ? (
                                <div
                                    className="prose prose-sm max-w-none text-text-muted leading-relaxed mb-3"
                                    dangerouslySetInnerHTML={{ __html: gastronomyGuideContent }}
                                />
                            ) : (
                                <>
                                    <p className="font-bold text-sm text-text-main mb-1">Antes de reservar</p>
                                    <p className="text-xs text-text-muted line-clamp-2 mb-3">
                                        Descubra horários típicos, pratos imperdíveis, gorjeta e muito mais.
                                    </p>
                                </>
                            )}

                            <button
                                onClick={handleGenerateGastronomyGuide}
                                disabled={isGeneratingGuide}
                                className="w-full py-1.5 bg-white rounded-xl text-xs font-bold text-amber-600 hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isGeneratingGuide ? 'Gerando...' : gastronomyGuideContent ? 'Atualizar Dicas' : 'Gerar com IA'}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Boxes Row */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Map */}
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
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
                        </a>

                        {/* Attractions */}
                        <div
                            onClick={() => onTabChange && onTabChange('attractions')}
                            className="relative h-24 rounded-2xl overflow-hidden group shadow-sm cursor-pointer hover:shadow-md transition-all"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=400"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt="Atrações"
                            />
                            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-1 drop-shadow-md">
                                <span className="material-symbols-outlined text-2xl mb-0.5">attractions</span>
                                <span className="text-[10px] font-bold">Atrações</span>
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

                {/* Right Column: Curation & Restaurant Cards (2/3 width) */}
                <div className="lg:col-span-2">
                    {/* Generate with AI & Import Buttons */}
                    <div className="mb-6 flex flex-wrap gap-4">
                        <button
                            onClick={handleGenerateCuration}
                            disabled={isGenerating}
                            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                    Gerando curadoria...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Gerar curadoria com IA
                                </>
                            )}
                        </button>

                        <div className="w-px h-6 bg-gray-200"></div>

                        <button
                            onClick={() => setShowDiscoveryMode(true)}
                            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">swipe_right</span>
                            Modo Descoberta
                        </button>

                        <div className="w-px h-6 bg-gray-200"></div>

                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Importar Lista
                        </button>
                    </div>

                    {/* Restaurant Grid */}
                    <div id="restaurants-grid" className={viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                        : "grid grid-cols-1 gap-4"
                    }>
                        {isLoadingGuide ? [1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-[1.5rem] animate-pulse"></div>) : (
                            <>
                                {filteredRestaurants.map((restaurant, idx) => {
                                    const style = getCategoryStyle(restaurant.category || restaurant.specialty);
                                    return (
                                        <PlaceCard
                                            key={idx}
                                            title={restaurant.name}
                                            description={restaurant.description}
                                            image={restaurant.image}
                                            icon={style.icon}
                                            color={style.color}
                                            category={restaurant.category}
                                            rating={restaurant.rating?.toFixed(1)}
                                            time={restaurant.hours?.text?.split(':')[0]?.trim() || "Aberto"}
                                            price={restaurant.price}
                                            variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
                                            specialty={restaurant.specialty}
                                            highlight={restaurant.highlight}
                                            onClick={() => setSelectedRestaurant(restaurant)}
                                            onMapClick={(e) => { e.stopPropagation(); handleGoogleMaps(e, restaurant); }}
                                            onAddToItinerary={(e) => { e.stopPropagation(); handleAddToItinerary(restaurant); }}
                                            onDelete={(e) => { e.stopPropagation(); handleDeleteRestaurant(restaurant); }}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Load More Footer */}
                    {!isLoadingGuide && filteredRestaurants.length > 0 && (
                        <div className="mt-8 flex justify-center">
                            <Button variant="outline" className="rounded-full shadow-sm">
                                Carregar Mais
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoadingGuide && filteredRestaurants.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <p className="text-gray-500 font-medium">Clique em "Gerar curadoria com IA" para descobrir os melhores restaurantes.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <RestaurantDetailModal
                isOpen={!!selectedRestaurant}
                onClose={() => setSelectedRestaurant(null)}
                restaurant={selectedRestaurant}
                onAddToItinerary={handleAddToItinerary}
            />

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Importar Lista</h3>
                                <p className="text-sm text-gray-500 mt-1">Cole sua lista de restaurantes abaixo</p>
                            </div>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder={`Ex: \n- Le Chateaubriand\n- Septime\n- Clown Bar`}
                                className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm leading-relaxed placeholder:text-gray-400"
                            />

                            <div className="mt-6 flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowImportModal(false)}
                                    className="border-gray-200"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleImportList}
                                    disabled={!importText.trim() || isImporting}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                                >
                                    {isImporting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processando...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            <span>Processar com IA</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Discovery Mode Overlay */}
            {showDiscoveryMode && (
                <div className="fixed inset-0 z-[60] bg-white text-gray-900 flex flex-col animate-in fade-in duration-300">
                    <div className="flex-1 flex items-center justify-center p-4 bg-gray-100/50 backdrop-blur-sm">
                        <GastronomyDiscoveryMode
                            cityName={cityName}
                            onSave={handleDiscoverySave}
                            onSchedule={handleDiscoverySchedule}
                            onClose={() => setShowDiscoveryMode(false)}
                            existingRestaurants={generatedRestaurants}
                        />
                    </div>
                </div>
            )}

            {/* Add to Itinerary Modal */}
            <AddToItineraryModal
                isOpen={showAddToItinerary}
                onClose={() => {
                    setShowAddToItinerary(false);
                    setItemToAdd(null);
                }}
                item={itemToAdd ? {
                    name: itemToAdd.name,
                    image: itemToAdd.image,
                    category: itemToAdd.category,
                    type: 'restaurant',
                    address: itemToAdd.address
                } : null}
                onConfirm={handleConfirmAddToItinerary}
                minDate={tripStartDate}
                maxDate={tripEndDate}
            />
        </div>
    );
};

export default GastronomyTab;

