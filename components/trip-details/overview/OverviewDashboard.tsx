import React, { useState, useEffect } from 'react';
import { OverviewInfoCards } from './OverviewInfoCards';
import { City, Trip } from '../../../types';
import SmartChecklist from '../SmartChecklist';
import { LuggageView } from '../checklist/LuggageView';
import { ActiveAlertsBox } from '../pre-trip/ActiveAlertsBox';
// Using ActiveAlertsBox requires data. I need to see where data comes from.
// TripDetails has `preTripData`. I might need to pass it down.
// Or fetch it here? Ideally passed down.

interface OverviewDashboardProps {
    cities: City[];
    trip: Trip;
    nextActivity?: { title: string; time: string; date: string } | null;
    // We can remove the old onX handlers since navigation is internal now.
    // Unless we want to keep them as fallbacks or for specific outer logic.
    // I will keep them optional but implementing internal logic.

    // Data for alerts
    preTripData?: any; // Define proper type
}

type DashboardTab = 'alerts' | 'checklist' | 'luggage' | null;

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
    cities,
    trip,
    nextActivity,
    preTripData
}) => {
    // Internal navigation state
    const [activeTab, setActiveTab] = useState<DashboardTab>('checklist'); // Default to checklist or null? Or 'alerts'?
    // User asked: "ao clicar nelas devem abrir". Maybe default is closed?
    // User also said: "Ajuste a tipografia, cores e tamanhos dos boxes para nao perder a identidade visual da pagina inicial"
    // Let's toggle. If I click active, it closes? Or acts as tabs.
    // I will treating them as tabs. Defaulting to one is good for discovery, but maybe null to keep clean?
    // Let's default to null to show "Overview" properly, or maybe standard state.
    // Actually, let's keep it null so the buttons act as "Opening" the section.

    // Slideshow Logic (Same as before)
    const allImages = cities.flatMap(c =>
        c.image ? [{ url: c.image, label: c.name }] : []
    );
    if (allImages.length === 0) {
        allImages.push({ url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', label: trip.destination });
        allImages.push({ url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', label: trip.destination });
        allImages.push({ url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', label: trip.destination });
    }
    while (allImages.length < 3) allImages.push(allImages[allImages.length % allImages.length]);

    const [startIndex, setStartIndex] = useState(0);
    useEffect(() => {
        if (allImages.length <= 3) return;
        const interval = setInterval(() => setStartIndex((prev) => (prev + 1) % allImages.length), 4000);
        return () => clearInterval(interval);
    }, [allImages.length]);

    const visibleImages = [
        allImages[startIndex % allImages.length],
        allImages[(startIndex + 1) % allImages.length],
        allImages[(startIndex + 2) % allImages.length]
    ];

    const handleTabClick = (tab: DashboardTab) => {
        setActiveTab(prev => prev === tab ? null : tab);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Gallery Section */}
            <div className="grid grid-cols-3 gap-3 h-[200px]">
                {visibleImages.map((img, i) => (
                    <div key={i} className="relative rounded-2xl overflow-hidden shadow-sm group">
                        <img
                            src={img.url}
                            alt={img.label}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                            <p className="text-white font-bold text-sm drop-shadow-md">{img.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Cards Row */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50">
                <OverviewInfoCards nextActivity={nextActivity} />
            </div>

            {/* Quick Actions / Internal Tabs - Reduced Height */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                    onClick={() => handleTabClick('alerts')}
                    className={`h-12 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 group
                ${activeTab === 'alerts'
                            ? 'bg-[#E67E22] text-white ring-2 ring-offset-2 ring-[#E67E22]'
                            : 'bg-[#FF9F43] text-white hover:bg-[#ffaa5b]'
                        }
            `}
                >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">notifications_active</span>
                    alertas
                </button>

                <button
                    onClick={() => handleTabClick('checklist')}
                    className={`h-12 rounded-xl font-semibold text-sm shadow-sm border border-gray-100 transition-all flex items-center justify-center gap-2 group
                ${activeTab === 'checklist'
                            ? 'bg-gray-100 text-[#1A1A1A] ring-2 ring-offset-2 ring-gray-200'
                            : 'bg-white text-[#1A1A1A] hover:bg-gray-50'
                        }
            `}
                >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">checklist</span>
                    checklist
                </button>

                <button
                    onClick={() => handleTabClick('luggage')}
                    className={`h-12 rounded-xl font-semibold text-sm shadow-sm border border-gray-100 transition-all flex items-center justify-center gap-2 group
                ${activeTab === 'luggage'
                            ? 'bg-gray-100 text-[#1A1A1A] ring-2 ring-offset-2 ring-gray-200'
                            : 'bg-white text-[#1A1A1A] hover:bg-gray-50'
                        }
            `}
                >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">luggage</span>
                    bagagem
                </button>
            </div>

            {/* Internal Content Area */}
            {activeTab && (
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm ring-1 ring-black/5 animate-in fade-in slide-in-from-top-4 duration-300">

                    {activeTab === 'alerts' && (
                        <div>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FF9F43]">notifications</span>
                                Alertas da Viagem
                            </h3>
                            {preTripData ? (
                                <ActiveAlertsBox data={preTripData} trip={trip} />
                            ) : (
                                <p className="text-gray-500">Nenhum alerta disponível no momento.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'checklist' && (
                        <SmartChecklist />
                    )}

                    {activeTab === 'luggage' && (
                        <LuggageView />
                    )}

                </div>
            )}

        </div>
    );
};
