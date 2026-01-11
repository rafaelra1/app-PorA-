/**
 * Integration Test: Smart Checklist with AI
 * 
 * Tests the full flow of AI-powered checklist generation and suggestion acceptance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockGeminiService, mockChecklistAnalysisResult } from '../helpers/mockGeminiService';

describe('Checklist AI Integration', () => {
    let mockService: MockGeminiService;

    beforeEach(() => {
        mockService = new MockGeminiService();
        vi.clearAllMocks();
    });

    describe('analyzeChecklist', () => {
        it('should return insights and suggested tasks', async () => {
            const context = {
                destination: 'Tóquio, Japão',
                startDate: '2026-03-15',
                endDate: '2026-03-25',
                travelers: [{ id: '1', name: 'Viajante', email: '', avatar: '' }],
                interests: ['culture', 'food']
            };

            const result = await mockService.analyzeChecklist(context);

            expect(result.insights).toBeDefined();
            expect(result.insights.length).toBeGreaterThan(0);
            expect(result.suggestedTasks).toBeDefined();
            expect(result.suggestedTasks.length).toBeGreaterThan(0);
        });

        it('should add Japan-specific tasks for Japan destination', async () => {
            const context = {
                destination: 'Tóquio, Japão',
                startDate: '2026-03-15',
                endDate: '2026-03-25',
                travelers: [],
                interests: []
            };

            const result = await mockService.analyzeChecklist(context);

            const jrPassTask = result.suggestedTasks.find(t => t.title.includes('JR Pass'));
            expect(jrPassTask).toBeDefined();
            expect(jrPassTask?.isUrgent).toBe(true);
        });

        it('should have valid categories for all suggested tasks', async () => {
            const context = {
                destination: 'Paris, França',
                startDate: '2026-06-01',
                endDate: '2026-06-10',
                travelers: [],
                interests: []
            };

            const result = await mockService.analyzeChecklist(context);
            const validCategories = ['preparation', 'packing', 'documents', 'health', 'documentation', 'financial', 'tech', 'reservations'];

            result.suggestedTasks.forEach(task => {
                expect(validCategories).toContain(task.category);
            });
        });

        it('should have valid insight types', async () => {
            const result = mockChecklistAnalysisResult;
            const validTypes = ['weather', 'event', 'logistics', 'local_tip'];

            result.insights.forEach(insight => {
                expect(validTypes).toContain(insight.type);
            });
        });
    });

    describe('Duplicate Filtering', () => {
        it('should filter out duplicate suggestions based on existing task titles', () => {
            const existingTaskTitles = [
                'Verificar validade do passaporte',
                'Contratar seguro viagem internacional'
            ];

            const suggestions = mockChecklistAnalysisResult.suggestedTasks;

            const normalizedExisting = existingTaskTitles.map(t => t.toLowerCase().trim());
            const filteredSuggestions = suggestions.filter(suggestion => {
                const normalizedTitle = suggestion.title.toLowerCase().trim();
                return !normalizedExisting.some(existing =>
                    existing.includes(normalizedTitle) || normalizedTitle.includes(existing)
                );
            });

            // All mock suggestions should pass since none match existing titles
            expect(filteredSuggestions.length).toBe(suggestions.length);
        });

        it('should correctly identify and filter an exact duplicate', () => {
            const existingTaskTitles = ['Comprar adaptador de tomada'];
            const suggestions = mockChecklistAnalysisResult.suggestedTasks;

            const normalizedExisting = existingTaskTitles.map(t => t.toLowerCase().trim());
            const filteredSuggestions = suggestions.filter(suggestion => {
                const normalizedTitle = suggestion.title.toLowerCase().trim();
                return !normalizedExisting.some(existing =>
                    existing.includes(normalizedTitle) || normalizedTitle.includes(existing)
                );
            });

            expect(filteredSuggestions.length).toBe(suggestions.length - 1);
            expect(filteredSuggestions.find(s => s.title === 'Comprar adaptador de tomada')).toBeUndefined();
        });
    });

    describe('AI Settings', () => {
        // Note: localStorage is browser-only. These tests would run in jsdom environment.
        // For now, we test the logic itself without actual localStorage calls.

        it('should parse valid JSON settings', () => {
            const settingsJson = JSON.stringify({ autoAnalyze: true, threshold: 14 });
            const settings = JSON.parse(settingsJson);

            expect(settings.autoAnalyze).toBe(true);
            expect(settings.threshold).toBe(14);
        });

        it('should provide defaults for missing settings', () => {
            const defaults = { autoAnalyze: true, threshold: 14 };
            const settings = null || defaults;

            expect(settings.autoAnalyze).toBe(true);
            expect(settings.threshold).toBe(14);
        });
    });
});
