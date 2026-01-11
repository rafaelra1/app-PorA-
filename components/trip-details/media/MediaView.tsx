import React, { useState } from 'react';
import { Card, Button } from '../../ui/Base';
import { YouTubeVideo, Trip } from '../../../types';
import { VideoGallery } from '../overview/VideoGallery';
import { EmptyState } from '../../ui/EmptyState';

interface MediaViewProps {
    trip: Trip;
    onAddVideo: (url: string) => void;
    onRemoveVideo: (id: string) => void;
}

type MediaFilter = 'all' | 'videos' | 'photos';

const MediaView: React.FC<MediaViewProps> = ({ trip, onAddVideo, onRemoveVideo }) => {
    const [activeFilter, setActiveFilter] = useState<MediaFilter>('all');
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

    const videos = trip.videos || [];
    const photos: string[] = []; // Placeholder for future photo implementation

    const filters: { id: MediaFilter; label: string; icon: string; count: number }[] = [
        { id: 'all', label: 'Todas', icon: 'perm_media', count: videos.length + photos.length },
        { id: 'videos', label: 'Vídeos', icon: 'smart_display', count: videos.length },
        { id: 'photos', label: 'Fotos', icon: 'photo_library', count: photos.length },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-3xl">perm_media</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main">Mídias da Viagem</h2>
                            <p className="text-sm text-text-muted">
                                {videos.length + photos.length} {videos.length + photos.length === 1 ? 'item' : 'itens'} salvos
                            </p>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                                    ${activeFilter === filter.id
                                        ? 'bg-primary text-white shadow-md'
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

            {/* Videos Section */}
            {(activeFilter === 'all' || activeFilter === 'videos') && (
                <VideoGallery
                    videos={videos}
                    onAddVideo={onAddVideo}
                    onRemoveVideo={onRemoveVideo}
                />
            )}

            {/* Photos Section (Placeholder for future) */}
            {(activeFilter === 'all' || activeFilter === 'photos') && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">photo_library</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-text-main">Fotos da Viagem</h4>
                                <p className="text-sm text-text-muted">Galeria de momentos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsUploadingPhotos(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                            Adicionar Fotos
                        </button>
                    </div>

                    {photos.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">add_photo_alternate</span>
                            <p className="text-text-muted text-sm">Nenhuma foto adicionada ainda.</p>
                            <p className="text-xs text-text-muted opacity-70 mt-1">
                                Adicione fotos para criar memórias da sua viagem.
                            </p>
                            <button
                                onClick={() => setIsUploadingPhotos(true)}
                                className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                            >
                                Fazer Upload
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {/* Photo grid would go here */}
                        </div>
                    )}
                </Card>
            )}

            {/* Tips Section */}
            <Card className="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100">
                <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">tips_and_updates</span>
                    </div>
                    <div>
                        <h5 className="font-semibold text-sm text-purple-900 mb-1">Dicas para sua galeria</h5>
                        <ul className="text-xs text-purple-700 space-y-1">
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-purple-400" />
                                Adicione vídeos do YouTube para inspirar sua viagem
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-purple-400" />
                                Organize fotos por cidade ou dia da viagem
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-purple-400" />
                                Use a seção Memórias para criar um diário visual
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MediaView;
