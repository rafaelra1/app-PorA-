import React from 'react';
import { PreTripBriefingData } from '../../../types/preTripBriefing';
import { useChecklist } from '../../../contexts/ChecklistContext';
import { Trip, City } from '../../../types';

interface ActiveAlertsBoxProps {
    data: PreTripBriefingData;
    trip: Trip;
    city?: City | null;
}

export const ActiveAlertsBox: React.FC<ActiveAlertsBoxProps> = ({ data, trip, city }) => {
    const { addTask } = useChecklist();

    const handleAddAlertTask = async (title: string, description: string, category: 'documentation' | 'health' | 'other') => {
        await addTask(title, trip.id, {
            category: category,
            priority: 'blocking',
            description: description
        });
    };

    // Extract alerts from data
    const alerts = [];

    // Visa/Entry Alert
    if (data.entry) {
        if (!data.entry.visaPolicy.isVisaFree) {
            alerts.push({
                id: 'visa',
                type: 'entry',
                icon: 'badge',
                title: 'Visto Necessário',
                description: `Brasileiros precisam de visto ou autorização para ${data.destination}. ${data.entry.visaPolicy.description}`,
                category: 'documentation' as const
            });
        }

        // Passport validity
        alerts.push({
            id: 'passport',
            type: 'entry',
            icon: 'passport',
            title: 'Validade do Passaporte',
            description: 'Verifique se seu passaporte tem pelo menos 6 meses de validade além da data de retorno.',
            category: 'documentation' as const
        });
    }

    // Health/Vaccine Alert
    if (data.entry?.vaccines) {
        if (data.entry.vaccines.mandatory.length > 0) {
            alerts.push({
                id: 'vaccine',
                type: 'health',
                icon: 'vaccines',
                title: 'Vacinas Obrigatórias',
                description: `Exigência de: ${data.entry.vaccines.mandatory.join(', ')}.`,
                category: 'health' as const
            });
        } else if (data.entry.vaccines.recommended.length > 0) {
            alerts.push({
                id: 'vaccine_rec',
                type: 'health',
                icon: 'medical_services',
                title: 'Vacinas Recomendadas',
                description: `Recomendado: ${data.entry.vaccines.recommended.join(', ')}.`,
                category: 'health' as const
            });
        }
    }

    // Safety Alert
    if (data.safety?.safetyLevel) {
        if (data.safety.safetyLevel.status !== 'safe') {
            alerts.push({
                id: 'safety',
                type: 'safety',
                icon: 'warning',
                title: `Atenção: ${data.safety.safetyLevel.label}`,
                description: data.safety.safetyLevel.description,
                category: 'other' as const
            });
        }
    }

    if (alerts.length === 0) return null;

    return (
        <div className="mb-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className="material-symbols-outlined text-orange-500">warning</span>
                <h3 className="font-bold text-gray-800">Alertas Ativos de Viagem</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {city?.name || data.destination}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map(alert => (
                    <div key={alert.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-2">
                            <div className={`size-8 rounded-lg flex items-center justify-center ${alert.type === 'entry' ? 'bg-blue-50 text-blue-600' :
                                alert.type === 'health' ? 'bg-green-50 text-green-600' :
                                    'bg-orange-50 text-orange-600'
                                }`}>
                                <span className="material-symbols-outlined text-lg">{alert.icon}</span>
                            </div>
                            <button
                                onClick={() => handleAddAlertTask(alert.title, alert.description, alert.category)}
                                className="text-gray-400 hover:text-indigo-600 transition-colors tooltip"
                                title="Adicionar ao Checklist"
                            >
                                <span className="material-symbols-outlined">playlist_add</span>
                            </button>
                        </div>

                        <h4 className="font-bold text-gray-900 text-sm mb-1">{alert.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-3 mb-2">{alert.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
