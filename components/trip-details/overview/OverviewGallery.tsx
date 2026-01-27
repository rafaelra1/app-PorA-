import React from 'react';
import { City } from '../../../types';

interface OverviewGalleryProps {
    cities: City[];
}

export const OverviewGallery: React.FC<OverviewGalleryProps> = ({ cities }) => {
    const images = cities.map(c => c.image).filter(Boolean).slice(0, 3);
    // Fill with placeholders if less than 3
    while (images.length < 3) {
        images.push('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop');
    }

    return (
        <div className="grid grid-cols-3 gap-4 h-48 md:h-64">
            {images.map((img, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <img src={img} alt="Gallery" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
            ))}
        </div>
    );
};
