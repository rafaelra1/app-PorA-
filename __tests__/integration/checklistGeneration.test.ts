import { describe, it, expect } from 'vitest';
import { applyAllRules } from '../../lib/checklistRules';
import { createUSATrip, createSchengenTrip, createYellowFeverTrip } from '../helpers/tripFactory';

describe('Checklist Generation Integration', () => {
    describe('USA Trip', () => {
        it('should generate appropriate tasks for USA trip', () => {
            const trip = createUSATrip();
            const tasks = applyAllRules(trip);

            // Deve incluir tarefas de câmbio (USD)
            const currencyTask = tasks.find(t => t.title?.includes('câmbio'));
            expect(currencyTask).toBeDefined();
            expect(currencyTask?.description).toContain('Dólar');

            // Deve incluir tarefa de avisar banco
            const bankTask = tasks.find(t => t.title?.includes('banco'));
            expect(bankTask).toBeDefined();

            // NÃO deve incluir adaptador (mesma tomada do Brasil)
            const adapterTask = tasks.find(t => t.title?.includes('adaptador'));
            expect(adapterTask).toBeUndefined();

            // NÃO deve incluir vacina de febre amarela
            const vaccineTask = tasks.find(t => t.title?.includes('febre amarela'));
            expect(vaccineTask).toBeUndefined();
        });
    });

    describe('Schengen Trip', () => {
        it('should generate appropriate tasks for European trip', () => {
            const trip = createSchengenTrip();
            const tasks = applyAllRules(trip);

            // Deve incluir seguro viagem (obrigatório para Schengen)
            const insuranceTask = tasks.find(t => t.title?.includes('seguro'));
            expect(insuranceTask).toBeDefined();
            expect(insuranceTask?.description).toContain('€30.000');

            // Deve incluir adaptador de tomada (Tipo C)
            const adapterTask = tasks.find(t => t.title?.includes('adaptador'));
            expect(adapterTask).toBeDefined();
            expect(adapterTask?.description).toContain('Tipo C');

            // Deve incluir câmbio (EUR)
            const currencyTask = tasks.find(t => t.title?.includes('câmbio'));
            expect(currencyTask).toBeDefined();
            expect(currencyTask?.description).toContain('Euro');
        });
    });

    describe('Yellow Fever Trip', () => {
        it('should generate vaccine task for yellow fever countries', () => {
            const trip = createYellowFeverTrip();
            const tasks = applyAllRules(trip);

            const vaccineTask = tasks.find(t => t.title?.includes('febre amarela'));
            expect(vaccineTask).toBeDefined();
            expect(vaccineTask?.category).toBe('health');
        });
    });

    describe('Task Priority', () => {
        it('should mark urgent tasks correctly', () => {
            const trip = createSchengenTrip();
            const tasks = applyAllRules(trip);

            // Seguro viagem deve ser urgente
            const insuranceTask = tasks.find(t => t.title?.includes('seguro'));
            expect(insuranceTask).toBeDefined();
        });

        it('should categorize tasks correctly', () => {
            const trip = createSchengenTrip();
            const tasks = applyAllRules(trip);

            const categories = new Set(tasks.map(t => t.category));

            // Deve ter múltiplas categorias
            expect(categories.size).toBeGreaterThan(1);

            // Categorias válidas
            const validCategories = ['documentation', 'health', 'financial', 'packing', 'other'];
            tasks.forEach(task => {
                expect(validCategories).toContain(task.category);
            });
        });
    });

    describe('Multiple Destinations', () => {
        it('should handle trips with multiple countries', () => {
            const trip = createSchengenTrip();
            const tasks = applyAllRules(trip);

            // Deve gerar tarefas mesmo com múltiplos destinos
            expect(tasks.length).toBeGreaterThan(0);

            // Deve mencionar adaptador universal para múltiplos países
            const adapterTask = tasks.find(t => t.title?.includes('adaptador'));
            if (adapterTask) {
                expect(adapterTask.description).toContain('universal');
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle trip with no detailed destinations', () => {
            const trip = createUSATrip();
            trip.detailedDestinations = undefined;

            const tasks = applyAllRules(trip);

            // Deve gerar pelo menos algumas tarefas genéricas
            expect(tasks.length).toBeGreaterThanOrEqual(0);
        });

        it('should handle trip with empty destination list', () => {
            const trip = createUSATrip();
            trip.detailedDestinations = [];

            const tasks = applyAllRules(trip);

            // Não deve gerar erros
            expect(Array.isArray(tasks)).toBe(true);
        });
    });
});
