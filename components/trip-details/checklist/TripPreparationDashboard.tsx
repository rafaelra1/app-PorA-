import React, { useMemo } from 'react';
import { Task } from '../../../types';

interface TripPreparationDashboardProps {
    tasks: Task[];
    tripStartDate: string;
}

interface CategoryProgress {
    category: string;
    icon: string;
    color: string;
    total: number;
    completed: number;
    urgent: number;
}

export const TripPreparationDashboard: React.FC<TripPreparationDashboardProps> = ({
    tasks,
    tripStartDate
}) => {
    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.is_completed).length;
        const urgent = tasks.filter(t => t.is_urgent && !t.is_completed).length;
        const overdue = tasks.filter(t => {
            if (t.is_completed || !t.due_date) return false;
            return new Date(t.due_date) < new Date();
        }).length;

        return { total, completed, urgent, overdue };
    }, [tasks]);

    const categoryProgress = useMemo((): CategoryProgress[] => {
        const categories: Record<string, CategoryProgress> = {
            documentation: {
                category: 'Documentação',
                icon: 'description',
                color: 'blue',
                total: 0,
                completed: 0,
                urgent: 0,
            },
            health: {
                category: 'Saúde',
                icon: 'medical_services',
                color: 'red',
                total: 0,
                completed: 0,
                urgent: 0,
            },
            financial: {
                category: 'Financeiro',
                icon: 'payments',
                color: 'green',
                total: 0,
                completed: 0,
                urgent: 0,
            },
            packing: {
                category: 'Bagagem',
                icon: 'luggage',
                color: 'purple',
                total: 0,
                completed: 0,
                urgent: 0,
            },
            other: {
                category: 'Outros',
                icon: 'checklist',
                color: 'gray',
                total: 0,
                completed: 0,
                urgent: 0,
            },
        };

        tasks.forEach(task => {
            const cat = task.category || 'other';
            const category = categories[cat] || categories.other;

            category.total++;
            if (task.is_completed) category.completed++;
            if (task.is_urgent && !task.is_completed) category.urgent++;
        });

        return Object.values(categories).filter(c => c.total > 0);
    }, [tasks]);

    const daysUntilTrip = useMemo(() => {
        const start = new Date(tripStartDate.split('/').reverse().join('-'));
        const today = new Date();
        const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    }, [tripStartDate]);

    const completionPercentage = stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;

    const getUrgencyColor = () => {
        if (daysUntilTrip <= 7) return 'text-red-600';
        if (daysUntilTrip <= 30) return 'text-orange-600';
        return 'text-green-600';
    };

    const getProgressColor = () => {
        if (completionPercentage >= 80) return 'bg-green-500';
        if (completionPercentage >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Header com countdown */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Preparação da Viagem</h2>
                        <p className="text-amber-50 text-sm">Acompanhe seu progresso</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-bold ${getUrgencyColor()} bg-white rounded-xl px-4 py-2`}>
                            {daysUntilTrip > 0 ? daysUntilTrip : 0}
                        </div>
                        <p className="text-xs mt-1 text-amber-50">
                            {daysUntilTrip > 0 ? 'dias para a viagem' : 'viagem iniciada!'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500 text-xl">checklist</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-main">{stats.total}</p>
                            <p className="text-xs text-text-muted">Total de Tarefas</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-main">{stats.completed}</p>
                            <p className="text-xs text-text-muted">Concluídas</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-orange-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-orange-500 text-xl">priority_high</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-main">{stats.urgent}</p>
                            <p className="text-xs text-text-muted">Urgentes</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-red-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-500 text-xl">schedule</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-main">{stats.overdue}</p>
                            <p className="text-xs text-text-muted">Atrasadas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de progresso geral */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-text-main">Progresso Geral</h3>
                    <span className="text-2xl font-bold text-text-main">{completionPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor()} transition-all duration-500 rounded-full`}
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
                <p className="text-xs text-text-muted mt-2">
                    {stats.completed} de {stats.total} tarefas concluídas
                </p>
            </div>

            {/* Progresso por categoria */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-text-main mb-4">Progresso por Categoria</h3>
                <div className="space-y-4">
                    {categoryProgress.map(cat => {
                        const percentage = Math.round((cat.completed / cat.total) * 100);

                        return (
                            <div key={cat.category}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-${cat.color}-500 text-lg`}>
                                            {cat.icon}
                                        </span>
                                        <span className="text-sm font-semibold text-text-main">{cat.category}</span>
                                        {cat.urgent > 0 && (
                                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full">
                                                {cat.urgent} urgente{cat.urgent > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-bold text-text-muted">
                                        {cat.completed}/{cat.total}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-${cat.color}-500 transition-all duration-500 rounded-full`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Alertas */}
            {(stats.overdue > 0 || stats.urgent > 0) && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-orange-500 text-xl">warning</span>
                        <div className="flex-1">
                            <h4 className="font-bold text-orange-900 mb-1">Atenção Necessária</h4>
                            <ul className="text-sm text-orange-800 space-y-1">
                                {stats.overdue > 0 && (
                                    <li>• Você tem {stats.overdue} tarefa{stats.overdue > 1 ? 's' : ''} atrasada{stats.overdue > 1 ? 's' : ''}</li>
                                )}
                                {stats.urgent > 0 && (
                                    <li>• {stats.urgent} tarefa{stats.urgent > 1 ? 's' : ''} urgente{stats.urgent > 1 ? 's' : ''} pendente{stats.urgent > 1 ? 's' : ''}</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
