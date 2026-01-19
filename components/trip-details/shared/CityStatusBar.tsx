import * as React from 'react';
import { City, HotelReservation } from '../../../types';

interface CityStatusBarProps {
    cities: City[];
    hotels: HotelReservation[];
    selectedCity?: string;
    onCitySelect?: (cityId: string | undefined) => void;
}

/**
 * Horizontal scrollable bar showing cities with hotel reservation status
 * Shows a check icon if there's at least one confirmed hotel for that city
 */
const CityStatusBar: React.FC<CityStatusBarProps> = ({
    cities,
    hotels,
    selectedCity,
    onCitySelect,
}) => {
    if (!cities || cities.length === 0) return null;

    // Check if a city has a confirmed hotel
    const cityHasHotel = (cityId: string, cityName: string): boolean => {
        return hotels.some(hotel =>
            (hotel.cityId === cityId ||
                hotel.address?.toLowerCase().includes(cityName.toLowerCase()) ||
                hotel.name?.toLowerCase().includes(cityName.toLowerCase())) &&
            hotel.status === 'confirmed'
        );
    };

    // Check if city has pending hotel (not confirmed)
    const cityHasPendingHotel = (cityId: string, cityName: string): boolean => {
        return hotels.some(hotel =>
            (hotel.cityId === cityId ||
                hotel.address?.toLowerCase().includes(cityName.toLowerCase()) ||
                hotel.name?.toLowerCase().includes(cityName.toLowerCase())) &&
            hotel.status === 'pending'
        );
    };

    return (
        <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/80 rounded-2xl p-3 border border-indigo-100/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-indigo-500 text-sm">location_city</span>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Cidades do Roteiro</span>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {/* All cities option */}
                <button
                    onClick={() => onCitySelect?.(undefined)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${!selectedCity
                            ? 'bg-white text-indigo-700 shadow-md ring-2 ring-indigo-200'
                            : 'bg-white/60 text-text-muted hover:bg-white hover:shadow-sm border border-white/80'
                        }`}
                >
                    <span className="material-symbols-outlined text-sm">public</span>
                    Todas
                </button>

                {cities.map((city) => {
                    const hasConfirmedHotel = cityHasHotel(city.id, city.name);
                    const hasPendingHotel = cityHasPendingHotel(city.id, city.name);
                    const isSelected = selectedCity === city.id;

                    return (
                        <button
                            key={city.id}
                            onClick={() => onCitySelect?.(city.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${isSelected
                                    ? 'bg-white text-indigo-700 shadow-md ring-2 ring-indigo-200'
                                    : 'bg-white/60 text-text-muted hover:bg-white hover:shadow-sm border border-white/80'
                                }`}
                        >
                            {/* City Name */}
                            <span>{city.name}</span>

                            {/* Status Icon */}
                            {hasConfirmedHotel ? (
                                <span className="flex items-center justify-center size-5 rounded-full bg-green-100 text-green-600">
                                    <span className="material-symbols-outlined text-xs fill">check_circle</span>
                                </span>
                            ) : hasPendingHotel ? (
                                <span className="flex items-center justify-center size-5 rounded-full bg-amber-100 text-amber-600">
                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center size-5 rounded-full bg-gray-100 text-gray-400">
                                    <span className="material-symbols-outlined text-xs">hotel</span>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-indigo-100/50">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="size-4 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600 text-[10px] fill">check_circle</span>
                    </span>
                    <span>Hotel confirmado</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="size-4 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600 text-[10px]">schedule</span>
                    </span>
                    <span>Pendente</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <span className="size-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 text-[10px]">hotel</span>
                    </span>
                    <span>Sem reserva</span>
                </div>
            </div>
        </div>
    );
};

export default CityStatusBar;
