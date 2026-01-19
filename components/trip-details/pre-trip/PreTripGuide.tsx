import React, { useMemo, useState } from 'react';
import { useChecklist } from '../../../contexts/ChecklistContext';
import { useTrips } from '@/contexts/TripContext';
import { enrichTask, groupTasksByWindow, EnrichedTask } from '../../../utils/smartTaskEnricher';

import { TimelineHeader } from './TimelineHeader';
import { CriticalAlerts } from './CriticalAlerts';
import { TimelineSection } from './TimelineSection';
import { CategorySection } from './CategorySection';
import { EmptyState } from '../../ui/EmptyState';
import { SmartBaggage } from './SmartBaggage';
import { DocumentChecklist } from './DocumentChecklist';
import { SmartSuggestions } from './SmartSuggestions';

// Define the order of timeline sections logic
// This matches the smartTaskEnricher logic order
const TIMELINE_ORDER = [
    'Atrasado',
    'Mais de 30 dias antes',
    '2 Semanas Antes',
    '1 Semana Antes',
    'Essa Semana',
    'Véspera / 3 Dias Antes',
    'Dia do Embarque / Durante',
    'Geral'
];

// Descriptions for sections
const TIMELINE_DESCRIPTIONS: Record<string, string> = {
    'Mais de 30 dias antes': 'Decisões importantes e reservas',
    '2 Semanas Antes': 'Detalhes práticos e pagamentos',
    '1 Semana Antes': 'Organização de documentos e roteiros',
    'Essa Semana': 'Preparativos finais',
    'Véspera / 3 Dias Antes': 'Malas e check-in',
    'Dia do Embarque / Durante': 'Tenha tudo à mão'
};

const SmartPreTripGuide: React.FC = () => {
    const { tasks, isLoading } = useChecklist();
    const { selectedTrip } = useTrips();


    // Memos
    const enrichedTasks = useMemo(() => {
        if (!selectedTrip) return [];
        return tasks.map(t => enrichTask(t, selectedTrip));
    }, [tasks, selectedTrip]);

    const tasksByWindow = useMemo(() => {
        return groupTasksByWindow(enrichedTasks);
    }, [enrichedTasks]);

    const tasksByCategory = useMemo(() => {
        const grouped: Record<string, EnrichedTask[]> = {};
        enrichedTasks.forEach(t => {
            const cat = t.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t);
        });
        return grouped;
    }, [enrichedTasks]);

    const daysLeft = useMemo(() => {
        if (!selectedTrip?.startDate) return 0;
        const start = new Date(selectedTrip.startDate);
        const now = new Date();
        const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diff;
    }, [selectedTrip]);

    const completedCount = enrichedTasks.filter(t => t.is_completed).length;


    if (isLoading && enrichedTasks.length === 0) {
        return <div className="p-8 text-center text-gray-400">Carregando preparativos...</div>;
    }

    if (!selectedTrip) return null;

    return (
        <div className="max-w-7xl mx-auto pb-20 animate-fadeIn space-y-8">

            {/* Header - Full Width */}
            <TimelineHeader
                daysLeft={daysLeft}
                totalTasks={enrichedTasks.length}
                completedTasks={completedCount}
                destinationName={selectedTrip.destination}
                action={<SmartSuggestions />}
            />

            {/* Critical Alerts & Cronograma - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Atenção Imediata (Critical Alerts) - Left */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <CriticalAlerts tasks={enrichedTasks} tripId={selectedTrip.id} />
                </div>

                {/* Cronograma (Timeline) - Right, larger */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl">calendar_month</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Cronograma</h3>
                                <p className="text-xs text-gray-500">Organize suas tarefas por período</p>
                            </div>
                        </div>

                        <div className="max-w-full">
                            {TIMELINE_ORDER.map(window => {
                                const windowTasks = tasksByWindow[window];
                                if (!windowTasks || windowTasks.length === 0) return null;

                                const isCurrent = windowTasks.some(t => !t.is_completed);

                                return (
                                    <TimelineSection
                                        key={window}
                                        title={window}
                                        description={TIMELINE_DESCRIPTIONS[window]}
                                        tasks={windowTasks}
                                        tripId={selectedTrip.id}
                                        isCurrent={isCurrent}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Side-by-Side Blocks (Baggage & Docs) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Baggage */}
                <div className="h-full">
                    <SmartBaggage trip={selectedTrip} />
                </div>

                {/* Documents */}
                <div className="h-full">
                    <DocumentChecklist trip={selectedTrip} />
                </div>
            </div>

        </div>
    );
};

export default SmartPreTripGuide;
