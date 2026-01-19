import React from 'react';

interface BriefingHeaderProps {
    destination: string;
    details: string; // "Lisboa & Porto • 7 dias • Fevereiro"
    hookMessage: string;
}

export const BriefingHeader: React.FC<BriefingHeaderProps> = ({ destination, details, hookMessage }) => {
    return (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 p-6 md:p-8 text-white relative overflow-hidden shadow-lg mb-6">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-9xl">travel_explore</span>
            </div>

            <div className="relative z-10 max-w-4xl">
                <div className="flex items-center gap-2 mb-3 text-indigo-200 uppercase tracking-widest text-[10px] font-bold">
                    <span className="material-symbols-outlined text-sm">checklist</span>
                    Guia do Destino
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                    Preparativos da Viagem
                </h1>

                <p className="text-indigo-100 text-base md:text-lg font-medium opacity-90 leading-relaxed max-w-3xl">
                    {details}
                </p>

                {/* Optional: Keep hook message but simpler/integrated if needed, or remove as per plan. 
                    Plan said "Remove repetitive text". I will omit the hook message bubble for cleaner look.
                    The 'details' prop now carries the list of cities which acts as the subtitle.
                */}
            </div>
        </div>
    );
};
