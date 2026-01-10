import React, { useMemo } from 'react';
import { PreparationTask } from '../../../types';
import { useTaskPriority } from '../../../hooks/useTaskPriority';
import { EmptyState } from '../../../components/ui/EmptyState';

interface ChecklistTimelineProps {
    tasks: PreparationTask[];
    onToggle: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
}

export const ChecklistTimeline: React.FC<ChecklistTimelineProps> = ({ tasks, onToggle, onDelete }) => {
    const { getDaysRemaining, calculatePriorityScore } = useTaskPriority();

    const groupedTasks = useMemo(() => {
        const groups = {
            overdue: [] as PreparationTask[],
            today: [] as PreparationTask[],
            thisWeek: [] as PreparationTask[],
            upcoming: [] as PreparationTask[],
            completed: [] as PreparationTask[],
            noDate: [] as PreparationTask[]
        };

        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            return calculatePriorityScore(b) - calculatePriorityScore(a);
        });

        sortedTasks.forEach(task => {
            if (task.status === 'done') {
                groups.completed.push(task);
                return;
            }

            if (!task.deadline) {
                groups.noDate.push(task);
                return;
            }

            const days = getDaysRemaining(task.deadline);
            if (days === null) {
                groups.noDate.push(task);
            } else if (days < 0) {
                groups.overdue.push(task);
            } else if (days === 0) {
                groups.today.push(task);
            } else if (days <= 7) {
                groups.thisWeek.push(task);
            } else {
                groups.upcoming.push(task);
            }
        });

        return groups;
    }, [tasks, getDaysRemaining, calculatePriorityScore]);

    const renderTaskRow = (task: PreparationTask, isOverdue = false) => {
        const days = getDaysRemaining(task.deadline);
        let dateLabel = task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : 'Sem data';

        if (days !== null) {
            if (days < 0) dateLabel = `Atrasado há ${Math.abs(days)} dias`;
            else if (days === 0) dateLabel = 'Hoje';
            else if (days === 1) dateLabel = 'Amanhã';
            else if (days <= 7) dateLabel = `${new Date(task.deadline!).toLocaleDateString('pt-BR', { weekday: 'short' })}, ${new Date(task.deadline!).getDate()}`;
        }

        return (
            <div
                key={task.id}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all border
                    ${task.status === 'done'
                        ? 'bg-gray-50 border-transparent opacity-60'
                        : isOverdue
                            ? 'bg-white border-red-100 hover:border-red-200 hover:shadow-sm'
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
            >
                {/* Checkbox */}
                <button
                    onClick={() => onToggle(task.id)}
                    className={`size-5 rounded-md border flex items-center justify-center transition-colors shrink-0
                        ${task.status === 'done'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isOverdue
                                ? 'border-red-300 hover:border-red-400 bg-red-50'
                                : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                >
                    {task.status === 'done' && <span className="material-symbols-outlined text-sm">check</span>}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {task.priority === 'high' && !task.status && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                ALTA
                            </span>
                        )}
                        <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {dateLabel}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {onDelete && (
                        <button
                            onClick={() => onDelete(task.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (tasks.length === 0) {
        return (
            <div className="py-12">
                <EmptyState
                    icon="checklist"
                    title="Nenhuma tarefa"
                    description="Adicione tarefas para começar a planejar."
                    variant="minimal"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {groupedTasks.overdue.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-red-500 animate-pulse"></span>
                        Atrasadas ({groupedTasks.overdue.length})
                    </h4>
                    <div className="space-y-2">
                        {groupedTasks.overdue.map(t => renderTaskRow(t, true))}
                    </div>
                </section>
            )}

            {groupedTasks.today.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">
                        Para Hoje ({groupedTasks.today.length})
                    </h4>
                    <div className="space-y-2">
                        {groupedTasks.today.map(t => renderTaskRow(t))}
                    </div>
                </section>
            )}

            {groupedTasks.thisWeek.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
                        Esta Semana ({groupedTasks.thisWeek.length})
                    </h4>
                    <div className="space-y-2">
                        {groupedTasks.thisWeek.map(t => renderTaskRow(t))}
                    </div>
                </section>
            )}

            {groupedTasks.upcoming.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Em Breve ({groupedTasks.upcoming.length})
                    </h4>
                    <div className="space-y-2">
                        {groupedTasks.upcoming.map(t => renderTaskRow(t))}
                    </div>
                </section>
            )}

            {groupedTasks.noDate.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Sem Data
                    </h4>
                    <div className="space-y-2">
                        {groupedTasks.noDate.map(t => renderTaskRow(t))}
                    </div>
                </section>
            )}

            {groupedTasks.completed.length > 0 && (
                <section className="pt-4 border-t border-gray-100">
                    <details className="group">
                        <summary className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                            <span className="material-symbols-outlined text-lg transition-transform group-open:rotate-90">chevron_right</span>
                            Concluídas ({groupedTasks.completed.length})
                        </summary>
                        <div className="space-y-2 mt-3 pl-2 border-l-2 border-gray-100 ml-2">
                            {groupedTasks.completed.map(t => renderTaskRow(t))}
                        </div>
                    </details>
                </section>
            )}
        </div>
    );
};
