import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChecklistInsight, ChecklistTask } from '../../../types';
import { TaskCategory } from '../../../types/checklist';

// Map categories to icons/colors (reusing consistency from SmartChecklist)
const CATEGORY_ICONS: Record<string, string> = {
    documentation: 'description',
    health: 'medical_services',
    reservations: 'book_online',
    packing: 'luggage',
    financial: 'payments',
    tech: 'devices',
    other: 'lightbulb'
};

const CONFIDENCE_COLORS = {
    high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-gray-100 text-gray-700 border-gray-200'
};

const CONFIDENCE_LABEL = {
    high: 'Alta Confiança',
    medium: 'Média Confiança',
    low: 'Baixa Confiança'
};

interface AISuggestionsProps {
    insights: ChecklistInsight[];
    suggestions: ChecklistTask[];
    onAccept: (suggestion: ChecklistTask) => void;
    onReject: (id: string) => void;
    onDismissInsight: (id: string) => void;
    onAcceptAll: () => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
    insights,
    suggestions,
    onAccept,
    onReject,
    onDismissInsight,
    onAcceptAll
}) => {
    const [expandedTask, setExpandedTask] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedTask(expandedTask === id ? null : id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">auto_awesome</span>
                        Análise Inteligente
                    </h4>
                    <p className="text-xs text-indigo-600/80 mt-0.5">
                        {suggestions.length} sugestões encontradas para sua viagem
                    </p>
                </div>
                {suggestions.length > 0 && (
                    <button
                        onClick={onAcceptAll}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        Aceitar Todas
                    </button>
                )}
            </div>

            {/* Insights Section - Horizontal Scroll or Grid */}
            {insights.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    {insights.map((insight) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-xl p-3 relative shadow-sm"
                        >
                            <button
                                onClick={() => onDismissInsight(insight.id)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg shrink-0 ${insight.type === 'weather' ? 'bg-blue-50 text-blue-500' :
                                    insight.type === 'event' ? 'bg-purple-50 text-purple-500' :
                                        insight.type === 'logistics' ? 'bg-orange-50 text-orange-500' :
                                            'bg-emerald-50 text-emerald-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-lg">
                                        {insight.type === 'weather' ? 'partly_cloudy_day' :
                                            insight.type === 'event' ? 'event' :
                                                insight.type === 'logistics' ? 'commute' :
                                                    'lightbulb'}
                                    </span>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-gray-800 mb-1">{insight.title}</h5>
                                    <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Suggestions Accordion List */}
            <div className="space-y-2">
                <AnimatePresence>
                    {suggestions.map((task) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white border border-indigo-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Card Header */}
                            <div
                                onClick={() => toggleExpand(task.id)}
                                className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${task.isUrgent ? 'bg-red-100 text-red-500' : 'bg-indigo-50 text-indigo-500'
                                        }`}>
                                        <span className="material-symbols-outlined text-lg">
                                            {CATEGORY_ICONS[task.category] || 'task_alt'}
                                        </span>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                            {task.title}
                                            {task.isUrgent && (
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-wide">
                                                    Urgente
                                                </span>
                                            )}
                                        </h5>
                                        <p className="text-xs text-gray-500 line-clamp-1">{task.reason}</p>
                                    </div>
                                </div>
                                <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedTask === task.id ? 'rotate-180' : ''
                                    }`}>
                                    expand_more
                                </span>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedTask === task.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-100 bg-gray-50/50"
                                    >
                                        <div className="p-4">
                                            <p className="text-sm text-gray-600 mb-4 bg-white p-3 rounded-lg border border-gray-100">
                                                <span className="font-semibold text-gray-800 block mb-1 text-xs uppercase tracking-wide">Por que sugerimos isso?</span>
                                                {task.reason}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                {/* Confidence Badge (Optional, assuming high for now or randomly assigned if missing) */}
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${CONFIDENCE_COLORS['high']}`}>
                                                    <span className="material-symbols-outlined text-xs">verified</span>
                                                    IA Confidence: Alta
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onReject(task.id); }}
                                                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        Dispensar
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onAccept(task); }}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
