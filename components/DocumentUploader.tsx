import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, Loader2, CheckCircle2, AlertTriangle, X, ChevronDown, ChevronUp, Plane, Hotel, Car, Shield, FileQuestion } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface FieldData {
    value: string | null;
    confidence: number;
}

interface ExtractedItem {
    fields: Record<string, FieldData>;
    overallConfidence: number;
    itemIndex: number;
    validationWarnings: string[];
    isValid: boolean;
}

interface ProcessingResult {
    success: boolean;
    classification: {
        type: string;
        confidence: number;
    };
    data: {
        type: string;
        items: ExtractedItem[];
    };
    metadata: {
        filename: string;
        mimetype: string;
        processedAt: string;
        hasValidationWarnings: boolean;
    };
    rawText?: string;
}

interface DocumentUploaderProps {
    onDataExtracted?: (data: ProcessingResult) => void;
    tripId?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

const getDocTypeIcon = (type: string) => {
    switch (type) {
        case 'flight': return <Plane className="w-5 h-5" />;
        case 'hotel': return <Hotel className="w-5 h-5" />;
        case 'car': return <Car className="w-5 h-5" />;
        case 'insurance': return <Shield className="w-5 h-5" />;
        default: return <FileQuestion className="w-5 h-5" />;
    }
};

const getDocTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
        flight: 'Passagem Aérea',
        hotel: 'Reserva de Hotel',
        car: 'Aluguel de Carro',
        insurance: 'Seguro Viagem',
        train: 'Bilhete de Trem',
        bus: 'Passagem de Ônibus',
        passport: 'Passaporte',
        visa: 'Visto',
        activity: 'Ingresso/Atividade',
        other: 'Outro Documento'
    };
    return labels[type] || 'Documento';
};

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
    const percent = Math.round(confidence * 100);
    let color = 'bg-red-500/20 text-red-400';
    if (confidence >= 0.9) color = 'bg-green-500/20 text-green-400';
    else if (confidence >= 0.7) color = 'bg-yellow-500/20 text-yellow-400';

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
            {percent}% confiança
        </span>
    );
};

const FieldDisplay: React.FC<{ label: string; data: FieldData }> = ({ label, data }) => {
    if (!data?.value) return null;

    const fieldLabels: Record<string, string> = {
        airline: 'Companhia',
        flightNumber: 'Voo',
        pnr: 'Localizador',
        ticketNumber: 'E-Ticket',
        departureAirport: 'Origem',
        arrivalAirport: 'Destino',
        departureDate: 'Data Partida',
        arrivalDate: 'Data Chegada',
        departureTime: 'Hora Partida',
        arrivalTime: 'Hora Chegada',
        terminal: 'Terminal',
        gate: 'Portão',
        seat: 'Assento',
        class: 'Classe',
        hotelName: 'Hotel',
        address: 'Endereço',
        checkInDate: 'Check-in',
        checkInTime: 'Hora Check-in',
        checkOutDate: 'Check-out',
        checkOutTime: 'Hora Check-out',
        roomType: 'Quarto',
        confirmationNumber: 'Confirmação',
        guestName: 'Hóspede',
        company: 'Locadora',
        pickupLocation: 'Retirada',
        pickupDate: 'Data Retirada',
        pickupTime: 'Hora Retirada',
        dropoffLocation: 'Devolução',
        dropoffDate: 'Data Devolução',
        dropoffTime: 'Hora Devolução',
        vehicleModel: 'Veículo',
        provider: 'Seguradora',
        policyNumber: 'Apólice',
        insuredName: 'Segurado',
        coverageStart: 'Início Vigência',
        coverageEnd: 'Fim Vigência',
        emergencyPhone: 'Emergência',
    };

    return (
        <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
            <span className="text-gray-400 text-sm">{fieldLabels[label] || label}</span>
            <div className="flex items-center gap-2">
                <span className="text-white font-medium">{data.value}</span>
                {data.confidence < 0.9 && (
                    <span className="text-xs text-yellow-500">⚠</span>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// Main Component
// =============================================================================

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onDataExtracted, tripId }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ProcessingResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const processFile = async (file: File) => {
        setIsProcessing(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('document', file);
        if (tripId) formData.append('tripId', tripId);

        try {
            const response = await fetch('/api/process-document', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Processing failed');
            }

            const data: ProcessingResult = await response.json();
            setResult(data);
            onDataExtracted?.(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao processar documento');
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleItemExpanded = (index: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const reset = () => {
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Upload Area */}
            {!result && !isProcessing && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-8
            transition-all duration-300 text-center
            ${isDragging
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'}
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-4">
                        <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <p className="text-white font-medium mb-1">
                                {isDragging ? 'Solte o arquivo aqui' : 'Arraste seu documento ou clique para selecionar'}
                            </p>
                            <p className="text-gray-400 text-sm">
                                PDF, JPG, PNG ou WebP • Máximo 20MB
                            </p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Plane className="w-3.5 h-3.5" /> Passagens
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Hotel className="w-3.5 h-3.5" /> Hotéis
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Car className="w-3.5 h-3.5" /> Carros
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Shield className="w-3.5 h-3.5" /> Seguros
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing State */}
            {isProcessing && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">Processando documento...</p>
                    <p className="text-gray-400 text-sm mt-1">Classificando e extraindo informações</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-400 font-medium">Erro ao processar</p>
                            <p className="text-gray-400 text-sm mt-1">{error}</p>
                        </div>
                        <button
                            onClick={reset}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    <button
                        onClick={reset}
                        className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-green-500/20">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Documento processado</p>
                                <p className="text-gray-400 text-sm">{result.metadata.filename}</p>
                            </div>
                        </div>
                        <button
                            onClick={reset}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Classification */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            {getDocTypeIcon(result.classification.type)}
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-medium">{getDocTypeLabel(result.classification.type)}</p>
                            <p className="text-gray-400 text-xs">
                                {result.data.items.length} item(s) encontrado(s)
                            </p>
                        </div>
                        <ConfidenceBadge confidence={result.classification.confidence} />
                    </div>

                    {/* Extracted Items */}
                    <div className="space-y-3">
                        {result.data.items.map((item, idx) => (
                            <div
                                key={idx}
                                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
                            >
                                {/* Item Header */}
                                <button
                                    onClick={() => toggleItemExpanded(idx)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-medium">
                                            Item {item.itemIndex}
                                        </span>
                                        {!item.isValid && (
                                            <span className="flex items-center gap-1 text-xs text-yellow-400">
                                                <AlertTriangle className="w-3 h-3" />
                                                {item.validationWarnings.length} aviso(s)
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ConfidenceBadge confidence={item.overallConfidence} />
                                        {expandedItems.has(idx)
                                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                                        }
                                    </div>
                                </button>

                                {/* Item Details */}
                                {expandedItems.has(idx) && (
                                    <div className="px-4 pb-4 border-t border-white/5">
                                        <div className="pt-3 space-y-1">
                                            {Object.entries(item.fields).map(([key, fieldData]) => (
                                                <FieldDisplay key={key} label={key} data={fieldData as FieldData} />
                                            ))}
                                        </div>

                                        {/* Validation Warnings */}
                                        {item.validationWarnings.length > 0 && (
                                            <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                                <p className="text-xs text-yellow-400 font-medium mb-1">Avisos de Validação:</p>
                                                <ul className="text-xs text-gray-400 space-y-1">
                                                    {item.validationWarnings.map((warning, i) => (
                                                        <li key={i}>• {warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={reset}
                            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors"
                        >
                            Processar outro
                        </button>
                        <button
                            onClick={() => {
                                // TODO: Save to trip
                                console.log('Saving to trip:', result);
                            }}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-medium transition-colors"
                        >
                            Adicionar à Viagem
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentUploader;
