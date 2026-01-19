import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { Button } from '../../ui/Base';
import { getGeminiService } from '../../../services/geminiService';
import { googlePlacesService } from '../../../services/googlePlacesService';

interface ActivityDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    location?: string;
    type: string;
    image?: string;
    activityId?: string;
    onGenerateImage?: (id: string) => void;
    onUpdateImage?: (id: string, imageUrl: string) => void;
}

const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({
    isOpen,
    onClose,
    title,
    location,
    type,
    image,
    activityId,
    onGenerateImage,
    onUpdateImage
}) => {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<{ description: string; reviewSummary: string } | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | undefined>(image);

    // Sync currentImage with prop changes
    useEffect(() => {
        setCurrentImage(image);
    }, [image]);

    useEffect(() => {
        const query = location || title;
        if (isOpen && query) {
            setLoading(true);
            getGeminiService().getPlaceDetails(query)
                .then(data => setDetails(data))
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setDetails(null);
        }
    }, [isOpen, title, location]);

    const handleGenerateAI = async () => {
        if (!activityId || !onGenerateImage) return;
        setIsGeneratingAI(true);
        try {
            await onGenerateImage(activityId);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleFetchGooglePlaces = async () => {
        if (!activityId) return;
        setIsFetchingPlaces(true);
        try {
            const query = location || title;
            const result = await googlePlacesService.searchPlace(query);
            if (result.image) {
                setCurrentImage(result.image);
                if (onUpdateImage) {
                    onUpdateImage(activityId, result.image);
                }
            }
        } catch (error) {
            console.error('Error fetching Google Places image:', error);
        } finally {
            setIsFetchingPlaces(false);
        }
    };

    const footer = (
        <Button onClick={onClose} className="w-full">
            Fechar
        </Button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="xl"
            footer={footer}
        >
            <div className="flex items-center gap-2 text-text-muted text-sm uppercase tracking-wider font-bold mb-6">
                <span className="material-symbols-outlined text-lg">info</span>
                {type}
            </div>

            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-text-muted space-y-3">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                    <p className="text-sm font-medium">Buscando informações...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                    {/* Column 1: Photos */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-500">photo_library</span>
                            Fotos do Local
                        </h4>
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm relative group">
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt={title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">image_not_supported</span>
                                    <span className="text-xs">Nenhuma foto disponível</span>
                                </div>
                            )}

                            {/* Hover overlay with actions */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 ${currentImage ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                                <div className="flex flex-col gap-2">
                                    {/* Generate AI Button */}
                                    <button
                                        onClick={handleGenerateAI}
                                        disabled={isGeneratingAI || isFetchingPlaces || !activityId}
                                        className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                            {isGeneratingAI ? 'progress_activity' : 'auto_awesome'}
                                        </span>
                                        {isGeneratingAI ? 'Gerando...' : 'Gerar Foto IA'}
                                    </button>

                                    {/* Google Places Button */}
                                    <button
                                        onClick={handleFetchGooglePlaces}
                                        disabled={isGeneratingAI || isFetchingPlaces || !activityId}
                                        className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-white/90 hover:bg-white text-gray-800 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${isFetchingPlaces ? 'animate-spin' : ''}`}>
                                            {isFetchingPlaces ? 'progress_activity' : 'travel_explore'}
                                        </span>
                                        {isFetchingPlaces ? 'Buscando...' : 'Buscar no Google'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: About */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">description</span>
                            Sobre o Local
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 h-full max-h-[400px] overflow-y-auto custom-scrollbar">
                            {details ? (
                                <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                    {details.description}
                                </p>
                            ) : (
                                <p className="text-sm text-text-muted italic">Informações não disponíveis.</p>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Reviews */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500">star</span>
                            O que dizem as pessoas
                        </h4>
                        <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 h-full max-h-[400px] overflow-y-auto custom-scrollbar">
                            {details ? (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {details.reviewSummary}
                                </p>
                            ) : (
                                <p className="text-sm text-text-muted italic">Avaliações não disponíveis.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ActivityDetailsModal;
