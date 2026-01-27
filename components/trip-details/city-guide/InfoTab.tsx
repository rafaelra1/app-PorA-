import React, { useState } from 'react';
import { City, CityTab, InfoCidade } from '../../../types';
import { getGeminiService } from '../../../services/geminiService';
import { useTrips } from '@/contexts/TripContext';

interface InfoTabProps {
    city: City;
    cityGuide: any;
    onEditorialChange: (content: string) => void;
    onGenerateEditorial: () => void;
    isGeneratingEditorial: boolean;
    onTabChange: (tab: CityTab) => void;
}

const InfoTab: React.FC<InfoTabProps> = ({
    city,
    onTabChange,
    onGenerateEditorial,
    isGeneratingEditorial,
    onEditorialChange
}) => {
    const { updateTrip, selectedTrip } = useTrips();
    const [info, setInfo] = useState<InfoCidade | undefined>(city.info);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeCategory, setActiveCategory] = useState<keyof InfoCidade['categorias']>('entrada');

    const handleGenerateInfo = async () => {
        setIsGenerating(true);
        try {
            const service = getGeminiService();
            const data = await service.getCityInfo(city.name, city.country || '');
            if (data) {
                setInfo(data);

                // Persist to trip
                if (selectedTrip && selectedTrip.detailedDestinations) {
                    const updatedDestinations = selectedTrip.detailedDestinations.map(dest => {
                        if (dest.id === city.id) {
                            return { ...dest, info: data };
                        }
                        return dest;
                    });

                    await updateTrip({
                        ...selectedTrip,
                        detailedDestinations: updatedDestinations
                    });
                }
            }
        } catch (error) {
            console.error("Failed to generate info:", error);
            alert("Erro ao gerar informações. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Early returns removed to ensure layout is always visible.
    // Loading/Empty states handled inline below.

    const cards = [
        { icon: 'schedule', label: 'FUSO', value: info?.fuso.diferenca, sub: info?.fuso.gmt },
        { icon: 'payments', label: 'MOEDA', value: info?.moeda.nome, sub: info?.moeda.cotacao },
        { icon: 'translate', label: 'IDIOMA', value: info?.idioma.principais[0], sub: info?.idioma.observacao },
        { icon: 'power', label: 'TOMADA', value: info?.tomada.tipo, sub: info?.tomada.voltagem },
        { icon: 'thermostat', label: 'CLIMA', value: info?.clima.temperatura, sub: info?.clima.melhorEpoca },
        { icon: 'call', label: 'TELEFONE', value: info?.telefone.ddi, sub: info?.telefone.operadoras },
        { icon: 'directions_car', label: 'TRÂNSITO', value: info?.transito.mao, sub: info?.transito.observacao },
        { icon: 'water_drop', label: 'ÁGUA', value: info?.agua.qualidade, sub: info?.agua.observacao },
    ];

    const tabs: { id: keyof InfoCidade['categorias']; label: string }[] = [
        { id: 'entrada', label: 'entrada' },
        { id: 'cultura', label: 'cultura' },
        { id: 'custos', label: 'custos' },
        { id: 'saude', label: 'saúde' },
    ];



    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Header: Sub-title + Add Button */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                        <span className="material-symbols-outlined text-lg">info</span>
                    </span>
                    Sobre a Cidade
                </h2>
                <button
                    onClick={onGenerateEditorial} // Or open modal to add text
                    className="size-8 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    title="Adicionar descrição"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                </button>
            </div>

            {/* 3. Text Content */}
            <div className="prose prose-gray max-w-none min-h-[100px]">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                        <div className="size-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500 animate-pulse">Gerando informações...</p>
                    </div>
                ) : (
                    <p className="text-gray-600 leading-relaxed text-sm text-justify">
                        {info?.categorias?.['entrada']
                            ? info.categorias['entrada']
                            : info?.categorias?.[activeCategory]
                                ? info.categorias[activeCategory]
                                : "Nenhuma descrição disponível. Clique no + acima para adicionar informações sobre a cidade."
                        }
                    </p>
                )}
            </div>

            {/* 4. Extra Info Cards - Only show if info exists */}
            {info && !isGenerating && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    {cards.map((card, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                            <div className="size-8 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                                <span className="material-symbols-outlined text-lg">{card.icon}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                                <p className="text-xs font-bold text-gray-900 truncate">{card.value || '-'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={handleGenerateInfo}
                    className="text-xs font-medium text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Atualizar informações
                </button>
            </div>
        </div>
    );
};

export default InfoTab;
