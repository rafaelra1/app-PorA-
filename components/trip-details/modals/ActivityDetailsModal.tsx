import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { Button } from '../../ui/Base';
import { getGeminiService } from '../../../services/geminiService';

interface ActivityDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    location?: string;
    type: string;
}

const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({ isOpen, onClose, title, location, type }) => {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<{ description: string; reviewSummary: string } | null>(null);

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
            size="sm"
            footer={footer}
        >
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-text-muted text-sm uppercase tracking-wider font-bold">
                    <span className="material-symbols-outlined text-lg">info</span>
                    {type}
                </div>

                {loading ? (
                    <div className="py-8 flex flex-col items-center justify-center text-text-muted space-y-3">
                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                        <p className="text-sm font-medium">Buscando informações...</p>
                    </div>
                ) : details ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Description */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-500">description</span>
                                Sobre o Local
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                {details.description}
                            </p>
                        </div>

                        {/* Reviews */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-500">star</span>
                                O que dizem as pessoas
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
                                {details.reviewSummary}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-text-muted">
                        <p>Não foi possível carregar os detalhes deste local.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ActivityDetailsModal;
