import * as React from 'react';
import { TripMemory, ReviewContent } from '../../types';

interface MemoryCardProps {
    memory: TripMemory;
    onDelete?: (id: string) => void;
    onShare?: (id: string) => void;
}

// Helper to check if content is ReviewContent
const isReviewContent = (content: TripMemory['content']): content is ReviewContent => {
    return 'rating' in content;
};

// Star Rating Component
const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <span
                key={star}
                className={`material-symbols-outlined text-base ${star <= rating ? 'text-amber-400' : 'text-gray-200'
                    }`}
                style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
            >
                star
            </span>
        ))}
    </div>
);

// Photo Gallery Component
const PhotoGallery: React.FC<{ photos: string[] }> = ({ photos }) => {
    if (photos.length === 0) return null;

    if (photos.length === 1) {
        return (
            <div className="relative aspect-video rounded-xl overflow-hidden">
                <img
                    src={photos[0]}
                    alt="Memory"
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    // Grid layout for multiple photos
    return (
        <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 row-span-2 relative aspect-square rounded-xl overflow-hidden">
                <img
                    src={photos[0]}
                    alt="Memory principal"
                    className="w-full h-full object-cover"
                />
            </div>
            {photos.slice(1, 3).map((photo, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                    <img
                        src={photo}
                        alt={`Memory ${idx + 2}`}
                        className="w-full h-full object-cover"
                    />
                    {idx === 1 && photos.length > 3 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">+{photos.length - 3}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// Tag Pills Component
const TagPills: React.FC<{ tags: string[] }> = ({ tags }) => {
    const tagColors: Record<string, string> = {
        'Gastronomia': 'bg-orange-100 text-orange-700',
        'Cultura': 'bg-purple-100 text-purple-700',
        'Natureza': 'bg-green-100 text-green-700',
        'Jantar': 'bg-rose-100 text-rose-700',
        'Vibe Local': 'bg-cyan-100 text-cyan-700',
        'Romântico': 'bg-pink-100 text-pink-700',
        'Aventura': 'bg-amber-100 text-amber-700',
        'Compras': 'bg-blue-100 text-blue-700',
    };

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
                <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${tagColors[tag] || 'bg-gray-100 text-gray-600'
                        }`}
                >
                    {tag}
                </span>
            ))}
        </div>
    );
};

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onDelete, onShare }) => {
    const isReview = isReviewContent(memory.content);
    const reviewContent = isReview ? memory.content as ReviewContent : null;
    const photos = isReview
        ? (memory.content as ReviewContent).photos
        : (memory.content as { images: string[] }).images || [];
    const text = isReview
        ? (memory.content as ReviewContent).text
        : (memory.content as { text: string }).text;
    const tags = isReview ? (memory.content as ReviewContent).tags : [];
    const title = isReview ? (memory.content as ReviewContent).title : null;

    const formattedDate = new Date(memory.timestamp).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const formattedTime = new Date(memory.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
            {/* Header */}
            <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Type Badge */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isReview
                                    ? 'bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                <span className="material-symbols-outlined text-sm">
                                    {isReview ? 'rate_review' : 'edit_note'}
                                </span>
                                {isReview ? 'Avaliação' : 'Relato'}
                            </span>
                            <span className="text-xs text-gray-400">
                                {formattedDate} • {formattedTime}
                            </span>
                        </div>

                        {/* Title */}
                        {title && (
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                                {title}
                            </h3>
                        )}

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <span className="material-symbols-outlined text-base">location_on</span>
                            {memory.location}
                        </div>
                    </div>

                    {/* Rating (if Review) */}
                    {isReview && reviewContent && (
                        <div className="flex flex-col items-end gap-1">
                            <StarRating rating={reviewContent.rating} />
                            <span className="text-xs font-medium text-gray-400">
                                {reviewContent.rating}/5
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Gallery */}
            {photos.length > 0 && (
                <div className="px-5 pb-4">
                    <PhotoGallery photos={photos} />
                </div>
            )}

            {/* Content Text */}
            <div className="px-5 pb-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {text}
                </p>

                {/* Audio Transcription Indicator */}
                {reviewContent?.transcriptionUrl && (
                    <button className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-600">
                        <span className="material-symbols-outlined text-base text-purple-500">mic</span>
                        <span className="font-medium">Ouvir relato original</span>
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex items-center justify-between gap-4">
                {/* Tags */}
                <div className="flex-1 min-w-0">
                    {tags.length > 0 && <TagPills tags={tags} />}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {onShare && (
                        <button
                            onClick={() => onShare(memory.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">auto_stories</span>
                            Gerar Story
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(memory.id)}
                            className="p-2 rounded-lg hover:bg-rose-50 text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemoryCard;
