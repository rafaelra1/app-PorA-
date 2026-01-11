import { useState, useCallback } from 'react';
import { GeminiService } from '../services/geminiService';
import { TripContext, ChecklistAnalysisResult, ChecklistTask, ChecklistInsight } from '../types';
import { useLocalStorage } from './useLocalStorage';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const geminiService = new GeminiService(GEMINI_API_KEY);

// Debug flag - set via URL param ?debug=checklist or localStorage
const isDebugMode = () => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debug') ||
        localStorage.getItem('debug_checklist') === 'true';
};

interface UseLLMAnalysisReturn {
    isAnalyzing: boolean;
    analysisResult: ChecklistAnalysisResult | null;
    analyzeChecklist: (context: TripContext, existingTaskTitles?: string[]) => Promise<void>;
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

    const analyzeChecklist = useCallback(async (context: TripContext, existingTaskTitles: string[] = []) => {
        // Prevent analysis if already running
        if (isAnalyzing) return;

        setIsAnalyzing(true);
        try {
            if (isDebugMode()) {
                console.log('[Checklist AI] Starting analysis with context:', context);
            }

            const result = await geminiService.analyzeChecklist(context);

            if (isDebugMode()) {
                console.log('[Checklist AI] Raw response from Gemini:', JSON.stringify(result, null, 2));
            }

            // Filter out duplicate suggestions that already exist in the task list
            if (result && result.suggestedTasks && existingTaskTitles.length > 0) {
                const normalizedExisting = existingTaskTitles.map(t => t.toLowerCase().trim());
                result.suggestedTasks = result.suggestedTasks.filter(suggestion => {
                    const normalizedTitle = suggestion.title.toLowerCase().trim();
                    const isDuplicate = normalizedExisting.some(existing =>
                        existing.includes(normalizedTitle) || normalizedTitle.includes(existing)
                    );
                    if (isDuplicate && isDebugMode()) {
                        console.log('[Checklist AI] Filtered duplicate suggestion:', suggestion.title);
                    }
                    return !isDuplicate;
                });
            }

            setAnalysisResult(result);
        } catch (error) {
            console.error('[Checklist AI] Failed to analyze checklist:', error);
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
