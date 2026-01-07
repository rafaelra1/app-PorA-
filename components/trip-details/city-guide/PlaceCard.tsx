import React from 'react';
import { Card } from '../../ui/Base';

interface PlaceCardProps {
    image: string;
    category?: string;
    title: string;
    description: string;
    longDescription?: string;
    reviewSummary?: string;
    rating?: number | string;
    time?: string;
    price?: string;
    variant?: 'horizontal' | 'vertical';
    onClick?: () => void;
    onMapClick?: (e: React.MouseEvent) => void;
    onEditImage?: (e: React.MouseEvent) => void;
    onAddToItinerary?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    isGenerating?: boolean;
    specialty?: string;
    highlight?: string;
    icon?: string;
    color?: string;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
    image,
    category,
    title,
    description,
    longDescription,
    reviewSummary,
    rating,
    time,
    price,
    variant = 'horizontal',
    onClick,
    onMapClick,
    onEditImage,
    onAddToItinerary,
    onDelete,
    isGenerating,
    specialty,
    highlight,
    icon,
    color
}) => {
    const isHorizontal = variant === 'horizontal';

    if (isHorizontal) {
        return (
            <Card
                onClick={onClick}
                className="group flex items-center p-3 gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white cursor-pointer h-full hover:border-primary/30"
            >
                {/* Image Section - Compact Thumbnail */}
                <div className={`relative w-24 h-24 shrink-0 rounded-xl overflow-hidden ${!image && 'bg-gray-50 flex items-center justify-center'}`}>
                    {image && !image.includes('placeholder') ? (
                        <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center bg-${color || 'indigo'}-50 text-${color || 'indigo'}-500 group-hover:bg-${color || 'indigo'}-100 transition-colors`}>
                            <span className="material-symbols-outlined text-4xl">{icon || 'restaurant'}</span>
                        </div>
                    )}

                    {/* AI Edit Button - Mini */}
                    {onEditImage && (
                        <button
                            onClick={onEditImage}
                            className="absolute bottom-1 right-1 bg-black/50 backdrop-blur-md p-1 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            title="Gerar nova imagem com IA"
                        >
                            <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                        </button>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <div className="flex justify-between items-start">
                        <div className='flex flex-col'>
                            {category && (
                                <span className="text-[9px] uppercase font-bold text-primary-dark tracking-wider mb-0.5 opacity-70">
                                    {category}
                                </span>
                            )}
                            <h3 className="text-sm font-bold text-text-main leading-tight truncate group-hover:text-primary-dark transition-colors">
                                {title}
                            </h3>
                        </div>

                        {/* Rating - Ultra Compact */}
                        {rating && (
                            <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50/50 px-1.5 py-0.5 rounded-md shrink-0 h-fit border border-amber-100/50">
                                <span className="material-symbols-outlined text-[10px] filled">star</span>
                                <span className="text-[10px] font-bold">{rating}</span>
                            </div>
                        )}
                    </div>

                    {/* Meta info row - Compact */}
                    <div className="flex items-center gap-2 text-[10px] text-text-muted font-medium">
                        {time && (
                            <div className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {time}
                            </div>
                        )}
                        {price && (
                            <div className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-xs">confirmation_number</span>
                                {price}
                            </div>
                        )}
                    </div>

                    {/* Short Description */}
                    <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5 opacity-80">
                        {description}
                    </p>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-1 px-1">
                    {onAddToItinerary && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddToItinerary(e); }}
                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Adicionar ao Itinerário"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                            className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title="Remover"
                        >
                            <span className="material-symbols-outlined text-base">delete_outline</span>
                        </button>
                    )}
                    {onMapClick && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMapClick(e); }}
                            className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            title="Ver no Google Maps"
                        >
                            <span className="material-symbols-outlined text-base">map</span>
                        </button>
                    )}
                    <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all border border-gray-100">
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                </div>
            </Card>
        );
    }

    // Vertical Variant (Grid)
    return (
        <Card
            onClick={onClick}
            className="group overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl bg-white flex flex-col h-full cursor-pointer"
        >
            {/* Image Section */}
            <div className={`relative h-56 overflow-hidden ${!image && 'bg-gray-50 flex items-center justify-center'}`}>
                {image && !image.includes('placeholder') ? (
                    <img
                        src={image}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={title}
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-${color || 'indigo'}-50 text-${color || 'indigo'}-500 group-hover:bg-${color || 'indigo'}-100 transition-colors`}>
                        <span className="material-symbols-outlined text-7xl opacity-80">{icon || 'restaurant'}</span>
                    </div>
                )}

                {/* Rating Badge */}
                {rating && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-amber-500 filled">star</span>
                        <span className="text-xs font-bold text-text-main">{rating}</span>
                    </div>
                )}

                {/* Category Badge */}
                {category && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm">
                        <span className="text-[10px] font-bold text-text-main uppercase tracking-wider">{category}</span>
                    </div>
                )}

                {/* AI Generation Button */}
                {onEditImage && (
                    <button
                        onClick={onEditImage}
                        className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        title="Gerar nova imagem com IA"
                    >
                        <span className="material-symbols-outlined text-base">auto_awesome</span>
                    </button>
                )}

                {/* Loading State */}
                {isGenerating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-dark"></div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-text-main leading-tight group-hover:text-primary-dark transition-colors">{title}</h3>
                    <div className="flex gap-1">
                        {onAddToItinerary && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddToItinerary(e); }}
                                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Adicionar ao Itinerário"
                            >
                                <span className="material-symbols-outlined text-base">add</span>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                                className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Remover"
                            >
                                <span className="material-symbols-outlined text-base">delete_outline</span>
                            </button>
                        )}
                        {onMapClick && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMapClick(e); }}
                                className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Ver no Google Maps"
                            >
                                <span className="material-symbols-outlined text-base">map</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Primary Description */}
                <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">
                    {description}
                </p>

                {/* Expanded Sections (AI Features) */}
                {(longDescription || reviewSummary) && (
                    <div className="space-y-3 mb-4 p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                        {longDescription && (
                            <div className="flex gap-2 items-start">
                                <span className="material-symbols-outlined text-base text-primary-main shrink-0 mt-0.5">info</span>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-900 block uppercase tracking-tight">O que é</span>
                                    <p className="text-[11px] text-gray-600 leading-relaxed italic">{longDescription}</p>
                                </div>
                            </div>
                        )}
                        {reviewSummary && (
                            <div className="flex gap-2 items-start pt-2 border-t border-gray-200/50">
                                <span className="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">reviews</span>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-900 block uppercase tracking-tight">Voz dos Visitantes</span>
                                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">"{reviewSummary}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Specialty & Highlight - Vertical (Fallback/Legacy) */}
                {(specialty || highlight) && !longDescription && (
                    <div className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 rounded-xl text-xs">
                        {specialty && (
                            <div className="flex gap-2 items-start">
                                <span className="material-symbols-outlined text-base text-amber-600 shrink-0">restaurant_menu</span>
                                <div>
                                    <span className="font-bold text-gray-900 block mb-0.5 text-[10px]">Especialidade</span>
                                    <span className="text-gray-600 leading-relaxed text-[11px]">{specialty}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Meta Info - Compacted */}
                <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-50/50">
                    {time && (
                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold bg-gray-50 px-2 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-xs text-primary-dark">schedule</span>
                            {time}
                        </div>
                    )}

                    {price && (
                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold bg-gray-50 px-2 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-xs text-secondary-dark">confirmation_number</span>
                            {price}
                        </div>
                    )}
                </div>

                {/* Details Link */}
                <div className="mt-3 flex justify-end">
                    <span className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                        Ver mais detalhes <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default PlaceCard;
