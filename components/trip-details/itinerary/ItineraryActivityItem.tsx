import React from 'react';
import { ItineraryActivity, ItineraryActivityType } from '../../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ItineraryActivityItemProps {
    activity: ItineraryActivity;
    dayCity?: string;
    config: { icon: string; label: string; bgColor: string; textColor: string; dotColor: string };
    period: string;
    onToggleComplete: (id: string) => void;
    onDetails: (activity: ItineraryActivity) => void;
    onReview: (activity: ItineraryActivity) => void;
    onGenerateImage: (id: string) => void;
    onEdit: (activity: ItineraryActivity) => void;
    onDelete: (id: string) => void;
    deletingActivityId: string | null;
    setDeletingActivityId: (id: string | null) => void;
    isConflict?: boolean;
}

export const ItineraryActivityItem: React.FC<ItineraryActivityItemProps> = ({
    activity,
    dayCity,
    config,
    period,
    onToggleComplete,
    onDetails,
    onReview,
    onGenerateImage,
    onEdit,
    onDelete,
    deletingActivityId,
    setDeletingActivityId
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: activity.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex gap-4 p-4 rounded-xl border border-gray-100 bg-white transition-all ${isDragging ? 'shadow-xl scale-105 border-primary/50' : 'hover:border-gray-200 hover:shadow-md'}`}
        >
            {/* Left: Time & Type Decoration & Drag Handle */}
            <div className="flex flex-col items-center gap-2 min-w-[70px] border-r border-gray-100 pr-4">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 text-gray-300">
                    <span className="material-symbols-outlined text-lg">drag_indicator</span>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}>
                    {activity.time}
                </div>
                <div className="flex-1 w-0.5 bg-gray-100 rounded-full my-1 group-hover:bg-gray-200 transition-colors" />
                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${config.bgColor} text-${config.textColor}`}>
                    <span className={`material-symbols-outlined text-lg ${config.textColor}`}>{config.icon}</span>
                </div>
            </div>

            {/* Right: Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{period} • {config.label}</span>
                            {activity.completed && (
                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-[10px]">check</span>
                                    Feito
                                </span>
                            )}
                        </div>
                        <h4 className={`font-bold text-text-main leading-tight ${activity.completed ? 'line-through text-text-muted' : ''}`}>
                            {activity.title}
                        </h4>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(activity.id); }}
                        className={`size-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${activity.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-200 text-gray-300 hover:border-green-400 hover:text-green-400'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                </div>

                {/* Details */}
                {activity.location && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
                        <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                        <span className="truncate">{activity.location}</span>
                        {activity.locationDetail && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span className="truncate">{activity.locationDetail}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Notes */}
                {activity.notes && (
                    <div className="p-2 bg-gray-50 rounded-lg text-xs text-gray-600 italic border border-gray-100 mb-2">
                        {activity.notes}
                    </div>
                )}

                {/* Image */}
                {activity.image && (
                    <div className="rounded-lg overflow-hidden mb-2 relative group/image h-32 w-full">
                        <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent p-3 flex items-end">
                            <span className="text-[10px] text-white font-medium bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full">Foto IA</span>
                        </div>
                    </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center flex-wrap gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Google Maps Link */}
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((activity.location || activity.title) + (dayCity ? ` ${dayCity}` : ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xs">directions</span>
                        Como chegar
                    </a>

                    {/* Details Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDetails(activity); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xs">info</span>
                        Detalhes
                    </button>

                    {/* Journal/Review Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onReview(activity); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xs">rate_review</span>
                        Avaliar
                    </button>

                    {/* Generate Photo Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onGenerateImage(activity.id); }}
                        disabled={activity.isGeneratingImage}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                        <span className={`material-symbols-outlined text-xs ${activity.isGeneratingImage ? 'animate-spin' : ''}`}>
                            {activity.isGeneratingImage ? 'progress_activity' : 'auto_awesome'}
                        </span>
                        {activity.isGeneratingImage ? 'Gerando...' : 'Gerar Foto'}
                    </button>

                    {/* Edit Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(activity); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        Editar
                    </button>

                    {/* Delete Button */}
                    {deletingActivityId === activity.id ? (
                        <div className="flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-right-2">
                            <button onClick={() => onDelete(activity.id)} className="size-6 bg-rose-500 text-white rounded flex items-center justify-center hover:bg-rose-600 shadow-sm"><span className="material-symbols-outlined text-[10px]">check</span></button>
                            <button onClick={() => setDeletingActivityId(null)} className="size-6 bg-gray-200 text-gray-600 rounded flex items-center justify-center hover:bg-gray-300"><span className="material-symbols-outlined text-[10px]">close</span></button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); setDeletingActivityId(activity.id); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xs">delete</span>
                            Remover
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
