import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { Input } from '../../ui/Input';
import { Button, DocumentUploadZone } from '../../ui/Base';
import { DocumentType, Participant } from '../../../types';
import { getGeminiService } from '../../../services/geminiService';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (doc: DocumentFormData) => void;
    travelers?: Participant[];
}

interface DocumentFormData {
    type: DocumentType;
    name: string;
    date: string;
    expiryDate?: string;
    reference: string;
    details: string;
    pickupLocation: string;
    dropoffLocation: string;
    model: string;
    travelers: string[];
    checkInUrl?: string;
    mapUrl?: string;
    contactPhone?: string;
}

interface DocumentTypeConfig {
    id: DocumentType;
    label: string;
    icon: string;
    nameLabel: string;
    namePlaceholder: string;
    category: 'reservation' | 'identity' | 'health';
}

// =============================================================================
// Constants
// =============================================================================

const DOCUMENT_TYPES: DocumentTypeConfig[] = [
    // Reservations
    { id: 'flight', label: 'Voo', icon: 'flight', nameLabel: 'Companhia Aérea / Voo', namePlaceholder: 'Ex: Latam LA3040', category: 'reservation' },
    { id: 'hotel', label: 'Hotel', icon: 'hotel', nameLabel: 'Nome do Hotel', namePlaceholder: 'Ex: Hotel Ibis Paulista', category: 'reservation' },
    { id: 'car', label: 'Carro', icon: 'directions_car', nameLabel: 'Locadora', namePlaceholder: 'Ex: Localiza', category: 'reservation' },
    { id: 'activity', label: 'Atividade', icon: 'local_activity', nameLabel: 'Nome / Título', namePlaceholder: 'Ex: Ingresso Museu', category: 'reservation' },
    { id: 'insurance', label: 'Seguro', icon: 'health_and_safety', nameLabel: 'Seguradora', namePlaceholder: 'Ex: Assist Card', category: 'reservation' },
    // Identity
    { id: 'passport', label: 'Passaporte', icon: 'badge', nameLabel: 'Titular do Passaporte', namePlaceholder: 'Ex: João da Silva', category: 'identity' },
    { id: 'visa', label: 'Visto', icon: 'verified_user', nameLabel: 'Tipo de Visto / País', namePlaceholder: 'Ex: Visto Turista - EUA', category: 'identity' },
    // Health
    { id: 'vaccine', label: 'Vacina', icon: 'vaccines', nameLabel: 'Nome da Vacina', namePlaceholder: 'Ex: Febre Amarela', category: 'health' },
    // Other
    { id: 'other', label: 'Outro', icon: 'folder', nameLabel: 'Nome / Título', namePlaceholder: 'Ex: Documento importante', category: 'reservation' },
];

const INITIAL_FORM_STATE: DocumentFormData = {
    type: 'other',
    name: '',
    date: '',
    expiryDate: '',
    reference: '',
    details: '',
    pickupLocation: '',
    dropoffLocation: '',
    model: '',
    travelers: [],
    checkInUrl: '',
    mapUrl: '',
    contactPhone: ''
};

const VALID_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DEFAULT_TRAVELERS: Participant[] = [
    { id: 'u1', name: 'Elena R.', avatar: '', initials: 'ER' },
    { id: 'u2', name: 'João Silva', avatar: '', initials: 'JS' },
    { id: 'u3', name: 'Lisa M.', avatar: '', initials: 'LM' },
];

// =============================================================================
// Helper Components
// =============================================================================

interface DocumentTypeSelectorProps {
    selected: DocumentType;
    onChange: (type: DocumentType) => void;
}

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({ selected, onChange }) => {
    const reservationTypes = DOCUMENT_TYPES.filter(t => t.category === 'reservation');
    const identityTypes = DOCUMENT_TYPES.filter(t => t.category === 'identity');
    const healthTypes = DOCUMENT_TYPES.filter(t => t.category === 'health');

    const renderTypeButton = (type: DocumentTypeConfig) => (
        <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selected === type.id
                ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm'
                : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
        >
            <span className="material-symbols-outlined mb-1">{type.icon}</span>
            <span className="text-[10px] font-bold uppercase">{type.label}</span>
        </button>
    );

    return (
        <div className="space-y-4">
            {/* Reservations */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600 text-sm">confirmation_number</span>
                    Reservas
                </label>
                <div className="grid grid-cols-5 gap-2">
                    {reservationTypes.map(renderTypeButton)}
                </div>
            </div>

            {/* Identity & Health */}
            <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-600 text-sm">badge</span>
                        Identidade
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {identityTypes.map(renderTypeButton)}
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-600 text-sm">vaccines</span>
                        Saúde
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {healthTypes.map(renderTypeButton)}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TravelerSelectorProps {
    travelers: Participant[];
    selected: string[];
    onChange: (ids: string[]) => void;
}

const TravelerSelector: React.FC<TravelerSelectorProps> = ({ travelers, selected, onChange }) => {
    const toggleTraveler = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter(t => t !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-sm">group</span>
                Viajantes
            </label>
            <div className="flex flex-wrap gap-2">
                {travelers.map(traveler => (
                    <button
                        key={traveler.id}
                        type="button"
                        onClick={() => toggleTraveler(traveler.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selected.includes(traveler.id)
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${selected.includes(traveler.id)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                            }`}>
                            {traveler.initials || traveler.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold">{traveler.name.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// =============================================================================
// Custom Hooks
// =============================================================================

const useDocumentAnalysis = (onDataExtracted: (data: Partial<DocumentFormData>) => void) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeFile = useCallback(async (file: File) => {
        // Validate file type
        if (!VALID_FILE_TYPES.includes(file.type)) {
            alert('Tipo de arquivo não suportado. Por favor use Imagens ou PDF.');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            alert(`O arquivo é muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Limite é 10MB.`);
            return;
        }

        setIsAnalyzing(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async () => {
                const base64 = reader.result as string;

                if (!base64 || !base64.includes('base64,')) {
                    console.error('Failed to read file as base64');
                    setIsAnalyzing(false);
                    return;
                }

                try {
                    const aiData = await getGeminiService().analyzeDocumentImage(base64);

                    if (aiData) {
                        console.log('AI Data received:', aiData);

                        // Clean date format
                        const cleanDate = (d: string) => d?.match(/^\d{4}-\d{2}-\d{2}$/) ? d : '';

                        // For hotels, 'details' field is used as Check-out date
                        let detailsValue = aiData.details || '';
                        if (aiData.type === 'hotel' && aiData.endDate) {
                            detailsValue = cleanDate(aiData.endDate);
                        }

                        onDataExtracted({
                            type: aiData.type || undefined,
                            name: aiData.name || undefined,
                            date: cleanDate(aiData.date) || undefined,
                            reference: aiData.reference || undefined,
                            details: detailsValue || undefined,
                            pickupLocation: aiData.pickupLocation || undefined,
                            dropoffLocation: aiData.dropoffLocation || undefined,
                            model: aiData.model || undefined
                        });
                    } else {
                        alert('A IA não conseguiu ler o documento. Verifique se a imagem está nítida ou preencha manualmente.');
                    }
                } catch (err) {
                    console.error("AI Analysis failed:", err);
                    alert('Não foi possível analisar o documento. Tente novamente ou preencha manualmente.');
                } finally {
                    setIsAnalyzing(false);
                }
            };

            reader.onerror = () => {
                console.error('Error reading file');
                alert('Erro ao ler o arquivo. Tente novamente.');
                setIsAnalyzing(false);
            };
        } catch (error) {
            console.error("File reading failed:", error);
            alert('Erro ao processar o arquivo.');
            setIsAnalyzing(false);
        }
    }, [onDataExtracted]);

    return { isAnalyzing, analyzeFile };
};

// =============================================================================
// Main Component
// =============================================================================

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ isOpen, onClose, onAdd, travelers = DEFAULT_TRAVELERS }) => {
    const [formData, setFormData] = useState<DocumentFormData>(INITIAL_FORM_STATE);

    const updateField = useCallback(<K extends keyof DocumentFormData>(
        field: K,
        value: DocumentFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateFields = useCallback((updates: Partial<DocumentFormData>) => {
        setFormData(prev => ({
            ...prev,
            ...Object.fromEntries(
                Object.entries(updates).filter(([_, v]) => v !== undefined)
            )
        }));
    }, []);

    const { isAnalyzing, analyzeFile } = useDocumentAnalysis(updateFields);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
    }, []);

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (!formData.name || !formData.date) return;

        onAdd(formData);
        resetForm();
        onClose();
    }, [formData, onAdd, onClose, resetForm]);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    // Get current type config for dynamic labels
    const currentTypeConfig = DOCUMENT_TYPES.find(t => t.id === formData.type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
    const isIdentityType = currentTypeConfig.category === 'identity';
    const isHealthType = currentTypeConfig.category === 'health';

    const footer = (
        <>
            <Button variant="outline" onClick={handleClose}>
                Cancelar
            </Button>
            <Button
                type="submit"
                form="document-form"
                disabled={!formData.name || !formData.date}
            >
                Adicionar Documento
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Adicionar Documento"
            size="lg"
            footer={footer}
        >
            <form id="document-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <DocumentTypeSelector
                    selected={formData.type}
                    onChange={(type) => updateField('type', type)}
                />

                {/* Traveler Selection */}
                <TravelerSelector
                    travelers={travelers}
                    selected={formData.travelers}
                    onChange={(ids) => updateField('travelers', ids)}
                />

                {/* Common Fields */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <Input
                        label={currentTypeConfig.nameLabel}
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder={currentTypeConfig.namePlaceholder}
                        required
                        fullWidth
                    />

                    {/* Date Fields - Dynamic based on type */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={
                                formData.type === 'hotel' ? 'Check-in' :
                                    isIdentityType ? 'Data de Emissão' :
                                        isHealthType ? 'Data da Vacina' :
                                            'Data'
                            }
                            type="date"
                            value={formData.date}
                            onChange={(e) => updateField('date', e.target.value)}
                            required
                            fullWidth
                        />
                        {isIdentityType ? (
                            <Input
                                label="Data de Validade"
                                type="date"
                                value={formData.expiryDate || ''}
                                onChange={(e) => updateField('expiryDate', e.target.value)}
                                fullWidth
                            />
                        ) : (
                            <Input
                                label={formData.type === 'hotel' ? 'Check-out' : 'Horário / Detalhes'}
                                type={formData.type === 'hotel' ? 'date' : 'text'}
                                value={formData.details}
                                onChange={(e) => updateField('details', e.target.value)}
                                placeholder={formData.type === 'hotel' ? '' : 'Ex: 14:00 ou informações extras'}
                                fullWidth
                            />
                        )}
                    </div>

                    {/* Flight-specific Fields */}
                    {formData.type === 'flight' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <Input
                                label="Origem (IATA)"
                                value={formData.pickupLocation}
                                onChange={(e) => updateField('pickupLocation', e.target.value)}
                                placeholder="Ex: GRU"
                                fullWidth
                            />
                            <Input
                                label="Destino (IATA)"
                                value={formData.dropoffLocation}
                                onChange={(e) => updateField('dropoffLocation', e.target.value)}
                                placeholder="Ex: JFK"
                                fullWidth
                            />
                        </div>
                    )}

                    {/* Car-specific Fields */}
                    {formData.type === 'car' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <Input
                                label="Modelo do Veículo"
                                value={formData.model}
                                onChange={(e) => updateField('model', e.target.value)}
                                placeholder="Ex: Jeep Compass ou similar"
                                fullWidth
                            />
                        </div>
                    )}

                    {/* Insurance-specific Fields */}
                    {formData.type === 'insurance' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <Input
                                label="Telefone de Emergência"
                                value={formData.contactPhone}
                                onChange={(e) => updateField('contactPhone', e.target.value)}
                                placeholder="Ex: +55 11 4004-1234"
                                fullWidth
                                leftIcon={<span className="material-symbols-outlined text-red-500 text-sm">call</span>}
                            />
                        </div>
                    )}

                    {/* Reference */}
                    <Input
                        label={
                            isIdentityType ? 'Número do Documento' :
                                isHealthType ? 'Número do Certificado' :
                                    'Código de Reserva / Localizador'
                        }
                        value={formData.reference}
                        onChange={(e) => updateField('reference', e.target.value.toUpperCase())}
                        placeholder={
                            isIdentityType ? 'Ex: BR123456789' :
                                isHealthType ? 'Ex: ICV-2023-001' :
                                    'Ex: XYZ123'
                        }
                        fullWidth
                        leftIcon={<span className="material-symbols-outlined text-purple-600 text-sm">tag</span>}
                    />

                    {/* Quick Actions (Optional) */}
                    {(formData.type === 'flight' || formData.type === 'hotel') && (
                        <div className="p-4 bg-gray-50 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-indigo-600">bolt</span>
                                Ações Rápidas (Opcional)
                            </p>
                            {formData.type === 'flight' && (
                                <Input
                                    label="Link para Check-in Online"
                                    value={formData.checkInUrl || ''}
                                    onChange={(e) => updateField('checkInUrl', e.target.value)}
                                    placeholder="https://..."
                                    fullWidth
                                />
                            )}
                            {formData.type === 'hotel' && (
                                <Input
                                    label="Link do Mapa / Endereço"
                                    value={formData.mapUrl || ''}
                                    onChange={(e) => updateField('mapUrl', e.target.value)}
                                    placeholder="https://maps.google.com/..."
                                    fullWidth
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Document Upload */}
                <DocumentUploadZone
                    isProcessing={isAnalyzing}
                    onFileSelect={analyzeFile}
                    title="Anexar Imagem do Documento"
                    subtitle="Nós preencheremos os campos para você"
                    processingTitle="Analisando documento..."
                    processingSubtitle="Extraindo informações com IA"
                />
            </form>
        </Modal>
    );
};

export default AddDocumentModal;
