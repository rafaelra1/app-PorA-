import React from 'react';

interface ChecklistSummaryProps {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    upcomingTasks: number; // Due in next 3 days maybe
}

export const ChecklistSummary: React.FC<ChecklistSummaryProps> = ({
    totalTasks,
    completedTasks,
    overdueTasks,
    upcomingTasks
}) => {
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Circle config
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Progress Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 col-span-1 md:col-span-2">
                <div className="relative size-20 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="8"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={progress === 100 ? "#10b981" : "#0ea5e9"}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={`text-xl font-bold ${progress === 100 ? 'text-emerald-600' : 'text-sky-600'}`}>
                            {progress}%
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-gray-800">Progresso Geral</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {completedTasks} de {totalTasks} tarefas concluídas
                    </p>
                    {progress === 100 && (
                        <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Tudo pronto!
                        </p>
                    )}
                </div>
            </div>

            {/* Overdue Card */}
            <div className={`p-4 rounded-xl border flex flex-col justify-center ${overdueTasks > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className={`material-symbols-outlined ${overdueTasks > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        warning
                    </span>
                    <span className={`text-sm font-semibold ${overdueTasks > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                        Em Atraso
                    </span>
                </div>
                <span className={`text-2xl font-bold ${overdueTasks > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {overdueTasks}
                </span>
            </div>

            {/* Upcoming Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-amber-500">
                        upcoming
                    </span>
                    <span className="text-sm font-semibold text-gray-500">
                        Próximos dias
                    </span>
                </div>
                <span className="text-2xl font-bold text-gray-800">
                    {upcomingTasks}
                </span>
            </div>
        </div>
    );
};
