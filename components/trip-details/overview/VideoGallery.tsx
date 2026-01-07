
import React, { useState } from 'react';
import { Card } from '../../ui/Base';
import { YouTubeVideo } from '../../../types';

interface VideoGalleryProps {
    videos: YouTubeVideo[];
    onAddVideo: (url: string) => void;
    onRemoveVideo: (id: string) => void;
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({ videos = [], onAddVideo, onRemoveVideo }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [error, setError] = useState('');

    const handleAdd = () => {
        if (!newVideoUrl.trim()) return;

        // Basic validation and ID extraction could happen here or in parent
        if (!newVideoUrl.includes('youtube.com') && !newVideoUrl.includes('youtu.be')) {
            setError('Por favor, insira um link válido do YouTube.');
            return;
        }

        onAddVideo(newVideoUrl);
        setNewVideoUrl('');
        setIsAdding(false);
        setError('');
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">smart_display</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-text-main dark:text-white">Vídeos da Viagem</h4>
                        <p className="text-sm text-text-muted dark:text-gray-400">Repositório de vídeos e inspirações</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-lg">add_link</span>
                    Adicionar Vídeo
                </button>
            </div>

            {isAdding && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h5 className="text-sm font-semibold text-text-main mb-2">Adicionar novo vídeo</h5>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newVideoUrl}
                            onChange={(e) => { setNewVideoUrl(e.target.value); setError(''); }}
                            placeholder="Cole o link do YouTube aqui..."
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none text-sm"
                        />
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-text-main text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={() => { setIsAdding(false); setError(''); setNewVideoUrl(''); }}
                            className="px-4 py-2 bg-transparent text-text-muted hover:text-text-main transition-colors text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
            )}

            {videos.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">video_library</span>
                    <p className="text-text-muted text-sm">Nenhum vídeo salvo ainda.</p>
                    <p className="text-xs text-text-muted opacity-70 mt-1">Adicione links do YouTube para criar sua playlist de viagem.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {videos.map((video) => (
                        <div key={video.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="aspect-video relative overflow-hidden bg-gray-100">
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors"
                                >
                                    <div className="size-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-2xl fill-current">play_arrow</span>
                                    </div>
                                </a>
                                <button
                                    onClick={() => onRemoveVideo(video.id)}
                                    className="absolute top-2 right-2 size-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Remover vídeo"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                            <div className="p-3">
                                <h5 className="font-semibold text-sm text-text-main line-clamp-2 leading-snug mb-1" title={video.title}>
                                    {video.title}
                                </h5>
                                <p className="text-[10px] text-text-muted">
                                    Adicionado em {new Date(video.addedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
