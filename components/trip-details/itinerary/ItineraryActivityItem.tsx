import * as React from 'react';
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
            {...attributes}
            {...listeners}
            className={`group flex gap-4 p-4 rounded-xl border border-gray-100 bg-white transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-xl scale-105 border-primary/50' : 'hover:border-gray-200 hover:shadow-md'}`}
        >
            {/* Left: Time & Type Icon */}
            <div className="flex flex-col items-center justify-center gap-2 min-w-[60px] border-r border-gray-100 pr-4">
                <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}>
                    {activity.time?.slice(0, 5)}
                </div>
                <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <span className={`material-symbols-outlined text-lg ${config.textColor}`}>{config.icon}</span>
                </div>
            </div>

            {/* Center: Content */}
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
            </div>

            {/* Right: Actions Column (max 1/3 width) */}
            <div className="grid grid-cols-3 gap-1 pl-3 border-l border-gray-100 max-w-[33%] self-center place-items-center opacity-60 group-hover:opacity-100 transition-opacity">
                {/* Google Maps Link */}
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((activity.location || activity.title) + (dayCity ? ` ${dayCity}` : ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Como chegar"
                    className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">directions</span>
                </a>

                {/* Details Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDetails(activity); }}
                    title="Detalhes"
                    className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">info</span>
                </button>

                {/* Journal/Review Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onReview(activity); }}
                    title="Avaliar"
                    className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">rate_review</span>
                </button>

                {/* Generate Photo Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onGenerateImage(activity.id); }}
                    disabled={activity.isGeneratingImage}
                    title={activity.isGeneratingImage ? 'Gerando...' : 'Gerar Foto'}
                    className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                    <span className={`material-symbols-outlined text-lg ${activity.isGeneratingImage ? 'animate-spin' : ''}`}>
                        {activity.isGeneratingImage ? 'progress_activity' : 'auto_awesome'}
                    </span>
                </button>

                {/* Edit Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(activity); }}
                    title="Editar"
                    className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">edit</span>
                </button>

                {/* Delete Button */}
                {deletingActivityId === activity.id ? (
                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                        <button onClick={() => onDelete(activity.id)} title="Confirmar" className="size-6 bg-rose-500 text-white rounded flex items-center justify-center hover:bg-rose-600 shadow-sm"><span className="material-symbols-outlined text-sm">check</span></button>
                        <button onClick={() => setDeletingActivityId(null)} title="Cancelar" className="size-6 bg-gray-200 text-gray-600 rounded flex items-center justify-center hover:bg-gray-300"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setDeletingActivityId(activity.id); }}
                        title="Remover"
                        className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                )}
            </div>
        </div>
    );
};
