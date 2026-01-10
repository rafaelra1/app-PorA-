/**
 * Serviço de Analytics para Checklist - Fase 5
 * 
 * Rastreia métricas de uso do checklist:
 * - Tarefas mais completadas
 * - Tempo médio para conclusão
 * - Categorias mais populares
 * - Padrões de uso
 */

import { Task } from '../types';

export interface TaskCompletionEvent {
    taskId: string;
    taskTitle: string;
    category: string;
    completedAt: string;
    tripId: string;
    daysBeforeTrip: number;
}

export interface TaskAnalytics {
    taskTitle: string;
    category: string;
    completionCount: number;
    averageDaysBeforeTrip: number;
    completionRate: number; // Percentage
}

export interface CategoryAnalytics {
    category: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageCompletionTime: number; // days
}

export interface ChecklistAnalyticsSummary {
    totalTasks: number;
    completedTasks: number;
    overallCompletionRate: number;
    mostCompletedTasks: TaskAnalytics[];
    categoryBreakdown: CategoryAnalytics[];
    completionTimeline: {
        date: string;
        completedCount: number;
    }[];
}

/**
 * Classe para gerenciar analytics do checklist
 */
class ChecklistAnalyticsService {
    private readonly STORAGE_KEY = 'checklist_analytics';

    /**
     * Registra evento de conclusão de tarefa
     */
    trackTaskCompletion(
        task: Task,
        tripId: string,
        tripStartDate: string
    ): void {
        const event: TaskCompletionEvent = {
            taskId: task.id,
            taskTitle: task.title,
            category: task.category || 'other',
            completedAt: new Date().toISOString(),
            tripId,
            daysBeforeTrip: this.calculateDaysBeforeTrip(tripStartDate),
        };

        this.saveEvent(event);
    }

    /**
     * Calcula quantos dias faltam para a viagem
     */
    private calculateDaysBeforeTrip(tripStartDate: string): number {
        const start = new Date(tripStartDate.split('/').reverse().join('-'));
        const today = new Date();
        const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    }

    /**
     * Salva evento no localStorage
     */
    private saveEvent(event: TaskCompletionEvent): void {
        const events = this.getAllEvents();
        events.push(event);

        // Mantém apenas os últimos 1000 eventos
        const recentEvents = events.slice(-1000);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentEvents));
    }

    /**
     * Recupera todos os eventos salvos
     */
    private getAllEvents(): TaskCompletionEvent[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Gera relatório de analytics para uma viagem específica
     */
    getAnalyticsForTrip(tripId: string): ChecklistAnalyticsSummary {
        const allEvents = this.getAllEvents();
        const tripEvents = allEvents.filter(e => e.tripId === tripId);

        return this.generateSummary(tripEvents);
    }

    /**
     * Gera relatório de analytics global (todas as viagens)
     */
    getGlobalAnalytics(): ChecklistAnalyticsSummary {
        const allEvents = this.getAllEvents();
        return this.generateSummary(allEvents);
    }

    /**
     * Gera sumário de analytics
     */
    private generateSummary(events: TaskCompletionEvent[]): ChecklistAnalyticsSummary {
        const taskMap = new Map<string, TaskCompletionEvent[]>();
        const categoryMap = new Map<string, TaskCompletionEvent[]>();

        // Agrupa eventos por tarefa e categoria
        events.forEach(event => {
            // Por tarefa
            const taskKey = event.taskTitle;
            if (!taskMap.has(taskKey)) {
                taskMap.set(taskKey, []);
            }
            taskMap.get(taskKey)!.push(event);

            // Por categoria
            if (!categoryMap.has(event.category)) {
                categoryMap.set(event.category, []);
            }
            categoryMap.get(event.category)!.push(event);
        });

        // Calcula tarefas mais completadas
        const mostCompletedTasks: TaskAnalytics[] = Array.from(taskMap.entries())
            .map(([taskTitle, taskEvents]) => {
                const avgDays = taskEvents.reduce((sum, e) => sum + e.daysBeforeTrip, 0) / taskEvents.length;

                return {
                    taskTitle,
                    category: taskEvents[0].category,
                    completionCount: taskEvents.length,
                    averageDaysBeforeTrip: Math.round(avgDays),
                    completionRate: 100, // Simplified - would need total task count
                };
            })
            .sort((a, b) => b.completionCount - a.completionCount)
            .slice(0, 10);

        // Calcula breakdown por categoria
        const categoryBreakdown: CategoryAnalytics[] = Array.from(categoryMap.entries())
            .map(([category, catEvents]) => {
                const avgTime = catEvents.reduce((sum, e) => sum + e.daysBeforeTrip, 0) / catEvents.length;

                return {
                    category,
                    totalTasks: catEvents.length,
                    completedTasks: catEvents.length,
                    completionRate: 100,
                    averageCompletionTime: Math.round(avgTime),
                };
            })
            .sort((a, b) => b.totalTasks - a.totalTasks);

        // Timeline de conclusões (últimos 30 dias)
        const completionTimeline = this.generateTimeline(events, 30);

        return {
            totalTasks: events.length,
            completedTasks: events.length,
            overallCompletionRate: 100,
            mostCompletedTasks,
            categoryBreakdown,
            completionTimeline,
        };
    }

    /**
     * Gera timeline de conclusões
     */
    private generateTimeline(
        events: TaskCompletionEvent[],
        days: number
    ): { date: string; completedCount: number }[] {
        const timeline: Map<string, number> = new Map();
        const today = new Date();

        // Inicializa os últimos N dias
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            timeline.set(dateKey, 0);
        }

        // Conta eventos por dia
        events.forEach(event => {
            const dateKey = event.completedAt.split('T')[0];
            if (timeline.has(dateKey)) {
                timeline.set(dateKey, timeline.get(dateKey)! + 1);
            }
        });

        return Array.from(timeline.entries()).map(([date, completedCount]) => ({
            date,
            completedCount,
        }));
    }

    /**
     * Obtém insights baseados nos dados
     */
    getInsights(tripId?: string): string[] {
        const analytics = tripId
            ? this.getAnalyticsForTrip(tripId)
            : this.getGlobalAnalytics();

        const insights: string[] = [];

        // Insight 1: Categoria mais popular
        if (analytics.categoryBreakdown.length > 0) {
            const topCategory = analytics.categoryBreakdown[0];
            insights.push(
                `A categoria "${this.getCategoryName(topCategory.category)}" é a mais completada, ` +
                `com ${topCategory.totalTasks} tarefas concluídas.`
            );
        }

        // Insight 2: Tempo médio de antecedência
        const avgDays = analytics.mostCompletedTasks.reduce(
            (sum, t) => sum + t.averageDaysBeforeTrip,
            0
        ) / Math.max(analytics.mostCompletedTasks.length, 1);

        if (avgDays > 0) {
            insights.push(
                `Em média, as tarefas são concluídas ${Math.round(avgDays)} dias antes da viagem.`
            );
        }

        // Insight 3: Tarefa mais popular
        if (analytics.mostCompletedTasks.length > 0) {
            const topTask = analytics.mostCompletedTasks[0];
            insights.push(
                `"${topTask.taskTitle}" é a tarefa mais completada, ` +
                `com ${topTask.completionCount} conclusões.`
            );
        }

        return insights;
    }

    /**
     * Retorna nome amigável da categoria
     */
    private getCategoryName(category: string): string {
        const names: Record<string, string> = {
            documentation: 'Documentação',
            health: 'Saúde',
            financial: 'Financeiro',
            packing: 'Bagagem',
            other: 'Outros',
        };

        return names[category] || category;
    }

    /**
     * Limpa todos os dados de analytics
     */
    clearAnalytics(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

// Exporta instância singleton
export const checklistAnalytics = new ChecklistAnalyticsService();
