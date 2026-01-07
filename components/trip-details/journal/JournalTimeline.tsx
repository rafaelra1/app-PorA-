import React from 'react';
import { JournalEntry } from '../../../types';
import JournalEntryCard from './JournalEntryCard';

interface JournalTimelineProps {
    entries: JournalEntry[];
    onLike?: (id: string) => void;
    onComment?: (id: string) => void;
    onShare?: (id: string) => void;
}

interface DayGroup {
    date: string;
    dayNumber?: number;
    entries: JournalEntry[];
}

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const getDayTitle = (entry: JournalEntry): string => {
    if (entry.dayNumber) {
        return `Dia ${entry.dayNumber}`;
    }
    return formatDate(entry.date);
};

const JournalTimeline: React.FC<JournalTimelineProps> = ({
    entries,
    onLike,
    onComment,
    onShare,
}) => {
    // Group entries by date
    const groupedByDay = entries.reduce((acc: DayGroup[], entry: JournalEntry) => {
        const existingGroup = acc.find((g) => g.date === entry.date);
        if (existingGroup) {
            existingGroup.entries.push(entry);
        } else {
            acc.push({
                date: entry.date,
                dayNumber: entry.dayNumber,
                entries: [entry],
            });
        }
        return acc;
    }, []);

    // Sort groups by date (newest first)
    groupedByDay.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Sort entries within each group by time (newest first)
    groupedByDay.forEach((group) => {
        group.entries.sort((a, b) => {
            // Parse time strings like "14:30"
            const timeA = a.timestamp.split(':').map(Number);
            const timeB = b.timestamp.split(':').map(Number);
            const minutesA = timeA[0] * 60 + timeA[1];
            const minutesB = timeB[0] * 60 + timeB[1];
            return minutesB - minutesA;
        });
    });

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="size-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-indigo-400">auto_stories</span>
                </div>
                <p className="text-text-muted font-bold text-lg mb-2">Nenhum registro ainda</p>
                <p className="text-text-muted/70 text-sm max-w-xs">
                    Comece a contar sua história. Registre momentos, emoções e descobertas.
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-transparent hidden md:block" />

            <div className="flex flex-col gap-12">
                {groupedByDay.map((group, groupIdx) => (
                    <div key={group.date} className="relative">
                        {/* Day Header */}
                        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-gradient-to-r from-gray-50/95 via-white/95 to-gray-50/95 backdrop-blur-sm z-10 py-4 -mx-2 px-2 rounded-2xl">
                            {/* Timeline Dot */}
                            <div className="hidden md:flex size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center shadow-lg shadow-indigo-200 z-10">
                                <span className="text-white font-extrabold text-sm">
                                    {group.dayNumber || groupIdx + 1}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <h3 className="text-lg font-extrabold text-text-main flex items-center gap-2">
                                    {group.dayNumber ? `Dia ${group.dayNumber}` : 'Memórias'}
                                    <span className="text-indigo-400">•</span>
                                    <span className="text-indigo-600">{formatDate(group.date)}</span>
                                </h3>
                                <p className="text-xs font-medium text-text-muted mt-0.5">
                                    {group.entries.length} {group.entries.length === 1 ? 'registro' : 'registros'}
                                </p>
                            </div>

                            {/* Day Summary Badge (mocked) */}
                            {group.entries.some((e) => e.mood) && (
                                <div className="hidden sm:flex items-center gap-2 ml-auto bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-xl">
                                    <span className="text-lg">
                                        {group.entries.find((e) => e.mood)?.mood === 'amazing'
                                            ? '🤩'
                                            : group.entries.find((e) => e.mood)?.mood === 'excited'
                                                ? '🥳'
                                                : '😊'}
                                    </span>
                                    <span className="text-xs font-bold text-amber-700">Dia incrível!</span>
                                </div>
                            )}
                        </div>

                        {/* Entries for this day */}
                        <div className="flex flex-col gap-8 md:pl-16">
                            {group.entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="relative animate-in slide-in-from-bottom-4 duration-500"
                                >
                                    {/* Time indicator */}
                                    <div className="absolute -left-16 top-8 hidden md:flex items-center gap-2">
                                        <span className="text-xs font-bold text-text-muted bg-white px-2 py-1 rounded-lg shadow-sm">
                                            {entry.timestamp}
                                        </span>
                                        <div className="w-4 h-0.5 bg-gray-200" />
                                    </div>

                                    <JournalEntryCard
                                        entry={entry}
                                        onLike={onLike}
                                        onComment={onComment}
                                        onShare={onShare}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JournalTimeline;
