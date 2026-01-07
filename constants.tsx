
import { Trip, Participant, JournalEntry, DocsFilter, SubTab, CityTab, ReservationType, DocumentType } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
  { id: 'calendar', label: 'Calendário', icon: 'calendar_month' },
  { id: 'travels', label: 'Minhas Viagens', icon: 'luggage' },
  { id: 'documents', label: 'Documentos', icon: 'folder_open' },
  { id: 'journal', label: 'Diário', icon: 'book_2' },
  { id: 'ai', label: 'Assistente IA', icon: 'smart_toy' },
];

export const DEMO_USER: Participant = {
  id: 'u1',
  name: 'Elena R.',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBPImauLC8G6C_KRt7mh_b2LS6Yp4IyyegwIB67GTMHzYnEW9v0G5ONUx_5K8SEvOg7OmVT3l62BpC6O9xaqnVGYCW8gKcixQLbzuIBgVfgZA4oi0c9FOGZ_TqOwG0zM6kYw8PpjVsRcPtrw3-ylfCacoHLwhup4fhRjWHxusLfaKB-tjqAKKf-GQVy7WVSWNR-JrUWNMDf6ybQzROYUhi0WyNXHnJGd3TaFyOuRrCuqEAu1tGPhC8XFV6xAVe5mp3OF6ycAWziD0',
  role: 'Exploradora'
};

export const DEMO_TRIPS: Trip[] = [];

export const DEMO_JOURNAL: JournalEntry[] = [
  {
    id: 'j1',
    author: DEMO_USER,
    timestamp: '14:30',
    date: '2023-10-14',
    dayNumber: 3,
    location: 'Fushimi Inari',
    title: 'Os Portões Mágicos ⛩️',
    content: 'A caminhada pelos portões torii foi absolutamente mágica! Conseguimos chegar antes da multidão e a luz estava perfeita. Definitivamente o ponto alto da viagem até agora. ⛩️✨',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCv-RFLwaBZUzMl-z3JP0aSp-lsVu_4rfwtQXMhcTFG3Lq9X_kPfN_jgaOdyiHFJfFD1g5S0Z9Rs2SbHe6tG71uWxllvA793Z9EdM1fCWZGejy6TIWd8iFS8YbG_jXPPQFqgfegbOUEJtLl-Nq4YaVU9BxlSbL8FtU1hxHTIpwX05Ugn8dFPmR2aMO6fHucn1WaOt5l6VpvCAzjZn_EJ0e3zep0cNSoPU0zuYeAsvtyhBYq1O5CxgnVNiE-QuqnkHwehIKxWXX-rek',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAkisqqd0zNnQCJoz9a7Nq9ocLP5qC8qyS4rfmI4XPV26kcxYQsfrprEZfAugumg-UEBJ7evwdaD7ZG4f_RX5fg5R0MTb2CUjnzuqL1gIRDszkXoQ2wYtD_T6MUIM6U2O5LHD_7t7AFMUcwIif1hsoNS0M7MRCQ_Y6aCaT7iOEPhQXnZnZvM2v--ic5KhpJ_DqE7Yt_UQD8FBt6VT6fNKO45ZUMtDwbOgqUVadTxWVHv6m7BDAeAI0ydXb2W1v3wROjgNE4SNbOyAw'
    ],
    mood: 'amazing',
    weather: { temp: 22, condition: 'Ensolarado', icon: 'sunny' },
    tags: ['Paisagem', 'Cultura'],
    likes: 24,
    comments: 3
  },
  {
    id: 'j2',
    author: DEMO_USER,
    timestamp: '19:45',
    date: '2023-10-14',
    dayNumber: 3,
    location: 'Gion District',
    title: 'Jantar Tradicional',
    content: 'Encontramos um izakaya escondido nas vielas de Gion. A comida era incrível e o ambiente super autêntico. Provei sake quente pela primeira vez! 🍶',
    images: [
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&q=80&w=800'
    ],
    mood: 'excited',
    weather: { temp: 18, condition: 'Limpo', icon: 'nights_stay' },
    tags: ['Comida', 'Cultura'],
    likes: 18,
    comments: 5
  },
  {
    id: 'j3',
    author: DEMO_USER,
    timestamp: '08:15',
    date: '2023-10-13',
    dayNumber: 2,
    location: 'Arashiyama Bamboo Grove',
    title: 'Floresta de Bambu 🎋',
    content: 'Acordamos cedo para pegar o trem até Arashiyama. A floresta de bambu é ainda mais impressionante pessoalmente - o som do vento entre os bambus é hipnotizante.',
    images: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&q=80&w=800'
    ],
    mood: 'relaxed',
    weather: { temp: 19, condition: 'Parcialmente Nublado', icon: 'partly_cloudy_day' },
    tags: ['Paisagem', 'Natureza'],
    likes: 32,
    comments: 7
  },
  {
    id: 'j4',
    author: DEMO_USER,
    timestamp: '12:00',
    date: '2023-10-12',
    dayNumber: 1,
    location: 'Aeroporto de Osaka',
    title: 'Chegada ao Japão! 🇯🇵',
    content: 'Finalmente chegamos! Após 24 horas de viagem, estamos exaustos mas muito animados. O trem para Kyoto parte em 30 minutos. A aventura começa agora!',
    images: [],
    mood: 'tired',
    weather: { temp: 24, condition: 'Nublado', icon: 'cloud' },
    tags: ['Transporte'],
    likes: 15,
    comments: 2
  }
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
  { id: 'cities', label: 'Cidades', icon: 'location_city' },
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
