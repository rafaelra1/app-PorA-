import React from 'react';
import { Trip, City } from '../../../types';
import { Card } from '../../ui/Base';
import { getGeminiService } from '../../../services/geminiService';

// Reusing the CityAlertsBox component structure from OverviewTab
// Ideally, CityAlertsBox should be a shared component, but for now we inline it 
// or import if possible. Since it's not exported from OverviewTab, I'll reimplement it here
// with potential improvements.

const CityAlertsBox: React.FC<{ cities: City[] }> = ({ cities }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [alerts, setAlerts] = React.useState<{
        id: string;
        type: 'warning' | 'info' | 'danger';
        title: string;
        message: string;
        icon: string;
        city?: string;
        details?: string;
        isExpanded?: boolean;
        isLoadingDetails?: boolean;
    }[]>([]);

    React.useEffect(() => {
        if (cities.length === 0) return;

        setIsLoading(true);
        const fetchAlerts = async () => {
            try {
                const geminiService = getGeminiService();
                const citiesData = cities.map(c => ({ name: c.name, country: c.country }));
                const generatedAlerts = await geminiService.generateTripAlerts(citiesData);

                if (generatedAlerts && generatedAlerts.length > 0) {
                    setAlerts(generatedAlerts.map(alert => ({
                        ...alert,
                        city: alert.cities?.join(', '),
                    })));
                }
            } catch (error) {
                console.error('Error generating alerts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlerts();
    }, [cities]);

    const generateMoreDetails = async (alertId: string) => {
        const targetAlert = alerts.find(a => a.id === alertId);
        if (!targetAlert) return;

        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, isLoadingDetails: true } : a
        ));

        try {
            const geminiService = getGeminiService();
            const details = await geminiService.generateAlertDetails(
                targetAlert.title,
                targetAlert.message,
                targetAlert.city
            );

            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, details, isExpanded: true, isLoadingDetails: false } : a
            ));
        } catch (error) {
            console.error('Error generating details:', error);
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, isLoadingDetails: false } : a
            ));
        }
    };

    const toggleExpand = (alertId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, isExpanded: !a.isExpanded } : a
        ));
    };

    const getIconBg = (type: 'warning' | 'info' | 'danger') => {
        switch (type) {
            case 'danger': return 'bg-red-100 text-red-600';
            case 'warning': return 'bg-amber-100 text-amber-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    if (alerts.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-green-500">check_circle</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tudo tranquilo!</h3>
                <p className="text-gray-500 max-w-md">
                    Não encontramos alertas urgentes ou avisos de risco para seus destinos. Boa viagem!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="size-12 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin mb-4" />
                    <p className="font-medium text-gray-600 animate-pulse">Consultando assistente de segurança...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {alerts.map(alert => (
                        <Card key={alert.id} className="overflow-hidden hover:shadow-md transition-all duration-300">
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className={`size-12 rounded-xl ${getIconBg(alert.type)} flex items-center justify-center shrink-0`}>
                                        <span className="material-symbols-outlined text-2xl">{alert.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 mb-1">{alert.title}</h4>
                                        {alert.city && (
                                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-500 mb-2">
                                                {alert.city}
                                            </span>
                                        )}
                                        <p className="text-sm text-gray-600 leading-relaxed">{alert.message}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={() => alert.details ? toggleExpand(alert.id) : generateMoreDetails(alert.id)}
                                        disabled={alert.isLoadingDetails}
                                        className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors"
                                    >
                                        {alert.isLoadingDetails ? 'Gerando...' : alert.isExpanded ? 'Esconder detalhes' : 'Saber mais com IA'}
                                        <span className="material-symbols-outlined text-lg">
                                            {alert.isLoadingDetails ? 'hourglass_top' : alert.isExpanded ? 'expand_less' : 'auto_awesome'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {alert.isExpanded && alert.details && (
                                <div className="bg-gray-50 p-5 border-t border-gray-100 animate-in slide-in-from-top-2">
                                    <div className="prose prose-sm prose-amber max-w-none">
                                        {alert.details.split('\n').map((line, i) => (
                                            <p key={i} className={`mb-1 ${line.startsWith('**') ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                                {line.replace(/\*\*/g, '')}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

interface PreTripInfoViewProps {
    trip: Trip;
    cities: City[];
}

const PreTripInfoView: React.FC<PreTripInfoViewProps> = ({ trip, cities }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Informações Importantes</h2>
                <p className="text-gray-500">
                    Resumo de alertas de segurança, dicas culturais e avisos essenciais para seus destinos.
                </p>
            </div>

            {/* AI Alerts Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">warning</span>
                    <h3 className="font-bold text-gray-900">Alertas & Avisos IA</h3>
                </div>
                <CityAlertsBox cities={cities} />
            </div>

            {/* General Country Info (Aggregated) */}
            {/* Placeholder for future expansion: Cultural etiquette, Emergency numbers, etc. */}

        </div>
    );
};

export default PreTripInfoView;
