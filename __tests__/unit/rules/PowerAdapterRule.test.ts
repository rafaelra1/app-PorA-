import { describe, it, expect } from 'vitest';
import { PowerAdapterRule } from '../../../lib/checklistRules';
import { createSchengenTrip, createBrazilTrip, createUSATrip } from '../../helpers/tripFactory';

describe('PowerAdapterRule', () => {
    it('should apply to European trips (Type C plugs)', () => {
        const trip = createSchengenTrip();
        expect(PowerAdapterRule.applies(trip)).toBe(true);
    });

    it('should not apply to Brazil domestic trips', () => {
        const trip = createBrazilTrip();
        expect(PowerAdapterRule.applies(trip)).toBe(false);
    });

    it('should not apply to USA trips (same plug type as Brazil)', () => {
        const trip = createUSATrip();
        expect(PowerAdapterRule.applies(trip)).toBe(false);
    });

    it('should generate task with adapter types needed', () => {
        const trip = createSchengenTrip();
        const tasks = PowerAdapterRule.generateTasks(trip);

        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Comprar adaptador de tomada');
        expect(tasks[0].category).toBe('packing');
        expect(tasks[0].description).toContain('Tipo C (Europeu)');
    });

    it('should suggest universal adapter for multiple countries', () => {
        const trip = createSchengenTrip();
        const tasks = PowerAdapterRule.generateTasks(trip);

        expect(tasks[0].description).toContain('adaptador universal');
    });

    it('should set deadline to one week before trip', () => {
        const trip = createSchengenTrip({
            startDate: '15/03/2026',
        });

        const tasks = PowerAdapterRule.generateTasks(trip);
        const dueDate = new Date(tasks[0].deadline!);
        const tripStart = new Date('2026-03-15');
        const daysDiff = Math.floor((tripStart.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        expect(daysDiff).toBe(7);
    });
});
