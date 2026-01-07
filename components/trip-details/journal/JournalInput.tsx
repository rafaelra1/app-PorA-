import React, { useState } from 'react';
import { JournalMood, Participant } from '../../../types';
import { Card, Button } from '../../ui/Base';

interface JournalInputProps {
    user: Participant;
    onSubmit: (data: {
        content: string;
        location: string;
        mood?: JournalMood;
        tags: string[];
        images: string[];
    }) => void;
}

const MOOD_OPTIONS: { value: JournalMood; emoji: string; label: string }[] = [
    { value: 'amazing', emoji: '🤩', label: 'Incrível' },
    { value: 'excited', emoji: '🥳', label: 'Animado' },
    { value: 'relaxed', emoji: '😌', label: 'Relaxado' },
    { value: 'tired', emoji: '😴', label: 'Cansado' },
    { value: 'hungry', emoji: '😋', label: 'Com Fome' },
    { value: 'cold', emoji: '🥶', label: 'Com Frio' },
];

const TAG_OPTIONS = ['Comida', 'Paisagem', 'Perrengue', 'Cultura', 'Natureza', 'Relax', 'Transporte'];

const DAILY_PROMPTS = [
    "Qual foi o sabor mais estranho que você provou hoje?",
    "O que te surpreendeu mais até agora?",
    "Uma palavra para descrever o dia.",
    "Qual momento você gostaria de reviver?",
    "Algo que você aprendeu sobre a cultura local.",
];

const JournalInput: React.FC<JournalInputProps> = ({ user, onSubmit }) => {
    const [content, setContent] = useState('');
    const [location, setLocation] = useState('');
    const [selectedMood, setSelectedMood] = useState<JournalMood | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [showTagPicker, setShowTagPicker] = useState(false);

    // Random daily prompt
    const dailyPrompt = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];

    const handleTagToggle = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = () => {
        if (!content.trim()) return;

        onSubmit({
            content,
            location: location || 'Local não especificado',
            mood: selectedMood || undefined,
            tags: selectedTags,
            images: [], // Placeholder for now
        });

        // Reset form
        setContent('');
        setLocation('');
        setSelectedMood(null);
        setSelectedTags([]);
        setShowMoodPicker(false);
        setShowTagPicker(false);
    };

    return (
        <Card className="p-0 border border-gray-100/50 shadow-soft overflow-hidden rounded-2xl bg-white hover:shadow-md transition-shadow duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                <img
                    src={user.avatar}
                    className="size-10 rounded-xl object-cover ring-2 ring-white shadow-sm"
                    alt={user.name}
                />
                <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-text-main leading-none">{user.name}</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                        Criar Memória
                    </span>
                </div>
            </div>

            {/* Daily Prompt */}
            <div className="px-6 pt-5">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 bg-indigo-50/50 px-3 py-2 rounded-lg">
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    <span className="italic">{dailyPrompt}</span>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 space-y-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Conte sobre seu dia... cores, aromas, sons, sensações..."
                    className="w-full min-h-[140px] text-base text-text-main bg-transparent border-none focus:ring-0 p-0 resize-none placeholder:text-gray-300 font-medium leading-relaxed"
                />

                {/* Selected Items Preview */}
                {(selectedMood || selectedTags.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 pb-2">
                        {selectedMood && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
                                {MOOD_OPTIONS.find((m) => m.value === selectedMood)?.emoji}{' '}
                                {MOOD_OPTIONS.find((m) => m.value === selectedMood)?.label}
                                <button onClick={() => setSelectedMood(null)} className="ml-1 hover:text-amber-900">
                                    <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                            </span>
                        )}
                        {selectedTags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full"
                            >
                                #{tag}
                                <button onClick={() => handleTagToggle(tag)} className="ml-1 hover:text-indigo-900">
                                    <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Mood Picker Dropdown */}
                {showMoodPicker && (
                    <div className="bg-gray-50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Como você está?</p>
                        <div className="flex flex-wrap gap-2">
                            {MOOD_OPTIONS.map((mood) => (
                                <button
                                    key={mood.value}
                                    onClick={() => {
                                        setSelectedMood(mood.value);
                                        setShowMoodPicker(false);
                                    }}
                                    className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${selectedMood === mood.value
                                        ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                                        : 'bg-white text-text-muted hover:bg-amber-50 hover:text-amber-600'
                                        }`}
                                >
                                    <span className="text-lg">{mood.emoji}</span>
                                    <span>{mood.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tag Picker Dropdown */}
                {showTagPicker && (
                    <div className="bg-gray-50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Categorize o momento</p>
                        <div className="flex flex-wrap gap-2">
                            {TAG_OPTIONS.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${selectedTags.includes(tag)
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-white text-text-muted hover:bg-indigo-50 hover:text-indigo-600'
                                        }`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100 items-stretch sm:items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Location Input */}
                        <div className="relative flex-1 min-w-[180px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                location_on
                            </span>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Onde você está?"
                                className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-200 text-text-main"
                            />
                        </div>

                        {/* Tool Buttons */}
                        <button
                            className="size-10 rounded-xl bg-gray-50 text-text-muted flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                            title="Adicionar foto"
                        >
                            <span className="material-symbols-outlined text-lg">add_a_photo</span>
                        </button>

                        <button
                            onClick={() => {
                                setShowMoodPicker(!showMoodPicker);
                                setShowTagPicker(false);
                            }}
                            className={`size-10 rounded-xl flex items-center justify-center transition-all ${showMoodPicker || selectedMood
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-gray-50 text-text-muted hover:bg-amber-50 hover:text-amber-500'
                                }`}
                            title="Humor"
                        >
                            <span className="text-lg">{selectedMood ? MOOD_OPTIONS.find((m) => m.value === selectedMood)?.emoji : '😊'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setShowTagPicker(!showTagPicker);
                                setShowMoodPicker(false);
                            }}
                            className={`size-10 rounded-xl flex items-center justify-center transition-all ${showTagPicker || selectedTags.length > 0
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-gray-50 text-text-muted hover:bg-indigo-50 hover:text-indigo-500'
                                }`}
                            title="Tags"
                        >
                            <span className="material-symbols-outlined text-lg">sell</span>
                        </button>

                        <button
                            className="size-10 rounded-xl bg-gray-50 text-text-muted flex items-center justify-center hover:bg-sky-50 hover:text-sky-500 transition-all"
                            title="Clima (automático)"
                        >
                            <span className="material-symbols-outlined text-lg">partly_cloudy_day</span>
                        </button>

                        <button
                            className="size-10 rounded-xl bg-gray-50 text-text-muted flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                            title="Vincular despesa"
                        >
                            <span className="material-symbols-outlined text-lg">payments</span>
                        </button>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={!content.trim()}
                        variant="dark"
                        className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 !py-3 !px-8 !text-[11px] font-extrabold uppercase tracking-[0.15em] w-full sm:w-auto shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-sm mr-2">auto_awesome</span>
                        Publicar
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default JournalInput;
