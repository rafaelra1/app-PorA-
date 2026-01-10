
/**
 * CONFIGURAÇÕES DE INTERFACE E DADOS DE REFERÊNCIA
 * Estas constantes definem a estrutura da UI e dados auxiliares (como feriados).
 * NÃO REMOVER estas configurações. Para dados de exemplo, use arquivos .mock.ts
 */

import { Trip, Participant, JournalEntry, DocsFilter, SubTab, CityTab, ReservationType, DocumentType } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
  { id: 'calendar', label: 'Calendário', icon: 'calendar_month' },
  { id: 'travels', label: 'Minhas Viagens', icon: 'luggage' },
  { id: 'library', label: 'Biblioteca', icon: 'folder_open' },
  { id: 'memories', label: 'Memórias', icon: 'book_2' },
  { id: 'ai', label: 'Assistente IA', icon: 'smart_toy' },
];

// TripDetails constants
export const DOC_FILTERS: { label: DocsFilter }[] = [
  { label: 'Tudo' },
  { label: 'Reservas' },
  { label: 'Pessoais' },
  { label: 'Outros' },
];

export const TRIP_DETAIL_TABS: { id: SubTab; label: string; icon: string }[] = [
  { id: 'itinerary', label: 'Roteiro', icon: 'map' },

  { id: 'logistics', label: 'Logística', icon: 'commute' },
  { id: 'budget', label: 'Orçamento', icon: 'attach_money' },
  { id: 'docs', label: 'Documentos', icon: 'description' },
  { id: 'journal', label: 'Diário', icon: 'book_2' },
];

export const CITY_GUIDE_TABS: { id: CityTab; label: string }[] = [
  { id: 'info', label: 'Informações Gerais' },
  { id: 'attractions', label: 'Atrações' },
  { id: 'gastronomy', label: 'Gastronomia' },
  { id: 'tips', label: 'Dicas' },
];

export const ATTRACTION_CATEGORIES = ['Todos', 'Histórico', 'Natureza', 'Cultura', 'Lazer', 'Gastronomia'];

export const MODAL_TYPE_LABELS: Record<DocumentType, { label: string; icon: string }> = {
  hotel: { label: 'Hospedagem', icon: 'hotel' },
  flight: { label: 'Voo', icon: 'flight' },
  car: { label: 'Aluguel de Carro', icon: 'directions_car' },
  insurance: { label: 'Seguro Viagem', icon: 'shield' },
  activity: { label: 'Atividade', icon: 'confirmation_number' },
  passport: { label: 'Passaporte', icon: 'badge' },
  visa: { label: 'Visto', icon: 'verified_user' },
  vaccine: { label: 'Vacina', icon: 'vaccines' },
  other: { label: 'Outro', icon: 'description' }
};

export const DEFAULT_CITY_PLACEHOLDER = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000";

export const BRAZILIAN_HOLIDAYS = [
  { date: '2025-01-01', name: 'Ano Novo', type: 'nacional' },
  { date: '2025-02-28', name: 'Carnaval', type: 'facultativo' },
  { date: '2025-03-03', name: 'Carnaval', type: 'facultativo' },
  { date: '2025-04-18', name: 'Sexta-feira Santa', type: 'nacional' },
  { date: '2025-04-21', name: 'Tiradentes', type: 'nacional' },
  { date: '2025-05-01', name: 'Dia do Trabalho', type: 'nacional' },
  { date: '2025-09-07', name: 'Independência do Brasil', type: 'nacional' },
  { date: '2025-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
  { date: '2025-11-02', name: 'Finados', type: 'nacional' },
  { date: '2025-11-15', name: 'Proclamação da República', type: 'nacional' },
  { date: '2025-12-25', name: 'Natal', type: 'nacional' },
  { date: '2026-01-01', name: 'Ano Novo', type: 'nacional' },
  { date: '2026-02-16', name: 'Carnaval', type: 'facultativo' },
  { date: '2026-04-03', name: 'Sexta-feira Santa', type: 'nacional' },
  { date: '2026-04-21', name: 'Tiradentes', type: 'nacional' },
  { date: '2026-05-01', name: 'Dia do Trabalho', type: 'nacional' },
  { date: '2026-09-07', name: 'Independência do Brasil', type: 'nacional' },
  { date: '2026-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
  { date: '2026-11-02', name: 'Finados', type: 'nacional' },
  { date: '2026-12-25', name: 'Natal', type: 'nacional' },
];
