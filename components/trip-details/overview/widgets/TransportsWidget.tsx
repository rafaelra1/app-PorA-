import * as React from 'react';
import { Card } from '../../../ui/Base';
import { Transport } from '../../../../types';

// =============================================================================
// Types
// =============================================================================

interface TransportsWidgetProps {
    transports: Transport[];
    onNavigate?: () => void;
}

interface TransportGroup {
    type: string;
    count: number;
    icon: string;
    color: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

const getTransportIcon = (type: string): string => {
    const icons: Record<string, string> = {
        flight: 'flight',
        train: 'train',
        bus: 'directions_bus',
        car: 'directions_car',
        ferry: 'directions_boat',
        taxi: 'local_taxi',
        other: 'commute'
    };
    return icons[type] || 'commute';
};

const getTransportColor = (type: string): string => {
    const colors: Record<string, string> = {
        flight: 'bg-blue-100 text-blue-600',
        train: 'bg-emerald-100 text-emerald-600',
        bus: 'bg-amber-100 text-amber-600',
        car: 'bg-purple-100 text-purple-600',
        ferry: 'bg-cyan-100 text-cyan-600',
        taxi: 'bg-yellow-100 text-yellow-600',
        other: 'bg-gray-100 text-gray-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
};

const getTransportLabel = (type: string): string => {
    const labels: Record<string, string> = {
        flight: 'Voos',
        train: 'Trens',
        bus: 'Ônibus',
        car: 'Carros',
        ferry: 'Balsas',
        taxi: 'Táxis',
        other: 'Outros'
    };
    return labels[type] || 'Outros';
};

const formatTime = (time?: string): string => {
    if (!time) return '--:--';
    return time.slice(0, 5);
};

// =============================================================================
// TransportsWidget Component
// =============================================================================

const TransportsWidget: React.FC<TransportsWidgetProps> = ({
    transports,
    onNavigate
}) => {
    // Group transports by type
    const groups = React.useMemo(() => {
        const groupMap: Record<string, number> = {};
        transports.forEach(t => {
            groupMap[t.type] = (groupMap[t.type] || 0) + 1;
        });

        return Object.entries(groupMap).map(([type, count]): TransportGroup => ({
            type,
            count,
            icon: getTransportIcon(type),
            color: getTransportColor(type)
        }));
    }, [transports]);

    // Find next upcoming transport (simplified - just first one)
    const nextTransport = transports[0];

    return (
        <Card
            className="p-5 hover:shadow-lg transition-all cursor-pointer group"
            onClick={onNavigate}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1.5 text-xs font-bold text-text-main bg-purple-100 rounded-full">
                    Transportes
                </span>
                <span className="text-xs text-text-muted">{transports.length} total</span>
            </div>

            {transports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">commute</span>
                    <p className="text-sm text-text-muted">Nenhum transporte adicionado</p>
                </div>
            ) : (
                <>
                    {/* Transport Types Summary */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {groups.map((group) => (
                            <div
                                key={group.type}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${group.color}`}
                            >
                                <span className="material-symbols-outlined text-sm">{group.icon}</span>
                                <span className="text-xs font-bold">{group.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-3" />

                    {/* Next Transport Highlight */}
                    {nextTransport && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-text-muted uppercase font-bold mb-2">Próximo</p>
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-xl flex items-center justify-center ${getTransportColor(nextTransport.type)}`}>
                                    <span className="material-symbols-outlined text-lg">
                                        {getTransportIcon(nextTransport.type)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
                                        <span className="truncate">{nextTransport.departureLocation?.split('(')[0]}</span>
                                        <span className="material-symbols-outlined text-xs text-text-muted">arrow_forward</span>
                                        <span className="truncate">{nextTransport.arrivalLocation?.split('(')[0]}</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted">
                                        {nextTransport.departureDate} às {formatTime(nextTransport.departureTime)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Hover Indicator */}
            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                Ver todos
            </div>
        </Card>
    );
};

export default TransportsWidget;
