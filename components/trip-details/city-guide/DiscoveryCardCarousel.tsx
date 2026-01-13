import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DiscoveryCardCarouselProps {
    photos: string[];
    name: string;
}

const DiscoveryCardCarousel: React.FC<DiscoveryCardCarouselProps> = ({ photos, name }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [loadedImages, setLoadedImages] = useState<number>(0);

    // Auto-advance photos
    useEffect(() => {
        if (photos.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % photos.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [photos, isHovered]);

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    };

    const goToPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    const handleDotClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setCurrentIndex(index);
    };

    if (!photos || photos.length === 0) return null;

    return (
        <div
            className="relative w-full h-full bg-gray-200 overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Images */}
            {photos.map((photo, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    <img
                        src={photo}
                        alt={`${name} - Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        onLoad={() => setLoadedImages(prev => prev + 1)}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                </div>
            ))}

            {/* Navigation Arrows - Only show on hover and if multiple photos */}
            {photos.length > 1 && (
                <div className={`absolute inset-0 z-20 flex items-center justify-between p-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={goToPrev}
                        className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all transform hover:scale-110"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={goToNext}
                        className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all transform hover:scale-110"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Dots Indicator */}
            {photos.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
                    {photos.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => handleDotClick(e, index)}
                            className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${index === currentIndex
                                    ? 'bg-white w-6'
                                    : 'bg-white/40 w-1.5 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Single Photo Placeholder Check */}
            {loadedImages === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
                    <span className="material-symbols-outlined text-gray-300 text-4xl animate-pulse">image</span>
                </div>
            )}
        </div>
    );
};

export default DiscoveryCardCarousel;
