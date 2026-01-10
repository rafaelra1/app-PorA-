import React from 'react';
import { JournalEntry, JournalMood } from '../../../types';
import { Card } from '../../ui/Base';

interface JournalEntryCardProps {
    entry: JournalEntry;
    onLike?: (id: string) => void;
    onComment?: (id: string) => void;
    onShare?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const MOOD_ICONS: Record<JournalMood, { emoji: string; label: string }> = {
    amazing: { emoji: '🤩', label: 'Incrível' },
    tired: { emoji: '😴', label: 'Cansado' },
    hungry: { emoji: '😋', label: 'Com Fome' },
    cold: { emoji: '🥶', label: 'Com Frio' },
    excited: { emoji: '🥳', label: 'Animado' },
    relaxed: { emoji: '😌', label: 'Relaxado' },
};

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({
    entry,
    onLike,
    onComment,
    onShare,
    onDelete,
}) => {
    return (
        <Card className="overflow-hidden border-none shadow-soft hover:shadow-2xl transition-all duration-500 rounded-2xl bg-white group">
            {/* Image Showcase */}
            {entry.images && entry.images.length > 0 && (
                <div className={`grid gap-1 ${entry.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {entry.images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                            <img
                                src={img}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                                alt="Memória de viagem"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                        </div>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className="p-6 md:p-8">
                {/* Header with Author + Meta */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                        <img
                            src={entry.author.avatar}
                            className="size-11 rounded-xl object-cover shadow-sm border-2 border-white ring-2 ring-gray-100"
                            alt={entry.author.name}
                        />
                        <div className="flex flex-col">
                            <p className="font-extrabold text-sm text-text-main">{entry.author.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] font-bold text-primary-dark flex items-center gap-1 uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                    {entry.location}
                                </span>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    • {entry.timestamp}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="relative group/menu">
                        <button className="size-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-text-muted transition-colors">
                            <span className="material-symbols-outlined text-lg">more_horiz</span>
                        </button>
                        {onDelete && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-32 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                                <button
                                    onClick={() => onDelete(entry.id)}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                    Excluir
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title */}
                {entry.title && (
                    <h3 className="text-lg font-extrabold text-text-main mb-3">{entry.title}</h3>
                )}

                {/* Content */}
                <p className="text-base text-text-main leading-[1.8] font-medium mb-6 whitespace-pre-wrap">
                    {entry.content}
                </p>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {entry.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Metadata Bar: Mood, Weather, Expense */}
                <div className="flex flex-wrap items-center gap-4 pt-4 pb-4 border-y border-gray-100 text-xs font-bold text-text-muted">
                    {entry.mood && MOOD_ICONS[entry.mood] && (
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                            <span>{MOOD_ICONS[entry.mood].emoji}</span>
                            <span>{MOOD_ICONS[entry.mood].label}</span>
                        </div>
                    )}
                    {entry.weather && (
                        <div className="flex items-center gap-1.5 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full">
                            <span className="material-symbols-outlined text-sm">{entry.weather.icon}</span>
                            <span>{entry.weather.temp}°C • {entry.weather.condition}</span>
                        </div>
                    )}
                    {entry.expenseId && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                            <span className="material-symbols-outlined text-sm">payments</span>
                            <span>Despesa Vinculada</span>
                        </div>
                    )}
                </div>

                {/* Actions: Like, Comment, Share */}
                <div className="flex items-center justify-between pt-5">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => onLike?.(entry.id)}
                            className="flex items-center gap-2 group/btn transition-all"
                        >
                            <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-muted group-hover/btn:bg-red-50 group-hover/btn:text-red-500 transition-all">
                                <span className={`material-symbols-outlined text-lg ${entry.likes > 20 ? 'filled text-red-500' : ''}`}>
                                    favorite
                                </span>
                            </div>
                            <span className="text-xs font-bold text-text-muted group-hover/btn:text-text-main">
                                {entry.likes}
                            </span>
                        </button>

                        <button
                            onClick={() => onComment?.(entry.id)}
                            className="flex items-center gap-2 group/btn transition-all"
                        >
                            <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-muted group-hover/btn:bg-indigo-50 group-hover/btn:text-indigo-600 transition-all">
                                <span className="material-symbols-outlined text-lg">mode_comment</span>
                            </div>
                            <span className="text-xs font-bold text-text-muted group-hover/btn:text-text-main">
                                {entry.comments}
                            </span>
                        </button>
                    </div>

                    <button
                        onClick={() => onShare?.(entry.id)}
                        className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-muted hover:bg-[#111111] hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">share</span>
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default JournalEntryCard;
