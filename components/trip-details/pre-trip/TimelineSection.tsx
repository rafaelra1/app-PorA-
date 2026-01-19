import React from 'react';
import { EnrichedTask } from '../../../utils/smartTaskEnricher';
import { TaskItem } from './TaskItem';

interface TimelineSectionProps {
    title: string;
    description?: string;
    tasks: EnrichedTask[];
    isCurrent?: boolean;
    tripId: string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
    title,
    description,
    tasks,
    isCurrent = false,
    tripId
}) => {
    if (tasks.length === 0) return null;

    return (
        <div className="relative pl-8 pb-10 last:pb-0">
            {/* Timeline Line */}
            <div className={`absolute left-3 top-8 bottom-0 w-0.5 ${isCurrent ? 'bg-indigo-500' : 'bg-gray-200'}`} />

            {/* Bullet Point */}
            <div className={`absolute left-0 top-0 size-6 rounded-full border-4 flex items-center justify-center bg-white z-10 ${isCurrent
                    ? 'border-indigo-500 text-indigo-500 shadow-lg shadow-indigo-200'
                    : 'border-gray-200 text-gray-400'
                }`}>
                {isCurrent && <div className="size-2 bg-indigo-500 rounded-full" />}
            </div>

            {/* Header */}
            <div className="mb-4">
                <h3 className={`text-lg font-bold ${isCurrent ? 'text-indigo-900' : 'text-gray-500'}`}>
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-gray-400 font-medium">{description}</p>
                )}
            </div>

            {/* Tasks */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                {tasks.map(task => (
                    <TaskItem key={task.id} task={task} tripId={tripId} />
                ))}
            </div>
        </div>
    );
};
