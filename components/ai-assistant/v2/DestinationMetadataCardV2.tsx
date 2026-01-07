import React from 'react';
import { DestinationMetadata } from '../../../types';

interface DestinationMetadataCardV2Props {
    metadata: DestinationMetadata;
}

const DestinationMetadataCardV2: React.FC<DestinationMetadataCardV2Props> = ({ metadata }) => {
    const infoItems = [
        {
            icon: 'schedule',
            label: 'Fuso Horário',
            value: metadata.timezone,
        },
        {
            icon: 'currency_exchange',
            label: 'Moeda',
            value: `${metadata.currency.code} (${metadata.currency.symbol})`,
            extra: metadata.currency.rateToBRL ? `1 ${metadata.currency.code} = R$ ${metadata.currency.rateToBRL.toFixed(2)}` : undefined,
        },
        {
            icon: 'translate',
            label: 'Idioma',
            value: metadata.language,
        },
        {
            icon: 'electrical_services',
            label: 'Voltagem',
            value: metadata.voltage || 'N/A',
            extra: metadata.plugType ? `Tomada tipo ${metadata.plugType}` : undefined,
        },
    ];

    return (
        <div className="bg-white rounded-2xl border border-[#EDEFF3] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#6B68FF] to-[#9F9FB1] p-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-white text-2xl">public</span>
                    <div>
                        <h3 className="text-white font-bold text-lg">{metadata.name}</h3>
                        <p className="text-white/80 text-sm">{metadata.country}</p>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-0">
                {infoItems.map((item, idx) => (
                    <div
                        key={idx}
                        className={`p-4 ${idx % 2 === 0 ? 'border-r border-[#EDEFF3]' : ''} ${idx < 2 ? 'border-b border-[#EDEFF3]' : ''}`}
                    >
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[#6B68FF] text-xl">{item.icon}</span>
                            <div>
                                <p className="text-xs text-[#9F9FB1] uppercase font-medium">{item.label}</p>
                                <p className="text-[#1F1F1F] font-semibold">{item.value}</p>
                                {item.extra && (
                                    <p className="text-xs text-[#9F9FB1] mt-0.5">{item.extra}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visa Info */}
            {metadata.visaRequired !== undefined && (
                <div className={`p-4 border-t border-[#EDEFF3] flex items-center gap-3 ${metadata.visaRequired ? 'bg-yellow-50' : 'bg-green-50'
                    }`}>
                    <span className={`material-symbols-outlined text-xl ${metadata.visaRequired ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                        {metadata.visaRequired ? 'warning' : 'check_circle'}
                    </span>
                    <div>
                        <p className={`font-medium ${metadata.visaRequired ? 'text-yellow-700' : 'text-green-700'}`}>
                            {metadata.visaRequired ? 'Visto Necessário' : 'Visto Dispensado'}
                        </p>
                        {metadata.visaNotes && (
                            <p className="text-sm text-[#9F9FB1]">{metadata.visaNotes}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Emergency Numbers */}
            {metadata.emergencyNumbers && (
                <div className="p-4 border-t border-[#EDEFF3] bg-[#EDEFF3]/50">
                    <p className="text-xs text-[#9F9FB1] uppercase font-medium mb-2">Emergências</p>
                    <div className="flex flex-wrap gap-3">
                        {metadata.emergencyNumbers.police && (
                            <span className="text-sm text-[#1F1F1F]">
                                <span className="text-[#9F9FB1]">Polícia:</span> {metadata.emergencyNumbers.police}
                            </span>
                        )}
                        {metadata.emergencyNumbers.ambulance && (
                            <span className="text-sm text-[#1F1F1F]">
                                <span className="text-[#9F9FB1]">Ambulância:</span> {metadata.emergencyNumbers.ambulance}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Travel Advisory */}
            {metadata.travelAdvisory && (
                <div className="p-4 border-t border-[#EDEFF3] bg-orange-50">
                    <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-orange-500 text-xl">info</span>
                        <p className="text-sm text-orange-700">{metadata.travelAdvisory}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DestinationMetadataCardV2;
