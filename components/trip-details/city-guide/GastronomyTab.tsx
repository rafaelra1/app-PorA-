import React, { useState, useMemo, useRef, useCallback } from 'react';
import { CityGuide, Restaurant, TypicalDish } from '../../../types';
import { Button } from '../../ui/Base';
import { ChevronDown, Sparkles, FileText, X, ChevronRight, Utensils, ChefHat, Search, ChevronLeft } from 'lucide-react';
import { getGeminiService } from '../../../services/geminiService';
import RestaurantDetailModal from '../modals/RestaurantDetailModal';
import AddToItineraryModal from '../modals/AddToItineraryModal';
import PlaceCard from './PlaceCard';
import GastronomyDiscoveryMode from './GastronomyDiscoveryMode';

import { AnimatePresence, motion } from 'framer-motion';
import { useTrips } from '../../../contexts/TripContext';



interface GastronomyTabProps {
    cityGuide: CityGuide | null;
    isLoadingGuide: boolean;
    cityName: string;
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
    cityName,
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

    // Discovery Mode State
    const [showDiscoveryMode, setShowDiscoveryMode] = useState(false);

    // AI Overview State
    const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
    const [gastronomyOverview, setGastronomyOverview] = useState<{
        description: string;
        goldenTip: string;
    } | null>(null);

    // Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Typical Dishes State
    const [isLoadingDishes, setIsLoadingDishes] = useState(false);
    const [selectedDish, setSelectedDish] = useState<TypicalDish | null>(null);

    // Chat Box State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
        { role: 'model', text: `Olá! Sou seu guia gastronômico em ${cityName}. Pergunte-me sobre pratos típicos, onde comer ou dicas de etiqueta!` }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Get trip context
    const { selectedTrip, updateDestination } = useTrips();

    // Find current destination data
    const currentDestination = useMemo(() => {
        return selectedTrip?.detailedDestinations?.find(d => d.name === cityName);
    }, [selectedTrip, cityName]);

    // Derived states from context
    const generatedRestaurants = currentDestination?.restaurants || [];
    const excludedRestaurants = currentDestination?.excludedRestaurants || [];
    const typicalDishes = currentDestination?.typicalDishes || [];
    const isDishesStorageLoading = false; // Always false as it's now synced from context

    // Setters
    const setGeneratedRestaurantsFunc = useCallback(async (newRestaurants: Restaurant[] | ((prev: Restaurant[]) => Restaurant[])) => {
        if (!selectedTrip || !currentDestination) return;
        const value = typeof newRestaurants === 'function' ? newRestaurants(generatedRestaurants) : newRestaurants;
        await updateDestination(selectedTrip.id, currentDestination.id, { restaurants: value });
    }, [selectedTrip, currentDestination, updateDestination, generatedRestaurants]);

    const setExcludedRestaurantsFunc = useCallback(async (newExcluded: string[] | ((prev: string[]) => string[])) => {
        if (!selectedTrip || !currentDestination) return;
        const value = typeof newExcluded === 'function' ? newExcluded(excludedRestaurants) : newExcluded;
        await updateDestination(selectedTrip.id, currentDestination.id, { excludedRestaurants: value });
    }, [selectedTrip, currentDestination, updateDestination, excludedRestaurants]);

    const setTypicalDishesFunc = useCallback(async (newDishes: TypicalDish[] | ((prev: TypicalDish[]) => TypicalDish[])) => {
        if (!selectedTrip || !currentDestination) return;
        const value = typeof newDishes === 'function' ? newDishes(typicalDishes) : newDishes;
        await updateDestination(selectedTrip.id, currentDestination.id, { typicalDishes: value });
    }, [selectedTrip, currentDestination, updateDestination, typicalDishes]);

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

    // Generate Typical Dishes on mount if empty
    React.useEffect(() => {
        const loadDishes = async () => {
            // Wait for storage to load first or if already loading
            if (isDishesStorageLoading || isLoadingDishes) return;

            if (typicalDishes.length === 0 && cityName) {
                setIsLoadingDishes(true);
                try {
                    const service = getGeminiService();
                    const dishes = await service.generateTypicalDishes(cityName);

                    if (dishes && dishes.length > 0) {
                        await setTypicalDishesFunc(dishes);

                        // Trigger image generation for dishes without images sequentially
                        for (let i = 0; i < dishes.length; i++) {
                            const dish = dishes[i];
                            if (!dish.image && !dish.aiImage) {
                                // Generate Icon
                                const iconUrl = await service.generateDishIcon(dish.name);

                                // Update with result
                                if (iconUrl) {
                                    await setTypicalDishesFunc(prev => prev.map((d, idx) =>
                                        idx === i ? { ...d, aiImage: iconUrl, isGenerating: false } : d
                                    ));
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error loading typical dishes:', e);
                } finally {
                    setIsLoadingDishes(false);
                }
            }
        };
        loadDishes();
    }, [cityName, isDishesStorageLoading, typicalDishes.length, setTypicalDishesFunc]);

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
        await setGeneratedRestaurantsFunc([]); // Clear previous

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

                await setGeneratedRestaurantsFunc(mappedRestaurants);
            }
        } catch (error) {
            console.error('Error generating curation:', error);
            // Optionally handle error state here
        } finally {
            setIsGenerating(false);
            setIsGeneratingOverview(false);
        }
    };

    const handleDeleteRestaurant = (restaurant: Restaurant) => {
        setExcludedRestaurantsFunc([...excludedRestaurants, restaurant.name]);
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
            setGeneratedRestaurantsFunc([restaurant, ...generatedRestaurants]);
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

                await setGeneratedRestaurantsFunc([...generatedRestaurants, ...mapped]);
                setShowImportModal(false);
                setImportText('');
            }
        } catch (error) {
            console.error('Error importing list:', error);
        } finally {
            setIsImporting(false);
        }
    };



    // Simplified restaurant source logic
    // Simplified restaurant source logic
    const filteredRestaurants = useMemo(() => {
        if (generatedRestaurants.length > 0) {
            return generatedRestaurants.filter(r => !excludedRestaurants.includes(r.name));
        }
        return [];
    }, [generatedRestaurants, excludedRestaurants]);

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

                    <div id="dishes-carousel" className="flex gap-6 overflow-x-auto pb-8 pt-4 snap-x hide-scrollbar px-1 scroll-smooth">
                        {isLoadingDishes ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="min-w-[220px] h-48 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse flex flex-col items-center justify-center p-6" >
                                    <div className="w-24 h-24 bg-gray-100 rounded-full mb-4"></div>
                                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                </div>
                            ))
                        ) : typicalDishes.length > 0 ? (
                            typicalDishes.map((dish, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDish(dish)}
                                    className="min-w-[160px] max-w-[160px] bg-white border-2 border-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center snap-start"
                                >
                                    <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
                                        {dish.isGenerating ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
                                                <Sparkles className="w-6 h-6 text-orange-300 animate-spin" />
                                            </div>
                                        ) : (dish.aiImage || dish.image) ? (
                                            <img
                                                src={dish.aiImage || dish.image}
                                                alt={dish.name}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-orange-50 rounded-lg flex items-center justify-center text-orange-300">
                                                <Utensils className="w-10 h-10" />
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="font-bold text-gray-900 text-base text-center leading-tight">
                                        {dish.name}
                                    </h4>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                Nenhum prato típico encontrado.
                            </div>
                        )}
                    </div>
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
                    {/* Gastronomy Chat Widget */}
                    <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100 shadow-sm relative overflow-hidden flex flex-col h-[400px]">
                        {/* Decorator */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <span className="material-symbols-outlined text-6xl text-amber-600">restaurant</span>
                        </div>

                        <div className="relative z-10 flex-none">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-600">forum</span> Chat Gastronômico
                                </h3>
                                <span className="text-[10px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded-full shadow-sm">Gemini 3 Flash</span>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-3 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
                                        ? 'bg-amber-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-700 shadow-sm rounded-tl-none border border-amber-100'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white text-gray-500 shadow-sm rounded-2xl rounded-tl-none border border-amber-100 px-3 py-2 text-xs flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                                placeholder="Pergunte sobre comida..."
                                className="flex-1 bg-white border border-amber-200 text-gray-700 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder:text-gray-400"
                                disabled={isChatLoading}
                            />
                            <button
                                onClick={handleSendChatMessage}
                                disabled={!chatInput.trim() || isChatLoading}
                                className="bg-amber-600 text-white p-2 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
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
                            <div className="w-full bg-[#8B5CF6] text-white px-4 py-2 rounded-lg font-bold text-sm tracking-wide lowercase mb-1">
                                Lista de Restaurantes
                            </div>
                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder={`Ex: \n- Le Chateaubriand\n- Septime\n- Clown Bar`}
                                className="w-full h-48 p-4 bg-white border border-gray-400 rounded-lg focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all resize-none text-sm leading-relaxed placeholder-gray-400 font-medium text-gray-900"
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

