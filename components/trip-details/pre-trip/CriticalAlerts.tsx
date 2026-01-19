import React from 'react';
import { EnrichedTask } from '../../../utils/smartTaskEnricher';
import { useChecklist } from '../../../contexts/ChecklistContext';

interface CriticalAlertsProps {
    tasks: EnrichedTask[];
    tripId: string;
}

export const CriticalAlerts: React.FC<CriticalAlertsProps> = ({ tasks, tripId }) => {
    const { toggleTask } = useChecklist();

    const criticalTasks = tasks.filter(t =>
        !t.is_completed &&
        (t.priority === 'blocking' || (t.context?.timeWindow === 'overdue'))
    );

    if (criticalTasks.length === 0) return null;

    return (
        <div className="mb-6 animate-fadeIn">
            <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                <div className="bg-red-100/50 px-4 py-2 border-b border-red-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600 text-lg">notification_important</span>
                    <span className="text-xs font-bold text-red-800 uppercase tracking-wide">Atenção Imediata</span>
                </div>

                <div className="divide-y divide-red-100">
                    {criticalTasks.map(task => (
                        <div key={task.id} className="p-4 flex gap-4">
                            <div className="flex-1">
                                <h4 className="font-bold text-red-900 text-sm mb-1">{task.title}</h4>
                                <p className="text-red-700 text-xs mb-3">
                                    {task.context?.why || 'Esta tarefa é crítica para sua viagem e precisa ser resolvida logo.'}
                                </p>

                                {task.context?.links && task.context.links.length > 0 ? (
                                    <div className="flex gap-2">
                                        {task.context.links.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener"
                                                className="px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors inline-flex items-center gap-1"
                                            >
                                                {link.label}
                                                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => toggleTask(task.id, true)}
                                        className="text-xs font-bold text-red-600 underline hover:text-red-800"
                                    >
                                        Marcar como resolvido
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
