import React from 'react';
import { JournalEntry } from '../../../types';
import { Card } from '../../ui/Base';

interface JournalStatsProps {
    entries: JournalEntry[];
    tripTitle?: string;
}

const JournalStats: React.FC<JournalStatsProps> = ({ entries, tripTitle }) => {
    // Calculate stats
    const totalPhotos = entries.reduce((acc, entry) => acc + entry.images.length, 0);
    const uniqueDays = new Set(entries.map((e) => e.date)).size;
    const uniqueLocations = new Set(entries.map((e) => e.location)).size;
    const totalLikes = entries.reduce((acc, entry) => acc + entry.likes, 0);

    // Get most used tags
    const tagCounts = entries.flatMap((e) => e.tags).reduce((acc: Record<string, number>, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});
    const topTags = Object.entries(tagCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5);

    // Get mood distribution
    const moodCounts = entries.reduce((acc: Record<string, number>, entry: JournalEntry) => {
        if (entry.mood) {
            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const MOOD_EMOJIS: Record<string, string> = {
        amazing: '🤩',
        tired: '😴',
        hungry: '😋',
        cold: '🥶',
        excited: '🥳',
        relaxed: '😌',
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Trip Progress Card */}
            <Card className="p-6 border-none shadow-xl rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">auto_stories</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold opacity-90">Diário da Viagem</h3>
                        {tripTitle && (
                            <p className="text-xs font-medium opacity-70">{tripTitle}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-3xl font-black">{uniqueDays}</p>
                        <p className="text-xs font-bold opacity-70 uppercase tracking-wider">Dias</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-3xl font-black">{entries.length}</p>
                        <p className="text-xs font-bold opacity-70 uppercase tracking-wider">Memórias</p>
                    </div>
                </div>
            </Card>

            {/* Stats Card */}
            <Card className="p-6 border-none shadow-soft rounded-2xl bg-white">
                <h4 className="text-sm font-extrabold text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-indigo-500">bar_chart</span>
                    Estatísticas
                </h4>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-pink-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-pink-500 text-lg">photo_library</span>
                            </div>
                            <span className="text-sm font-bold text-text-muted">Fotos</span>
                        </div>
                        <span className="text-lg font-extrabold text-text-main">{totalPhotos}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">location_on</span>
                            </div>
                            <span className="text-sm font-bold text-text-muted">Locais</span>
                        </div>
                        <span className="text-lg font-extrabold text-text-main">{uniqueLocations}</span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-red-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500 text-lg">favorite</span>
                            </div>
                            <span className="text-sm font-bold text-text-muted">Curtidas</span>
                        </div>
                        <span className="text-lg font-extrabold text-text-main">{totalLikes}</span>
                    </div>
                </div>
            </Card>

            {/* Mood Summary */}
            {Object.keys(moodCounts).length > 0 && (
                <Card className="p-6 border-none shadow-soft rounded-2xl bg-white">
                    <h4 className="text-sm font-extrabold text-text-main mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-amber-500">mood</span>
                        Vibes da Viagem
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(moodCounts).map(([mood, count]) => (
                            <div
                                key={mood}
                                className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-xl"
                            >
                                <span className="text-lg">{MOOD_EMOJIS[mood] || '😊'}</span>
                                <span className="text-xs font-extrabold">{count}x</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Top Tags */}
            {topTags.length > 0 && (
                <Card className="p-6 border-none shadow-soft rounded-2xl bg-white">
                    <h4 className="text-sm font-extrabold text-text-main mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-indigo-500">sell</span>
                        Tags Populares
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {topTags.map(([tag, count]) => (
                            <div
                                key={tag}
                                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl"
                            >
                                <span className="text-xs font-extrabold">#{tag}</span>
                                <span className="text-[10px] font-bold text-indigo-400">({count})</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Mini Map Placeholder */}
            <Card className="p-6 border-none shadow-soft rounded-2xl bg-white overflow-hidden">
                <h4 className="text-sm font-extrabold text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-emerald-500">map</span>
                    Trajeto
                </h4>
                <div className="aspect-video bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-4xl text-emerald-300 mb-2">explore</span>
                        <p className="text-xs font-bold text-emerald-600/60">Mapa em breve</p>
                    </div>
                </div>
            </Card>

            {/* Generate PDF Button */}
            <button className="w-full py-4 px-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:from-gray-800 hover:to-gray-700 transition-all group">
                <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
                    picture_as_pdf
                </span>
                Gerar PDF da Viagem
            </button>
        </div>
    );
};

export default JournalStats;
