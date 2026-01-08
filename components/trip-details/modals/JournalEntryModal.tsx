import React, { useState } from 'react';
import { ItineraryActivity, JournalMood } from '../../../types';

interface JournalEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    activity: ItineraryActivity | null;
    onSave: (entry: { rating: number; text: string; mood: JournalMood; images: string[] }) => void;
}

const moods: { value: JournalMood; icon: string; label: string }[] = [
    { value: 'amazing', icon: 'sentiment_very_satisfied', label: 'Incrível' },
    { value: 'relaxed', icon: 'self_improvement', label: 'Relaxado' },
    { value: 'excited', icon: 'celebration', label: 'Animado' },
    { value: 'tired', icon: 'sentiment_neutral', label: 'Cansado' },
    { value: 'hungry', icon: 'restaurant', label: 'Com Fome' },
    { value: 'cold', icon: 'ac_unit', label: 'Frio' },
];

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
    isOpen,
    onClose,
    activity,
    onSave
}) => {
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [mood, setMood] = useState<JournalMood>('amazing');
    const [images, setImages] = useState<string[]>([]);

    if (!isOpen || !activity) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ rating, text, mood, images });
        onClose();
        // Reset state
        setText('');
        setRating(5);
        setMood('amazing');
        setImages([]);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Avaliar Atividade</h2>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">event</span>
                            {activity.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Como foi a experiência?</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-4xl fill-current">star</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mood */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Como você se sentiu?</label>
                        <div className="flex flex-wrap gap-2">
                            {moods.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setMood(m.value)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${mood === m.value
                                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-base">
                                        {m.icon}
                                    </span>
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Text */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Suas anotações</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="O que mais te marcou? Dicas para o futuro..."
                            className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                        />
                    </div>

                    {/* Photo Placeholder */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Fotos do momento</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button
                                type="button"
                                className="size-20 shrink-0 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                                <span className="text-[10px] font-bold">Add</span>
                            </button>
                            {/* Placeholder for uploaded images */}
                            <div className="size-20 shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300">
                                <span className="material-symbols-outlined">image</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                        >
                            Salvar no Diário
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
