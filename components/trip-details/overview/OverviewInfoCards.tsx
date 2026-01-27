import React from 'react';

interface OverviewInfoCardsProps {
    nextActivity?: { title: string; time: string; date: string } | null;
}

export const OverviewInfoCards: React.FC<OverviewInfoCardsProps> = ({ nextActivity }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Weather Card (2 cols) */}
            <div className="md:col-span-2 bg-[#F0F0F0] rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
                <p className="text-xl font-medium text-[#1A1A1A]">Tempo</p>
                <div className="flex items-center gap-2">
                    {/* Mock Weather Data */}
                    <span className="material-symbols-outlined text-4xl text-[#1A1A1A]">partly_cloudy_day</span>
                    <div>
                        <p className="text-3xl font-black text-[#1A1A1A]">28°</p>
                        <p className="text-xs text-[#1A1A1A]/60 font-bold uppercase">Rio de Janeiro</p>
                    </div>
                </div>
            </div>

            {/* Next Activity Card (3 cols) */}
            <div className="md:col-span-3 bg-[#F0F0F0] rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
                <p className="text-xl font-medium text-[#1A1A1A]">Próxima Atividade</p>
                <div>
                    {nextActivity ? (
                        <>
                            <p className="text-2xl font-bold text-[#1A1A1A] leading-tight mb-1">{nextActivity.title}</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-[10px] font-bold rounded uppercase">
                                    {nextActivity.time}
                                </span>
                                <p className="text-sm font-medium text-[#1A1A1A]/60">{nextActivity.date}</p>
                            </div>
                        </>
                    ) : (
                        <p className="text-lg text-[#1A1A1A]/40 font-medium">Nenhuma atividade agendada</p>
                    )}
                </div>
            </div>
        </div>
    );
};
