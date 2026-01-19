import React, { useState, useEffect, useMemo } from 'react';
import { useChecklist } from '../../contexts/ChecklistContext';
import { useTrips } from '@/contexts/TripContext';
import { Task, TaskCategory, TaskPriorityLevel } from '../../types/checklist';
import { Trip, PreparationTask, TripContext, EnhancedTripContext, ChecklistTask, PlanningGap } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useAccommodation } from '../../contexts/AccommodationContext';
import { useTransport } from '../../contexts/TransportContext';
import { useItinerary } from '../../contexts/ItineraryContext';
import { EmptyState } from '../ui/EmptyState';
import { useLLMAnalysis } from '../../hooks/useLLMAnalysis';
import { checklistNotificationService } from '../../services/checklistNotificationService';
import { AISuggestions } from './overview/AISuggestions';
import { Skeleton } from '../ui/Skeleton';
import Toast, { ToastProps, ToastContainer } from '../ui/Toast';
import { analyzeGaps, toStandardGaps, ExtendedPlanningGap } from '../../services/checklist/gapAnalysisService';

// Category metadata
const CATEGORY_CONFIG: Record<TaskCategory, { icon: string; label: string; color: string }> = {
    documentation: { icon: 'description', label: 'Documentação', color: 'blue' },
    health: { icon: 'health_and_safety', label: 'Saúde', color: 'green' },
    reservations: { icon: 'book_online', label: 'Reservas', color: 'purple' },
    packing: { icon: 'luggage', label: 'Bagagem', color: 'orange' },
    financial: { icon: 'payments', label: 'Financeiro', color: 'emerald' },
    tech: { icon: 'devices', label: 'Tecnologia', color: 'cyan' },
    other: { icon: 'task_alt', label: 'Outros', color: 'gray' }
};

// Priority badge colors
const PRIORITY_COLORS = {
    blocking: 'bg-red-100 text-red-700 border-red-200',
    important: 'bg-amber-100 text-amber-700 border-amber-200',
    recommended: 'bg-blue-100 text-blue-700 border-blue-200'
};

const PRIORITY_LABELS = {
    blocking: 'Crítico',
    important: 'Importante',
    recommended: 'Recomendado'
};

interface SmartChecklistProps {
    className?: string;
}



const SmartChecklist: React.FC<SmartChecklistProps> = ({ className = '' }) => {
    const { tasks, isLoading, toggleTask, addTask, refreshTasks } = useChecklist();
    const { selectedTrip } = useTrips();
    const { accommodations, fetchAccommodations } = useAccommodation();
    const { transports, fetchTransports } = useTransport();
    const { activities: itineraryActivities } = useItinerary();

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<TaskCategory>>(new Set(['documentation', 'health']));
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [toasts, setToasts] = useState<ToastProps[]>([]);
    const [detectedGaps, setDetectedGaps] = useState<ExtendedPlanningGap[]>([]);

    const addToast = (message: string, type: ToastProps['type'] = 'success') => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type, onClose: removeToast }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // AI Analysis hook
    const {
        isAnalyzing,
        analysisResult,
        analyzeChecklist,
        acceptSuggestion,
        rejectSuggestion,
        clearAnalysis
    } = useLLMAnalysis(selectedTrip?.id || '');

    // Helper: Map ChecklistTask category to Task category
    const mapCategory = (cat: ChecklistTask['category']): TaskCategory => {
        switch (cat) {
            case 'documents': return 'documentation';
            case 'preparation': return 'other';
            default: return cat as TaskCategory;
        }
    };

    // Handle running AI analysis
    const handleRunAnalysis = async () => {
        if (!selectedTrip) return;

        setShowAnalysis(true);

        // Use the new GapAnalysisService for comprehensive gap detection
        const gaps = analyzeGaps({
            trip: selectedTrip,
            accommodations,
            transports,
            tasks
        });

        // Store gaps for immediate display (before AI finishes)
        setDetectedGaps(gaps);

        // Convert to standard format for AI prompt
        const standardGaps = toStandardGaps(gaps);

        const context: EnhancedTripContext = {
            destination: selectedTrip.detailedDestinations?.map(d => d.name).join(', ') || selectedTrip.destination,
            cities: selectedTrip.detailedDestinations,
            startDate: selectedTrip.startDate,
            endDate: selectedTrip.endDate,
            travelers: selectedTrip.participants || [],
            flights: transports.filter(t => t.type === 'flight'),
            hotels: accommodations,
            activities: itineraryActivities,
            existingTasks: tasks.map(t => t.title),
            planningGaps: standardGaps,
        };

        try {
            await analyzeChecklist(context, tasks.map(t => t.title));
        } catch (error) {
            addToast('Falha ao analisar checklist. Tente novamente.', 'error');
            setShowAnalysis(false);
        }
    };

    // Handle accepting a suggestion
    const handleAcceptSuggestion = async (suggestion: ChecklistTask) => {
        if (!selectedTrip) return;

        const accepted = acceptSuggestion(suggestion.id);
        if (accepted) {
            const priority: TaskPriorityLevel = accepted.isUrgent ? 'blocking' : 'recommended';
            await addTask(accepted.title, selectedTrip.id, {
                category: mapCategory(accepted.category),
                priority,
                description: accepted.reason,
                ruleId: `ai-suggestion-${accepted.id}`
            });
            addToast('Tarefa adicionada com sucesso!', 'success');
        }
    };

    // Handle rejecting a suggestion
    const handleRejectSuggestion = (id: string) => {
        rejectSuggestion(id);
    };

    // Handle accepting all suggestions
    const handleAcceptAll = async () => {
        if (!selectedTrip || !analysisResult) return;

        for (const suggestion of analysisResult.suggestedTasks) {
            const priority: TaskPriorityLevel = suggestion.isUrgent ? 'blocking' : 'recommended';
            await addTask(suggestion.title, selectedTrip.id, {
                category: mapCategory(suggestion.category),
                priority,
                description: suggestion.reason,
            });
        }
        clearAnalysis();
        addToast('Todas as sugestões foram aceitas!', 'success');
    };

    // Handle dismissing an insight (optional, no-op for now)
    const handleDismissInsight = (_id: string) => {
        // Could be extended to track dismissed insights
    };

    // Refresh tasks when trip changes - staggered to prevent request overload
    useEffect(() => {
        if (selectedTrip) {
            // Small delay to stagger API calls and prevent ERR_INSUFFICIENT_RESOURCES
            const timeoutId = setTimeout(() => {
                refreshTasks(selectedTrip.id, selectedTrip);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTrip?.id]);

    // Group tasks by category
    const tasksByCategory = useMemo(() => {
        const grouped: Partial<Record<TaskCategory, Task[]>> = {};
        tasks.forEach(task => {
            const category = task.category || 'other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category]!.push(task);
        });
        return grouped;
    }, [tasks]);

    // Calculate summary
    const summary = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.is_completed).length;
        const critical = tasks.filter(t => t.priority === 'blocking' && !t.is_completed).length;

        const now = new Date();
        const overdue = tasks.filter(t => {
            if (t.is_completed || !t.due_date) return false;
            return new Date(t.due_date) < now;
        }).length;

        return { total, completed, critical, overdue };
    }, [tasks]);

    const toggleCategory = (category: TaskCategory) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const handleAddTask = async () => {
        if (!selectedTrip || !newTaskTitle.trim()) return;

        await addTask(newTaskTitle, selectedTrip.id);
        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    const formatDueDate = (dueDate?: string) => {
        if (!dueDate) return null;

        const date = new Date(dueDate);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `Atrasado ${Math.abs(diffDays)}d`, color: 'text-red-600' };
        } else if (diffDays === 0) {
            return { text: 'Hoje', color: 'text-orange-600' };
        } else if (diffDays <= 7) {
            return { text: `Em ${diffDays}d`, color: 'text-amber-600' };
        } else {
            return { text: date.toLocaleDateString('pt-BR'), color: 'text-gray-600' };
        }
    };

    if (isLoading && tasks.length === 0) {
        return (
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-8 ${className}`}>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Carregando tarefas...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
            {/* Header with Summary */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-text-main">Checklist Inteligente</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRunAnalysis}
                            disabled={isAnalyzing || !selectedTrip}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${isAnalyzing
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-base ${isAnalyzing ? 'animate-spin' : ''}`}>
                                {isAnalyzing ? 'progress_activity' : 'auto_awesome'}
                            </span>
                            {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
                        </button>
                        <span className="text-xs font-medium text-text-muted">
                            {summary.completed}/{summary.total} concluídas
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${summary.total > 0 ? (summary.completed / summary.total) * 100 : 0}%` }}
                    />
                </div>

                {/* Alerts */}
                {summary.critical > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        <span className="font-medium">{summary.critical} tarefa(s) crítica(s) pendente(s)</span>
                    </div>
                )}
                {summary.overdue > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span className="font-medium">{summary.overdue} tarefa(s) atrasada(s)</span>
                    </div>
                )}
            </div>

            {/* AI Insights Section */}
            {(showAnalysis || analysisResult) && (
                <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
                    {isAnalyzing ? (
                        <div className="space-y-4">
                            {/* Immediate Gap Alerts - shown while AI is analyzing */}
                            {detectedGaps.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-2">
                                        <span className="material-symbols-outlined text-sm">warning</span>
                                        Alertas Detectados
                                    </h4>
                                    <div className="space-y-2">
                                        {detectedGaps.filter(g => g.severity === 'critical').map((gap, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3"
                                            >
                                                <span className="material-symbols-outlined text-red-500 text-lg shrink-0">
                                                    {gap.type === 'accommodation' ? 'hotel' : gap.type === 'transport' ? 'flight' : 'error'}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-red-800">{gap.description}</p>
                                                    {gap.suggestedAction && (
                                                        <p className="text-xs text-red-600 mt-0.5">{gap.suggestedAction}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {detectedGaps.filter(g => g.severity === 'warning').map((gap, index) => (
                                            <div
                                                key={`warning-${index}`}
                                                className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3"
                                            >
                                                <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">
                                                    {gap.category === 'documentation' ? 'badge' : gap.category === 'health' ? 'medical_services' : 'info'}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-800">{gap.description}</p>
                                                    {gap.suggestedAction && (
                                                        <p className="text-xs text-amber-600 mt-0.5">{gap.suggestedAction}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Loading skeleton for AI analysis */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <span className="material-symbols-outlined text-indigo-500 animate-spin">auto_awesome</span>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <p className="text-sm font-medium text-indigo-900">Analisando sua viagem com IA...</p>
                                    <p className="text-xs text-indigo-600/80">Verificando requisitos de visto, vacinas e documentos</p>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <Skeleton className="h-14 rounded-xl bg-white/60" />
                                <Skeleton className="h-14 rounded-xl bg-white/60" />
                            </div>
                        </div>
                    ) : analysisResult && (analysisResult.insights.length > 0 || analysisResult.suggestedTasks.length > 0) ? (
                        <AISuggestions
                            insights={analysisResult.insights}
                            suggestions={analysisResult.suggestedTasks}
                            onAccept={handleAcceptSuggestion}
                            onReject={handleRejectSuggestion}
                            onDismissInsight={handleDismissInsight}
                            onAcceptAll={handleAcceptAll}
                        />
                    ) : showAnalysis && (
                        <div className="text-center py-8">
                            <div className="size-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-3xl">check_circle</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">Sua viagem já está bem preparada!</p>
                            <p className="text-xs text-gray-500 mt-1">Nenhuma sugestão adicional encontrada pela IA.</p>
                            <button
                                onClick={() => setShowAnalysis(false)}
                                className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-700"
                            >
                                Fechar
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Task List by Category */}
            <div className="divide-y divide-gray-50">
                {tasks.length === 0 ? (
                    <div className="py-8">
                        <EmptyState
                            variant="minimal"
                            icon="checklist"
                            title="Nenhuma tarefa gerada"
                            description="Adicione destinos à sua viagem para gerar tarefas automaticamente"
                        />
                    </div>
                ) : (
                    Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
                        const config = CATEGORY_CONFIG[category as TaskCategory] || CATEGORY_CONFIG.other;
                        const isExpanded = expandedCategories.has(category as TaskCategory);
                        const completedCount = categoryTasks?.filter(t => t.is_completed).length || 0;
                        const totalCount = categoryTasks?.length || 0;

                        return (
                            <div key={category}>
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(category as TaskCategory)}
                                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-lg bg-${config.color}-50 text-${config.color}-600 flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-lg">{config.icon}</span>
                                        </div>
                                        <span className="font-semibold text-sm text-gray-800">{config.label}</span>
                                        <span className="text-xs text-gray-500">
                                            {completedCount}/{totalCount}
                                        </span>
                                    </div>
                                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>

                                {/* Category Tasks */}
                                {isExpanded && (
                                    <div className="bg-gray-50/30">
                                        {categoryTasks?.map(task => {
                                            const dueDateInfo = formatDueDate(task.due_date);

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`px-6 py-4 flex items-center gap-4 hover:bg-white/50 transition-colors border-l-2 ${task.priority === 'blocking' ? 'border-red-400' :
                                                        task.priority === 'important' ? 'border-amber-400' :
                                                            'border-transparent'
                                                        } ${task.is_completed ? 'opacity-60' : ''}`}
                                                >
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => toggleTask(task.id, !task.is_completed)}
                                                        className={`size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${task.is_completed
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {task.is_completed && (
                                                            <span className="material-symbols-outlined text-sm">check</span>
                                                        )}
                                                    </button>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-semibold text-sm ${task.is_completed ? 'line-through text-text-muted' : 'text-text-main'
                                                            }`}>
                                                            {task.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {task.priority && (
                                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${PRIORITY_COLORS[task.priority]}`}>
                                                                    {PRIORITY_LABELS[task.priority]}
                                                                </span>
                                                            )}
                                                            {dueDateInfo && (
                                                                <span className={`text-xs flex items-center gap-1 ${dueDateInfo.color}`}>
                                                                    <span className="material-symbols-outlined text-sm">event</span>
                                                                    {dueDateInfo.text}
                                                                </span>
                                                            )}
                                                            {task.rule_id && task.rule_id.startsWith('ai-suggestion') && (
                                                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1 font-medium" title="Sugerido por IA">
                                                                    <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                                                                    IA
                                                                </span>
                                                            )}
                                                            {task.rule_id && !task.rule_id.startsWith('ai-suggestion') && (
                                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                                                    Auto
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Task Section */}
            <div className="px-6 py-4 border-t border-gray-100 bg-yellow-50/30">
                {isAddingTask ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Nome da tarefa..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            autoFocus
                        />
                        <button
                            onClick={handleAddTask}
                            className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
                        >
                            Adicionar
                        </button>
                        <button
                            onClick={() => setIsAddingTask(false)}
                            className="px-3 py-2 text-gray-500 text-xs font-bold hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="w-full py-3 border-2 border-dashed border-amber-200 rounded-xl text-sm font-bold text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Adicionar Tarefa Manual
                    </button>
                )}
            </div>
            {/* Toasts */}
            <ToastContainer toasts={toasts} />
        </div>
    );
};

export default SmartChecklist;
