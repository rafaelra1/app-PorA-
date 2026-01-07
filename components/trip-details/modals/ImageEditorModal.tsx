import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import Modal from './Modal';

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageData: {
        type: 'attraction' | 'dish';
        index: number;
        data: any;
    };
    onEditComplete: (type: 'attraction' | 'dish', index: number, newImageUrl: string) => void;
    isEditing: boolean;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
    isOpen,
    onClose,
    imageData,
    onEditComplete,
    isEditing
}) => {
    const [prompt, setPrompt] = useState('');

    const handleEdit = () => {
        if (prompt.trim()) {
            onEditComplete(imageData.type, imageData.index, prompt);
            setPrompt('');
        }
    };

    const handleClose = () => {
        setPrompt('');
        onClose();
    };

    const currentImage = imageData.data.aiImage || imageData.data.image;
    const itemName = imageData.data.name;

    const footer = (
        <>
            <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                disabled={isEditing}
            >
                Cancelar
            </button>
            <button
                onClick={handleEdit}
                disabled={!prompt.trim() || isEditing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
                {isEditing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Editando...
                    </>
                ) : (
                    <>
                        <Wand2 className="w-4 h-4" />
                        Editar com IA
                    </>
                )}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Editar Imagem com IA"
            size="lg"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Current Image Preview */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Imagem Atual - {itemName}
                    </h3>
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                            src={currentImage}
                            alt={itemName}
                            className="w-full h-64 object-cover"
                        />
                    </div>
                </div>

                {/* Edit Instructions */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Como funciona a edição?
                    </h4>
                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                        <li>• Descreva as mudanças que deseja fazer na imagem</li>
                        <li>• A IA irá editar a imagem mantendo o contexto original</li>
                        <li>• Exemplos: "adicionar céu azul", "mudar para noite", "adicionar pessoas"</li>
                    </ul>
                </div>

                {/* Prompt Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descreva a edição desejada
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: adicionar pôr do sol ao fundo, mudar iluminação para noite, adicionar mais cores vibrantes..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={4}
                        disabled={isEditing}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Seja específico sobre o que deseja mudar na imagem
                    </p>
                </div>

                {/* Example Prompts */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sugestões rápidas:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {[
                            'adicionar pôr do sol',
                            'mudar para noite',
                            'adicionar pessoas',
                            'mais cores vibrantes',
                            'clima ensolarado',
                            'adicionar flores'
                        ].map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => setPrompt(suggestion)}
                                disabled={isEditing}
                                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ImageEditorModal;
