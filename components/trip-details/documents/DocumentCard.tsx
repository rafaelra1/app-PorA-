import React, { useState, memo } from 'react';
import { TripDocument, DocumentType, DocumentStatus, Participant } from '../../../types';
import { Badge } from '../../ui/Base';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface DocumentCardProps {
    document: TripDocument;
    travelers?: Participant[];
    viewMode?: 'grid' | 'list';
    onClick?: () => void;
    onCopyReference?: (ref: string) => void;
    onDelete?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const TYPE_CONFIG: Record<DocumentType, { icon: string; label: string; color: string; bgColor: string }> = {
    flight: { icon: 'flight', label: 'Voo', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    hotel: { icon: 'hotel', label: 'Hotel', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    car: { icon: 'directions_car', label: 'Carro', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    train: { icon: 'train', label: 'Trem', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    bus: { icon: 'directions_bus', label: 'Ônibus', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    transfer: { icon: 'airport_shuttle', label: 'Transfer', color: 'text-slate-600', bgColor: 'bg-slate-50' },
    ferry: { icon: 'directions_boat', label: 'Ferry', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    insurance: { icon: 'health_and_safety', label: 'Seguro', color: 'text-green-600', bgColor: 'bg-green-50' },
    activity: { icon: 'local_activity', label: 'Atividade', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    passport: { icon: 'badge', label: 'Passaporte', color: 'text-rose-600', bgColor: 'bg-rose-50' },
    visa: { icon: 'verified_user', label: 'Visto', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    vaccine: { icon: 'vaccines', label: 'Vacina', color: 'text-teal-600', bgColor: 'bg-teal-50' },
    other: { icon: 'description', label: 'Outro', color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

const STATUS_CONFIG: Record<DocumentStatus, { color: string; label: string; icon?: string }> = {
    confirmed: { color: 'bg-green-100 text-green-700', label: 'Confirmado', icon: 'check_circle' },
    pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pendente', icon: 'schedule' },
    printed: { color: 'bg-blue-100 text-blue-700', label: 'Impresso', icon: 'print' },
    expiring: { color: 'bg-red-100 text-red-700', label: 'Expirando', icon: 'warning' },
    cancelled: { color: 'bg-gray-100 text-gray-500', label: 'Cancelado', icon: 'cancel' },
};

// =============================================================================
// Helpers
// =============================================================================

const getRelativeDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr.split('/').reverse().join('-'));
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';
        if (diffDays > 0 && diffDays <= 7) return `Em ${diffDays} dias`;
        if (diffDays < 0 && diffDays >= -7) return `Há ${Math.abs(diffDays)} dias`;
        return dateStr;
    } catch {
        return dateStr;
    }
};

// =============================================================================
// Sub-components
// =============================================================================

const CopyButton: React.FC<{ text: string; onCopy?: (text: string) => void }> = ({ text, onCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            onCopy?.(text);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-all ${copied
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }`}
            title={copied ? 'Copiado!' : 'Copiar código'}
        >
            <span className="material-symbols-outlined text-sm">
                {copied ? 'check' : 'content_copy'}
            </span>
        </button>
    );
};

const TravelerAvatars: React.FC<{ travelers: Participant[] }> = ({ travelers }) => {
    if (!travelers.length) return null;

    return (
        <div className="flex -space-x-2">
            {travelers.slice(0, 3).map((traveler) => (
                <div
                    key={traveler.id}
                    className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                    title={traveler.name}
                >
                    {traveler.initials || traveler.name.charAt(0)}
                </div>
            ))}
            {travelers.length > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-600 text-[10px] font-bold">
                    +{travelers.length - 3}
                </div>
            )}
        </div>
    );
};

// =============================================================================
// Main Component
// =============================================================================

const DocumentCardComponent: React.FC<DocumentCardProps> = ({
    document,
    travelers = [],
    viewMode = 'grid',
    onClick,
    onCopyReference,
    onDelete
}) => {
    const typeConfig = TYPE_CONFIG[document.type] || TYPE_CONFIG.other;
    const statusConfig = STATUS_CONFIG[document.status] || STATUS_CONFIG.confirmed;

    const docTravelers = travelers.filter(t => document.travelers.includes(t.id));
    const relativeDate = getRelativeDate(document.date);
    const isUrgent = relativeDate === 'Hoje' || relativeDate === 'Amanhã';

    // Grid View Card
    if (viewMode === 'grid') {
        return (
            <div
                onClick={onClick}
                className={`group relative bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-xl hover:border-gray-200 transition-all cursor-pointer ${isUrgent ? 'ring-2 ring-amber-200 ring-offset-2' : ''}`}
            >
                {/* Urgent Badge */}
                {isUrgent && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                        {relativeDate}
                    </div>
                )}

                {/* Header: Icon + Status */}
                <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl ${typeConfig.bgColor} ${typeConfig.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                        <span className="material-symbols-outlined text-2xl">{typeConfig.icon}</span>
                    </div>
                    <Badge color={`${statusConfig.color} !text-[9px] font-bold uppercase tracking-wider px-2.5 py-1`}>
                        {statusConfig.icon && <span className="material-symbols-outlined text-[10px] mr-1">{statusConfig.icon}</span>}
                        {statusConfig.label}
                    </Badge>
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="size-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                            title="Excluir documento"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    )}
                </div>

                {/* Body: Title, Subtitle, Date */}
                <div className="flex-1">
                    <h4 className="font-bold text-lg text-text-main group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {document.title}
                    </h4>
                    {document.subtitle && (
                        <p className="text-sm text-text-muted mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">route</span>
                            {document.subtitle}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-text-muted">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span className="text-xs font-semibold">{document.date}</span>
                        {document.details && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs">{document.details}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Reference Highlight */}
                {document.reference && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2 border border-gray-100">
                        <div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Localizador</span>
                            <span className="text-lg font-black text-text-main tracking-wider">{document.reference}</span>
                        </div>
                        <CopyButton text={document.reference} onCopy={onCopyReference} />
                    </div>
                )}

                {/* Footer: Travelers + Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <TravelerAvatars travelers={docTravelers} />
                    <div className="flex items-center gap-1">
                        {/* Offline indicator */}
                        {document.isOfflineAvailable && (
                            <div className="p-1.5 rounded-lg bg-green-50 text-green-600" title="Disponível offline">
                                <span className="material-symbols-outlined text-sm">download_done</span>
                            </div>
                        )}

                        {/* Quick Actions */}
                        {document.actions?.checkInUrl && (
                            <a
                                href={document.actions.checkInUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Fazer Check-in"
                            >
                                <span className="material-symbols-outlined text-sm">login</span>
                            </a>
                        )}
                        {document.actions?.mapUrl && (
                            <a
                                href={document.actions.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                title="Ver no Mapa"
                            >
                                <span className="material-symbols-outlined text-sm">map</span>
                            </a>
                        )}
                        {document.actions?.contactPhone && (
                            <a
                                href={`tel:${document.actions.contactPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Ligar para Emergência"
                            >
                                <span className="material-symbols-outlined text-sm">call</span>
                            </a>
                        )}
                        {(document.type === 'flight' || document.type === 'hotel') && (
                            <button
                                onClick={(e) => { e.stopPropagation(); alert('Adicionando ao Google Wallet...'); }}
                                className="p-1.5 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
                                title="Adicionar ao Google Wallet"
                            >
                                <span className="material-symbols-outlined text-sm">wallet</span>
                            </button>
                        )}

                        {/* View Document */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="Abrir documento"
                        >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // List View Card
    return (
        <div
            onClick={onClick}
            className={`group flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer ${isUrgent ? 'ring-2 ring-amber-200' : ''}`}
        >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl ${typeConfig.bgColor} ${typeConfig.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-xl">{typeConfig.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h5 className="font-bold text-base text-text-main group-hover:text-indigo-600 transition-colors truncate">
                        {document.title}
                    </h5>
                    <Badge color={`${statusConfig.color} !text-[8px] font-bold px-2 py-0.5`}>
                        {statusConfig.label}
                    </Badge>
                    {isUrgent && (
                        <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full">{relativeDate}</span>
                    )}
                </div>
                <p className="text-xs text-text-muted mt-1 truncate">
                    {document.subtitle || document.details || document.date}
                </p>
            </div>

            {/* Reference + Copy */}
            {document.reference && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="font-black text-sm text-text-main tracking-wider">{document.reference}</span>
                    <CopyButton text={document.reference} onCopy={onCopyReference} />
                </div>
            )}

            {/* Travelers */}
            <div className="hidden lg:block">
                <TravelerAvatars travelers={docTravelers} />
            </div>

            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="size-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors flex items-center justify-center"
                    title="Excluir documento"
                >
                    <span className="material-symbols-outlined text-lg">delete</span>
                </button>
            )}

            {/* Arrow */}
            <span className="material-symbols-outlined text-indigo-600 group-hover:translate-x-1 transition-transform shrink-0">
                arrow_forward
            </span>
        </div>
    );
};

const DocumentCard = memo(DocumentCardComponent);

export default DocumentCard;
