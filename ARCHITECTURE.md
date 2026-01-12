# PorAí - Documentação de Arquitetura e Engenharia

## Visão Geral

**PorAí** é uma plataforma moderna e completa de planejamento de viagens alimentada por Inteligência Artificial. O aplicativo funciona como um companheiro pessoal para viajantes, centralizando todos os aspectos de uma viagem em um único lugar - desde o planejamento inicial até a execução e memórias.

---

## O Problema que Resolvemos

Planejar uma viagem envolve múltiplos desafios que tradicionalmente exigem o uso de diversas ferramentas desconectadas:

1. **Planejamento fragmentado**: Informações espalhadas entre e-mails, planilhas, aplicativos de notas e múltiplos sites de reserva
2. **Falta de assistência inteligente**: Dificuldade em criar roteiros personalizados que considerem preferências, orçamento e tempo disponível
3. **Gerenciamento de documentos complexo**: Reservas de voos, hotéis, carros e atividades chegam em formatos diversos e precisam ser organizados manualmente
4. **Logística desconectada**: Sem visão unificada de transporte, hospedagem e atividades
5. **Preparação para viagem**: Esquecimento de tarefas importantes como vacinas, vistos, adaptadores de tomada e câmbio
6. **Experiência offline limitada**: Muitos apps dependem de conexão constante

O PorAí resolve esses problemas oferecendo uma solução integrada e inteligente.

---

## Público-Alvo

- **Viajantes independentes** que querem planejamento simplificado e organizado
- **Grupos de viagem** (famílias, amigos, casais) que precisam compartilhar informações
- **Usuários que valorizam organização** e buscam uma experiência baseada em IA
- **Viajantes frequentes** que gerenciam múltiplas viagens simultaneamente

---

## Funcionalidades Principais

### 1. Planejamento Inteligente de Viagens

O coração do PorAí é seu sistema de planejamento de viagens alimentado por IA. O usuário pode criar uma nova viagem fornecendo destinos, datas e preferências. O sistema então:

- **Gera roteiros personalizados** dia a dia com atividades, horários e locais
- **Considera o perfil do viajante** (orçamento, ritmo, tipo de companhia)
- **Sugere atrações e restaurantes** baseados no destino
- **Calcula automaticamente** o número de noites em cada cidade

O Assistente de IA V2 permite conversas naturais para refinar o planejamento, responder dúvidas sobre o destino e ajustar o roteiro conforme feedback.

### 2. Guias de Cidades com IA

Para cada cidade do roteiro, o sistema gera automaticamente um guia completo contendo:

- **Visão geral** da cidade com informações essenciais
- **Atrações principais** com descrições, horários e preços estimados
- **Gastronomia local** com restaurantes recomendados e pratos típicos
- **Dicas práticas** sobre transporte, segurança, costumes locais
- **Informações de emergência** (polícia, ambulância, embaixada)
- **Custo de vida estimado** para ajudar no planejamento financeiro

O usuário pode gerar imagens das atrações e pratos típicos usando IA generativa, criando uma experiência visual rica.

### 3. Análise Inteligente de Documentos

Uma das funcionalidades mais poderosas é a análise automática de documentos de viagem. O usuário simplesmente faz upload de PDFs ou imagens de:

- Confirmações de voo
- Reservas de hotel
- Aluguel de carro
- Ingressos de atividades
- Documentos pessoais (passaporte, visto)

O sistema utiliza Google Gemini com visão computacional para extrair automaticamente:

- Datas e horários
- Locais de partida e chegada
- Códigos de confirmação
- Nomes dos viajantes
- Informações específicas de cada tipo de documento

O processamento em lote permite analisar múltiplos documentos simultaneamente, com detecção de duplicatas e nível de confiança para cada campo extraído.

### 4. Gerenciamento de Logística

#### Transporte
O sistema gerencia todos os tipos de transporte:
- **Voos** com rastreamento em tempo real (atrasado, cancelado, no ar, pousado)
- **Trens, ônibus e ferries** com horários e referências
- **Aluguel de carros** com informações de retirada e devolução
- **Transfers** entre aeroporto e hotel

#### Hospedagem
Gerenciamento completo de acomodações:
- Hotéis com estrelas, avaliações e comodidades
- Apartamentos e casas alugadas
- Casas de amigos/família
- Check-in e check-out com horários
- Confirmações e contatos

### 5. Checklist Inteligente de Preparação

O Smart Checklist é um sistema que gera automaticamente tarefas de preparação baseadas em:

- **Destino da viagem**: vacinas exigidas, visto necessário, adaptadores de tomada
- **Datas**: contagem regressiva, urgência de tarefas
- **Viajantes**: documentos por pessoa
- **Tipo de viagem**: bagagem apropriada, seguro viagem

As tarefas são priorizadas automaticamente por urgência (blocking, important, recommended) e o sistema notifica sobre itens pendentes conforme a viagem se aproxima.

Funcionalidades adicionais:
- Compartilhamento de checklist com outros viajantes
- Sincronização offline
- Analytics de progresso de preparação

### 6. Orçamento e Câmbio

O módulo financeiro permite:

- **Controle de despesas** por categoria (alimentação, transporte, hospedagem, lazer)
- **Conversor de moedas** em tempo real (BRL para moedas do destino)
- **Estimativas de custo de vida** por cidade
- **Breakdown de orçamento** por tipo de gasto
- **Histórico de transações** com entrada e saída

### 7. Diário de Viagem

Durante a viagem, os usuários podem registrar suas experiências:

- **Entradas com localização** geográfica
- **Fotos e imagens** da viagem
- **Mood e clima** do momento
- **Tags** para organização
- **Agrupamento por dia** para fácil navegação

### 8. Calendário Integrado

Visualização unificada de todos os eventos da viagem em múltiplas visões:

- **Dia**: agenda detalhada
- **Semana**: visão semanal
- **Mês**: calendário mensal
- **Ano**: planejamento anual

Integração com Google Calendar para sincronização bidirecional.

### 9. Mapas e Visualização Geográfica

- **Mapa 2D** (Leaflet) com marcadores de atrações, hotéis e atividades
- **Mapa 3D** (WebGL/Three.js) com visualização imersiva das cidades
- **Integração Google Places** para busca e autocomplete de locais

### 10. Biblioteca e Memórias

- **Galeria de fotos** organizadas por viagem
- **Biblioteca de recursos** (links, vídeos, artigos)
- **Integração YouTube** para adicionar vídeos sobre destinos
- **Exportação** de recordações em PDF ou ICS

### 11. Notificações Inteligentes

Sistema de alertas proativos:

- **Mudanças de voo** em tempo real
- **Lembretes de check-in** de hotel
- **Documentos expirando** (passaporte, visto)
- **Alertas de clima** no destino
- **Lembretes de atividades** do roteiro

---

## Arquitetura Técnica

### Visão Geral da Stack

O PorAí é uma aplicação web moderna construída com tecnologias de ponta:

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19 + TypeScript |
| **Build** | Vite 6 |
| **Estilização** | Tailwind CSS |
| **Animações** | Framer Motion |
| **Estado** | React Context API |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **IA** | Google Gemini AI |
| **Mapas** | Google Maps + Leaflet + Three.js |

### Estrutura de Pastas

```
src/
├── components/          # Componentes React (152 arquivos)
│   ├── ui/              # Biblioteca de componentes base
│   ├── trip-details/    # Componentes de detalhes da viagem
│   ├── ai-assistant/    # Assistente de IA
│   ├── calendar/        # Calendário
│   ├── dashboard/       # Dashboard principal
│   ├── maps/            # Mapas 2D e 3D
│   └── ...
│
├── pages/               # Páginas da aplicação (12 páginas)
├── contexts/            # Context providers (13 contextos)
├── services/            # Serviços e integrações (28 serviços)
├── hooks/               # Custom hooks (16 hooks)
├── lib/                 # Utilitários e helpers
├── types/               # Definições TypeScript
├── styles/              # Design system CSS
└── constants/           # Constantes e configurações
```

### Padrões Arquiteturais

#### 1. Context API para Gerenciamento de Estado

O estado global é gerenciado através de múltiplos contextos especializados:

- **AuthContext**: Autenticação e sessão do usuário
- **TripContext**: Estado das viagens
- **AIContext**: Estado de geração de conteúdo IA
- **UIContext**: Estado da interface (modais, abas)
- **CalendarContext**: Eventos do calendário
- **ChecklistContext**: Tarefas de preparação
- **CurrencyContext**: Taxas de câmbio
- **NotificationContext**: Notificações
- **ThemeContext**: Tema claro/escuro

Essa separação permite atualizações eficientes sem re-renders desnecessários.

#### 2. Service Layer Desacoplado

A lógica de negócio e integrações externas estão isoladas em serviços:

- `geminiService.ts`: Todas as chamadas para Google Gemini AI
- `googlePlacesService.ts`: Autocomplete e busca de lugares
- `currencyService.ts`: Taxa de câmbio em tempo real
- `flightStatusService.ts`: Rastreamento de voos
- `checklistService.ts`: Regras inteligentes de checklist
- `storageService.ts`: Sincronização com Supabase

Esse padrão facilita testes, manutenção e substituição de dependências.

#### 3. Code Splitting com Lazy Loading

Componentes pesados são carregados sob demanda:

```typescript
const TripDetails = lazy(() => import('./pages/TripDetails'));
const AIAssistantV2 = lazy(() => import('./pages/AIAssistantV2'));
```

Isso reduz o bundle inicial e melhora o tempo de carregamento.

#### 4. Type Safety Completo

Todo o código utiliza TypeScript em modo strict, com interfaces bem definidas para:

- Modelos de dados (Trip, Transport, City, etc.)
- Respostas de API
- Props de componentes
- Estados de contexto

Validação em runtime é feita com Zod para formulários e dados externos.

#### 5. Offline-First

O aplicativo funciona mesmo sem conexão:

- **LocalStorage** para cache de dados
- **PendingActions** para operações offline
- **Sincronização automática** quando online

### Modelos de Dados Principais

#### Trip (Viagem)
```typescript
interface Trip {
  id: string;
  title: string;
  destination: string;
  detailedDestinations?: DetailedDestination[];
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'planning' | 'completed';
  coverImage: string;
  participants: Participant[];
  tasks?: TaskItem[];
}
```

#### City (Cidade)
```typescript
interface City {
  id: string;
  name: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  headline: string;
  image: string;
  countryInfo?: CountryInfo;
  costOfLiving?: CostOfLiving;
}
```

#### Transport (Transporte)
```typescript
interface Transport {
  id: string;
  type: 'flight' | 'train' | 'car' | 'transfer' | 'bus' | 'ferry';
  operator: string;
  departureLocation: string;
  departureTime: string;
  arrivalLocation: string;
  arrivalTime: string;
  status: 'confirmed' | 'scheduled' | 'pending' | 'cancelled';
}
```

#### ItineraryActivity (Atividade do Roteiro)
```typescript
interface ItineraryActivity {
  id: string;
  day: number;
  date: string;
  time: string;
  title: string;
  location?: string;
  type: 'transport' | 'accommodation' | 'meal' | 'sightseeing' | 'culture' | 'food' | 'nature' | 'shopping';
  completed: boolean;
}
```

---

## Integrações Externas

### Google Gemini AI

Principal motor de inteligência artificial do aplicativo. Utilizado para:

- **Geração de roteiros**: Cria itinerários completos baseados em preferências
- **Guias de cidades**: Gera conteúdo sobre destinos (atrações, gastronomia, dicas)
- **Análise de documentos**: Extrai dados de PDFs e imagens usando visão computacional
- **Geração de imagens**: Cria visuais de atrações e pratos típicos
- **Processamento de linguagem natural**: Entende perguntas e gera respostas contextuais

O serviço implementa cache inteligente para otimizar custos e performance.

### Supabase

Backend-as-a-Service que fornece:

- **PostgreSQL**: Banco de dados relacional para armazenar viagens, transportes, hospedagens, etc.
- **Auth**: Autenticação multi-método (email, Google, Apple)
- **Row Level Security**: Segurança a nível de linha para isolamento de dados
- **Real-time**: Capacidade de sincronização em tempo real (opcional)

### Google Maps Platform

- **Maps JavaScript API**: Exibição de mapas interativos
- **Places API**: Autocomplete e busca de lugares
- **Maps 3D**: Visualização tridimensional com WebGL

### APIs Externas Adicionais

- **ExchangeRate-API**: Taxa de câmbio em tempo real
- **Flight Status API**: Rastreamento de voos
- **Weather API**: Previsão do tempo para destinos

---

## Componentes da Interface

### Biblioteca de UI Base

O aplicativo possui uma biblioteca de componentes reutilizáveis:

- **Button**: Botões em variantes (primary, secondary, outline, ghost)
- **Card**: Cartões com sombra e border radius
- **Input/Textarea**: Campos de entrada customizados
- **Select/MultiSelect**: Seletores com suporte a múltipla escolha
- **Badge**: Labels e tags coloridas
- **DatePicker**: Seletor de data avançado
- **CurrencyInput**: Input especializado para valores monetários
- **LoadingSpinner**: Indicador de carregamento
- **EmptyState**: Estado vazio com ilustração

### Hooks Customizados

```typescript
// Dados e Estado
useTripData()          // Carrega dados completos da viagem
useTripModals()        // Gerencia estado de modais
useFormState()         // Estado de formulários
useLocalStorage()      // Persistência em localStorage

// IA e Geração
useCityGuide()         // Busca/cache de guia de cidade
useImageGeneration()   // Geração de imagens via Gemini
useLLMAnalysis()       // Análise de documentos com IA

// Integrações
useFlightTracking()    // Rastreamento de voos em tempo real
useCurrency()          // Conversão de moedas
useCalendarNotifications() // Notificações de calendário

// UI
useDebounce()          // Debounce de valores
useModal()             // Estado simples de modal
useMap3DCamera()       // Controle de câmera 3D
```

---

## Performance e Otimizações

### Estratégias Implementadas

1. **Code Splitting**: Componentes carregados sob demanda
2. **Lazy Loading**: Imagens e recursos carregados conforme necessário
3. **Memoization**: Uso de `useMemo` e `useCallback` para evitar recálculos
4. **Debouncing**: Operações de busca e filtro com debounce
5. **Image Compression**: Compressão de imagens antes de upload
6. **Cache de API**: Respostas de IA cacheadas para economia
7. **Virtual Scrolling**: Listas longas renderizadas sob demanda

### Métricas do Codebase

| Métrica | Valor |
|---------|-------|
| Componentes React | 152 arquivos |
| Páginas | 12 |
| Contextos | 13 providers |
| Serviços | 28 serviços |
| Custom Hooks | 16 hooks |
| Linhas em Trip Details | ~21.500 |
| Linhas em Serviços | ~5.900 |

---

## Segurança

### Medidas Implementadas

- **Row Level Security (RLS)** no Supabase para isolamento de dados por usuário
- **Environment Variables** para chaves de API (nunca expostas no cliente)
- **Validação com Zod** para todos os dados de entrada
- **Sanitização de inputs** para prevenir XSS
- **Autenticação multi-fator** disponível via Supabase Auth
- **CORS configurado** para restringir origens permitidas

---

## Considerações Finais

O PorAí representa uma abordagem moderna para planejamento de viagens, combinando:

- **Experiência do usuário fluida** com interface responsiva e animações suaves
- **Inteligência artificial prática** que realmente economiza tempo do usuário
- **Arquitetura escalável** preparada para crescimento
- **Código manutenível** com separação clara de responsabilidades
- **Performance otimizada** para funcionar bem em qualquer dispositivo

O projeto está estruturado para facilitar a adição de novas funcionalidades, manutenção contínua e colaboração em equipe.

---

*Documentação gerada em Janeiro de 2026*
*Versão do aplicativo: Baseada nos commits mais recentes do repositório*
