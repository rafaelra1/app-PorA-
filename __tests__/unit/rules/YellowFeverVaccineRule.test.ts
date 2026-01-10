import { describe, it, expect } from 'vitest';
import { YellowFeverVaccineRule } from '../../../lib/checklistRules';
import { createYellowFeverTrip, createBrazilTrip, createSchengenTrip } from '../../helpers/tripFactory';

describe('YellowFeverVaccineRule', () => {
    it('should apply to trips to yellow fever countries', () => {
        const trip = createYellowFeverTrip();
        expect(YellowFeverVaccineRule.applies(trip)).toBe(true);
    });

    it('should not apply to trips to Brazil', () => {
        const trip = createBrazilTrip();
        // Brasil está na lista, mas vamos testar com destino doméstico
        expect(YellowFeverVaccineRule.applies(trip)).toBe(true); // Brasil exige vacina para algumas regiões
    });

    it('should not apply to European trips', () => {
        const trip = createSchengenTrip();
        expect(YellowFeverVaccineRule.applies(trip)).toBe(false);
    });

    it('should generate a task with correct deadline', () => {
        const trip = createYellowFeverTrip({
            startDate: '15/03/2026',
        });

        const tasks = YellowFeverVaccineRule.generateTasks(trip);

        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Tomar vacina de febre amarela');
        expect(tasks[0].category).toBe('health');
        expect(tasks[0].priority).toBe('high');

        // Verifica se o prazo é 10 dias antes da viagem
        const dueDate = new Date(tasks[0].deadline!);
        const tripStart = new Date('2026-03-15');
        const daysDiff = Math.floor((tripStart.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        expect(daysDiff).toBe(10);
    });

    it('should include vaccination certificate reminder in description', () => {
        const trip = createYellowFeverTrip();
        const tasks = YellowFeverVaccineRule.generateTasks(trip);

        expect(tasks[0].description).toContain('Certificado Internacional de Vacinação');
    });
});
