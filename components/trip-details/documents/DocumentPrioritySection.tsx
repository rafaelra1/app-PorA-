import React from 'react';
import { TripDocument, Participant } from '../../../types';
import DocumentCard from './DocumentCard';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface DocumentPrioritySectionProps {
    documents: TripDocument[];
    travelers: Participant[];
    onDocumentClick?: (doc: TripDocument) => void;
    onCopyReference?: (ref: string) => void;
}

// =============================================================================
// Helpers
// =============================================================================

const isDocumentUrgent = (doc: TripDocument): boolean => {
    if (!doc.date) return false;
    try {
        // Parse date (handle DD/MM/YYYY and YYYY-MM-DD)
        let date: Date;
        if (doc.date.includes('/')) {
            const [day, month, year] = doc.date.split('/');
            date = new Date(`${year}-${month}-${day}`);
        } else {
            date = new Date(doc.date);
        }

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Reset time for comparison
        now.setHours(0, 0, 0, 0);
        tomorrow.setHours(23, 59, 59, 999);
        date.setHours(12, 0, 0, 0);

        return date >= now && date <= tomorrow;
    } catch {
        return false;
    }
};

const getPriorityDocuments = (documents: TripDocument[]): TripDocument[] => {
    // Priority 1: Documents for today/tomorrow
    const urgentDocs = documents.filter(isDocumentUrgent);

    // Priority 2: Passports/Visas that are expiring
    const expiringDocs = documents.filter(doc =>
        (doc.type === 'passport' || doc.type === 'visa') && doc.status === 'expiring'
    );

    // Priority 3: Pending documents
    const pendingDocs = documents.filter(doc => doc.status === 'pending');

    // Combine and deduplicate
    const priorityIds = new Set<string>();
    const result: TripDocument[] = [];

    [...urgentDocs, ...expiringDocs, ...pendingDocs].forEach(doc => {
        if (!priorityIds.has(doc.id)) {
            priorityIds.add(doc.id);
            result.push(doc);
        }
    });

    return result.slice(0, 4); // Max 4 priority items
};

// =============================================================================
// Main Component
// =============================================================================

const DocumentPrioritySection: React.FC<DocumentPrioritySectionProps> = ({
    documents,
    travelers,
    onDocumentClick,
    onCopyReference
}) => {
    const priorityDocs = getPriorityDocuments(documents);

    if (priorityDocs.length === 0) return null;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white text-lg">priority_high</span>
                </div>
                <div>
                    <h3 className="text-lg font-black text-text-main">Acesso Rápido</h3>
                    <p className="text-xs text-text-muted">Documentos para hoje e próximos passos</p>
                </div>
            </div>

            {/* Priority Cards - Horizontal scroll on mobile */}
            <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 min-w-max md:min-w-0">
                    {priorityDocs.map(doc => (
                        <div key={doc.id} className="w-80 md:w-auto shrink-0">
                            <DocumentCard
                                document={doc}
                                travelers={travelers}
                                viewMode="grid"
                                onClick={() => onDocumentClick?.(doc)}
                                onCopyReference={onCopyReference}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="mt-8 border-t border-gray-100 flex items-center justify-center -mx-2">
                <span className="bg-white px-4 py-1 text-[10px] font-bold text-text-muted uppercase tracking-widest -mt-3">
                    Todos os Documentos
                </span>
            </div>
        </div>
    );
};

export default DocumentPrioritySection;
