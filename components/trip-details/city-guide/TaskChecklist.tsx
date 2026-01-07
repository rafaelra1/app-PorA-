import React, { useState } from 'react';

interface Task {
    id: string;
    title: string;
    dueDate: string;
    icon: string;
    isUrgent: boolean;
    isCompleted: boolean;
}

interface TaskChecklistProps {
    cityName?: string;
}

const INITIAL_TASKS: Task[] = [
    {
        id: 'task-1',
        title: 'Solicitar visto de turista',
        dueDate: '15/01/2026',
        icon: 'event',
        isUrgent: true,
        isCompleted: false
    },
    {
        id: 'task-2',
        title: 'Reservar hotel em Sapa',
        dueDate: '20/01/2026',
        icon: 'hotel',
        isUrgent: true,
        isCompleted: false
    },
    {
        id: 'task-3',
        title: 'Contratar seguro viagem',
        dueDate: '01/02/2026',
        icon: 'verified_user',
        isUrgent: true,
        isCompleted: false
    },
    {
        id: 'task-4',
        title: 'Fazer check-in online',
        dueDate: '10/02/2026',
        icon: 'check_circle',
        isUrgent: true,
        isCompleted: false
    }
];

const TaskChecklist: React.FC<TaskChecklistProps> = ({ cityName }) => {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);

    const completedCount = tasks.filter(t => t.isCompleted).length;

    const toggleTask = (taskId: string) => {
        setTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
            )
        );
    };

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: newTaskTitle,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            icon: 'task_alt',
            isUrgent: false,
            isCompleted: false
        };

        setTasks(prev => [...prev, newTask]);
        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-text-main">Checklist de Tarefas</h3>
                <span className="text-xs font-medium text-text-muted">
                    {completedCount}/{tasks.length} concluídas
                </span>
            </div>

            {/* Task List */}
            <div className="divide-y divide-gray-50">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors ${task.isCompleted ? 'opacity-60' : ''}`}
                    >
                        {/* Icon */}
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${task.isCompleted ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-400'}`}>
                            <span className="material-symbols-outlined text-xl">
                                {task.isCompleted ? 'check_circle' : task.icon}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${task.isCompleted ? 'line-through text-text-muted' : 'text-text-main'}`}>
                                {task.title}
                            </p>
                            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-sm">event</span>
                                Até {task.dueDate}
                            </p>
                        </div>

                        {/* Urgency Tag */}
                        {task.isUrgent && !task.isCompleted && (
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-500 text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0">
                                Urgente
                            </span>
                        )}

                        {/* Completion Toggle */}
                        <button
                            onClick={() => toggleTask(task.id)}
                            className={`size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${task.isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            {task.isCompleted && (
                                <span className="material-symbols-outlined text-sm">check</span>
                            )}
                        </button>
                    </div>
                ))}
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
                        Adicionar Tarefa
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaskChecklist;
