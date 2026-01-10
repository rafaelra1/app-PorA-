import * as React from 'react';
import { CountryInfo, CostOfLiving } from '../../../types';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface CountryInfoCardProps {
    countryInfo?: CountryInfo | null;
    costOfLiving?: CostOfLiving | null;
    countryName: string;
    isLoading?: boolean;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface InfoItemProps {
    icon: string;
    label: string;
    value: string;
    iconColor?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, iconColor = 'text-primary' }) => (
    <div className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
        <div className={`size-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 ${iconColor}`}>
            <span className="material-symbols-outlined text-sm">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[8px] text-text-muted uppercase tracking-wider font-bold leading-tight mb-0.5">{label}</p>
            <p className="text-[10px] font-bold text-text-main truncate leading-tight" title={value}>{value}</p>
        </div>
    </div>
);

interface CostBarProps {
    label: string;
    value: number;
    maxValue: number;
    prefix?: string;
}

const CostBar: React.FC<CostBarProps> = ({ label, value, maxValue, prefix = '$' }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">{label}</span>
                <span className="font-bold text-text-main">{prefix}{value}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

// =============================================================================
// Main Component
// =============================================================================

const CountryInfoCard: React.FC<CountryInfoCardProps> = ({
    countryInfo,
    costOfLiving,
    countryName,
    isLoading
}) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-text-muted">Carregando informações do país...</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!countryInfo) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100/50 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">public</span>
                    <h4 className="font-bold text-text-main text-sm">Informações de {countryName}</h4>
                </div>
                {countryInfo.visaRequired ? (
                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">warning</span>
                        Visto
                    </span>
                ) : (
                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">check_circle</span>
                        Livre
                    </span>
                )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-2">
                <InfoItem
                    icon="payments"
                    label="Moeda"
                    value={`${countryInfo.currency.symbol} ${countryInfo.currency.code}`}
                    iconColor="text-emerald-500"
                />
                <InfoItem
                    icon="translate"
                    label="Idioma"
                    value={countryInfo.language}
                    iconColor="text-blue-500"
                />
                <InfoItem
                    icon="schedule"
                    label="Fuso Horário"
                    value={countryInfo.timezone}
                    iconColor="text-indigo-500"
                />
                <InfoItem
                    icon="electrical_services"
                    label="Tomada"
                    value={countryInfo.plugType}
                    iconColor="text-amber-500"
                />
                <InfoItem
                    icon="emergency"
                    label="Emergência"
                    value={countryInfo.emergencyNumber}
                    iconColor="text-rose-500"
                />
                <InfoItem
                    icon="directions_car"
                    label="Mão de Direção"
                    value={countryInfo.drivingSide === 'right' ? 'Direita' : 'Esquerda'}
                    iconColor="text-cyan-500"
                />
            </div>

            {/* Cost of Living Section */}
            {costOfLiving && (
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">savings</span>
                            <h5 className="font-bold text-sm text-text-main">Custo de Vida</h5>
                        </div>
                        <div className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${costOfLiving.overall <= 80 ? 'bg-green-100 text-green-700' :
                            costOfLiving.overall <= 120 ? 'bg-blue-100 text-blue-700' :
                                costOfLiving.overall <= 150 ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                            }`}>
                            {costOfLiving.overall <= 80 ? 'Mais barato que BR' :
                                costOfLiving.overall <= 120 ? 'Similar ao BR' :
                                    costOfLiving.overall <= 150 ? '~30% mais caro' :
                                        'Bem mais caro'}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <CostBar label="Refeição (restaurante)" value={costOfLiving.restaurant} maxValue={50} />
                        <CostBar label="Transporte (dia)" value={costOfLiving.transport} maxValue={15} />
                        <CostBar label="Hotel (diária)" value={costOfLiving.hotel} maxValue={200} />
                    </div>

                    <p className="text-[9px] text-text-muted mt-3 text-center">
                        Valores médios em USD • Índice geral: {costOfLiving.overall}% do custo brasileiro
                    </p>
                </div>
            )}
        </div>
    );
};

export default CountryInfoCard;
