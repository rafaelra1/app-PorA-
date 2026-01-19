import React from 'react';

interface TimelineHeaderProps {
    daysLeft: number;
    totalTasks: number;
    completedTasks: number;
    destinationName: string;
    action?: React.ReactNode;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
    daysLeft,
    totalTasks,
    completedTasks,
    destinationName,
    action
}) => {
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase block mt-1">
                        Checklist Pré-Viagem
                    </span>
                    {action && <div className="ml-4">{action}</div>}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {daysLeft > 0 ? `Faltam ${daysLeft} dias` : daysLeft === 0 ? 'É hoje!' : 'Viagem iniciada'}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                    Preparativos para {destinationName}
                </p>

                {/* Progress Bar & Stats */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-600">
                        <span>{completedTasks} de {totalTasks} tarefas concluídas</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
