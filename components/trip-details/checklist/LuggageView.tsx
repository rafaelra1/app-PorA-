import React, { useState } from 'react';
import { useChecklist } from '../../../contexts/ChecklistContext';
import { useTrips } from '@/contexts/TripContext';
import { EmptyState } from '../../ui/EmptyState';

export const LuggageView: React.FC = () => {
    const { tasks, toggleTask, addTask } = useChecklist();
    const { selectedTrip } = useTrips();
    const [newItem, setNewItem] = useState('');

    // Filter for packing tasks
    const packingTasks = tasks.filter(t => t.category === 'packing');

    const handleAddItem = async () => {
        if (!selectedTrip || !newItem.trim()) return;
        await addTask(newItem, selectedTrip.id, { category: 'packing' });
        setNewItem('');
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">luggage</span>
                Minha Bagagem
            </h2>

            {/* Input */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    placeholder="Adicionar item na mala..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-orange-500 transition-colors"
                />
                <button
                    onClick={handleAddItem}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                    Adicionar
                </button>
            </div>

            {/* List */}
            <div className="space-y-2">
                {packingTasks.length === 0 ? (
                    <EmptyState
                        title="Mala vazia"
                        description="Comece a adicionar itens para não esquecer nada!"
                        icon="luggage"
                    />
                ) : (
                    packingTasks.map(task => (
                        <div
                            key={task.id}
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer
                             ${task.is_completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-orange-300'}
                           `}
                            onClick={() => toggleTask(task.id, !task.is_completed)}
                        >
                            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all
                                ${task.is_completed ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}
                            `}>
                                {task.is_completed && <span className="material-symbols-outlined text-white text-sm">check</span>}
                            </div>
                            <span className={`text-base font-medium ${task.is_completed ? 'text-gray-400 line-through' : 'text-[#1A1A1A]'}`}>
                                {task.title}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
