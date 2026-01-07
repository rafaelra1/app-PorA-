import React, { useState } from 'react';
import { X, Sparkles, Upload, Loader2 } from 'lucide-react';
import { Attraction } from '../../../types';
import { getGeminiService } from '../../../services/geminiService';

interface ImportAttractionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (attractions: Attraction[]) => void;
    cityName: string;
}

const ImportAttractionsModal: React.FC<ImportAttractionsModalProps> = ({
    isOpen,
    onClose,
    onImport,
    cityName
}) => {
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewItems, setPreviewItems] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setInputText(text);

        // Parse and show preview
        const lines = text.split('\n').filter(line => line.trim() !== '');
        setPreviewItems(lines);
    };

    const handleImport = async () => {
        if (previewItems.length === 0) return;

        setIsProcessing(true);
        try {
            const service = getGeminiService();
            // Call AI to enrich attractions with real-world info
            const enrichedAttractions = await service.enrichAttractions(previewItems, cityName);

            onImport(enrichedAttractions);
            setIsProcessing(false);
            setInputText('');
            setPreviewItems([]);
            onClose();
        } catch (error) {
            console.error('Failed to enrich attractions with AI:', error);
            // Fallback to basic objects if AI fails
            const basicAttractions: Attraction[] = previewItems.map((name, index) => ({
                id: `imported-${Date.now()}-${index}`,
                name: name.trim(),
                description: `Atração turística em ${cityName}`,
                category: 'Ponto Turístico',
                image: '',
                rating: (4 + Math.random()).toFixed(1),
                time: '09:00 - 18:00',
                price: 'Consultar',
                longDescription: '',
            }));
            onImport(basicAttractions);
            setIsProcessing(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Importar Atrações</h2>
                            <p className="text-xs text-gray-500">Cole sua lista de atrações</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lista de Atrações
                        </label>
                        <textarea
                            value={inputText}
                            onChange={handleTextChange}
                            placeholder={`Digite uma atração por linha:\n\nTorre Eiffel\nMuseu do Louvre\nArco do Triunfo\n...`}
                            className="w-full h-40 px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                        />
                    </div>

                    {/* Preview */}
                    {previewItems.length > 0 && (
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">Preview</span>
                                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-bold">
                                    {previewItems.length} {previewItems.length === 1 ? 'atração' : 'atrações'}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {previewItems.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="material-symbols-outlined text-indigo-500 text-base">location_on</span>
                                        {item}
                                    </div>
                                ))}
                                {previewItems.length > 5 && (
                                    <p className="text-xs text-gray-400 pl-6">
                                        + {previewItems.length - 5} mais...
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={previewItems.length === 0 || isProcessing}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Identificando com IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Gerar Cards
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportAttractionsModal;
