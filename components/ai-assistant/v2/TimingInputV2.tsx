import React, { useState } from 'react';
import {
    TravelTiming,
    TravelTimingExact,
    TravelTimingMonth,
    TravelTimingFlexible,
    SeasonPreference,
    TravelTimingType,
} from '../../../types';

interface TimingInputV2Props {
    value: TravelTiming | null;
    onChange: (timing: TravelTiming) => void;
}

const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const seasonOptions: { value: SeasonPreference; label: string; icon: string }[] = [
    { value: 'summer', label: 'Verão', icon: '☀️' },
    { value: 'winter', label: 'Inverno', icon: '❄️' },
    { value: 'shoulder', label: 'Meia-estação', icon: '🍂' },
    { value: 'no_rain', label: 'Sem chuva', icon: '🌤️' },
    { value: 'any', label: 'Qualquer', icon: '🌍' },
];

const TimingInputV2: React.FC<TimingInputV2Props> = ({ value, onChange }) => {
    const [activeTab, setActiveTab] = useState<TravelTimingType>(value?.type || 'exact');

    // Local state for each mode
    const [exactDates, setExactDates] = useState<{ start: string; end: string }>({
        start: (value as TravelTimingExact)?.startDate || '',
        end: (value as TravelTimingExact)?.endDate || '',
    });

    const [monthData, setMonthData] = useState<{ month: number; year: number; duration: number }>({
        month: (value as TravelTimingMonth)?.month || new Date().getMonth() + 1,
        year: (value as TravelTimingMonth)?.year || new Date().getFullYear(),
        duration: (value as TravelTimingMonth)?.duration || 7,
    });

    const [flexData, setFlexData] = useState<{ duration: number; season: SeasonPreference }>({
        duration: (value as TravelTimingFlexible)?.duration || 7,
        season: (value as TravelTimingFlexible)?.seasonPreference || 'any',
    });

    const handleExactChange = (field: 'start' | 'end', val: string) => {
        const updated = { ...exactDates, [field]: val };
        setExactDates(updated);
        if (updated.start && updated.end) {
            onChange({ type: 'exact', startDate: updated.start, endDate: updated.end });
        }
    };

    const handleMonthChange = (field: 'month' | 'year' | 'duration', val: number) => {
        const updated = { ...monthData, [field]: val };
        setMonthData(updated);
        onChange({ type: 'month', ...updated });
    };

    const handleFlexChange = (field: 'duration' | 'season', val: number | SeasonPreference) => {
        const updated = { ...flexData, [field]: val };
        setFlexData(updated as typeof flexData);
        onChange({ type: 'flexible', duration: updated.duration, seasonPreference: updated.season });
    };

    const tabs: { id: TravelTimingType; label: string; icon: string }[] = [
        { id: 'exact', label: 'Datas Exatas', icon: 'event' },
        { id: 'month', label: 'Mês Específico', icon: 'calendar_month' },
        { id: 'flexible', label: 'Flexível', icon: 'event_available' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B68FF]">schedule</span>
                    Quando você quer viajar?
                </h3>
                <p className="text-sm text-[#9F9FB1] mt-1">
                    Escolha datas específicas ou deixe flexível para mais opções.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-[#EDEFF3] rounded-2xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-[#6B68FF] shadow-sm'
                                : 'text-[#9F9FB1] hover:text-[#1F1F1F]'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content based on active tab */}
            <div className="bg-white rounded-2xl p-6 border border-[#EDEFF3]">
                {activeTab === 'exact' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                                    Data de Ida
                                </label>
                                <input
                                    type="date"
                                    value={exactDates.start}
                                    onChange={(e) => handleExactChange('start', e.target.value)}
                                    className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] focus:border-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                                    Data de Volta
                                </label>
                                <input
                                    type="date"
                                    value={exactDates.end}
                                    onChange={(e) => handleExactChange('end', e.target.value)}
                                    min={exactDates.start}
                                    className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] focus:border-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                                />
                            </div>
                        </div>
                        {exactDates.start && exactDates.end && (
                            <div className="bg-[#6B68FF]/10 rounded-xl p-4 flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#6B68FF]">info</span>
                                <span className="text-sm text-[#6B68FF]">
                                    {Math.ceil((new Date(exactDates.end).getTime() - new Date(exactDates.start).getTime()) / (1000 * 60 * 60 * 24))} dias de viagem
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'month' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                                    Mês
                                </label>
                                <select
                                    value={monthData.month}
                                    onChange={(e) => handleMonthChange('month', parseInt(e.target.value))}
                                    className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                                >
                                    {monthNames.map((name, idx) => (
                                        <option key={idx} value={idx + 1}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                                    Ano
                                </label>
                                <select
                                    value={monthData.year}
                                    onChange={(e) => handleMonthChange('year', parseInt(e.target.value))}
                                    className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                                >
                                    {[2025, 2026, 2027].map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                                    Duração
                                </label>
                                <select
                                    value={monthData.duration}
                                    onChange={(e) => handleMonthChange('duration', parseInt(e.target.value))}
                                    className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                                >
                                    {[3, 5, 7, 10, 14, 21, 30].map((d) => (
                                        <option key={d} value={d}>{d} dias</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'flexible' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-2">
                                Duração Desejada
                            </label>
                            <select
                                value={flexData.duration}
                                onChange={(e) => handleFlexChange('duration', parseInt(e.target.value))}
                                className="w-full rounded-xl border-[#EDEFF3] bg-[#EDEFF3] focus:ring-2 focus:ring-[#6B68FF] py-3 px-4 text-[#1F1F1F]"
                            >
                                {[3, 5, 7, 10, 14, 21, 30].map((d) => (
                                    <option key={d} value={d}>{d} dias</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9F9FB1] uppercase mb-3">
                                Preferência de Estação
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {seasonOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleFlexChange('season', option.value)}
                                        className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${flexData.season === option.value
                                                ? 'bg-[#6B68FF] text-white shadow-md'
                                                : 'bg-[#EDEFF3] text-[#1F1F1F] hover:bg-[#6B68FF]/10'
                                            }`}
                                    >
                                        <span>{option.icon}</span>
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimingInputV2;
