import { describe, it, expect } from 'vitest';
import { CurrencyExchangeRule } from '../../../lib/checklistRules';
import { createSchengenTrip, createBrazilTrip, createUSATrip } from '../../helpers/tripFactory';

describe('CurrencyExchangeRule', () => {
    it('should apply to international trips', () => {
        const trip = createSchengenTrip();
        expect(CurrencyExchangeRule.applies(trip)).toBe(true);
    });

    it('should not apply to Brazil domestic trips', () => {
        const trip = createBrazilTrip();
        expect(CurrencyExchangeRule.applies(trip)).toBe(false);
    });

    it('should generate currency exchange and bank notification tasks', () => {
        const trip = createUSATrip();
        const tasks = CurrencyExchangeRule.generateTasks(trip);

        expect(tasks).toHaveLength(2);
        expect(tasks[0].title).toBe('Fazer câmbio de moeda');
        expect(tasks[1].title).toBe('Avisar banco sobre viagem');
    });

    it('should identify correct currency for European trips', () => {
        const trip = createSchengenTrip();
        const tasks = CurrencyExchangeRule.generateTasks(trip);

        expect(tasks[0].description).toContain('Euro (EUR)');
    });

    it('should identify correct currency for USA trips', () => {
        const trip = createUSATrip();
        const tasks = CurrencyExchangeRule.generateTasks(trip);

        expect(tasks[0].description).toContain('Dólar Americano (USD)');
    });

    it('should set deadline to 3 days before trip', () => {
        const trip = createSchengenTrip({
            startDate: '15/03/2026',
        });

        const tasks = CurrencyExchangeRule.generateTasks(trip);
        const dueDate = new Date(tasks[0].deadline!);
        const tripStart = new Date('2026-03-15');
        const daysDiff = Math.floor((tripStart.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        expect(daysDiff).toBe(3);
    });

    it('should suggest comparing exchange rates', () => {
        const trip = createSchengenTrip();
        const tasks = CurrencyExchangeRule.generateTasks(trip);

        expect(tasks[0].description).toContain('Compare taxas');
    });
});
