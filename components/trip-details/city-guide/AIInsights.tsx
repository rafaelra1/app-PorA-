import React from 'react';
import { ChecklistInsight, ChecklistTask } from '../../../types';

interface AIInsightsProps {
    insights: ChecklistInsight[];
    suggestions: ChecklistTask[];
    onAccept: (suggestion: ChecklistTask) => void;
    onReject: (id: string) => void;
    onDismissInsight: (id: string) => void;
    onAcceptAll?: () => void; // New: batch approval
}

export const AIInsights: React.FC<AIInsightsProps> = ({
    insights,
    suggestions,
    onAccept,
    onReject,
    onDismissInsight,
    onAcceptAll
}) => {
    if (insights.length === 0 && suggestions.length === 0) return null;

    const handleAcceptAll = () => {
        if (onAcceptAll) {
            onAcceptAll();
        } else {
            // Fallback: accept each suggestion individually
            suggestions.forEach(s => onAccept(s));
        }
    };

    return (
        <div className="space-y-6 mb-8 animate-fade-in-up">
            {/* Insights Section */}
            {insights.length > 0 && (
                <div className="grid gap-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-emerald-500 text-lg">lightbulb</span>
                        <h4 className="text-sm font-bold text-gray-800">Insights da IA</h4>
                    </div>
                    {insights.map(insight => (
                        <div
                            key={insight.id}
                            className={`
                                relative p-4 rounded-xl border flex gap-4 items-start shadow-sm transition-all hover:shadow-md
                                ${insight.type === 'weather' ? 'bg-blue-50/50 border-blue-100' :
                                    insight.type === 'event' ? 'bg-purple-50/50 border-purple-100' :
                                        insight.type === 'logistics' ? 'bg-amber-50/50 border-amber-100' :
                                            'bg-emerald-50/50 border-emerald-100'}
                            `}
                        >
                            {/* Icon */}
                            <div className={`
                                p-2 rounded-lg shrink-0
                                ${insight.type === 'weather' ? 'bg-blue-100 text-blue-600' :
                                    insight.type === 'event' ? 'bg-purple-100 text-purple-600' :
                                        insight.type === 'logistics' ? 'bg-amber-100 text-amber-600' :
                                            'bg-emerald-100 text-emerald-600'}
                            `}>
                                <span className="material-symbols-outlined text-xl">
                                    {insight.type === 'weather' ? 'partly_cloudy_day' :
                                        insight.type === 'event' ? 'celebration' :
                                            insight.type === 'logistics' ? 'commute' :
                                                'tips_and_updates'}
                                </span>
                            </div>

                            <div className="flex-1">
                                <h4 className={`text-sm font-bold mb-1
                                    ${insight.type === 'weather' ? 'text-blue-800' :
                                        insight.type === 'event' ? 'text-purple-800' :
                                            insight.type === 'logistics' ? 'text-amber-800' :
                                                'text-emerald-800'}
                                `}>
                                    {insight.title}
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {insight.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Suggestions Section */}
            {suggestions.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-500">auto_awesome</span>
                            <h3 className="text-sm font-bold text-indigo-900">Sugestões da IA</h3>
                            <span className="text-xs font-medium px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                                {suggestions.length} novas
                            </span>
                        </div>
                        {suggestions.length > 1 && (
                            <button
                                onClick={handleAcceptAll}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">done_all</span>
                                Adicionar Todas
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {suggestions.map(suggestion => (
                            <div key={suggestion.id} className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 group hover:border-indigo-200 transition-all">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-800 text-sm">{suggestion.title}</span>
                                        {suggestion.isUrgent && (
                                            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Urgente</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{suggestion.reason}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <button
                                        onClick={() => onReject(suggestion.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Recusar"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                    <button
                                        onClick={() => onAccept(suggestion)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-base">add</span>
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
