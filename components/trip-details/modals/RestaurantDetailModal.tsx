import React from 'react';
import { MapPin, Clock, Star, Heart, Share2, X, Plus, FileText } from 'lucide-react';
import Modal from '../modals/Modal';
import { Button } from '../../ui/Base';
import { Restaurant } from '../../../types';

interface RestaurantDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant | null;
    onAddToItinerary?: (restaurant: Restaurant) => void;
}

const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
    isOpen,
    onClose,
    restaurant,
    onAddToItinerary
}) => {
    const [isFavorite, setIsFavorite] = React.useState(false);

    if (!restaurant) return null;

    const footer = null; // No default footer, using custom layout

    const handleGoogleMaps = () => {
        const query = encodeURIComponent(`${restaurant.name} ${restaurant.address || ''} ${restaurant.city || ''}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    const getCategoryIcon = (category: string = ''): React.ReactNode => {
        const cat = category.toLowerCase();
        if (cat.includes('café') || cat.includes('coffee') || cat.includes('padaria')) return <span className="material-symbols-outlined">coffee</span>;
        if (cat.includes('bar') || cat.includes('pub') || cat.includes('drink')) return <span className="material-symbols-outlined">local_bar</span>;
        if (cat.includes('japon') || cat.includes('sushi') || cat.includes('asia')) return <span className="material-symbols-outlined">ramen_dining</span>;
        if (cat.includes('fast') || cat.includes('burger') || cat.includes('street')) return <span className="material-symbols-outlined">fastfood</span>;
        if (cat.includes('pizza') || cat.includes('ital')) return <span className="material-symbols-outlined">local_pizza</span>;
        if (cat.includes('sobremesa') || cat.includes('doce') || cat.includes('sorvete')) return <span className="material-symbols-outlined">icecream</span>;
        return <span className="material-symbols-outlined">restaurant</span>;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            size="lg" // Reduced size for better proportion
            footer={footer}
        >
            <div className="p-1">
                {/* Header Section - Clean & Minimal */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight leading-tight mb-3">
                        {restaurant.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Category Badge - Icon Style */}
                        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                            {getCategoryIcon(restaurant.category)}
                            <span className="text-xs font-bold uppercase tracking-wider">{restaurant.category}</span>
                        </div>

                        {/* Rating Badge */}
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span className="text-xs font-bold">{restaurant.rating?.toFixed(1) || '4.5'}</span>
                            <span className="text-[10px] text-amber-600/70 ml-1 font-medium">(1.2k)</span>
                        </div>

                        {/* Price Badge */}
                        {restaurant.price && (
                            <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <span className="material-symbols-outlined text-base">payments</span>
                                <span className="text-xs font-bold">{restaurant.price}</span>
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${restaurant.isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{restaurant.isOpen ? 'Aberto agora' : 'Fechado'}</span>
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
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                {restaurant.description || "Uma experiência gastronômica única esperando por você."}
                            </p>
                            {/* Address & Hours embedded in About box as context */}
                            <div className="mt-4 pt-4 border-t border-gray-200/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex gap-2.5 items-start">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 uppercase mb-0.5">Endereço</p>
                                        <p className="text-xs text-gray-500 leading-snug">{restaurant.address || "Endereço não disponível"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 items-start">
                                    <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 uppercase mb-0.5">Horário</p>
                                        <p className="text-xs text-gray-500 leading-snug">{restaurant.hours?.text || "Consultar horário"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* What People Say Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded bg-yellow-100/50 text-yellow-600">
                                <Star className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">O que dizem as pessoas</h3>
                        </div>
                        <div className="bg-yellow-50/50 rounded-2xl p-5 border border-yellow-100">
                            {restaurant.reviewSummary ? (
                                <p className="text-sm text-gray-700 leading-relaxed italic relative pl-4 border-l-2 border-yellow-300">
                                    "{restaurant.reviewSummary}"
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {restaurant.reviews?.slice(0, 2).map((review, i) => (
                                        <div key={i} className="pb-3 border-b border-yellow-100/50 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs font-bold text-gray-900">{review.author}</span>
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, j) => <Star key={j} className={`w-2.5 h-2.5 ${j < review.rating ? 'fill-current' : 'text-gray-200'}`} />)}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">"{review.text}"</p>
                                        </div>
                                    )) || <p className="text-sm text-gray-500 italic">Nenhuma avaliação detalhada disponível.</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gallery Thumbnails (Optional - Keep small if requested cleaning) */}
                    {restaurant.images && restaurant.images.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fotos</h3>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {restaurant.images.map((img, idx) => (
                                    <img key={idx} src={img} className="h-16 w-24 object-cover rounded-lg border border-gray-100" alt={`Foto ${idx}`} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions Footer - Fixed at bottom styling if needed, or just inline */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                    <Button
                        variant="primary"
                        onClick={() => onAddToItinerary && onAddToItinerary(restaurant)}
                        className="flex-1 shadow-lg shadow-indigo-500/20 py-2.5"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar ao Itinerário
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`px-4 ${isFavorite ? 'text-red-500 border-red-100 bg-red-50' : 'text-gray-600 border-gray-200'}`}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RestaurantDetailModal;
