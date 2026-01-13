import { useState, useCallback } from 'react';
import { getGeminiService } from '../services/geminiService';
import { DocumentAnalysisResult } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface UseDocumentAnalysisOptions<T> {
    mapResultToFormData: (result: DocumentAnalysisResult) => Partial<T>;
    initialFormState: T;
}

export interface UseDocumentAnalysisReturn<T> {
    isAnalyzing: boolean;
    detectedItems: T[];
    analyzeDocument: (file: File) => Promise<void>;
    clearDetectedItems: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Shared hook for document analysis using Gemini AI.
 * Used by AddTransportModal and AddAccommodationModal.
 */
export function useDocumentAnalysis<T>(
    options: UseDocumentAnalysisOptions<T>
): UseDocumentAnalysisReturn<T> {
    const { mapResultToFormData, initialFormState } = options;
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detectedItems, setDetectedItems] = useState<T[]>([]);

    const analyzeDocument = useCallback(async (file: File) => {
        setIsAnalyzing(true);
        setDetectedItems([]);

        try {
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const base64 = event.target?.result as string;

                    const geminiService = getGeminiService();
                    const results = await geminiService.analyzeDocumentImage(base64);

                    if (results && results.length > 0) {
                        console.log('Document analysis results:', results);

                        const items = results.map(result => ({
                            ...initialFormState,
                            ...mapResultToFormData(result)
                        }));

                        setDetectedItems(items);
                    }
                } catch (error) {
                    console.error('Error in document analysis callback:', error);
                } finally {
                    setIsAnalyzing(false);
                }
            };

            reader.onerror = () => {
                console.error('Error reading file');
                setIsAnalyzing(false);
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error analyzing document:', error);
            setIsAnalyzing(false);
        }
    }, [mapResultToFormData, initialFormState]);

    const clearDetectedItems = useCallback(() => {
        setDetectedItems([]);
    }, []);

    return {
        isAnalyzing,
        detectedItems,
        analyzeDocument,
        clearDetectedItems,
    };
}
