import React, { useState, useRef, useEffect } from 'react';
import { Card, Button } from '../../ui/Base';
import { YouTubeVideo, Trip } from '../../../types';
import { EmptyState } from '../../ui/EmptyState';

interface MediaViewProps {
    trip: Trip;
    onAddVideo: (url: string) => void;
    onRemoveVideo: (id: string) => void;
}

type MediaFilter = 'all' | 'links' | 'videos' | 'audios';

// Mock data for NotebookLM integration
const notebookLMData = {
    has_audio_overview: true,
    audio_url: "https://notebooklm.google/audio/trip_overview_v1.mp3",
    summary_text: "Este roteiro foca em experiências culturais e gastronômicas, explorando os principais pontos turísticos com um equilíbrio entre atividades programadas e tempo livre para descobertas espontâneas.",
    sources_count: 5,
    last_synced: "2026-01-10T14:30:00Z"
};

// Mock data for bookmarks
const mockBookmarks = [
    {
        id: '1',
        type: 'LINK' as const,
        url: "https://travelblog.com/top-10-tokyo",
        title: "Top 10 coisas para fazer em Tóquio",
        image_preview: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
        favicon: "https://www.google.com/s2/favicons?domain=travelblog.com&sz=32",
        domain: "travelblog.com",
        category: "Atrações",
        notes: "Ler a parte sobre o TeamLabs"
    },
    {
        id: '2',
        type: 'LINK' as const,
        url: "https://theguardian.com/travel/best-restaurants",
        title: "Os melhores restaurantes escondidos",
        image_preview: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
        favicon: "https://www.google.com/s2/favicons?domain=theguardian.com&sz=32",
        domain: "theguardian.com",
        category: "Gastronomia",
        notes: ""
    },
    {
        id: '3',
        type: 'LINK' as const,
        url: "https://skyscanner.com/tips/travel-hacks",
        title: "15 dicas para economizar em voos",
        image_preview: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop",
        favicon: "https://www.google.com/s2/favicons?domain=skyscanner.com&sz=32",
        domain: "skyscanner.com",
        category: "Logística",
        notes: ""
    },
    {
        id: '4',
        type: 'LINK' as const,
        url: "https://lonelyplanet.com/japan/tokyo/attractions",
        title: "Guia completo de Tóquio - Lonely Planet",
        image_preview: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop",
        favicon: "https://www.google.com/s2/favicons?domain=lonelyplanet.com&sz=32",
        domain: "lonelyplanet.com",
        category: "Atrações",
        notes: ""
    },
];

// Simple waveform visualization component
const AudioWaveform: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
    return (
        <div className="flex items-center gap-[2px] h-8">
            {Array.from({ length: 40 }).map((_, i) => (
                <div
                    key={i}
                    className={`w-1 rounded-full bg-gradient-to-t from-violet-500 to-indigo-400 transition-all duration-150 ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{
                        height: `${Math.sin(i * 0.3) * 12 + 16}px`,
                        animationDelay: `${i * 50}ms`,
                        opacity: isPlaying ? 1 : 0.5
                    }}
                />
            ))}
        </div>
    );
};

const MediaView: React.FC<MediaViewProps> = ({ trip, onAddVideo, onRemoveVideo }) => {
    const [activeFilter, setActiveFilter] = useState<MediaFilter>('all');
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [isAddingVideo, setIsAddingVideo] = useState(false);
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [videoError, setVideoError] = useState('');
    const [showSources, setShowSources] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const videos = trip.videos || [];
    const bookmarks = mockBookmarks;

    const filters: { id: MediaFilter; label: string; icon: string; count: number }[] = [
        { id: 'all', label: 'Todos', icon: 'apps', count: videos.length + bookmarks.length + 1 },
        { id: 'links', label: 'Links', icon: 'link', count: bookmarks.length },
        { id: 'videos', label: 'Vídeos', icon: 'smart_display', count: videos.length },
        { id: 'audios', label: 'Áudios', icon: 'mic', count: 1 },
    ];

    const handleAddVideo = () => {
        if (!newVideoUrl.trim()) return;
        if (!newVideoUrl.includes('youtube.com') && !newVideoUrl.includes('youtu.be') && !newVideoUrl.includes('vimeo.com') && !newVideoUrl.includes('tiktok.com')) {
            setVideoError('Por favor, insira um link válido do YouTube, Vimeo ou TikTok.');
            return;
        }
        onAddVideo(newVideoUrl);
        setNewVideoUrl('');
        setIsAddingVideo(false);
        setVideoError('');
    };

    const getEmbedUrl = (url: string): string | null => {
        // YouTube
        const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }
        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        return null;
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
        // In a real implementation, this would control the audio element
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-3xl">search</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main">Pesquisa & Referências</h2>
                            <p className="text-sm text-text-muted">
                                Hub de pesquisa e planejamento da viagem
                            </p>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                                    ${activeFilter === filter.id
                                        ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md'
                                        : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                                    }
                                `}
                            >
                                <span className="material-symbols-outlined text-lg">{filter.icon}</span>
                                {filter.label}
                                {filter.count > 0 && (
                                    <span className={`
                                        px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                        ${activeFilter === filter.id ? 'bg-white/20' : 'bg-gray-200'}
                                    `}>
                                        {filter.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* NotebookLM Integration Section */}
            {(activeFilter === 'all' || activeFilter === 'audios') && (
                <Card className="overflow-hidden border-0 shadow-lg">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">mic</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Resumo da Viagem (NotebookLM)</h3>
                                <p className="text-white/70 text-sm">Áudio Overview gerado por IA</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                    {notebookLMData.sources_count} fontes
                                </span>
                                <span className="text-xs text-white/60">
                                    Sync: {new Date(notebookLMData.last_synced).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>

                        {/* Audio Player */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={togglePlayPause}
                                    className="size-12 rounded-full bg-white text-violet-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                                >
                                    <span className="material-symbols-outlined text-2xl">
                                        {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                </button>
                                <div className="flex-1">
                                    <AudioWaveform isPlaying={isPlaying} />
                                    <div className="flex justify-between text-xs text-white/60 mt-1">
                                        <span>0:00</span>
                                        <span>5:32</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Content */}
                    <div className="p-6 bg-gradient-to-br from-violet-50 to-indigo-50">
                        <p className="text-sm text-gray-700 leading-relaxed mb-4">
                            "{notebookLMData.summary_text}"
                        </p>

                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">
                                {showSources ? 'expand_less' : 'expand_more'}
                            </span>
                            {showSources ? 'Ocultar Fontes' : 'Ver Fontes'}
                        </button>

                        {showSources && (
                            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                {['Roteiro_Roma_Florença.pdf', 'Guia_Restaurantes.pdf', 'Notas_Pesquisa.doc', 'Reservas_Hotel.pdf', 'Voos_Confirmados.pdf'].map((source, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                        <div className="size-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">description</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{source}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Web Clipper / Links Section */}
            {(activeFilter === 'all' || activeFilter === 'links') && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">link</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-text-main">Links e Artigos Salvos</h4>
                                <p className="text-sm text-text-muted">Referências da web para sua viagem</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAddingLink(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-lg">add_link</span>
                            Adicionar Link
                        </button>
                    </div>

                    {isAddingLink && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <h5 className="text-sm font-semibold text-text-main mb-2">Salvar novo link</h5>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                    placeholder="Cole o link aqui..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                                />
                                <button
                                    onClick={() => { setNewLinkUrl(''); setIsAddingLink(false); }}
                                    className="px-4 py-2 bg-text-main text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                                >
                                    Salvar
                                </button>
                                <button
                                    onClick={() => { setIsAddingLink(false); setNewLinkUrl(''); }}
                                    className="px-4 py-2 bg-transparent text-text-muted hover:text-text-main transition-colors text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {bookmarks.length === 0 ? (
                        <EmptyState
                            variant="minimal"
                            icon="bookmark"
                            title="Nenhum link salvo"
                            description="Salve artigos e páginas interessantes para referência."
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {bookmarks.map((bookmark) => (
                                <a
                                    key={bookmark.id}
                                    href={bookmark.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                                >
                                    {/* Preview Image */}
                                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
                                        <img
                                            src={bookmark.image_preview}
                                            alt={bookmark.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-blue-600">
                                                {bookmark.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-3">
                                        <h5 className="font-semibold text-sm text-text-main line-clamp-2 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                                            {bookmark.title}
                                        </h5>
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={bookmark.favicon}
                                                alt=""
                                                className="size-4 rounded-sm"
                                            />
                                            <span className="text-xs text-text-muted">{bookmark.domain}</span>
                                        </div>
                                        {bookmark.notes && (
                                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">note</span>
                                                {bookmark.notes}
                                            </p>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* Videos Section */}
            {(activeFilter === 'all' || activeFilter === 'videos') && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">smart_display</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-text-main">Vídeos</h4>
                                <p className="text-sm text-text-muted">YouTube, Vimeo e TikTok</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAddingVideo(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-lg">add_link</span>
                            Adicionar Vídeo
                        </button>
                    </div>

                    {isAddingVideo && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <h5 className="text-sm font-semibold text-text-main mb-2">Adicionar vídeo por URL</h5>
                            <p className="text-xs text-text-muted mb-3">Cole o link do YouTube, Vimeo ou TikTok</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newVideoUrl}
                                    onChange={(e) => { setNewVideoUrl(e.target.value); setVideoError(''); }}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none text-sm"
                                />
                                <button
                                    onClick={handleAddVideo}
                                    className="px-4 py-2 bg-text-main text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                                >
                                    Salvar
                                </button>
                                <button
                                    onClick={() => { setIsAddingVideo(false); setVideoError(''); setNewVideoUrl(''); }}
                                    className="px-4 py-2 bg-transparent text-text-muted hover:text-text-main transition-colors text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                            {videoError && <p className="text-red-500 text-xs mt-2">{videoError}</p>}
                        </div>
                    )}

                    {videos.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">video_library</span>
                            <p className="text-text-muted text-sm">Nenhum vídeo salvo ainda.</p>
                            <p className="text-xs text-text-muted opacity-70 mt-1">
                                Adicione links do YouTube, Vimeo ou TikTok.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {videos.map((video) => {
                                const embedUrl = getEmbedUrl(video.url);
                                return (
                                    <div key={video.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                        <div className="aspect-video relative overflow-hidden bg-gray-900">
                                            {embedUrl ? (
                                                <iframe
                                                    src={embedUrl}
                                                    title={video.title}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <img
                                                        src={video.thumbnail}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <a
                                                        href={video.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 flex items-center justify-center bg-black/30"
                                                    >
                                                        <div className="size-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                                                            <span className="material-symbols-outlined text-3xl">play_arrow</span>
                                                        </div>
                                                    </a>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => onRemoveVideo(video.id)}
                                                className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                title="Remover vídeo"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <h5 className="font-semibold text-sm text-text-main line-clamp-2 leading-snug mb-1">
                                                {video.title}
                                            </h5>
                                            <p className="text-[10px] text-text-muted">
                                                Adicionado em {new Date(video.addedAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* Tips Section */}
            <Card className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100">
                <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">tips_and_updates</span>
                    </div>
                    <div>
                        <h5 className="font-semibold text-sm text-violet-900 mb-1">Dicas para sua pesquisa</h5>
                        <ul className="text-xs text-violet-700 space-y-1">
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-violet-400" />
                                Salve links de blogs e sites de viagem para referência rápida
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-violet-400" />
                                Adicione vídeos do YouTube sobre os destinos que vai visitar
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-violet-400" />
                                Use o resumo do NotebookLM para ter uma visão geral do seu planejamento
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MediaView;
