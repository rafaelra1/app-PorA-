/**
 * CONFIGURAÇÕES CENTRALIZADAS
 * Este arquivo consolida todas as configurações duplicadas em diferentes componentes.
 * Use estas constantes ao invés de definir arrays locais em cada componente.
 */

import {
    ItineraryActivityType,
    ExpenseCategory,
    DocumentType,
    TransportType,
    TransportStatus
} from '../types';

// =============================================================================
// Activity Types - Usados em AddActivityModal, ItineraryView
// =============================================================================

export interface ActivityTypeConfig {
    value: ItineraryActivityType;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

export const ACTIVITY_TYPES: readonly ActivityTypeConfig[] = [
    { value: 'culture', label: 'Cultura', icon: 'museum', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { value: 'nature', label: 'Natureza', icon: 'park', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { value: 'food', label: 'Gastronomia', icon: 'restaurant', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { value: 'shopping', label: 'Compras', icon: 'shopping_bag', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
    { value: 'nightlife', label: 'Vida Noturna', icon: 'local_bar', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    { value: 'sightseeing', label: 'Passeio', icon: 'photo_camera', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { value: 'transport', label: 'Transporte', icon: 'flight', color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
    { value: 'accommodation', label: 'Acomodação', icon: 'hotel', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
    { value: 'other', label: 'Outro', icon: 'star', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
] as const;

// Helper para buscar configuração de tipo de atividade
export const getActivityTypeConfig = (type: ItineraryActivityType): ActivityTypeConfig => {
    return ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
};

// =============================================================================
// Expense Categories - Usados em AddExpenseModal, BudgetView
// =============================================================================

export interface ExpenseCategoryConfig {
    value: ExpenseCategory;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

export const EXPENSE_CATEGORIES: readonly ExpenseCategoryConfig[] = [
    { value: 'alimentacao', label: 'Alimentação', icon: 'restaurant', color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-500' },
    { value: 'transporte', label: 'Transporte', icon: 'directions_car', color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
    { value: 'hospedagem', label: 'Hospedagem', icon: 'hotel', color: 'text-indigo-500', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-500' },
    { value: 'lazer', label: 'Lazer', icon: 'confirmation_number', color: 'text-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
    { value: 'compras', label: 'Compras', icon: 'shopping_bag', color: 'text-pink-500', bgColor: 'bg-pink-50', borderColor: 'border-pink-500' },
    { value: 'outros', label: 'Outros', icon: 'more_horiz', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-500' },
] as const;

// Helper para buscar configuração de categoria de despesa
export const getExpenseCategoryConfig = (category: ExpenseCategory): ExpenseCategoryConfig => {
    return EXPENSE_CATEGORIES.find(c => c.value === category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
};

// =============================================================================
// Payment Methods - Usados em AddExpenseModal
// =============================================================================

export interface PaymentMethodConfig {
    value: string;
    label: string;
}

export const PAYMENT_METHODS: readonly PaymentMethodConfig[] = [
    { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
    { value: 'Cartão de Débito', label: 'Cartão de Débito' },
    { value: 'Dinheiro', label: 'Dinheiro' },
    { value: 'PIX', label: 'PIX' },
    { value: 'Apple Pay', label: 'Apple Pay' },
    { value: 'Google Pay', label: 'Google Pay' },
] as const;

// =============================================================================
// Transport Types - Usados em AddTransportModal, TransportView
// =============================================================================

export interface TransportTypeConfig {
    type: TransportType;
    icon: string;
    label: string;
    operatorLabel: string;
    operatorPlaceholder: string;
    referenceLabel: string;
    referencePlaceholder: string;
    departureSectionLabel: string;
    arrivalSectionLabel: string;
    locationPlaceholder: string;
}

export const TRANSPORT_TYPES: readonly TransportTypeConfig[] = [
    {
        type: 'flight',
        icon: 'flight',
        label: 'Voo',
        operatorLabel: 'Companhia Aérea',
        operatorPlaceholder: 'Ex: LATAM',
        referenceLabel: 'Número do Voo',
        referencePlaceholder: 'Ex: JL 005',
        departureSectionLabel: 'Partida',
        arrivalSectionLabel: 'Chegada',
        locationPlaceholder: 'Aeroporto (GRU)'
    },
    {
        type: 'train',
        icon: 'train',
        label: 'Trem',
        operatorLabel: 'Operadora',
        operatorPlaceholder: 'Ex: JR East',
        referenceLabel: 'Número do Trem',
        referencePlaceholder: 'Ex: Hikari 505',
        departureSectionLabel: 'Partida',
        arrivalSectionLabel: 'Chegada',
        locationPlaceholder: 'Estação'
    },
    {
        type: 'car',
        icon: 'directions_car',
        label: 'Aluguel de Carro',
        operatorLabel: 'Locadora',
        operatorPlaceholder: 'Ex: Localiza',
        referenceLabel: 'Referência',
        referencePlaceholder: 'Ex: RES-123',
        departureSectionLabel: 'Retirada',
        arrivalSectionLabel: 'Devolução',
        locationPlaceholder: 'Local'
    },
    {
        type: 'transfer',
        icon: 'local_taxi',
        label: 'Transfer',
        operatorLabel: 'Empresa',
        operatorPlaceholder: 'Ex: GetYourGuide',
        referenceLabel: 'Referência',
        referencePlaceholder: 'Ex: TRF-456',
        departureSectionLabel: 'Partida',
        arrivalSectionLabel: 'Chegada',
        locationPlaceholder: 'Local'
    },
    {
        type: 'bus',
        icon: 'directions_bus',
        label: 'Ônibus',
        operatorLabel: 'Empresa',
        operatorPlaceholder: 'Ex: Cometa',
        referenceLabel: 'Número do Bilhete',
        referencePlaceholder: 'Ex: BUS-789',
        departureSectionLabel: 'Partida',
        arrivalSectionLabel: 'Chegada',
        locationPlaceholder: 'Rodoviária'
    },
    {
        type: 'ferry',
        icon: 'directions_boat',
        label: 'Balsa',
        operatorLabel: 'Empresa',
        operatorPlaceholder: 'Ex: CCR Barcas',
        referenceLabel: 'Número do Bilhete',
        referencePlaceholder: 'Ex: FRY-101',
        departureSectionLabel: 'Embarque',
        arrivalSectionLabel: 'Desembarque',
        locationPlaceholder: 'Terminal'
    },
] as const;

// Helper para buscar configuração de tipo de transporte
export const getTransportTypeConfig = (type: TransportType): TransportTypeConfig => {
    return TRANSPORT_TYPES.find(t => t.type === type) || TRANSPORT_TYPES[0];
};

// =============================================================================
// Transport Status - Usados em AddTransportModal
// =============================================================================

export interface TransportStatusConfig {
    value: string;
    label: string;
}

export const TRANSPORT_STATUS_OPTIONS: TransportStatusConfig[] = [
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'pending', label: 'Pendente' },
];

// =============================================================================
// Document Types - Usados em AddDocumentModal, DocumentsView
// =============================================================================

export interface DocumentTypeConfig {
    id: DocumentType;
    label: string;
    icon: string;
    nameLabel: string;
    namePlaceholder: string;
    category: 'reservation' | 'identity' | 'health';
}

export const DOCUMENT_TYPES: readonly DocumentTypeConfig[] = [
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
] as const;

// Helper para buscar configuração de tipo de documento
export const getDocumentTypeConfig = (type: DocumentType): DocumentTypeConfig => {
    return DOCUMENT_TYPES.find(t => t.id === type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
};

// Helpers para filtrar documentos por categoria
export const getDocumentTypesByCategory = (category: 'reservation' | 'identity' | 'health'): DocumentTypeConfig[] => {
    return DOCUMENT_TYPES.filter(t => t.category === category) as DocumentTypeConfig[];
};

// =============================================================================
// Notification Types - Para uso futuro
// =============================================================================

export interface NotificationTypeConfig {
    value: string;
    label: string;
    icon: string;
    color: string;
}

export const NOTIFICATION_TYPES: readonly NotificationTypeConfig[] = [
    { value: 'reminder', label: 'Lembrete', icon: 'notifications', color: 'text-blue-500' },
    { value: 'alert', label: 'Alerta', icon: 'warning', color: 'text-amber-500' },
    { value: 'update', label: 'Atualização', icon: 'update', color: 'text-green-500' },
    { value: 'info', label: 'Informação', icon: 'info', color: 'text-gray-500' },
] as const;

// =============================================================================
// File Upload Configuration
// =============================================================================

export const FILE_UPLOAD_CONFIG = {
    validTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
} as const;

// =============================================================================
// Form Input Mode Configuration
// =============================================================================

export interface InputModeConfig {
    value: 'manual' | 'ai';
    label: string;
    icon: string;
    activeColor?: string;
}

export const INPUT_MODE_OPTIONS: InputModeConfig[] = [
    { value: 'manual', label: 'Manual', icon: 'edit' },
    { value: 'ai', label: 'Ler Documento', icon: 'auto_awesome', activeColor: 'text-primary' },
];

// =============================================================================
// Re-export from other constant files for convenience
// =============================================================================

export { COUNTRIES_PT_BR, CITIES_BY_COUNTRY } from '../constants/locations';
export { DESTINATION_CURRENCIES, CURRENCY_INFO, FALLBACK_RATES } from '../constants/currencies';
