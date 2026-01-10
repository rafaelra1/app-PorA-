import { useState, useCallback } from 'react';
import { GeminiService } from '../services/geminiService';
import { TripContext, ChecklistAnalysisResult, ChecklistTask, ChecklistInsight } from '../types';
import { useLocalStorage } from './useLocalStorage';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const geminiService = new GeminiService(GEMINI_API_KEY);

interface UseLLMAnalysisReturn {
    isAnalyzing: boolean;
    analysisResult: ChecklistAnalysisResult | null;
    analyzeChecklist: (context: TripContext) => Promise<void>;
    acceptSuggestion: (suggestionId: string) => ChecklistTask | undefined;
    rejectSuggestion: (suggestionId: string) => void;
    clearAnalysis: () => void;
}

export const useLLMAnalysis = (tripId: string): UseLLMAnalysisReturn => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Cache analysis results by tripId
    const [analysisResult, setAnalysisResult] = useLocalStorage<ChecklistAnalysisResult | null>(
        `checklist-analysis-${tripId}`,
        null
    );

    const analyzeChecklist = useCallback(async (context: TripContext) => {
        // Prevent analysis if already running or if we have valid cached data (optional: add expiration logic later)
        if (isAnalyzing) return;

        setIsAnalyzing(true);
        try {
            const result = await geminiService.analyzeChecklist(context);
            setAnalysisResult(result);
        } catch (error) {
            console.error('Failed to analyze checklist:', error);
            // Optionally set error state here
        } finally {
            setIsAnalyzing(false);
        }
    }, [isAnalyzing, setAnalysisResult]);

    const acceptSuggestion = useCallback((suggestionId: string) => {
        if (!analysisResult) return undefined;

        const suggestion = analysisResult.suggestedTasks.find(t => t.id === suggestionId);
        if (suggestion) {
            // Remove from suggestions list effectively "moving" it to the real list (handled by parent)
            setAnalysisResult({
                ...analysisResult,
                suggestedTasks: analysisResult.suggestedTasks.filter(t => t.id !== suggestionId)
            });
        }
        return suggestion;
    }, [analysisResult, setAnalysisResult]);

    const rejectSuggestion = useCallback((suggestionId: string) => {
        if (!analysisResult) return;

        setAnalysisResult({
            ...analysisResult,
            suggestedTasks: analysisResult.suggestedTasks.filter(t => t.id !== suggestionId)
        });
    }, [analysisResult, setAnalysisResult]);

    const clearAnalysis = useCallback(() => {
        setAnalysisResult(null);
    }, [setAnalysisResult]);

    return {
        isAnalyzing,
        analysisResult,
        analyzeChecklist,
        acceptSuggestion,
        rejectSuggestion,
        clearAnalysis
    };
};
