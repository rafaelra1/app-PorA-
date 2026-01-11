/**
 * Mock for GeminiService - Checklist Analysis
 * Use this mock in tests to avoid actual API calls
 */

import { TripContext, ChecklistAnalysisResult } from '../../types';

export const mockChecklistAnalysisResult: ChecklistAnalysisResult = {
    insights: [
        {
            id: 'insight-1',
            type: 'weather',
            title: 'Época de chuvas',
            description: 'Janeiro é época de monções no Sudeste Asiático. Leve guarda-chuva e roupas impermeáveis.',
            confidence: 'high'
        },
        {
            id: 'insight-2',
            type: 'event',
            title: 'Ano Novo Lunar',
            description: 'Se viajar em fevereiro, será época do Ano Novo Lunar. Reservas antecipadas são essenciais.',
            confidence: 'medium'
        }
    ],
    suggestedTasks: [
        {
            id: 'task-1',
            title: 'Comprar adaptador de tomada',
            category: 'packing',
            reason: 'Tomadas no Japão são tipo A/B, diferentes do Brasil.',
            isUrgent: false
        },
        {
            id: 'task-2',
            title: 'Baixar app de tradução offline',
            category: 'preparation',
            reason: 'Inglês não é amplamente falado. Google Translate offline é essencial.',
            isUrgent: false
        },
        {
            id: 'task-3',
            title: 'Verificar vacinas recomendadas',
            category: 'health',
            reason: 'Algumas regiões podem exigir vacinas específicas.',
            isUrgent: true
        }
    ]
};

export class MockGeminiService {
    private apiKey: string;

    constructor(apiKey: string = 'mock-key') {
        this.apiKey = apiKey;
    }

    async analyzeChecklist(context: TripContext): Promise<ChecklistAnalysisResult> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Return mock result, optionally customized based on destination
        const result = { ...mockChecklistAnalysisResult };

        // Customize based on destination
        if (context.destination.toLowerCase().includes('japão') ||
            context.destination.toLowerCase().includes('japan')) {
            result.suggestedTasks.push({
                id: 'task-japan-1',
                title: 'Comprar JR Pass antes de sair do Brasil',
                category: 'packing',
                reason: 'O Japan Rail Pass deve ser comprado fora do Japão e economiza muito em trens.',
                isUrgent: true
            });
        }

        return result;
    }
}

export const createMockGeminiService = () => new MockGeminiService();
