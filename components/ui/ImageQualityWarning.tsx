import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { QualityAnalysis } from '../../services/imagePreprocessor';

interface ImageQualityWarningProps {
    analysis: QualityAnalysis | null;
    onProceed: () => void;
    onRetake: () => void;
    isProcessing?: boolean;
}

export const ImageQualityWarning: React.FC<ImageQualityWarningProps> = ({
    analysis,
    onProceed,
    onRetake,
    isProcessing = false
}) => {
    if (!analysis) return null;

    // Map issues to user-friendly messages
    const getIssueMessage = (issue: string) => {
        switch (issue) {
            case 'blurry': return 'A imagem parece borrada. Tente segurar a câmera firme.';
            case 'dark': return 'A imagem está muito escura. Procure um local mais iluminado.';
            case 'overexposed': return 'A imagem está muito clara (estourada). Evite luz direta no papel.';
            case 'glare': return 'Há reflexos na imagem que podem dificultar a leitura.';
            default: return 'A qualidade da imagem pode afetar a leitura.';
        }
    };

    const hasIssues = analysis.issues.length > 0;
    const isGoodQuality = !hasIssues;

    if (isGoodQuality) {
        // Optional: could show a brief success message, but usually we just proceed automatically
        // or show a small checkmark before proceeding
        return null;
    }

    return (
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                        Qualidade da imagem baixa
                    </h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                        Identificamos alguns problemas que podem dificultar a leitura automática:
                    </p>
                    <ul className="space-y-2 mb-4">
                        {analysis.issues.map((issue) => (
                            <li key={issue} className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                {getIssueMessage(issue)}
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onRetake}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Tentar Novamente
                        </button>
                        <button
                            onClick={onProceed}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-lg text-sm font-medium text-orange-800 dark:text-orange-200 transition-colors flex items-center gap-2"
                        >
                            {isProcessing ? 'Processando...' : 'Usar esta imagem mesmo assim'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
