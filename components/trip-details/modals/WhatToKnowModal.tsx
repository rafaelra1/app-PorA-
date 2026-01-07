import React from 'react';

interface WhatToKnowModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    isLoading: boolean;
    onRegenerate: () => void;
    locationName: string;
}

const WhatToKnowModal: React.FC<WhatToKnowModalProps> = ({
    isOpen,
    onClose,
    content,
    isLoading,
    onRegenerate,
    locationName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">lightbulb</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main">O que saber antes de ir</h2>
                            <p className="text-xs text-text-muted">Dicas essenciais para {locationName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <span className="material-symbols-outlined text-4xl text-purple-300 animate-spin">autorenew</span>
                            <p className="text-sm font-medium text-text-muted">Consultando especialistas locais...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none text-text-main">
                            {content ? (
                                <div dangerouslySetInnerHTML={{ __html: content }} />
                            ) : (
                                <div className="text-center py-8 text-text-muted">
                                    <p>Nenhuma informação gerada ainda.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onRegenerate}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin' : ''}`}>
                            {isLoading ? 'sync' : 'refresh'}
                        </span>
                        Regenerar com IA
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-text-main hover:bg-gray-800 transition-colors"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatToKnowModal;
