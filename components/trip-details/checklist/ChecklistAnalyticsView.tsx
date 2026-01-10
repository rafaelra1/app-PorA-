import React, { useEffect, useState } from 'react';
import { checklistAnalytics, ChecklistAnalyticsSummary } from '../../../services/checklistAnalytics';

interface ChecklistAnalyticsViewProps {
    tripId?: string;
}

export const ChecklistAnalyticsView: React.FC<ChecklistAnalyticsViewProps> = ({ tripId }) => {
    const [analytics, setAnalytics] = useState<ChecklistAnalyticsSummary | null>(null);
    const [insights, setInsights] = useState<string[]>([]);

    useEffect(() => {
        const data = tripId
            ? checklistAnalytics.getAnalyticsForTrip(tripId)
            : checklistAnalytics.getGlobalAnalytics();

        setAnalytics(data);
        setInsights(checklistAnalytics.getInsights(tripId));
    }, [tripId]);

    if (!analytics) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-text-muted text-center">Carregando analytics...</p>
            </div>
        );
    }

    if (analytics.totalTasks === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">
                        analytics
                    </span>
                    <h3 className="font-bold text-text-main mb-2">Nenhum dado ainda</h3>
                    <p className="text-sm text-text-muted">
                        Complete algumas tarefas para ver suas estatísticas
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Insights */}
            {insights.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">lightbulb</span>
                        </div>
                        <h3 className="font-bold text-text-main">Insights</h3>
                    </div>
                    <ul className="space-y-2">
                        {insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-blue-900">
                                <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">
                                    arrow_right
                                </span>
                                <span>{insight}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Tarefas Mais Completadas */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">trending_up</span>
                    Tarefas Mais Completadas
                </h3>
                <div className="space-y-3">
                    {analytics.mostCompletedTasks.slice(0, 5).map((task, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-amber-600">#{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-text-main truncate">{task.taskTitle}</p>
                                <p className="text-xs text-text-muted">
                                    {task.completionCount} conclusões •
                                    Média: {task.averageDaysBeforeTrip} dias antes
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                    {task.completionCount}x
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Breakdown por Categoria */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-500">category</span>
                    Por Categoria
                </h3>
                <div className="space-y-4">
                    {analytics.categoryBreakdown.map((cat, index) => {
                        const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
                        const color = colors[index % colors.length];

                        return (
                            <div key={cat.category}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-${color}-500 text-lg`}>
                                            {getCategoryIcon(cat.category)}
                                        </span>
                                        <span className="text-sm font-semibold text-text-main">
                                            {getCategoryName(cat.category)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-text-main">{cat.totalTasks}</p>
                                        <p className="text-xs text-text-muted">
                                            ~{cat.averageCompletionTime}d antes
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-${color}-500 transition-all duration-500 rounded-full`}
                                        style={{ width: `${(cat.totalTasks / analytics.totalTasks) * 100}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Timeline de Conclusões */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500">show_chart</span>
                    Atividade Recente (30 dias)
                </h3>
                <div className="flex items-end gap-1 h-32">
                    {analytics.completionTimeline.slice(-30).map((day, index) => {
                        const maxCount = Math.max(...analytics.completionTimeline.map(d => d.completedCount), 1);
                        const height = (day.completedCount / maxCount) * 100;

                        return (
                            <div
                                key={index}
                                className="flex-1 bg-green-100 hover:bg-green-200 rounded-t transition-all cursor-pointer group relative"
                                style={{ height: `${height}%`, minHeight: day.completedCount > 0 ? '4px' : '0' }}
                                title={`${new Date(day.date).toLocaleDateString('pt-BR')}: ${day.completedCount} tarefas`}
                            >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    <br />
                                    {day.completedCount} tarefa{day.completedCount !== 1 ? 's' : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-text-muted">
                    <span>Há 30 dias</span>
                    <span>Hoje</span>
                </div>
            </div>
        </div>
    );
};

function getCategoryName(category: string): string {
    const names: Record<string, string> = {
        documentation: 'Documentação',
        health: 'Saúde',
        financial: 'Financeiro',
        packing: 'Bagagem',
        other: 'Outros',
    };
    return names[category] || category;
}

function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        documentation: 'description',
        health: 'medical_services',
        financial: 'payments',
        packing: 'luggage',
        other: 'checklist',
    };
    return icons[category] || 'checklist';
}
