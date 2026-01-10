import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText } from 'lucide-react';
import Modal from './Modal';
import { toISODate } from '../../../lib/dateUtils';

interface AddToItineraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: {
        name: string;
        image?: string;
        category?: string;
        type: 'restaurant' | 'attraction';
        subcategory?: string;
    } | null;
    onConfirm: (data: {
        itemName: string;
        itemType: 'restaurant' | 'attraction';
        date: string;
        time: string;
        notes?: string;
    }) => void;
    minDate?: string;
    maxDate?: string;
}

const AddToItineraryModal: React.FC<AddToItineraryModalProps> = ({
    isOpen,
    onClose,
    item,
    onConfirm,
    minDate,
    maxDate
}) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('12:30');
    const [notes, setNotes] = useState('');

    // Normalize constraints
    const min = toISODate(minDate || '');
    const max = toISODate(maxDate || '');

    useEffect(() => {
        if (isOpen && item) {
            // Set initial date to minDate if available (and valid), otherwise fallback to today or provided default
            const initialDate = min || '2026-01-05';
            setDate(initialDate);
            if (!time) setTime('12:30');
        }
    }, [isOpen, item, min]);

    if (!item) return null;

    const handleConfirm = () => {
        if (!date || !time) return;

        onConfirm({
            itemName: item.name,
            itemType: item.type,
            date,
            time,
            notes: notes.trim() || undefined
        });

        onClose();
    };

    const isFormValid = date && time;

    const footer = (
        <div className="flex gap-4 w-full pt-2">
            <button
                onClick={onClose}
                className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all"
            >
                Cancelar
            </button>
            <button
                onClick={handleConfirm}
                disabled={!isFormValid}
                className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${isFormValid
                    ? 'bg-gray-100 text-gray-400 hover:bg-indigo-600 hover:text-white'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
            >
                Confirmar Agendamento
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={<span className="text-[#4F46E5] font-black text-2xl">Adicionar ao Itinerário</span>}
            size="md"
            footer={footer}
        >
            <div className="space-y-6">
                <p className="text-sm font-medium text-gray-500 -mt-4">
                    Defina os detalhes da visita
                </p>

                {/* Item Preview Card */}
                <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm border-2 border-white">
                        <img
                            src={item.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-900 text-lg tracking-tight truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-2.5 py-1 bg-indigo-100/50 text-indigo-600 rounded-lg font-black uppercase tracking-wider">
                                {item.type === 'restaurant' ? 'Gastronomia' : 'Atração'}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                                {item.subcategory || item.category || ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Date and Time Fields */}
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[10px] font-black text-gray-800 uppercase tracking-[0.1em] mb-2.5 ml-1">
                            Data
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Calendar className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="date"
                                value={date}
                                min={min || undefined}
                                max={max || undefined}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-800 uppercase tracking-[0.1em] mb-2.5 ml-1">
                            Horário
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Clock className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes Field */}
                <div>
                    <label className="block text-[10px] font-black text-gray-800 uppercase tracking-[0.1em] mb-2.5 ml-1">
                        Notas <span className="text-gray-400 font-normal normal-case">(opcional)</span>
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-5 pointer-events-none">
                            <FileText className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Pedir mesa na varanda, referência do Google..."
                            rows={4}
                            className="w-full pl-12 pr-5 py-5 bg-white border border-gray-100 rounded-[2rem] text-sm font-medium text-gray-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-sm resize-none"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AddToItineraryModal;
