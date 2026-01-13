import React from 'react';
import { Card } from '../../ui/Base';

const DiscoveryCardSkeleton: React.FC = () => {
    return (
        <div className="w-full max-w-md mx-auto aspect-[3/4] relative">
            <Card className="w-full h-full overflow-hidden flex flex-col p-0 border-0 shadow-xl rounded-[2rem] bg-white relative z-10 discovery-skeleton-card">
                {/* Image Placeholder */}
                <div className="h-[60%] w-full bg-gray-200 animate-pulse relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Badge Placeholder */}
                    <div className="absolute top-4 left-4 w-24 h-8 bg-white/20 backdrop-blur-md rounded-full animate-pulse" />
                </div>

                {/* Content Placeholder */}
                <div className="flex-1 p-6 flex flex-col justify-between bg-white relative">
                    <div className="space-y-4">
                        {/* Title */}
                        <div className="h-8 bg-gray-100 rounded-lg w-[80%] animate-pulse" />

                        {/* Rating Row */}
                        <div className="flex items-center gap-3">
                            <div className="h-5 bg-gray-100 rounded w-12 animate-pulse" />
                            <div className="h-5 bg-gray-100 rounded w-24 animate-pulse" />
                            <div className="h-5 bg-gray-100 rounded w-16 animate-pulse" />
                        </div>

                        {/* Description */}
                        <div className="space-y-2 pt-2">
                            <div className="h-4 bg-gray-50 rounded w-full animate-pulse" />
                            <div className="h-4 bg-gray-50 rounded w-[90%] animate-pulse" />
                            <div className="h-4 bg-gray-50 rounded w-[60%] animate-pulse" />
                        </div>
                    </div>

                    {/* AI Reason Placeholder */}
                    <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                        <div className="h-3 bg-indigo-100 rounded w-full mb-2 animate-pulse" />
                        <div className="h-3 bg-indigo-100 rounded w-[80%] animate-pulse" />
                    </div>
                </div>

                {/* Buttons Placeholder */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-20">
                    <div className="w-14 h-14 rounded-full bg-gray-100 border-4 border-white shadow-lg animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-white shadow-xl animate-pulse -mt-4" />
                    <div className="w-14 h-14 rounded-full bg-gray-100 border-4 border-white shadow-lg animate-pulse" />
                </div>
            </Card>

            {/* Stack Effect for background cards */}
            <div className="absolute top-4 left-4 right-4 bottom-0 bg-white/80 rounded-[2rem] shadow-lg -z-10 transform scale-[0.95]" />
            <div className="absolute top-8 left-8 right-8 bottom-0 bg-white/60 rounded-[2rem] shadow shadow-lg -z-20 transform scale-[0.90]" />
        </div>
    );
};

export default DiscoveryCardSkeleton;
