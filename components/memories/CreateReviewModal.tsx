import * as React from 'react';
import { useState, useRef } from 'react';
import { PendingReviewItem, ReviewContent, TripMemory, Participant } from '../../types';

interface CreateReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (memory: TripMemory) => void;
    prefilledItem?: PendingReviewItem | null;
    currentUser: Participant;
}

// Star Rating Input Component
const StarRatingInput: React.FC<{
    value: number;
    onChange: (rating: number) => void;
}> = ({ value, onChange }) => {
    const [hoverValue, setHoverValue] = useState(0);

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHoverValue(star)}
                    onMouseLeave={() => setHoverValue(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                >
                    <span
                        className={`material-symbols-outlined text-3xl transition-colors ${star <= (hoverValue || value) ? 'text-amber-400' : 'text-gray-200'
                            }`}
                        style={{ fontVariationSettings: star <= (hoverValue || value) ? "'FILL' 1" : "'FILL' 0" }}
                    >
                        star
                    </span>
                </button>
            ))}
            <span className="ml-2 text-sm font-medium text-gray-500">
                {value > 0 ? `${value}/5` : 'Selecione'}
            </span>
        </div>
    );
};

// Tag Input Component
const TagInput: React.FC<{
    tags: string[];
    onChange: (tags: string[]) => void;
}> = ({ tags, onChange }) => {
    const [inputValue, setInputValue] = useState('');

    const suggestedTags = [
        'Gastronomia', 'Cultura', 'Natureza', 'Romântico',
        'Aventura', 'Compras', 'Vibe Local', 'Jantar', 'Imperdível'
    ];

    const addTag = (tag: string) => {
        if (tag && !tags.includes(tag)) {
            onChange([...tags, tag]);
        }
        setInputValue('');
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="space-y-3">
            {/* Current Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-purple-900"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2">
                {suggestedTags
                    .filter(t => !tags.includes(t))
                    .slice(0, 6)
                    .map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            + {tag}
                        </button>
                    ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(inputValue.trim());
                        }
                    }}
                    placeholder="Adicionar tag personalizada..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
                <button
                    type="button"
                    onClick={() => addTag(inputValue.trim())}
                    disabled={!inputValue.trim()}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Adicionar
                </button>
            </div>
        </div>
    );
};

export const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    prefilledItem,
    currentUser,
}) => {
    const [title, setTitle] = useState(prefilledItem?.title || '');
    const [location, setLocation] = useState(prefilledItem?.location || '');
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [photos, setPhotos] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when prefilled item changes
    React.useEffect(() => {
        if (prefilledItem) {
            setTitle(prefilledItem.title);
            setLocation(prefilledItem.location);
        }
    }, [prefilledItem]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            // In a real app, you'd upload these to a server
            // For now, we create local URLs
            const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
            setPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    const handleRecordToggle = () => {
        // Simulate recording UI (actual recording would need MediaRecorder API)
        setIsRecording(!isRecording);
        if (isRecording) {
            // Simulate transcription result
            setText(prev => prev + (prev ? '\n\n' : '') + '[Transcrição do áudio será adicionada aqui...]');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !rating || !text) {
            return;
        }

        const reviewContent: ReviewContent = {
            title,
            rating,
            text,
            tags,
            photos,
        };

        const newMemory: TripMemory = {
            id: `mem_${Date.now()}`,
            linkedItineraryItemId: prefilledItem?.itineraryItemId,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            type: 'REVIEW',
            content: reviewContent,
            author: currentUser,
            location,
        };

        onSubmit(newMemory);

        // Reset form
        setTitle('');
        setLocation('');
        setRating(0);
        setText('');
        setTags([]);
        setPhotos([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <span className="material-symbols-outlined text-white text-xl">rate_review</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Nova Avaliação</h2>
                            <p className="text-sm text-gray-500">Registre sua experiência</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-400">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Title & Location (pre-filled if from pending) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Título da Experiência
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Jantar no Trattoria da Enzo"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Local
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">location_on</span>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Roma, Itália"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            Sua Avaliação
                        </label>
                        <StarRatingInput value={rating} onChange={setRating} />
                    </div>

                    {/* Text Review with Audio Option */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-700">
                                Seu Relato
                            </label>
                            <button
                                type="button"
                                onClick={handleRecordToggle}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isRecording
                                        ? 'bg-rose-100 text-rose-600 animate-pulse'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-base">
                                    {isRecording ? 'stop_circle' : 'mic'}
                                </span>
                                {isRecording ? 'Parar Gravação' : 'Gravar Relato'}
                            </button>
                        </div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Descreva sua experiência... O que você sentiu? O que mais gostou? Alguma dica?"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none min-h-[120px]"
                            required
                        />
                    </div>

                    {/* Photos */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            Fotos
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {photos.map((photo, idx) => (
                                <div key={idx} className="relative size-20 rounded-xl overflow-hidden group">
                                    <img src={photo} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-white">delete</span>
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="size-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 flex flex-col items-center justify-center gap-1 transition-all"
                            >
                                <span className="material-symbols-outlined text-gray-400">add_photo_alternate</span>
                                <span className="text-[10px] text-gray-400 font-medium">Adicionar</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            Tags
                        </label>
                        <TagInput tags={tags} onChange={setTags} />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title || !rating || !text}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">save</span>
                            Salvar Memória
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateReviewModal;
