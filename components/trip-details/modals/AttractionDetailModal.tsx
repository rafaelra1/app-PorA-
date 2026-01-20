import React from 'react';
import { MapPin, Clock, Star, Heart, FileText, Plus } from 'lucide-react';
import Modal from './Modal';
import { Button } from '../../ui/Base';
import { Attraction } from '../../../types';

interface AttractionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    attraction: Attraction | null;
    onAddToItinerary?: (attraction: Attraction) => void;
    cityName?: string;
}

const AttractionDetailModal: React.FC<AttractionDetailModalProps> = ({
    isOpen,
    onClose,
    attraction,
    onAddToItinerary,
    cityName = ''
}) => {
    const [isFavorite, setIsFavorite] = React.useState(false);

    if (!attraction) return null;

    const footer = null; // Custom footer inside modal body

    const getCategoryIcon = (category: string = ''): React.ReactNode => {
        const cat = category.toLowerCase();
        if (cat.includes('museu') || cat.includes('arte') || cat.includes('galeria')) return <span className="material-symbols-outlined">museum</span>;
        if (cat.includes('parque') || cat.includes('nature') || cat.includes('jardim')) return <span className="material-symbols-outlined">park</span>;
        if (cat.includes('igreja') || cat.includes('templ') || cat.includes('relig')) return <span className="material-symbols-outlined">church</span>;
        if (cat.includes('hist') || cat.includes('monument') || cat.includes('castelo')) return <span className="material-symbols-outlined">castle</span>;
        if (cat.includes('teatro') || cat.includes('show') || cat.includes('cult')) return <span className="material-symbols-outlined">theater_comedy</span>;
        if (cat.includes('compras') || cat.includes('mall') || cat.includes('loja')) return <span className="material-symbols-outlined">shopping_bag</span>;
        return <span className="material-symbols-outlined">tour</span>;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            size="lg"
            footer={footer}
        >
            <div className="p-1">
                {/* Header Section */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight leading-tight mb-3">
                        {attraction.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2 text-primary-dark bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                            {getCategoryIcon(attraction.category)}
                            <span className="text-xs font-bold uppercase tracking-wider">{attraction.category}</span>
                        </div>

                        {/* Rating Badge */}
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span className="text-xs font-bold">{attraction.rating || '4.5'}</span>
                            <span className="text-[10px] text-amber-600/70 ml-1 font-medium">(1.2k)</span>
                        </div>

                        {/* Price Badge */}
                        {attraction.price && (
                            <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <span className="material-symbols-outlined text-base font-bold">payments</span>
                                <span className="text-xs font-bold">{attraction.price}</span>
                            </div>
                        )}

                        {/* Status Badge (Static for now since it's hard to know live status for attractions without API) */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Aberto agora</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* About Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded bg-orange-100/50 text-orange-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Sobre o Local</h3>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                            <p className="text-sm text-gray-600 leading-relaxed font-medium mb-4">
                                {attraction.longDescription || attraction.description}
                            </p>

                            <div className="pt-4 border-t border-gray-200/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex gap-2.5 items-start">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 uppercase mb-0.5">Endereço</p>
                                        <p className="text-xs text-gray-500 leading-snug">{attraction.address || "Consulte no mapa"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 items-start">
                                    <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 uppercase mb-0.5">Horário</p>
                                        <p className="text-xs text-gray-500 leading-snug">{attraction.openingHours || attraction.time || "Consultar horário"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Review Summary Section */}
                    {attraction.reviewSummary && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded bg-yellow-100/50 text-yellow-600">
                                    <Star className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">O que dizem as pessoas</h3>
                            </div>
                            <div className="bg-yellow-50/50 rounded-2xl p-5 border border-yellow-100">
                                <p className="text-sm text-gray-700 leading-relaxed italic relative pl-4 border-l-2 border-yellow-300">
                                    "{attraction.reviewSummary}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="primary"
                        onClick={() => onAddToItinerary && onAddToItinerary(attraction)}
                        className="flex-[2] shadow-lg shadow-indigo-500/20 py-3"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar ao Itinerário
                    </Button>

                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name + ' ' + (attraction.city || cityName))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                    >
                        <Button
                            variant="outline"
                            className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                        >
                            <MapPin className="w-4 h-4 mr-2 text-red-500" />
                            Ver no Maps
                        </Button>
                    </a>

                    <Button
                        variant="outline"
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`px-4 py-3 ${isFavorite ? 'text-red-500 border-red-100 bg-red-50' : 'text-gray-600 border-gray-200'}`}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AttractionDetailModal;
