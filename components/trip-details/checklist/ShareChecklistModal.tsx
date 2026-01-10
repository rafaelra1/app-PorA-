import React, { useState } from 'react';
import { PreparationTask, Participant } from '../../../types';

interface ShareChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: PreparationTask[];
    tripTitle: string;
    participants: Participant[];
}

export const ShareChecklistModal: React.FC<ShareChecklistModalProps> = ({
    isOpen,
    onClose,
    tasks,
    tripTitle,
    participants,
}) => {
    const [shareMethod, setShareMethod] = useState<'link' | 'email'>('link');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [shareLink, setShareLink] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const generateShareLink = () => {
        // Em produção, isso geraria um link real no backend
        const mockLink = `${window.location.origin}/shared/checklist/${Date.now()}`;
        setShareLink(mockLink);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const toggleParticipant = (participantId: string) => {
        setSelectedParticipants(prev =>
            prev.includes(participantId)
                ? prev.filter(id => id !== participantId)
                : [...prev, participantId]
        );
    };

    const handleShare = () => {
        if (shareMethod === 'link') {
            generateShareLink();
        } else {
            // Enviar por email
            console.log('Sending to:', selectedParticipants);
            alert('Checklist enviado por email!');
            onClose();
        }
    };

    const completedCount = tasks.filter(t => t.status === 'done').length;
    const completionPercentage = tasks.length > 0
        ? Math.round((completedCount / tasks.length) * 100)
        : 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Compartilhar Checklist</h2>
                        <p className="text-sm text-text-muted">{tripTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Preview Card */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-12 rounded-xl bg-amber-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">checklist</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-text-main">{tripTitle}</h3>
                                <p className="text-sm text-text-muted">
                                    {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} • {completionPercentage}% concluído
                                </p>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Share Method Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-text-main mb-3">
                            Como deseja compartilhar?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShareMethod('link')}
                                className={`p-4 rounded-xl border-2 transition-all ${shareMethod === 'link'
                                    ? 'border-amber-500 bg-amber-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-3xl mb-2 block text-amber-500">
                                    link
                                </span>
                                <p className="font-semibold text-sm text-text-main">Link de Compartilhamento</p>
                                <p className="text-xs text-text-muted mt-1">Gere um link para compartilhar</p>
                            </button>

                            <button
                                onClick={() => setShareMethod('email')}
                                className={`p-4 rounded-xl border-2 transition-all ${shareMethod === 'email'
                                    ? 'border-amber-500 bg-amber-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-3xl mb-2 block text-amber-500">
                                    mail
                                </span>
                                <p className="font-semibold text-sm text-text-main">Enviar por Email</p>
                                <p className="text-xs text-text-muted mt-1">Envie para os participantes</p>
                            </button>
                        </div>
                    </div>

                    {/* Link Generation */}
                    {shareMethod === 'link' && shareLink && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <label className="block text-sm font-semibold text-text-main mb-2">
                                Link Gerado
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareLink}
                                    readOnly
                                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {copied ? 'check' : 'content_copy'}
                                    </span>
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>
                            <p className="text-xs text-text-muted mt-2">
                                Este link permite visualização do checklist em tempo real
                            </p>
                        </div>
                    )}

                    {/* Email Recipients */}
                    {shareMethod === 'email' && (
                        <div>
                            <label className="block text-sm font-semibold text-text-main mb-3">
                                Selecione os destinatários
                            </label>
                            <div className="space-y-2">
                                {participants.map(participant => (
                                    <label
                                        key={participant.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedParticipants.includes(participant.id)}
                                            onChange={() => toggleParticipant(participant.id)}
                                            className="size-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        <img
                                            src={participant.avatar}
                                            alt={participant.name}
                                            className="size-10 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm text-text-main">{participant.name}</p>
                                            <p className="text-xs text-text-muted">{participant.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Permissions */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-blue-500 text-xl">info</span>
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-900 text-sm mb-1">Permissões</h4>
                                <p className="text-xs text-blue-800">
                                    Pessoas com acesso poderão visualizar o checklist e marcar tarefas como concluídas.
                                    Apenas você pode adicionar ou remover tarefas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-text-muted hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={shareMethod === 'email' && selectedParticipants.length === 0}
                        className="px-6 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">share</span>
                        {shareMethod === 'link' ? 'Gerar Link' : 'Enviar Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};
