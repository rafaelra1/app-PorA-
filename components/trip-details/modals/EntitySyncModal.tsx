import * as React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Button } from '../../ui/Base';
import { TripDocument } from '../../../types';
import { documentToTransport, documentToAccommodation, documentToCarRental } from '../../../services/entitySyncService';

interface EntitySyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: TripDocument | null;
    onConfirm: (entityType: 'transport' | 'accommodation' | 'car', data: any) => void;
}

export const EntitySyncModal = ({
    isOpen,
    onClose,
    document,
    onConfirm
}: EntitySyncModalProps): React.ReactElement | null => {
    const [previewData, setPreviewData] = useState<any>(null);
    const [entityType, setEntityType] = useState<'transport' | 'accommodation' | 'car'>('transport');

    useEffect(() => {
        if (document) {
            if (['flight', 'train', 'bus'].includes(document.type)) {
                setEntityType('transport');
                setPreviewData(documentToTransport(document));
            } else if (document.type === 'hotel') {
                setEntityType('accommodation');
                setPreviewData(documentToAccommodation(document));
            } else if (document.type === 'car') {
                setEntityType('car');
                setPreviewData(documentToCarRental(document));
            } else {
                // Default fallback if opened for other types, though usually restricted
                setEntityType('transport');
                setPreviewData(documentToTransport(document));
            }
        }
    }, [document]);

    if (!document || !previewData) return null;

    const renderPreview = () => {
        return (
            <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm">
                {Object.entries(previewData).map(([key, value]) => {
                    // Filter out empty or technical fields for cleaner preview
                    if (!value || key === 'id' || key === 'documentId' || key === 'status') return null;

                    // Format key for display
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                    return (
                        <div key={key} className="flex justify-between border-b border-gray-100 pb-1 last:border-0">
                            <span className="text-gray-500">{label}</span>
                            <span className="font-medium text-gray-900 truncate max-w-[200px]">{String(value)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleConfirm = () => {
        onConfirm(entityType, previewData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Sincronizar Dados"
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Pular
                    </Button>
                    <Button onClick={handleConfirm}>
                        Confirmar e Criar
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <span className="material-symbols-outlined text-lg mt-0.5">auto_awesome</span>
                    <p>
                        Identificamos que este documento é um <strong>{entityType === 'transport' ? 'Transporte' : entityType === 'accommodation' ? 'Hotel' : 'Aluguel de Carro'}</strong>.
                        Deseja criar automaticamente o item correspondente no seu itinerário?
                    </p>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pré-visualização dos Dados</h4>
                    {renderPreview()}
                </div>

                <p className="text-xs text-center text-gray-400">
                    Você poderá editar todos os detalhes após a criação.
                </p>
            </div>
        </Modal>
    );
};
