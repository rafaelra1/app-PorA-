import * as React from 'react';
import { TripDocument } from '../../types';

interface DocumentsWidgetProps {
    documents: TripDocument[];
}

const DocumentsWidget: React.FC<DocumentsWidgetProps> = ({ documents }) => {
    const today = new Date();

    const parseDate = (dateStr: string): Date => {
        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
    };

    const getMonthsUntil = (dateStr: string): number => {
        const expDate = parseDate(dateStr);
        const diffTime = expDate.getTime() - today.getTime();
        return diffTime / (1000 * 60 * 60 * 24 * 30);
    };

    // Filter documents that have expiry dates (passports, visas)
    const expiringDocs = documents
        .filter(doc => doc.expiryDate && (doc.type === 'passport' || doc.type === 'visa'))
        .map(doc => {
            const months = getMonthsUntil(doc.expiryDate!);
            let status: 'valid' | 'warning' | 'critical' | 'expired' = 'valid';
            if (months <= 0) status = 'expired';
            else if (months <= 1) status = 'critical';
            else if (months <= 6) status = 'warning';
            return { ...doc, monthsUntil: months, status };
        })
        .filter(doc => doc.status !== 'valid') // Only show problematic ones
        .sort((a, b) => a.monthsUntil - b.monthsUntil);

    const validCount = documents.filter(doc =>
        doc.expiryDate &&
        (doc.type === 'passport' || doc.type === 'visa') &&
        getMonthsUntil(doc.expiryDate) > 6
    ).length;

    const statusColors = {
        expired: 'bg-red-100 text-red-600 border-red-200',
        critical: 'bg-red-50 text-red-600 border-red-100',
        warning: 'bg-amber-50 text-amber-600 border-amber-100',
        valid: 'bg-green-50 text-green-600 border-green-100',
    };

    const statusLabels = {
        expired: 'Expirado',
        critical: 'Expira em breve!',
        warning: 'Atenção',
        valid: 'Válido',
    };

    const getExpiryLabel = (months: number): string => {
        if (months <= 0) return 'Expirado';
        if (months < 1) return `Expira em ${Math.round(months * 30)} dias`;
        if (months < 12) return `Expira em ${Math.round(months)} mês(es)`;
        return `Expira em ${Math.round(months / 12)} ano(s)`;
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-lg text-primary-dark">description</span>
                <h3 className="font-bold text-text-main">Resumo de Documentos</h3>
            </div>

            {/* Summary Row */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-green-500"></span>
                    <span className="text-xs text-text-muted">{validCount} Válidos</span>
                </div>
                {expiringDocs.filter(d => d.status === 'warning').length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-amber-500"></span>
                        <span className="text-xs text-text-muted">{expiringDocs.filter(d => d.status === 'warning').length} Atenção</span>
                    </div>
                )}
                {expiringDocs.filter(d => d.status === 'critical' || d.status === 'expired').length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-red-500"></span>
                        <span className="text-xs text-text-muted">{expiringDocs.filter(d => d.status === 'critical' || d.status === 'expired').length} Crítico</span>
                    </div>
                )}
            </div>

            {/* Expiring Documents List */}
            {expiringDocs.length > 0 ? (
                <div className="space-y-2">
                    {expiringDocs.slice(0, 3).map(doc => (
                        <div
                            key={doc.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${statusColors[doc.status]}`}
                        >
                            <span className="material-symbols-outlined text-xl">
                                {doc.type === 'passport' ? 'badge' : 'verified'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{doc.title}</p>
                                <p className="text-xs opacity-80">{getExpiryLabel(doc.monthsUntil)}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[doc.status]}`}>
                                {statusLabels[doc.status]}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-text-muted text-center py-2">
                    {documents.length === 0 ? 'Nenhum documento cadastrado.' : 'Todos os documentos estão em dia! ✓'}
                </p>
            )}
        </div>
    );
};

export default DocumentsWidget;
