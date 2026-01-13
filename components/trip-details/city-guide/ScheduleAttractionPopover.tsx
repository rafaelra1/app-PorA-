import React, { useState } from 'react';
import { Calendar, Clock, NotebookPen, Loader2 } from 'lucide-react';
import { DiscoveryAttraction } from '../../../types';
import { getToday } from '../../../lib/dateUtils';

interface ScheduleAttractionPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    attraction: DiscoveryAttraction;
    tripStartDate?: string;
    tripEndDate?: string;
    onConfirm: (date: string, time: string, notes?: string) => Promise<void>;
}

const ScheduleAttractionPopover: React.FC<ScheduleAttractionPopoverProps> = ({
    isOpen,
    onClose,
    attraction,
    tripStartDate,
    tripEndDate,
    onConfirm
}) => {
    const [date, setDate] = useState(tripStartDate || getToday());
    const [time, setTime] = useState('09:00');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onConfirm(date, time, notes);
            onClose();
        } catch (error) {
            console.error('Error scheduling:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                        <Calendar size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">Agendar Visita</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{attraction.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Data</label>
                        <div className="relative">
                            <input
                                type="date"
                                required
                                value={date}
                                min={tripStartDate}
                                max={tripEndDate}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-medium text-gray-700"
                            />
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Time Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Horário</label>
                        <div className="relative">
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-medium text-gray-700"
                            />
                            <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Notes Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Notas (Opcional)</label>
                        <div className="relative">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ex: Comprar ingresso antecipado"
                                rows={2}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-gray-700 resize-none"
                            />
                            <NotebookPen className="absolute left-3 top-3 text-gray-400" size={16} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Agendando...
                            </>
                        ) : (
                            'Confirmar no Roteiro'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ScheduleAttractionPopover;
