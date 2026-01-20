import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DiscoveryAttraction } from '../../../types';
import discoveryService from '../../../services/discoveryService';
import DiscoveryCard from './DiscoveryCard';
import DiscoveryCardSkeleton from './DiscoveryCardSkeleton';
import ScheduleAttractionPopover from './ScheduleAttractionPopover';
import { ChevronLeft, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Attraction } from '../../../types';

interface DiscoveryModeProps {
    cityName: string;
    country: string;
    existingAttractions: Attraction[];
    tripStartDate?: string;
    tripEndDate?: string;
    onSaveToRepository: (attraction: DiscoveryAttraction) => void;
    onAddToItinerary: (data: { itemName: string; itemType: 'attraction'; date: string; time: string; notes?: string; address?: string; image?: string; category?: string }) => Promise<void>;
    onExit: () => void;
}

const PREFETCH_COUNT = 2; // How many future cards to pre-validate

const DiscoveryMode: React.FC<DiscoveryModeProps> = ({
    cityName,
    country,
    existingAttractions,
    tripStartDate,
    tripEndDate,
    onSaveToRepository,
    onAddToItinerary,
    onExit
}) => {
    // Queue state
    const [queue, setQueue] = useState<DiscoveryAttraction[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Popover state
    const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);

    // Ref to track processed IDs to avoid duplicates if we regenerate
    const processedRef = useRef<Set<string>>(new Set());

    // Current active attraction
    const currentAttraction = queue[currentIdx];

    /**
     * Initialize Discovery - Generate Suggestions
     */
    useEffect(() => {
        const initDiscovery = async () => {
            setLoading(true);
            setError(null);
            try {
                const existingNames = existingAttractions.map(a => a.name);
                const rawSuggestions = await discoveryService.generateSuggestions(cityName, country, existingNames);

                if (rawSuggestions.length === 0) {
                    setError('Não foi possível encontrar sugestões no momento.');
                } else {
                    setQueue(rawSuggestions);
                    // Start validating the first few
                    validateQueueItems(rawSuggestions, 0);
                }
            } catch (e) {
                console.error(e);
                setError('Erro ao iniciar modo descoberta.');
            } finally {
                setLoading(false);
            }
        };

        initDiscovery();
    }, [cityName, country]);

    /**
     * Validate current and next few items in queue
     */
    const validateQueueItems = useCallback(async (allSuggestions: DiscoveryAttraction[], startIndex: number) => {
        // We want to ensure items from startIndex to startIndex + PREFETCH_COUNT are validated
        const endIndex = Math.min(startIndex + PREFETCH_COUNT + 1, allSuggestions.length);

        for (let i = startIndex; i < endIndex; i++) {
            const item = allSuggestions[i];
            if (item.status === 'pending') {
                // Update state to validating
                setQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'validating' } : it));

                // Perform validation
                try {
                    const validated = await discoveryService.validateWithPlaces(item, cityName);
                    setQueue(prev => prev.map((it, idx) => idx === i ? validated : it));
                } catch (err) {
                    console.error(`Validation failed for ${item.name}`, err);
                    // Mark as error so it doesn't get stuck in 'validating'
                    setQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', errorMessage: 'Falha na validação' } : it));
                }
            }
        }
    }, [cityName]);

    /**
     * Effect to trigger validation when index changes
     */
    useEffect(() => {
        if (queue.length > 0) {
            validateQueueItems(queue, currentIdx);
        }
    }, [currentIdx, queue.length, validateQueueItems]);


    /**
     * Actions
     */
    const handleNext = () => {
        if (currentIdx < queue.length - 1) {
            setCurrentIdx(prev => prev + 1);
        } else {
            // End of queue
            // Could auto-generate more here? For now show finish screen.
        }
    };

    const handleSkip = () => {
        handleNext();
    };

    const handleSave = () => {
        if (currentAttraction) {
            onSaveToRepository(currentAttraction);
            handleNext();
        }
    };

    const handleScheduleOpen = () => {
        setSchedulePopoverOpen(true);
    };

    const handleScheduleConfirm = async (date: string, time: string, notes?: string) => {
        if (currentAttraction) {
            await onAddToItinerary({
                itemName: currentAttraction.name,
                itemType: 'attraction',
                date,
                time,
                notes,
                address: currentAttraction.address,
                image: currentAttraction.photos?.[0],
                category: currentAttraction.category
            });
            // After scheduling, move to next? Yes typically
            handleNext();
        }
    };

    // Render Logic

    // 1. Initial Loading
    if (loading && queue.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-8 text-center bg-white p-8 rounded-[2rem] shadow-xl">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                        <div className="relative bg-white p-4 rounded-full shadow-md border border-indigo-50">
                            <Sparkles className="w-full h-full text-indigo-600 animate-pulse" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Curando Experiências</h2>
                        <p className="text-gray-500">Nossa IA está buscando os melhores lugares de {cityName} para você...</p>
                    </div>

                    <div className="h-1.5 w-48 bg-gray-100 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full animate-progress-indeterminate"></div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Error
    if (error) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md p-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Algo deu errado.</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <div className="flex justify-center gap-3">
                        <button onClick={onExit} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50">Voltar</button>
                        {/* Retry could be implemented by resetting state */}
                    </div>
                </div>
            </div>
        );
    }

    // 3. Finished / No more suggestions
    if (currentIdx >= queue.length) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Tudo Pronto!</h2>
                        <p className="text-gray-500 text-lg">Você visualizou todas as sugestões que preparamos para {cityName}.</p>
                    </div>

                    <div className="py-4">
                        <p className="font-bold text-indigo-600 bg-indigo-50 py-3 px-6 rounded-xl inline-block">
                            {queue.length} atrações analisadas
                        </p>
                    </div>

                    <button
                        onClick={onExit}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02]"
                    >
                        Ver Minha Lista
                    </button>
                </div>
            </div>
        );
    }

    // 4. Main Card View
    const isSkeleton = currentAttraction.status === 'pending' || currentAttraction.status === 'validating';

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
            {/* Dark Backdrop Overlay */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-0" />

            {/* Background Decorative Elements (inside overlay) */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-indigo-900/40 to-transparent -z-10 pointer-events-none" />

            {/* Header Navigation */}
            <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-40 max-w-2xl mx-auto w-full">
                <button
                    onClick={onExit}
                    className="p-2.5 bg-white/10 text-white rounded-full shadow-lg hover:bg-white/20 border border-white/20 transition-all hover:scale-105 backdrop-blur-md"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest bg-indigo-900/50 px-3 py-1 rounded-full mb-1 border border-indigo-500/30 backdrop-blur-md">Modo Descoberta</span>
                    <span className="text-sm font-medium text-gray-300">
                        {currentIdx + 1} de {queue.length}
                    </span>
                </div>
                <div className="w-10" /> {/* Spacer for balance */}
            </div>

            {/* Main Card Area */}
            <div className="w-full max-w-sm px-4 relative z-50 perspective-1000">
                {isSkeleton ? (
                    <DiscoveryCardSkeleton />
                ) : (
                    <DiscoveryCard
                        attraction={currentAttraction}
                        onSkip={handleSkip}
                        onSave={handleSave}
                        onSchedule={handleScheduleOpen}
                        isActive={true}
                    />
                )}
            </div>

            {/* Popovers */}
            {schedulePopoverOpen && currentAttraction && (
                <ScheduleAttractionPopover
                    isOpen={schedulePopoverOpen}
                    onClose={() => setSchedulePopoverOpen(false)}
                    attraction={currentAttraction}
                    tripStartDate={tripStartDate}
                    tripEndDate={tripEndDate}
                    onConfirm={handleScheduleConfirm}
                />
            )}
        </div>
    );
};

export default DiscoveryMode;
