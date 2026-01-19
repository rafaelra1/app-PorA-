import React, { useState } from 'react';
import { EnrichedTask } from '../../../utils/smartTaskEnricher';
import { useChecklist } from '../../../contexts/ChecklistContext';

interface TaskItemProps {
    task: EnrichedTask;
    tripId: string;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, tripId }) => {
    const { toggleTask } = useChecklist();
    const [isExpanded, setIsExpanded] = useState(false);

    const context = task.context || {};
    const hasSmartContext = context.why || context.when || context.how || (context.links && context.links.length > 0);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleTask(task.id, !task.is_completed);
    };

    return (
        <div className={`border-b border-gray-100 last:border-0 transition-all duration-300 ${isExpanded ? 'bg-gray-50/50' : 'bg-white'}`}>

            {/* Main Row */}
            <div
                className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => hasSmartContext && setIsExpanded(!isExpanded)}
            >
                {/* Checkbox */}
                <button
                    onClick={handleToggle}
                    className={`mt-0.5 size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${task.is_completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    {task.is_completed && <span className="material-symbols-outlined text-sm">check</span>}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-base font-medium ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.title}
                        </h4>
                        {task.priority === 'blocking' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-100 text-red-700">
                                Crítico
                            </span>
                        )}
                        {task.priority === 'important' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-100 text-amber-700">
                                Importante
                            </span>
                        )}

                    </div>

                    {/* Subtitle / Preview */}
                    <p className="text-xs text-gray-500 truncate">
                        {task.description || (context.why ? `Por que: ${context.why}` : 'Toque para ver detalhes')}
                    </p>
                </div>

                {/* Chevron */}
                {hasSmartContext && (
                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                )}
            </div>

            {/* Expanded Smart Details */}
            {isExpanded && hasSmartContext && (
                <div className="px-4 pb-4 pl-14 animate-fadeIn">
                    <div className="bg-white border boundary-gray-100 rounded-xl p-4 shadow-sm space-y-4">

                        {context.why && (
                            <div className="flex gap-3">
                                <div className="size-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-sm">help</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Por que é importante?</span>
                                    <p className="text-sm text-gray-700">{context.why}</p>
                                </div>
                            </div>
                        )}

                        {context.when && (
                            <div className="flex gap-3">
                                <div className="size-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Quando fazer?</span>
                                    <p className="text-sm text-gray-700">{context.when}</p>
                                </div>
                            </div>
                        )}

                        {context.how && (
                            <div className="flex gap-3">
                                <div className="size-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Como fazer?</span>
                                    <p className="text-sm text-gray-700">{context.how}</p>
                                </div>
                            </div>
                        )}

                        {context.links && context.links.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-2">
                                {context.links.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-2">
                        <button
                            onClick={handleToggle}
                            className={`text-xs font-bold px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors ${task.is_completed ? 'hidden' : ''}`}
                        >
                            Marcar como feito
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
