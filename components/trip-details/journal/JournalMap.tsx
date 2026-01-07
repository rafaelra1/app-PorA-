import React from 'react';
import { JournalEntry } from '../../../types';

interface JournalMapProps {
    entries: JournalEntry[];
    onPinClick?: (entry: JournalEntry) => void;
}

interface LocationGroup {
    location: string;
    count: number;
    entries: JournalEntry[];
}

const JournalMap: React.FC<JournalMapProps> = ({ entries, onPinClick }) => {
    // Get unique locations
    const locations = entries.reduce((acc: LocationGroup[], entry: JournalEntry) => {
        const existing = acc.find((l) => l.location === entry.location);
        if (existing) {
            existing.count += 1;
            existing.entries.push(entry);
        } else {
            acc.push({ location: entry.location, count: 1, entries: [entry] });
        }
        return acc;
    },
        []
    );

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="size-24 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-emerald-400">map</span>
                </div>
                <p className="text-text-muted font-bold text-lg mb-2">Nenhuma memória no mapa</p>
                <p className="text-text-muted/70 text-sm max-w-xs">
                    Adicione localizações aos seus registros para vê-los aqui.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Map Placeholder */}
            <div className="relative aspect-[16/9] bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 rounded-3xl overflow-hidden shadow-xl">
                {/* Decorative grid pattern */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Decorative circles representing locations */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full max-w-lg max-h-80">
                        {locations.map((loc, idx) => {
                            // Pseudo-random positioning based on location string
                            const hash = loc.location.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                            const x = (hash % 60) + 20; // 20-80%
                            const y = ((hash * 7) % 50) + 25; // 25-75%

                            return (
                                <div
                                    key={loc.location}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                                    style={{ left: `${x}%`, top: `${y}%` }}
                                    onClick={() => onPinClick?.(loc.entries[0])}
                                >
                                    {/* Pin pulse animation */}
                                    <div className="absolute inset-0 size-12 -m-1.5 rounded-full bg-indigo-400/30 animate-ping" />

                                    {/* Pin */}
                                    <div className="relative size-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                                        <span className="material-symbols-outlined text-white text-lg">location_on</span>
                                    </div>

                                    {/* Count badge */}
                                    {loc.count > 1 && (
                                        <div className="absolute -top-1 -right-1 size-5 rounded-full bg-rose-500 flex items-center justify-center z-20">
                                            <span className="text-[10px] font-extrabold text-white">{loc.count}</span>
                                        </div>
                                    )}

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                                        <p className="text-xs font-bold text-text-main">{loc.location}</p>
                                        <p className="text-[10px] text-text-muted">
                                            {loc.count} {loc.count === 1 ? 'memória' : 'memórias'}
                                        </p>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                            <div className="border-4 border-transparent border-t-white" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Map legend */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                        <span className="material-symbols-outlined text-indigo-500 text-sm">info</span>
                        Mapa ilustrativo
                    </div>
                </div>

                {/* Zoom controls (decorative) */}
                <div className="absolute right-4 bottom-4 flex flex-col gap-1">
                    <button className="size-9 bg-white rounded-xl shadow-lg flex items-center justify-center text-text-muted hover:text-text-main transition-colors">
                        <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                    <button className="size-9 bg-white rounded-xl shadow-lg flex items-center justify-center text-text-muted hover:text-text-main transition-colors">
                        <span className="material-symbols-outlined text-lg">remove</span>
                    </button>
                </div>
            </div>

            {/* Location List */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
                <h4 className="text-sm font-extrabold text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-emerald-500">pin_drop</span>
                    Locais Visitados ({locations.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {locations.map((loc) => (
                        <div
                            key={loc.location}
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer group"
                            onClick={() => onPinClick?.(loc.entries[0])}
                        >
                            <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-white text-lg">location_on</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-main truncate group-hover:text-indigo-600 transition-colors">
                                    {loc.location}
                                </p>
                                <p className="text-xs text-text-muted">
                                    {loc.count} {loc.count === 1 ? 'memória' : 'memórias'}
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-text-muted group-hover:text-indigo-500 transition-colors">
                                chevron_right
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default JournalMap;
