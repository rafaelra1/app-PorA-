import React, { useState } from 'react';
import { JournalEntry, JournalMood, Participant } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import JournalInput from './JournalInput';
import JournalTimeline from './JournalTimeline';
import JournalGallery from './JournalGallery';
import JournalMap from './JournalMap';
import JournalStats from './JournalStats';

type ViewMode = 'timeline' | 'gallery' | 'map';

interface JournalViewProps {
    tripTitle?: string;
    tripStartDate?: string;
    onDeleteEntry?: (id: string) => void;
}

const VIEW_TABS: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'timeline', label: 'Linha do Tempo', icon: 'timeline' },
    { id: 'gallery', label: 'Galeria', icon: 'photo_library' },
    { id: 'map', label: 'Mapa', icon: 'map' },
];

const JournalView: React.FC<JournalViewProps> = ({ tripTitle, tripStartDate, onDeleteEntry }) => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('timeline');
    const [showStats, setShowStats] = useState(true);

    const currentUser: Participant = {
        id: user?.id || 'u-temp',
        name: user?.name || 'Usuário',
        avatar: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff',
        role: 'Viajante'
    };

    // Calculate day number based on trip start date
    const calculateDayNumber = (date: string): number => {
        if (!tripStartDate) return 1;
        const start = new Date(tripStartDate);
        const current = new Date(date);
        const diffTime = Math.abs(current.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    };

    const handleCreateEntry = (data: {
        content: string;
        location: string;
        mood?: JournalMood;
        tags: string[];
        images: string[];
    }) => {
        const today = new Date();
        const newEntry: JournalEntry = {
            id: `j-${Date.now()}`,
            author: currentUser,
            timestamp: today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            date: today.toISOString().split('T')[0],
            dayNumber: calculateDayNumber(today.toISOString().split('T')[0]),
            location: data.location,
            content: data.content,
            images: data.images.length > 0
                ? data.images
                : ['https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&q=80&w=1000'],
            mood: data.mood,
            weather: {
                temp: Math.floor(Math.random() * 15) + 18, // Mock 18-33°C
                condition: 'Ensolarado',
                icon: 'sunny',
            },
            tags: data.tags,
            likes: 0,
            comments: 0,
        };

        setEntries([newEntry, ...entries]);
    };

    const handleLike = (id: string) => {
        setEntries((prev) =>
            prev.map((entry) =>
                entry.id === id ? { ...entry, likes: entry.likes + 1 } : entry
            )
        );
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-6 pb-20">
            {/* Standard Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 sticky top-0 z-20 backdrop-blur-sm">
                {/* View Tabs */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto px-1">
                    {[
                        { id: 'timeline', label: 'Linha do Tempo', icon: 'timeline' },
                        { id: 'gallery', label: 'Galeria', icon: 'grid_view' },
                        { id: 'map', label: 'Mapa', icon: 'map' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as ViewMode)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap ${viewMode === tab.id
                                ? 'bg-text-main text-white'
                                : 'bg-white text-text-muted hover:bg-gray-100 border border-gray-200/50'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
                    {/* Toggle Stats */}
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${showStats
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-gray-200/50 text-text-muted hover:bg-gray-50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-base">
                            {showStats ? 'visibility_off' : 'bar_chart'}
                        </span>
                        <span className="hidden sm:inline">Estatísticas</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Main Content */}
                <div className={`transition-all duration-300 ${showStats ? 'lg:col-span-8' : 'lg:col-span-12'}`}>

                    {/* Input Area - Always visible at top */}
                    <div className="mb-8">
                        <JournalInput user={currentUser} onSubmit={handleCreateEntry} />
                    </div>

                    {/* View Content */}
                    {viewMode === 'timeline' && (
                        <JournalTimeline
                            entries={entries}
                            onLike={handleLike}
                            onDelete={onDeleteEntry}
                        />
                    )}

                    {viewMode === 'gallery' && (
                        <JournalGallery entries={entries} onDelete={onDeleteEntry} />
                    )}

                    {viewMode === 'map' && (
                        <JournalMap entries={entries} />
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className={`space-y-6 lg:col-span-4 transition-all duration-300 ${showStats
                    ? 'opacity-100 translate-x-0'
                    : 'hidden opacity-0 translate-x-20'
                    }`}>
                    <div className="sticky top-24 space-y-6">
                        <JournalStats entries={entries} tripTitle={tripTitle} />

                        {/* Additional widgets can go here */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white text-center shadow-lg shadow-indigo-200">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-80">auto_awesome</span>
                            <h3 className="font-bold text-lg mb-1">Assistente de Diário</h3>
                            <p className="text-sm text-indigo-100 mb-4">
                                Deixe a IA transformar seus registros curtos em narrativas incríveis.
                            </p>
                            <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors w-full">
                                Experimentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Stats Drawer */}
            {showStats && (
                <div className="lg:hidden fixed inset-0 z-30 bg-black/50 animate-in fade-in duration-200" onClick={() => setShowStats(false)}>
                    <div
                        className="absolute right-0 top-0 bottom-0 w-[340px] max-w-full bg-gray-50 p-6 overflow-y-auto animate-in slide-in-from-right duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-extrabold text-text-main">Estatísticas</h3>
                            <button
                                onClick={() => setShowStats(false)}
                                className="size-10 rounded-xl bg-white flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <JournalStats entries={entries} tripTitle={tripTitle} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalView;
