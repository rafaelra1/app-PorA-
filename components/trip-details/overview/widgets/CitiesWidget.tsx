import * as React from 'react';
import { Card } from '../../../ui/Base';
import { City } from '../../../../types';

// =============================================================================
// Types
// =============================================================================

interface CitiesWidgetProps {
    cities: City[];
    onCityClick?: (city: City) => void;
    onNavigate?: () => void;
}

// =============================================================================
// CitiesWidget Component
// =============================================================================

const CitiesWidget: React.FC<CitiesWidgetProps> = ({
    cities,
    onCityClick,
    onNavigate
}) => {
    const displayCities = cities.slice(0, 3);
    const remainingCount = cities.length - 3;
    const visitedCount = 0; // Could be calculated based on dates

    return (
        <Card
            className="p-5 hover:shadow-lg transition-all cursor-pointer group"
            onClick={onNavigate}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-blue-100 rounded-full">
                    Cidades
                </span>
                <span className="text-xs text-text-muted">{cities.length} destinos</span>
            </div>

            {cities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">add_location</span>
                    <p className="text-sm text-text-muted">Adicione cidades ao roteiro</p>
                </div>
            ) : (
                <>
                    {/* City Thumbnails */}
                    <div className="space-y-2 mb-4">
                        {displayCities.map((city, index) => (
                            <div
                                key={city.id}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCityClick?.(city);
                                }}
                            >
                                {/* Thumbnail */}
                                <div className="size-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <img
                                        src={city.image}
                                        alt={city.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-text-main truncate">{city.name}</p>
                                    <p className="text-[10px] text-text-muted">{city.nights} noites</p>
                                </div>

                                {/* Arrow */}
                                <span className="material-symbols-outlined text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    chevron_right
                                </span>
                            </div>
                        ))}

                        {/* +X More */}
                        {remainingCount > 0 && (
                            <div className="flex items-center justify-center py-2">
                                <span className="text-xs font-medium text-primary">
                                    +{remainingCount} mais
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Progress Dots */}
                    <div className="flex items-center gap-1.5 justify-center">
                        {cities.map((_, index) => (
                            <div
                                key={index}
                                className={`size-2 rounded-full transition-colors ${index < visitedCount
                                        ? 'bg-emerald-500'
                                        : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-center text-[10px] text-text-muted mt-1.5">
                        {visitedCount} de {cities.length} cidades visitadas
                    </p>
                </>
            )}
        </Card>
    );
};

export default CitiesWidget;
