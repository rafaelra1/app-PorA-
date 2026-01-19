import * as React from 'react';
import { useState, useEffect } from 'react';
import Modal from './Modal';

interface ActivityNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialNotes?: string;
    onSave: (notes: string) => void;
}

export const ActivityNotesModal: React.FC<ActivityNotesModalProps> = ({
    isOpen,
    onClose,
    title,
    initialNotes = '',
    onSave
}) => {
    const [notes, setNotes] = useState(initialNotes);

    useEffect(() => {
        setNotes(initialNotes || '');
    }, [initialNotes, isOpen]);

    const handleSave = () => {
        onSave(notes);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Minhas Notas"
        >
            <div className="space-y-4">
                <p className="text-sm text-text-muted">
                    Adicione observações e informações importantes para <strong>{title}</strong>.
                </p>

                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-40 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm text-text-main"
                    placeholder="Ex: Chegar 15 minutos antes, levar comprovante impresso, procurar pela entrada norte..."
                    autoFocus
                />

                <div className="flex gap-3 justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-xl text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        Salvar Notas
                    </button>
                </div>
            </div>
        </Modal>
    );
};
