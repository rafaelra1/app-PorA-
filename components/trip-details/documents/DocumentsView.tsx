import React, { useState, useMemo } from 'react';
import { TripDocument, DocsFilter, DocumentType, Participant, HotelReservation, Transport } from '../../../types';
import { Button } from '../../ui/Base';
import { DOC_FILTERS } from '../../../constants';
import DocumentCard from './DocumentCard';
import DocumentPrioritySection from './DocumentPrioritySection';
import TravelerFilter from './TravelerFilter';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface DocumentsViewProps {
    documents?: TripDocument[];
    travelers?: Participant[];
    accommodations?: HotelReservation[];
    transports?: Transport[];
    docsFilter: DocsFilter;
    onFilterChange: (filter: DocsFilter) => void;
    onAddDocument?: () => void;
    onDocumentClick?: (doc: TripDocument) => void;
    onDeleteDocument?: (id: string) => void;
    onNavigateToAccommodation?: (accommodationId: string) => void;
    onNavigateToTransport?: (transportId: string) => void;
}

// =============================================================================
// Mock Data - Rich documents for demonstration
// =============================================================================

const DocumentsView: React.FC<DocumentsViewProps> = ({
    documents = [],
    travelers = [],
    accommodations = [],
    transports = [],
    docsFilter,
    onFilterChange,
    onAddDocument,
    onDocumentClick,
    onDeleteDocument,
    onNavigateToAccommodation,
    onNavigateToTransport
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTravelerId, setSelectedTravelerId] = useState<string | null>(null);

    // Filter documents
    const filteredDocuments = useMemo(() => {
        let result = [...documents];

        // Apply category filter
        if (docsFilter !== 'Tudo') {
            const filterMap: Record<DocsFilter, DocumentType[] | null> = {
                'Tudo': null,
                'Reservas': ['hotel', 'flight', 'car', 'activity', 'insurance'],
                'Pessoais': ['passport', 'visa', 'vaccine'],
                'Outros': ['other']
            };
            const types = filterMap[docsFilter];
            if (types) {
                result = result.filter(doc => types.includes(doc.type));
            }
        }

        // Apply traveler filter
        if (selectedTravelerId) {
            result = result.filter(doc => doc.travelers.includes(selectedTravelerId));
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(doc =>
                doc.title.toLowerCase().includes(query) ||
                doc.reference?.toLowerCase().includes(query) ||
                doc.subtitle?.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            if (sortBy === 'name') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'type') {
                return a.type.localeCompare(b.type);
            } else {
                // Sort by date
                const parseDate = (d?: string) => {
                    if (!d) return new Date(0);
                    if (d.includes('/')) {
                        const [day, month, year] = d.split('/');
                        return new Date(`${year}-${month}-${day}`);
                    }
                    return new Date(d);
                };
                return parseDate(a.date).getTime() - parseDate(b.date).getTime();
            }
        });

        return result;
    }, [documents, docsFilter, searchQuery, selectedTravelerId, sortBy]);



    const handleCopyReference = (ref: string) => {
        // Could show a toast notification here
        console.log('Copied:', ref);
    };

    return (
        <div className="text-left animate-in fade-in duration-300">
            {/* Header with Stats */}
            <div className="flex flex-col gap-4 mb-6">


                {/* Unified Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto px-1">
                        {DOC_FILTERS.map(f => (
                            <button
                                key={f.label}
                                onClick={() => onFilterChange(f.label)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${docsFilter === f.label
                                    ? 'bg-text-main text-white shadow-sm'
                                    : 'bg-white text-text-muted hover:bg-gray-100 border border-gray-200/50'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1 flex-wrap">
                        {/* Search */}
                        <div className="relative w-full md:w-48 order-first md:order-none mb-2 md:mb-0">
                            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
                            />
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-text-muted focus:ring-2 focus:ring-indigo-200 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <option value="date">Data</option>
                                <option value="name">Nome</option>
                                <option value="type">Tipo</option>
                            </select>
                            <span className="material-symbols-outlined text-sm absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">swap_vert</span>
                        </div>

                        {/* View Mode */}
                        <div className="flex bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined text-lg">view_list</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <span className="material-symbols-outlined text-lg">grid_view</span>
                            </button>
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

                        <Button variant="primary" onClick={onAddDocument} className="!bg-primary hover:!bg-primary-dark !py-1.5 !px-4 !text-xs font-bold !rounded-xl shadow-sm">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar
                        </Button>
                    </div>
                </div>

                {/* Traveler Filter (Below Bar) */}
                <div className="px-1">
                    <TravelerFilter
                        travelers={travelers}
                        selectedTravelerId={selectedTravelerId}
                        onSelect={setSelectedTravelerId}
                    />
                </div>
            </div>

            {/* Priority Section - Only when not filtering */}
            {
                docsFilter === 'Tudo' && !searchQuery && !selectedTravelerId && (
                    <DocumentPrioritySection
                        documents={documents}
                        travelers={travelers}
                        onDocumentClick={onDocumentClick}
                        onCopyReference={handleCopyReference}
                    />
                )
            }

            {/* Documents Display */}
            {
                filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                            <span className="material-symbols-outlined text-4xl">
                                {searchQuery ? 'search_off' : 'folder_open'}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-text-main mb-2">
                            {searchQuery ? 'Nenhum documento encontrado' : 'Nenhum documento adicionado'}
                        </h3>
                        <p className="text-text-muted mb-6">
                            {searchQuery
                                ? `Não encontramos documentos com "${searchQuery}"`
                                : 'Adicione documentos para organizar sua viagem!'}
                        </p>
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-6 py-2.5 bg-text-main text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                            >
                                Limpar busca
                            </button>
                        ) : (
                            <button
                                onClick={onAddDocument}
                                className="px-6 py-2.5 bg-text-main text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Adicionar primeiro documento
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredDocuments.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                travelers={travelers}
                                viewMode="grid"
                                onClick={() => onDocumentClick?.(doc)}
                                onCopyReference={handleCopyReference}
                                onDelete={() => onDeleteDocument?.(doc.id)}
                                onNavigateToReservation={
                                    doc.linkedAccommodationId
                                        ? () => onNavigateToAccommodation?.(doc.linkedAccommodationId!)
                                        : doc.linkedTransportId
                                            ? () => onNavigateToTransport?.(doc.linkedTransportId!)
                                            : undefined
                                }
                            />
                        ))}

                        {/* Add Document Card */}
                        {!searchQuery && docsFilter === 'Tudo' && (
                            <div
                                onClick={onAddDocument}
                                className="rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group min-h-[280px]"
                            >
                                <div className="size-14 rounded-2xl bg-gray-100 flex items-center justify-center text-text-muted group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                    <span className="material-symbols-outlined text-2xl">add</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-main">Novo Documento</p>
                                    <p className="text-xs text-text-muted mt-1">Voo, hotel, passaporte...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* List View */
                    <div className="flex flex-col gap-3">
                        {filteredDocuments.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                travelers={travelers}
                                viewMode="list"
                                onClick={() => onDocumentClick?.(doc)}
                                onCopyReference={handleCopyReference}
                                onDelete={() => onDeleteDocument?.(doc.id)}
                                onNavigateToReservation={
                                    doc.linkedAccommodationId
                                        ? () => onNavigateToAccommodation?.(doc.linkedAccommodationId!)
                                        : doc.linkedTransportId
                                            ? () => onNavigateToTransport?.(doc.linkedTransportId!)
                                            : undefined
                                }
                            />
                        ))}
                    </div>
                )
            }
        </div >
    );
};

export default DocumentsView;
