
import React, { useState } from 'react';
import { useChecklist } from '../../../contexts/ChecklistContext';
import { useTrips } from '@/contexts/TripContext';
import { getGeminiService } from '../../../services/geminiService';
import { ChecklistAnalysisResult, ChecklistTask } from '../../../types';

export const SmartSuggestions: React.FC = () => {
    const { selectedTrip } = useTrips();
    const { addTask } = useChecklist();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ChecklistAnalysisResult | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

    const handleAnalyze = async () => {
        if (!selectedTrip) return;

        setIsAnalyzing(true);
        setIsOpen(true);

        try {
            const service = getGeminiService();
            // Create a trip context object aligned with what the service expects
            const context = {
                destination: selectedTrip.destination,
                startDate: selectedTrip.startDate,
                endDate: selectedTrip.endDate,
                travelers: selectedTrip.participants || [],
                existingTasks: selectedTrip.tasks?.map(t => t.text) || []
            };

            const result = await service.analyzeChecklist(context);
            if (result) {
                setAnalysisResult(result);
                // Pre-select all suggested tasks
                const allTaskIds = new Set(result.suggestedTasks.map(t => t.id));
                setSelectedTasks(allTaskIds);
            }
        } catch (error) {
            console.error("Failed to analyze checklist", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleTaskSelection = (taskId: string) => {
        const newSelected = new Set(selectedTasks);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTasks(newSelected);
    };

    const handleAddSelectedTasks = async () => {
        if (!analysisResult) return;

        const tasksToAdd = analysisResult.suggestedTasks.filter(t => selectedTasks.has(t.id));

        for (const task of tasksToAdd) {
            await addTask(task.title, selectedTrip.id, {
                category: task.category as any,
                priority: task.isUrgent ? 'blocking' : 'recommended',
                description: task.reason
            });
        }

        setIsOpen(false);
        setAnalysisResult(null);
    };

    if (!selectedTrip) return null;

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

                {isAnalyzing ? (
                    <>
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="font-medium text-sm">Analisando...</span>
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined text-lg animate-pulse">auto_awesome</span>
                        <span className="font-medium text-sm">Sugestões com IA</span>
                    </>
                )}
            </button>

            {/* Modal / Results Display */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">

                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Análise Inteligente</h3>
                                    <p className="text-xs text-gray-500">Sugestões personalizadas para {selectedTrip.destination}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="size-8 rounded-full bg-white text-gray-400 hover:text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            {isAnalyzing ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="size-16 relative">
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-indigo-500 text-2xl animate-pulse">flight_takeoff</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Analisando sua viagem...</h4>
                                        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                                            Verificando documentos, clima, vacinas e logística para gerar recomendações precisas.
                                        </p>
                                    </div>
                                </div>
                            ) : analysisResult ? (
                                <>
                                    {/* Insights Section */}
                                    {analysisResult.insights.length > 0 && (
                                        <section>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Insights & Alertas</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {analysisResult.insights.map(insight => (
                                                    <div key={insight.id} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex gap-3">
                                                        <span className="material-symbols-outlined text-indigo-600 mt-0.5 shrink-0">
                                                            {insight.type === 'weather' ? 'cloud' :
                                                                insight.type === 'event' ? 'event' :
                                                                    insight.type === 'logistics' ? 'commute' : 'lightbulb'}
                                                        </span>
                                                        <div>
                                                            <h5 className="font-bold text-gray-800 text-sm">{insight.title}</h5>
                                                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{insight.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Tasks Section */}
                                    <section>
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tarefas Sugeridas</h4>
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {selectedTasks.size} selecionadas
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {analysisResult.suggestedTasks.map(task => {
                                                const isSelected = selectedTasks.has(task.id);
                                                return (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => toggleTaskSelection(task.id)}
                                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 group
                                                            ${isSelected
                                                                ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50'
                                                                : 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100 hover:bg-white'
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 size-5 rounded-md border flex items-center justify-center transition-colors
                                                            ${isSelected
                                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                : 'bg-white border-gray-300 text-transparent group-hover:border-indigo-400'
                                                            }`}
                                                        >
                                                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                                                        </div>

                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <h5 className={`font-medium text-sm ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                                                                    {task.title}
                                                                </h5>
                                                                {task.isUrgent && (
                                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-wide">
                                                                        Urgente
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">{task.reason}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                </>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">error</span>
                                    <p>Não foi possível gerar sugestões no momento.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {analysisResult && !isAnalyzing && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-medium text-sm hover:text-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddSelectedTasks}
                                    disabled={selectedTasks.size === 0}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    Adicionar {selectedTasks.size} Tarefas
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
