import React, { useState } from 'react';
import { Card } from '../../ui/Base';
import { Star, MapPin, Clock, Info, Heart, X, Calendar, DollarSign, ExternalLink, Sparkles } from 'lucide-react';
import { DiscoveryAttraction } from '../../../types';
import DiscoveryCardCarousel from './DiscoveryCardCarousel';

interface DiscoveryCardProps {
    attraction: DiscoveryAttraction;
    onSkip: () => void;
    onSave: () => void;
    onSchedule: () => void;
    isActive: boolean;
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
    attraction,
    onSkip,
    onSave,
    onSchedule,
    isActive
}) => {
    const [animationClass, setAnimationClass] = useState('');

    const handleAction = (action: 'skip' | 'save' | 'schedule') => {
        if (!isActive) return;

        if (action === 'skip') {
            setAnimationClass('discovery-card-skip');
            setTimeout(onSkip, 300);
        } else if (action === 'save') {
            setAnimationClass('discovery-card-save');
            setTimeout(onSave, 400);
        } else if (action === 'schedule') {
            // For schedule we open popover, don't necessarily animate card away immediately unless confirmed
            // But typically we want to transition to next one after scheduling
            // For UI feel, we might want to just open the popover first.
            onSchedule();
        }
    };

    // Pricing formatting
    const renderPrice = (level?: number) => {
        if (level === 0 || level === undefined) return <span className="text-green-400 font-bold text-xs">Grátis</span>;
        return (
            <div className="flex text-xs">
                {[...Array(4)].map((_, i) => (
                    <span key={i} className={i < level ? 'text-white font-bold' : 'text-white/40'}>$</span>
                ))}
            </div>
        );
    };

    const isOpen = attraction.openNow;
    const statusColor = isOpen === true ? 'bg-green-500' : (isOpen === false ? 'bg-red-500' : 'bg-gray-400');
    const statusText = isOpen === true ? 'Aberto' : (isOpen === false ? 'Fechado' : 'Horário não disp.');

    return (
        <div className={`w-full h-full max-h-[85vh] mx-auto aspect-[3/4.5] flex flex-col relative transition-transform duration-300 ${animationClass}`}>
            <Card className="w-full h-full overflow-hidden flex flex-col p-0 border-0 shadow-2xl rounded-[1.5rem] bg-white relative z-10 group select-none">

                {/* 1. TOP BLOCK: Media (45%) */}
                <div className="h-[45%] w-full relative shrink-0">
                    <DiscoveryCardCarousel photos={attraction.photos} name={attraction.name} />

                    {/* Overlays (Badges) - Inside Top Block */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
                        <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm uppercase flex items-center gap-1.5 border border-white/10">
                            <span className="material-symbols-outlined text-xs">category</span>
                            {attraction.category}
                        </div>

                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                            {renderPrice(attraction.priceLevel)}
                        </div>
                    </div>
                </div>

                {/* 2. MIDDLE BLOCK: Info (Flexible) */}
                <div className="flex-1 flex flex-col px-5 pt-5 pb-2 overflow-y-auto min-h-0">
                    {/* Header */}
                    <div className="mb-2">
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                {attraction.name}
                            </h2>
                            <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-xs shrink-0">
                                <Star size={12} fill="currentColor" />
                                <span>{attraction.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                            <span className="font-medium">{statusText}</span>
                            <span>•</span>
                            <span>{attraction.address?.split(',')[0]}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 mb-3">
                        {attraction.description}
                    </p>

                    {/* AI Reason */}
                    {attraction.aiReason && (
                        <div className="mt-auto mb-2 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100 flex gap-2.5 items-start">
                            <Sparkles className="text-indigo-500 w-4 h-4 shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-900 italic leading-snug">
                                "{attraction.aiReason}"
                            </p>
                        </div>
                    )}
                </div>

                {/* 3. BOTTOM BLOCK: Actions (Fixed Footer) */}
                <div className="h-24 shrink-0 bg-white border-t border-gray-100 flex items-center justify-center gap-6 px-4">
                    {/* Skip */}
                    <button
                        onClick={() => handleAction('skip')}
                        className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                        title="Pular"
                    >
                        <X size={24} />
                    </button>

                    {/* Add to Itinerary (Center) - Same Size, Highlight Color */}
                    <button
                        onClick={() => handleAction('schedule')}
                        className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center active:scale-95 border-4 border-indigo-50"
                        title="Agendar"
                    >
                        <Calendar size={24} />
                    </button>

                    {/* Save */}
                    <button
                        onClick={() => handleAction('save')}
                        className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-green-500 hover:bg-green-50 hover:border-green-200 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                        title="Salvar"
                    >
                        <Heart size={24} />
                    </button>
                </div>
            </Card>

            {/* Stack Effect Background Cards */}
            <div className="absolute top-4 left-4 right-4 bottom-0 bg-white/40 rounded-[2rem] -z-10 translate-y-2 scale-[0.95] blur-sm" />
        </div>
    );
};

export default DiscoveryCard;
