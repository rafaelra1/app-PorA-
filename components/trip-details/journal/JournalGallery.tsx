import React, { useState } from 'react';
import { JournalEntry } from '../../../types';

interface JournalGalleryProps {
    entries: JournalEntry[];
    onDelete?: (id: string) => void;
}

interface PhotoItem {
    url: string;
    entryId: string;
    location: string;
    date: string;
    timestamp: string;
}

const JournalGallery: React.FC<JournalGalleryProps> = ({ entries, onDelete }) => {
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

    // Flatten all photos from all entries
    const allPhotos: PhotoItem[] = entries.flatMap((entry) =>
        entry.images.map((url) => ({
            url,
            entryId: entry.id,
            location: entry.location,
            date: entry.date,
            timestamp: entry.timestamp,
        }))
    );

    if (allPhotos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="size-24 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-pink-400">photo_library</span>
                </div>
                <p className="text-text-muted font-bold text-lg mb-2">Nenhuma foto ainda</p>
                <p className="text-text-muted/70 text-sm max-w-xs">
                    Adicione fotos aos seus registros para vê-las aqui.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Photo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allPhotos.map((photo, idx) => (
                    <div
                        key={`${photo.entryId}-${idx}`}
                        className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer bg-gray-100 shadow-soft hover:shadow-xl transition-all duration-300"
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        <img
                            src={photo.url}
                            alt={`Foto em ${photo.location}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span className="truncate">{photo.location}</span>
                                </div>
                            </div>
                        </div>
                        {/* Expand Icon */}
                        <div className="absolute top-3 right-3 size-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="material-symbols-outlined text-white text-lg">open_in_full</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Photo count */}
            <div className="text-center mt-8">
                <p className="text-sm font-bold text-text-muted">
                    {allPhotos.length} {allPhotos.length === 1 ? 'foto' : 'fotos'} da viagem
                </p>
            </div>

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-6 right-6 size-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>

                    <div
                        className="relative max-w-5xl max-h-[85vh] w-full animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedPhoto.url}
                            alt={`Foto em ${selectedPhoto.location}`}
                            className="w-full h-full object-contain rounded-2xl"
                        />

                        {/* Info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white">location_on</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{selectedPhoto.location}</p>
                                        <p className="text-white/60 text-sm">
                                            {new Date(selectedPhoto.date).toLocaleDateString('pt-BR')} • {selectedPhoto.timestamp}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {onDelete && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Tem certeza que deseja excluir esta memória?')) {
                                                    onDelete(selectedPhoto.entryId);
                                                    setSelectedPhoto(null);
                                                }
                                            }}
                                            className="size-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors border border-red-500/30"
                                            title="Excluir Memória"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    )}
                                    <button className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                        <span className="material-symbols-outlined">download</span>
                                    </button>
                                    <button className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                        <span className="material-symbols-outlined">share</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JournalGallery;
