import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { X, Heart, Calendar, MapPin, Star, Info, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { getGeminiService } from '../../../services/geminiService';
import { googlePlacesService } from '../../../services/googlePlacesService';
import { Restaurant } from '../../../types';
import { Button } from '../../ui/Base';

interface GastronomyDiscoveryModeProps {
    cityName: string;
    onSave: (restaurant: Restaurant) => void;
    onSchedule: (restaurant: Restaurant) => void;
    onClose: () => void;
    existingRestaurants: Restaurant[];
}

interface DiscoveryCard extends Restaurant {
    googleRating?: number;
    businessStatus?: string;
    priceLevel?: number;
    userRatingsTotal?: number;
    photos?: string[];
}

const GastronomyDiscoveryMode: React.FC<GastronomyDiscoveryModeProps> = ({
    cityName,
    onSave,
    onSchedule,
    onClose,
    existingRestaurants
}) => {
    const [queue, setQueue] = useState<DiscoveryCard[]>([]);
    const [history, setHistory] = useState<DiscoveryCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Iniciando descoberta...');
    const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

    const controls = useAnimation();
    const [imageIndex, setImageIndex] = useState(0);

    // Initial load
    useEffect(() => {
        loadDiscoveryQueue();
    }, [cityName]);

    const currentCard = queue[0];

    // Reset image index when card changes
    useEffect(() => {
        setImageIndex(0);
    }, [currentCard?.id]);


    const loadDiscoveryQueue = async () => {
        setIsLoading(true);
        setLoadingMessage(`Analisando perfil gastronômico de ${cityName}...`);

        try {
            const gemini = getGeminiService();
            // Get raw suggestion list from AI
            const curation = await gemini.generateGastronomyCuration(cityName);

            if (!curation || !curation.restaurants) {
                // Resize queue or handle error
                setIsLoading(false);
                return;
            }

            setLoadingMessage('Validando restaurantes em tempo real...');

            // Process individually to validate
            const validRestaurants: DiscoveryCard[] = [];
            const processedNames = new Set(existingRestaurants.map(r => r.name.toLowerCase()));

            // Limit to checking 10 candidates to avoid API overuse in one go
            const candidates = curation.restaurants.filter(r => !processedNames.has(r.name.toLowerCase())).slice(0, 10);

            for (const cand of candidates) {
                const placeDetails = await googlePlacesService.searchPlace(`${cand.name} ${cityName}`);

                if (placeDetails.address && placeDetails.businessStatus === 'OPERATIONAL') {
                    // Enrich
                    validRestaurants.push({
                        id: `disc-${Date.now()}-${validRestaurants.length}`,
                        name: cand.name,
                        city: cityName,
                        category: cand.category,
                        description: cand.description,
                        price: cand.price, // Keep AI price string or use google priceLevel
                        priceLevel: placeDetails.priceLevel,
                        rating: placeDetails.rating || 4.5,
                        googleRating: placeDetails.rating,
                        userRatingsTotal: placeDetails.userRatingCount,
                        image: placeDetails.image || '', // Primary image
                        photos: placeDetails.photos && placeDetails.photos.length > 0 ? placeDetails.photos : (placeDetails.image ? [placeDetails.image] : []),
                        address: placeDetails.address,
                        hours: {
                            open: placeDetails.openingHours?.periods?.[0]?.open?.time || '',
                            close: placeDetails.openingHours?.periods?.[0]?.close?.time || '',
                            text: cand.hours
                        },
                        specialty: cand.specialty,
                        highlight: cand.highlight,
                        reviewSummary: cand.reviewSummary,
                        isOpen: true // Validated as operational
                    });
                }
            }

            setQueue(validRestaurants);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (action: 'skip' | 'save' | 'schedule') => {
        if (queue.length === 0) return;

        const current = queue[0];
        const nextQueue = queue.slice(1);

        // Animate out
        let xTarget = 0;
        let yTarget = 0;
        let opacityTarget = 0;

        if (action === 'skip') xTarget = -500;
        if (action === 'save') xTarget = 500;
        if (action === 'schedule') yTarget = -500;

        await controls.start({ x: xTarget, y: yTarget, opacity: opacityTarget, transition: { duration: 0.2 } });

        // Perform action
        if (action === 'save') onSave(current);
        if (action === 'schedule') onSchedule(current);

        // Update state
        setHistory([...history, current]);
        setQueue(nextQueue);

        // Reset animation for next card
        controls.set({ x: 0, y: 0, opacity: 1 });
    };

    const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            handleAction('save');
        } else if (info.offset.x < -threshold) {
            handleAction('skip');
        } else if (info.offset.y < -threshold) {
            handleAction('schedule');
        } else {
            controls.start({ x: 0, y: 0 });
        }
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentCard?.photos && currentCard.photos.length > 1) {
            setImageIndex((prev) => (prev + 1) % currentCard.photos!.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentCard?.photos && currentCard.photos.length > 1) {
            setImageIndex((prev) => (prev - 1 + currentCard.photos!.length) % currentCard.photos!.length);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-gray-100 min-h-[500px]">
                <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Star className="w-6 h-6 text-indigo-600 fill-indigo-600 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Preparando Experiência</h3>
                <p className="text-gray-500 animate-pulse">{loadingMessage}</p>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-200 min-h-[500px]">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Tudo pronto por aqui!</h3>
                <p className="text-gray-500 text-center max-w-md mb-8">
                    Você analisou todas as sugestões que preparamos.
                </p>
                <div className="flex gap-4">
                    <Button onClick={loadDiscoveryQueue} variant="outline" className="border-gray-200">
                        Buscar Mais
                    </Button>
                    <Button onClick={onClose} className="bg-gray-900 text-white">
                        Voltar para Lista
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-md mx-auto h-[700px] flex flex-col items-center justify-center">
            {/* Main Swipeable Card Structure */}
            <motion.div
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.6}
                onDragEnd={onDragEnd}
                animate={controls}
                whileTap={{ cursor: "grabbing" }}
                className="w-full h-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-20 cursor-grab active:cursor-grabbing border border-gray-100"
                style={{ transformOrigin: 'bottom center' }}
            >
                {/* 1. Integrated Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-50 z-30">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Star className="w-3 h-3 fill-white" />
                        IA Discovery • {queue.length} left
                    </span>

                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                        title="Fechar Modo Descoberta"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Hero Image Section */}
                <div className="relative h-[280px] shrink-0 bg-gray-100 group">
                    <img
                        src={currentCard.photos && currentCard.photos.length > 0 ? currentCard.photos[imageIndex] : (currentCard.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800")}
                        alt={currentCard.name}
                        className="w-full h-full object-cover"
                    />

                    {/* Carousel Controls */}
                    {currentCard.photos && currentCard.photos.length > 1 && (
                        <>
                            <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                            <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {currentCard.photos.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-full transition-all shadow-sm ${idx === imageIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Gradient Overlay for bottom protection */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                    {/* Top Right Badges */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white font-bold text-xs border border-white/20 shadow-sm">
                            {currentCard.price || '$$'}
                        </div>
                        {currentCard.rating && (
                            <div className="px-3 py-1 bg-white rounded-full text-gray-900 font-bold text-xs flex items-center gap-1 shadow-md">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-3 h-3" alt="Google" />
                                {currentCard.rating.toFixed(1)}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Content Body */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden bg-white relative">
                    {/* Header Info */}
                    <div className="mb-5">
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                            {currentCard.name}
                        </h2>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <span className="text-indigo-600 uppercase tracking-wide text-xs font-bold">{currentCard.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                                <MapPin className="w-3.5 h-3.5" />
                                {currentCard.address?.split(',')[0]}
                            </span>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
                        {/* AI Section */}
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                                Curadoria IA
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                {currentCard.description}
                            </p>
                        </div>

                        {/* Structured Details */}
                        <div className="grid grid-cols-1 gap-3 pt-2">
                            {currentCard.specialty && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Info className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-900 uppercase">Especialidade</span>
                                        <span className="text-sm text-gray-600 leading-snug">{currentCard.specialty}</span>
                                    </div>
                                </div>
                            )}

                            {currentCard.hours?.text && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <Clock className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-900 uppercase">Funcionamento</span>
                                        <span className="text-sm text-gray-600 leading-snug">{currentCard.hours.text}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Integrated Action Footer */}
                <div className="px-8 pb-8 pt-4 bg-white border-t border-gray-50 flex items-center justify-between z-30">
                    {/* Skip */}
                    <button
                        onClick={() => handleAction('skip')}
                        className="w-14 h-14 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all hover:scale-105 active:scale-95 group"
                        title="Pular"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    {/* Schedule */}
                    <button
                        onClick={() => handleAction('schedule')}
                        className="w-14 h-14 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
                        title="Agendar Visita"
                    >
                        <Calendar className="w-6 h-6" />
                    </button>

                    {/* Save */}
                    <button
                        onClick={() => handleAction('save')}
                        className="w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 hover:shadow-emerald-300"
                        title="Salvar"
                    >
                        <Heart className="w-6 h-6 fill-current" />
                    </button>
                </div>
            </motion.div>

            {/* Background Stack Effect */}
            {queue.length > 1 && (
                <div className="absolute top-4 bottom-4 inset-x-4 bg-white/50 rounded-[32px] border border-white/20 -z-10 scale-[0.98] blur-[1px] translate-y-2 shadow-xl" />
            )}
        </div>
    );
};

export default GastronomyDiscoveryMode;
