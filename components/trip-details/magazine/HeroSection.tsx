import React from 'react';
import { MagazineImage } from '../../../types/magazine';

interface HeroSectionProps {
    image: MagazineImage;
    headline: string;
    subheadline: string;
    dayNumber: number;
    date: string;
    city: string;
}

/**
 * HeroSection - The hero image and headline for a magazine day spread.
 */
const HeroSection: React.FC<HeroSectionProps> = ({
    image,
    headline,
    subheadline,
    dayNumber,
    date,
    city,
}) => {
    // Format date for display
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
    });

    return (
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-gray-100">
            {/* Background Image */}
            {image.url ? (
                <img
                    src={image.url}
                    alt={image.caption || headline}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                {/* Day Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20">
                        DIA {dayNumber}
                    </span>
                    <span className="text-white/80 text-sm">
                        {city} • {formattedDate}
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                    {headline}
                </h1>

                {/* Subheadline */}
                <p className="text-base md:text-lg text-white/90 max-w-2xl drop-shadow-md">
                    {subheadline}
                </p>

                {/* Image Caption */}
                {image.caption && (
                    <p className="text-xs text-white/60 mt-4 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                        {image.caption}
                        {image.credit && <span>• Foto: {image.credit}</span>}
                    </p>
                )}
            </div>
        </div>
    );
};

export default HeroSection;
