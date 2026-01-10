import React from 'react';
import { BatchAnalysisResult, DocumentAnalysisResult } from '../../../types';
import { Button } from '../../ui/Base';

interface BatchReviewViewProps {
    results: BatchAnalysisResult;
    onRemove: (index: number, type: 'success' | 'failed' | 'duplicate') => void;
    onConfirm: () => void;
    onCancel: () => void;
    isSaving: boolean;
}

export const BatchReviewView: React.FC<BatchReviewViewProps> = ({
    results,
    onRemove,
    onConfirm,
    onCancel,
    isSaving
}) => {
    const totalItems = results.successful.length + results.failed.length + results.duplicates.length;
    const hasSuccess = results.successful.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                    Revisão de Documentos ({totalItems})
                </h3>
                <div className="flex gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                        {results.successful.length} Prontos
                    </span>
                    {results.failed.length > 0 && (
                        <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-lg">
                            {results.failed.length} Falhas
                        </span>
                    )}
                    {results.duplicates.length > 0 && (
                        <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">
                            {results.duplicates.length} Duplicados
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {/* Successful Items */}
                {results.successful.map((doc, idx) => (
                    <div key={`param-${idx}`} className="flex items-start gap-3 p-3 bg-white border border-green-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-900 truncate">{doc.name || 'Documento Sem Nome'}</p>
                                <button
                                    onClick={() => onRemove(idx, 'success')}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{doc.type}</span>
                                <span>{doc.date}</span>
                                {doc.reference && <span className="text-gray-400">• {doc.reference}</span>}
                            </p>
                            {doc.warnings && doc.warnings.length > 0 && (
                                <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                    ⚠️ {doc.warnings.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Failed Items */}
                {results.failed.map((item, idx) => (
                    <div key={`fail-${idx}`} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-red-500">error</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-900 truncate">{item.fileName}</p>
                                <button
                                    onClick={() => onRemove(idx, 'failed')}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                            <p className="text-xs text-red-600 mt-1">{item.error}</p>
                        </div>
                    </div>
                ))}

                {/* Duplicates */}
                {results.duplicates.map((item, idx) => (
                    <div key={`dup-${idx}`} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl opacity-75">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-amber-500">content_copy</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-gray-900 truncate">{item.fileName}</p>
                                <button
                                    onClick={() => onRemove(idx, 'duplicate')}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                            <p className="text-xs text-amber-600 mt-1">Duplicata de: {item.duplicateOf}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                    Voltar / Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={!hasSuccess || isSaving}
                    className="flex-1"
                >
                    {isSaving ? 'Salvando...' : `Importar ${results.successful.length} Documentos`}
                </Button>
            </div>
        </div>
    );
};
