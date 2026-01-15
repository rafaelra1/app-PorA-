/**
 * Trip Navigation Configuration
 * Defines all navigation items with question-based format
 */

import { NavQuestion } from '../types/navigation';

/**
 * Main navigation items for trip details
 * Each item uses a question format to guide the user
 */
export const TRIP_NAV_QUESTIONS: NavQuestion[] = [
    {
        id: 'overview',
        question: 'Como está minha viagem?',
        shortLabel: 'Visão Geral',
        description: 'Resumo e status geral',
        icon: 'dashboard',
        gradient: 'from-violet-500 to-purple-600',
        iconColor: 'text-violet-500',
    },
    {
        id: 'pre_trip_info',
        question: 'O que preciso saber antes?',
        shortLabel: 'Alertas',
        description: 'Avisos e informações locais',
        icon: 'lightbulb',
        gradient: 'from-amber-400 to-orange-500',
        iconColor: 'text-amber-500',
    },
    {
        id: 'itinerary',
        question: 'O que fazer em cada dia?',
        shortLabel: 'Roteiro',
        description: 'Atividades e cronograma',
        icon: 'event_note',
        gradient: 'from-sky-500 to-blue-600',
        iconColor: 'text-sky-500',
    },
    {
        id: 'map',
        question: 'Por onde vou passar?',
        shortLabel: 'Mapa',
        description: 'Visualização geográfica',
        icon: 'explore',
        gradient: 'from-emerald-500 to-teal-600',
        iconColor: 'text-emerald-500',
    },
    {
        id: 'cities',
        question: 'O que ver em cada cidade?',
        shortLabel: 'Cidades',
        description: 'Guias e atrações locais',
        icon: 'location_city',
        gradient: 'from-cyan-500 to-teal-600',
        iconColor: 'text-cyan-500',
        // children are populated dynamically with trip cities
    },
    {
        id: 'accommodation',
        question: 'Onde vou dormir?',
        shortLabel: 'Hotéis',
        description: 'Reservas e hospedagem',
        icon: 'hotel',
        gradient: 'from-pink-500 to-rose-500',
        iconColor: 'text-pink-500',
    },
    {
        id: 'transport',
        question: 'Como vou me locomover?',
        shortLabel: 'Transportes',
        description: 'Voos, trens e aluguéis',
        icon: 'directions_car',
        gradient: 'from-orange-500 to-red-500',
        iconColor: 'text-orange-500',
    },
    {
        id: 'docs',
        question: 'Tenho todos os documentos?',
        shortLabel: 'Documentos',
        description: 'Reservas e documentos pessoais',
        icon: 'folder_open',
        gradient: 'from-rose-500 to-pink-600',
        iconColor: 'text-rose-500',
    },
    {
        id: 'budget',
        question: 'Quanto vou gastar?',
        shortLabel: 'Despesas',
        description: 'Orçamento e gastos',
        icon: 'account_balance_wallet',
        gradient: 'from-green-500 to-emerald-600',
        iconColor: 'text-green-500',
    },
    {
        id: 'checklist',
        question: 'O que tenho que fazer?',
        shortLabel: 'Checklist',
        description: 'Tarefas pré-viagem',
        icon: 'checklist',
        gradient: 'from-indigo-500 to-blue-600',
        iconColor: 'text-indigo-500',
    },
    {
        id: 'media',
        question: 'O que pesquisar sobre o destino?',
        shortLabel: 'Pesquisa',
        description: 'Vídeos e referências',
        icon: 'travel_explore',
        gradient: 'from-purple-500 to-indigo-600',
        iconColor: 'text-purple-500',
    },
    {
        id: 'memories',
        question: 'O que quero lembrar?',
        shortLabel: 'Memórias',
        description: 'Diário e fotos',
        icon: 'auto_stories',
        gradient: 'from-pink-500 to-rose-600',
        iconColor: 'text-pink-500',
    },
    {
        id: 'magazine',
        question: 'Revista da viagem',
        shortLabel: 'Revista',
        description: 'Visão editorial do roteiro',
        icon: 'menu_book',
        gradient: 'from-teal-500 to-cyan-600',
        iconColor: 'text-teal-500',
    },
];
