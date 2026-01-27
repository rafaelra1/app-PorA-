import React, { useMemo } from 'react';
import { useChecklist } from '../../../contexts/ChecklistContext';
import { useTrips } from '@/contexts/TripContext';
import { enrichTask } from '../../../utils/smartTaskEnricher';
import { CriticalAlerts } from '../pre-trip/CriticalAlerts';
import { EmptyState } from '../../ui/EmptyState';

export const DashboardAlertsView: React.FC = () => {
    const { tasks, isLoading } = useChecklist();
    const { selectedTrip } = useTrips();

    const enrichedTasks = useMemo(() => {
        if (!selectedTrip) return [];
        return tasks.map(t => enrichTask(t, selectedTrip));
    }, [tasks, selectedTrip]);

    const criticalTasks = enrichedTasks.filter(t =>
        !t.is_completed && (t.priority === 'blocking' || t.context?.timeWindow === 'overdue')
    );

    if (isLoading) return <div className="p-4 text-center text-gray-400">Carregando alertas...</div>;

    if (!selectedTrip) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#FF9F43]">notification_important</span>
                <h3 className="font-bold text-gray-800 text-lg">Alertas e Pendências Críticas</h3>
            </div>

            {criticalTasks.length > 0 ? (
                <CriticalAlerts tasks={enrichedTasks} tripId={selectedTrip.id} />
            ) : (
                <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="size-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <p className="font-bold text-green-800">Tudo certo!</p>
                    <p className="text-green-600 text-sm">Você não tem alertas críticos pendentes no momento.</p>
                </div>
            )}
        </div>
    );
};
