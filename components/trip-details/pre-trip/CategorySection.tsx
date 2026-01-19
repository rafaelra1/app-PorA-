import React, { useState } from 'react';
import { EnrichedTask } from '../../../utils/smartTaskEnricher';
import { TaskCategory } from '../../../types/checklist'; // Fix path if needed
import { TaskItem } from './TaskItem';

// Map icons/colors same as SmartChecklist
const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    documentation: { icon: 'description', label: 'Documentação', color: 'blue' },
    health: { icon: 'health_and_safety', label: 'Saúde', color: 'green' },
    reservations: { icon: 'book_online', label: 'Reservas', color: 'purple' },
    packing: { icon: 'luggage', label: 'Bagagem', color: 'orange' },
    financial: { icon: 'payments', label: 'Financeiro', color: 'emerald' },
    tech: { icon: 'devices', label: 'Tecnologia', color: 'cyan' },
    other: { icon: 'task_alt', label: 'Outros', color: 'gray' }
};

interface CategorySectionProps {
    category: string;
    tasks: EnrichedTask[];
    tripId: string;
    defaultExpanded?: boolean;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
    category,
    tasks,
    tripId,
    defaultExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // Fallback config
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;

    const completedCount = tasks.filter(t => t.is_completed).length;
    const progress = (completedCount / tasks.length) * 100;
    const isAllDone = completedCount === tasks.length && tasks.length > 0;

    if (tasks.length === 0) return null;

    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm mb-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-xl bg-${config.color}-50 text-${config.color}-600 flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-xl">{config.icon}</span>
                    </div>

                    <div className="text-left">
                        <h3 className="font-bold text-gray-900">{config.label}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${isAllDone ? 'bg-green-500' : `bg-${config.color}-500`}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{completedCount}/{tasks.length}</span>
                        </div>
                    </div>
                </div>

                <span className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {tasks.map(task => (
                        <TaskItem key={task.id} task={task} tripId={tripId} />
                    ))}
                </div>
            )}
        </div>
    );
};
