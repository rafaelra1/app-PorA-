import * as React from 'react';
import { useState } from 'react';
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
    onEditNotes: (activity: ItineraryActivity) => void;
    onEdit: (activity: ItineraryActivity) => void;
    onDelete: (id: string) => void;
    deletingActivityId: string | null;
    setDeletingActivityId: (id: string | null) => void;
    isConflict?: boolean;
}

// Maximum characters to show before truncating
const NOTES_PREVIEW_LENGTH = 120;

export const ItineraryActivityItem: React.FC<ItineraryActivityItemProps> = ({
    activity,
    dayCity,
    config,
    period,
    onToggleComplete,
    onDetails,
    onReview,
    onEditNotes,
    onEdit,
    onDelete,
    deletingActivityId,
    setDeletingActivityId
}) => {
    const [isNotesExpanded, setIsNotesExpanded] = useState(false);

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

    // Check if notes need truncation
    const hasLongNotes = activity.notes && activity.notes.length > NOTES_PREVIEW_LENGTH;
    const displayedNotes = hasLongNotes && !isNotesExpanded
        ? activity.notes?.slice(0, NOTES_PREVIEW_LENGTH) + '...'
        : activity.notes;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group flex gap-4 p-5 rounded-2xl border border-gray-100 bg-white transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-xl scale-105 border-primary/50' : 'hover:border-gray-200 hover:shadow-lg'}`}
        >
            {/* Left: Time & Type Icon */}
            <div className="flex flex-col items-center justify-start gap-3 min-w-[70px] border-r border-gray-100 pr-4">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}>
                    {activity.time?.slice(0, 5)}
                </div>
                <div className={`size-11 rounded-full flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <span className={`material-symbols-outlined text-xl ${config.textColor}`}>{config.icon}</span>
                </div>
            </div>

            {/* Center: Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{period} • {config.label}</span>
                            {activity.completed && (
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-xs">check</span>
                                    Feito
                                </span>
                            )}
                        </div>
                        <h4 className={`font-bold text-lg text-text-main leading-tight ${activity.completed ? 'line-through text-text-muted' : ''}`}>
                            {activity.title}
                        </h4>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(activity.id); }}
                        className={`size-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${activity.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-200 text-gray-300 hover:border-green-400 hover:text-green-400'
                            }`}
                    >
                        <span className="material-symbols-outlined text-base">check</span>
                    </button>
                </div>

                {/* Location Details */}
                {activity.location && (
                    <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
                        <span className="material-symbols-outlined text-base shrink-0 text-primary">location_on</span>
                        <span className="truncate font-medium">{activity.location}</span>
                        {activity.locationDetail && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span className="truncate text-gray-500">{activity.locationDetail}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Expandable Notes Section */}
                {activity.notes && (
                    <div className="relative">
                        <div
                            className={`p-3 bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl text-sm text-gray-700 border border-gray-100 mb-3 transition-all duration-300 ${isNotesExpanded ? 'max-h-[500px]' : 'max-h-32 overflow-hidden'}`}
                        >
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-base text-purple-400 shrink-0 mt-0.5">description</span>
                                <p className="leading-relaxed whitespace-pre-wrap">{displayedNotes}</p>
                            </div>
                        </div>

                        {/* Expand/Collapse Button */}
                        {hasLongNotes && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsNotesExpanded(!isNotesExpanded); }}
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-purple-600 hover:bg-purple-50 hover:border-purple-200 transition-all shadow-sm"
                            >
                                <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isNotesExpanded ? 'rotate-180' : ''}`}>
                                    keyboard_arrow_down
                                </span>
                                {isNotesExpanded ? 'Mostrar menos' : 'Ler mais'}
                            </button>
                        )}
                    </div>
                )}

                {/* Image */}
                {activity.image && (
                    <div className="rounded-xl overflow-hidden mb-3 relative group/image h-36 w-full shadow-sm">
                        <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent p-3 flex items-end">
                            <span className="text-xs text-white font-medium bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full">Foto IA</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Actions Column - Improved Layout */}
            <div className="flex flex-col gap-2 pl-4 border-l border-gray-100 min-w-[120px] self-stretch justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                {/* Primary Actions Row */}
                <div className="flex flex-wrap gap-1 justify-center">
                    {/* Google Maps Link */}
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((activity.location || activity.title) + (dayCity ? ` ${dayCity}` : ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Como chegar"
                        className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">directions</span>
                    </a>

                    {/* Details Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDetails(activity); }}
                        title="Detalhes"
                        className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">info</span>
                    </button>

                    {/* Journal/Review Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onReview(activity); }}
                        title="Avaliar"
                        className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">rate_review</span>
                    </button>
                </div>

                {/* Secondary Actions Row */}
                <div className="flex flex-wrap gap-1 justify-center">
                    {/* Notes Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditNotes(activity); }}
                        title="Minhas Notas"
                        className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">sticky_note_2</span>
                    </button>

                    {/* Edit Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(activity); }}
                        title="Editar"
                        className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">edit</span>
                    </button>

                    {/* Delete Button */}
                    {deletingActivityId === activity.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                            <button onClick={() => onDelete(activity.id)} title="Confirmar" className="size-7 bg-rose-500 text-white rounded-lg flex items-center justify-center hover:bg-rose-600 shadow-sm"><span className="material-symbols-outlined text-base">check</span></button>
                            <button onClick={() => setDeletingActivityId(null)} title="Cancelar" className="size-7 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300"><span className="material-symbols-outlined text-base">close</span></button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); setDeletingActivityId(activity.id); }}
                            title="Remover"
                            className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
