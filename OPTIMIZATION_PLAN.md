# Plano de Otimização do Código - PorAí App

## Resumo Executivo

Este documento apresenta um plano completo de otimização para a aplicação React de planejamento de viagens. O codebase atual possui **90+ componentes**, **10 context providers** e **12 páginas**, com oportunidades significativas de melhoria em performance, organização e qualidade.

---

## FASE 1: Performance Crítica (Prioridade Alta)

### Tarefa 1.1: Quebrar Componentes Monolíticos

**Problema:** Componentes com 1000+ linhas causam re-renders desnecessários e dificultam manutenção.

**Arquivos a modificar:**

| Componente | Linhas | Ação |
|------------|--------|------|
| `src/components/trip-details/OverviewTab.tsx` | 2,165 | Dividir em 6 componentes |
| `src/pages/TripDetails.tsx` | 1,356 | Dividir em 4 componentes |
| `src/components/trip-details/modals/AddTransportModal.tsx` | 750 | Extrair lógica de formulário |
| `src/components/trip-details/ItineraryView.tsx` | 748 | Separar drag-drop logic |
| `src/components/trip-details/modals/AddTripModal.tsx` | 689 | Extrair seções do formulário |

**Instruções para OverviewTab.tsx:**
```
1. Criar pasta: src/components/trip-details/overview/
2. Extrair componentes:
   - OverviewHeader.tsx (hero section, título, datas)
   - OverviewTimeline.tsx (timeline de cidades)
   - OverviewBudget.tsx (seção de orçamento)
   - OverviewWeather.tsx (previsão do tempo)
   - OverviewTasks.tsx (checklist de tarefas)
   - OverviewVideos.tsx (galeria de vídeos)
3. Manter OverviewTab.tsx como orquestrador
4. Passar apenas props necessárias para cada sub-componente
5. Adicionar React.memo em cada sub-componente
```

**Instruções para TripDetails.tsx:**
```
1. Criar componentes:
   - TripDetailsHeader.tsx (navegação, título)
   - TripDetailsModals.tsx (container de modais)
   - TripDetailsTabs.tsx (lógica de abas)
2. Mover estado de modais para custom hook: useTripsModals()
3. Usar React.lazy para carregar modais sob demanda
```

---

### Tarefa 1.2: Implementar Memoização em Componentes

**Problema:** 0 instâncias de React.memo no projeto; 58 componentes sem otimização.

**Instruções:**
```
1. Adicionar React.memo em todos os componentes de lista:
   - ActivityCard.tsx
   - TripCard.tsx
   - ExpenseCard.tsx
   - AccommodationCard.tsx
   - TransportCard.tsx
   - CityCard.tsx
   - NotificationCard.tsx

2. Padrão a seguir:

   // Antes
   export function ActivityCard({ activity }: Props) { ... }

   // Depois
   export const ActivityCard = memo(function ActivityCard({ activity }: Props) {
     ...
   });

   // Se precisar de comparação customizada:
   export const ActivityCard = memo(function ActivityCard({ activity }: Props) {
     ...
   }, (prevProps, nextProps) => prevProps.activity.id === nextProps.activity.id);

3. Arquivos prioritários para memoização:
   - src/components/dashboard/ActivitySummary.tsx
   - src/components/dashboard/RecentTrips.tsx
   - src/components/dashboard/UpcomingActivities.tsx
   - src/components/trip-details/ActivitiesSection.tsx
   - src/components/trip-details/CitiesTimeline.tsx
```

---

### Tarefa 1.3: Implementar Code Splitting e Lazy Loading

**Problema:** Todas as 12 páginas carregadas no bundle inicial; nenhum uso de React.lazy().

**Arquivo a modificar:** `src/App.tsx`

**Instruções:**
```tsx
// Antes
import Dashboard from './pages/Dashboard';
import TripDetails from './pages/TripDetails';
import CalendarView from './pages/CalendarView';
// ... outros imports

// Depois
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Journal = lazy(() => import('./pages/Journal'));
const Settings = lazy(() => import('./pages/Settings'));
const Documents = lazy(() => import('./pages/Documents'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const SharedTrip = lazy(() => import('./pages/SharedTrip'));
const Auth = lazy(() => import('./pages/Auth'));

// Envolver routes em Suspense:
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    {/* ... outras rotas */}
  </Routes>
</Suspense>
```

**Criar componente de loading:** `src/components/ui/PageLoader.tsx`
```tsx
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
```

---

### Tarefa 1.4: Adicionar useMemo para Cálculos Custosos

**Problema:** Cálculos de datas, moedas e agregações refeitos a cada render.

**Arquivos e instruções:**

**1. Dashboard.tsx - Memoizar agregações:**
```tsx
// Adicionar useMemo para:
const upcomingTrips = useMemo(() =>
  trips.filter(t => new Date(t.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
  [trips]
);

const totalExpenses = useMemo(() =>
  expenses.reduce((sum, e) => sum + e.amount, 0),
  [expenses]
);
```

**2. CalendarView.tsx - Memoizar eventos:**
```tsx
const calendarEvents = useMemo(() =>
  generateCalendarEvents(trips, activities, transports),
  [trips, activities, transports]
);
```

**3. OverviewTab.tsx - Memoizar cálculos de orçamento:**
```tsx
const budgetSummary = useMemo(() => ({
  total: expenses.reduce((sum, e) => sum + e.amount, 0),
  byCategory: groupExpensesByCategory(expenses),
  remaining: budget - total,
}), [expenses, budget]);
```

---

### Tarefa 1.5: Lazy Load de Dependências Pesadas

**Problema:** Google Maps e Gemini AI carregados em múltiplos componentes.

**Instruções:**

**1. Criar hook centralizado para Google Maps:**
```
Arquivo: src/hooks/useGoogleMaps.ts

- Usar useLoadScript do @react-google-maps/api
- Carregar apenas quando necessário
- Compartilhar instância entre componentes
- Implementar loading state
```

**2. Lazy load de modais com Google Maps:**
```tsx
// Em TripDetails.tsx ou onde modais são renderizados
const AddTripModal = lazy(() => import('./modals/AddTripModal'));
const EditCityModal = lazy(() => import('./modals/EditCityModal'));

// Renderizar apenas quando aberto:
{isAddTripOpen && (
  <Suspense fallback={<ModalLoader />}>
    <AddTripModal onClose={() => setIsAddTripOpen(false)} />
  </Suspense>
)}
```

---

## FASE 2: Organização do Código (Prioridade Média-Alta)

### Tarefa 2.1: Consolidar Configurações Duplicadas

**Problema:** 17+ configurações duplicadas em diferentes componentes.

**Instruções:**

**1. Criar arquivo de configurações:** `src/config/constants.ts`
```tsx
export const ACTIVITY_TYPES = [
  { value: 'tour', label: 'Passeio', icon: 'Map' },
  { value: 'restaurant', label: 'Restaurante', icon: 'Utensils' },
  { value: 'museum', label: 'Museu', icon: 'Building' },
  // ... outros tipos
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'transport', label: 'Transporte', icon: 'Car' },
  { value: 'food', label: 'Alimentação', icon: 'Utensils' },
  { value: 'accommodation', label: 'Hospedagem', icon: 'Hotel' },
  // ... outras categorias
] as const;

export const PAYMENT_METHODS = [
  { value: 'credit', label: 'Cartão de Crédito' },
  { value: 'debit', label: 'Cartão de Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
] as const;

export const TRANSPORT_TYPES = [...] as const;
export const DOCUMENT_TYPES = [...] as const;
export const NOTIFICATION_TYPES = [...] as const;
```

**2. Atualizar componentes para usar configurações centralizadas:**
```
Arquivos a atualizar:
- src/components/trip-details/modals/AddActivityModal.tsx (linhas 51-61)
- src/components/trip-details/ItineraryView.tsx (linhas 50-61)
- src/components/trip-details/modals/AddExpenseModal.tsx (linhas 42-49)
- src/components/trip-details/modals/AddTransportModal.tsx
- src/components/trip-details/modals/AddDocumentModal.tsx
```

---

### Tarefa 2.2: Abstrair Padrões de Modal/Formulário

**Problema:** 19 modais com lógica duplicada de formulário, validação e estado.

**Instruções:**

**1. Criar componente base de modal:** `src/components/ui/ModalForm.tsx`
```tsx
interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (data: FormData) => Promise<void>;
  children: React.ReactNode;
  submitLabel?: string;
  isLoading?: boolean;
}

export function ModalForm({
  isOpen,
  onClose,
  title,
  onSubmit,
  children,
  submitLabel = 'Salvar',
  isLoading = false
}: ModalFormProps) {
  // Lógica comum de modal: overlay, focus trap, escape key, etc.
}
```

**2. Criar hooks para formulários:** `src/hooks/useFormState.ts`
```tsx
export function useFormState<T>(initialState: T) {
  const [data, setData] = useState(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof T, value: T[keyof T]) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const reset = () => setData(initialState);

  return { data, errors, isSubmitting, handleChange, setErrors, setIsSubmitting, reset };
}
```

**3. Refatorar modais para usar componentes base:**
```
Ordem de refatoração:
1. AddExpenseModal.tsx (mais simples, bom para teste)
2. AddActivityModal.tsx
3. AddAccommodationModal.tsx
4. AddTransportModal.tsx
5. Demais modais
```

---

### Tarefa 2.3: Refatorar Gerenciamento de Estado

**Problema:** 10 context providers aninhados; múltiplas fontes de verdade (Context + localStorage).

**Instruções:**

**1. Agrupar contexts relacionados:**
```
Antes (10 providers):
ThemeProvider > AuthProvider > TripProvider > CalendarProvider > UIProvider >
AIProvider > NotificationProvider > AccommodationProvider > TransportProvider >
ItineraryProvider

Depois (5-6 providers):
ThemeProvider > AuthProvider > TripProvider > TripDataProvider > UIProvider > AIProvider

Onde TripDataProvider combina:
- CalendarProvider
- AccommodationProvider
- TransportProvider
- ItineraryProvider
```

**2. Criar custom hooks para acessar dados combinados:**
```
Arquivo: src/hooks/useTripData.ts

export function useTripData(tripId: string) {
  const { activities } = useItinerary();
  const { accommodations } = useAccommodation();
  const { transports } = useTransport();

  return useMemo(() => ({
    activities: activities.filter(a => a.tripId === tripId),
    accommodations: accommodations.filter(a => a.tripId === tripId),
    transports: transports.filter(t => t.tripId === tripId),
  }), [activities, accommodations, transports, tripId]);
}
```

**3. Eliminar localStorage como fonte primária:**
```
- Mover dados para Supabase ou Context
- Usar localStorage apenas como cache/fallback
- Implementar sync bidirecional com Supabase
```

---

### Tarefa 2.4: Centralizar Chamadas de API

**Problema:** Chamadas a Supabase, Gemini e Google Maps espalhadas pelo código sem padronização.

**Instruções:**

**1. Criar camada de serviços:** `src/services/`
```
Estrutura:
src/services/
├── api/
│   ├── client.ts        # Configuração base do cliente
│   ├── trips.ts         # CRUD de viagens
│   ├── activities.ts    # CRUD de atividades
│   ├── expenses.ts      # CRUD de despesas
│   └── documents.ts     # CRUD de documentos
├── gemini/
│   ├── client.ts        # Configuração do Gemini
│   ├── itinerary.ts     # Geração de itinerários
│   └── cityGuide.ts     # Guias de cidades
└── maps/
    └── places.ts        # Autocomplete e detalhes
```

**2. Implementar cache para chamadas Gemini:**
```tsx
// src/services/gemini/cache.ts
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

export async function cachedGeminiCall<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

**3. Implementar retry com exponential backoff:**
```tsx
// src/services/api/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## FASE 3: Qualidade e Segurança (Prioridade Média)

### Tarefa 3.1: Eliminar Tipos `any`

**Problema:** 44+ instâncias de `any` no código.

**Instruções:**

**1. Localizar e corrigir tipos any:**
```bash
# Comando para encontrar:
grep -rn ": any" src/
grep -rn "as any" src/
```

**2. Arquivos prioritários:**
```
- src/contexts/AIContext.tsx (groundingLinks: any[])
- src/services/geminiService.ts (respostas de API)
- src/contexts/*.tsx (handlers de eventos)
```

**3. Criar tipos para respostas de API:**
```tsx
// src/types/api.ts
export interface GeminiItineraryResponse {
  activities: Array<{
    name: string;
    description: string;
    date: string;
    time: string;
    duration: number;
    location: {
      name: string;
      coordinates: { lat: number; lng: number };
    };
  }>;
}

export interface GeminiCityGuideResponse {
  overview: string;
  highlights: string[];
  tips: string[];
  weather: {
    temperature: number;
    condition: string;
  };
}
```

---

### Tarefa 3.2: Implementar Error Boundaries

**Problema:** Nenhum Error Boundary no app; erros causam crash total.

**Instruções:**

**1. Criar Error Boundary genérico:** `src/components/ErrorBoundary.tsx`
```tsx
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enviar para serviço de logging (Sentry, etc.)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**2. Criar fallback de erro:** `src/components/ErrorFallback.tsx`
```tsx
export function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
      <p className="text-gray-600 mb-4">
        {error?.message || 'Ocorreu um erro inesperado'}
      </p>
      <button onClick={() => window.location.reload()}>
        Recarregar página
      </button>
    </div>
  );
}
```

**3. Aplicar Error Boundaries em:**
```
- App.tsx (root level)
- Cada página/rota
- Componentes que fazem chamadas de API
- Componentes que usam bibliotecas externas (Maps, Charts)
```

---

### Tarefa 3.3: Remover Console Statements e Alerts

**Problema:** 101 console.log/error/warn; 4 alert() em produção.

**Instruções:**

**1. Criar serviço de logging:** `src/services/logger.ts`
```tsx
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  warn: (...args: unknown[]) => isDev && console.warn(...args),
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
    // Em produção, enviar para serviço de monitoramento
    // sendToErrorTracking(args);
  },
  info: (...args: unknown[]) => isDev && console.info(...args),
};
```

**2. Substituir console statements:**
```bash
# Encontrar todos os console statements:
grep -rn "console\." src/

# Substituir por logger:
# console.log -> logger.log
# console.error -> logger.error
# console.warn -> logger.warn
```

**3. Substituir alert() por toast/notification:**
```tsx
// Antes
alert('Erro ao criar viagem');

// Depois
import { toast } from './components/ui/Toast';
toast.error('Erro ao criar viagem');
```

**Arquivos com alert():**
```
- src/components/trip-details/modals/AddTripModal.tsx
- src/pages/TripDetails.tsx
```

---

### Tarefa 3.4: Validação de Dados de Entrada

**Problema:** Formulários sem validação robusta; dados de API não validados.

**Instruções:**

**1. Instalar Zod para validação:**
```bash
npm install zod
```

**2. Criar schemas de validação:** `src/lib/validation/`
```tsx
// src/lib/validation/trip.ts
import { z } from 'zod';

export const tripSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  destination: z.string().min(2, 'Destino é obrigatório'),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Data inválida'),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Data inválida'),
  budget: z.number().min(0, 'Orçamento deve ser positivo').optional(),
});

export type TripInput = z.infer<typeof tripSchema>;

// src/lib/validation/activity.ts
export const activitySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  date: z.string(),
  time: z.string().optional(),
  type: z.enum(['tour', 'restaurant', 'museum', 'beach', 'shopping', 'other']),
  notes: z.string().optional(),
});
```

**3. Usar validação nos formulários:**
```tsx
// Em AddTripModal.tsx
import { tripSchema } from '@/lib/validation/trip';

const handleSubmit = async (data: unknown) => {
  const result = tripSchema.safeParse(data);
  if (!result.success) {
    setErrors(result.error.flatten().fieldErrors);
    return;
  }
  // Prosseguir com dados validados
  await createTrip(result.data);
};
```

---

## FASE 4: Testes e Acessibilidade (Prioridade Média)

### Tarefa 4.1: Configurar Framework de Testes

**Problema:** Zero testes no projeto.

**Instruções:**

**1. Instalar dependências:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**2. Configurar Vitest:** `vite.config.ts`
```tsx
export default defineConfig({
  // ... config existente
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

**3. Criar setup de testes:** `src/test/setup.ts`
```tsx
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

**4. Criar utilitário de render:** `src/test/utils.tsx`
```tsx
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
// ... outros providers

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        {/* outros providers necessários */}
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}
```

---

### Tarefa 4.2: Escrever Testes Unitários Prioritários

**Instruções:**

**1. Testes para utilitários:** `src/lib/__tests__/`
```
Criar testes para:
- src/lib/utils.ts
- src/lib/dateUtils.ts (se existir)
- src/lib/formatters.ts (se existir)
```

**2. Testes para hooks:** `src/hooks/__tests__/`
```
Criar testes para:
- useFormState.ts (após criação)
- useTripData.ts (após criação)
- Custom hooks existentes
```

**3. Testes para contexts:** `src/contexts/__tests__/`
```
Prioridade:
- TripContext.test.tsx (CRUD de viagens)
- AuthContext.test.tsx (autenticação)
- ItineraryContext.test.tsx (atividades)
```

**4. Testes para componentes críticos:**
```
Prioridade:
- TripCard.test.tsx
- ActivityCard.test.tsx
- AddTripModal.test.tsx (validação de formulário)
```

**Exemplo de teste:**
```tsx
// src/components/__tests__/TripCard.test.tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { TripCard } from '../TripCard';

const mockTrip = {
  id: '1',
  name: 'Viagem para Paris',
  destination: 'Paris, França',
  startDate: '2024-06-01',
  endDate: '2024-06-10',
};

describe('TripCard', () => {
  it('renders trip name and destination', () => {
    renderWithProviders(<TripCard trip={mockTrip} />);

    expect(screen.getByText('Viagem para Paris')).toBeInTheDocument();
    expect(screen.getByText('Paris, França')).toBeInTheDocument();
  });

  it('displays correct date range', () => {
    renderWithProviders(<TripCard trip={mockTrip} />);

    expect(screen.getByText(/01 Jun - 10 Jun/)).toBeInTheDocument();
  });
});
```

---

### Tarefa 4.3: Adicionar Atributos de Acessibilidade

**Problema:** Zero atributos ARIA; falta de semântica HTML.

**Instruções:**

**1. Adicionar ARIA labels em botões:**
```tsx
// Antes
<button onClick={handleClose}>
  <XIcon />
</button>

// Depois
<button
  onClick={handleClose}
  aria-label="Fechar modal"
>
  <XIcon aria-hidden="true" />
</button>
```

**2. Adicionar roles em modais:**
```tsx
// Antes
<div className="modal">

// Depois
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Título do Modal</h2>
  <p id="modal-description">Descrição...</p>
```

**3. Adicionar labels em formulários:**
```tsx
// Garantir que todos os inputs tenham labels associados
<label htmlFor="trip-name">Nome da viagem</label>
<input
  id="trip-name"
  aria-required="true"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? "name-error" : undefined}
/>
{errors.name && <span id="name-error" role="alert">{errors.name}</span>}
```

**4. Componentes prioritários para acessibilidade:**
```
- Todos os modais (19 arquivos em modals/)
- Navegação principal (Sidebar, Header)
- Formulários (inputs, selects, checkboxes)
- Notificações (role="alert")
- Cards clicáveis (role="button" ou usar <button>)
```

---

### Tarefa 4.4: Implementar Navegação por Teclado

**Instruções:**

**1. Focus trap em modais:**
```tsx
// Usar react-focus-lock ou implementar:
import FocusLock from 'react-focus-lock';

<FocusLock>
  <div role="dialog">
    {/* conteúdo do modal */}
  </div>
</FocusLock>
```

**2. Escape key handler:**
```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

**3. Navegação com Tab:**
```
- Garantir ordem lógica de tabulação
- Usar tabIndex="0" para elementos focáveis customizados
- Usar tabIndex="-1" para elementos que não devem receber foco
```

---

## FASE 5: Otimização de Bundle (Prioridade Média-Baixa)

### Tarefa 5.1: Configurar Code Splitting no Vite

**Arquivo:** `vite.config.ts`

**Instruções:**
```tsx
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', '@dnd-kit/core', '@dnd-kit/sortable'],
          'maps-vendor': ['@react-google-maps/api', 'leaflet'],
          'date-vendor': ['date-fns'],

          // Feature chunks
          'ai-features': ['./src/services/geminiService.ts', './src/contexts/AIContext.tsx'],
          'calendar': ['./src/pages/CalendarView.tsx', './src/contexts/CalendarContext.tsx'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
```

---

### Tarefa 5.2: Consolidar Sistema de Ícones

**Problema:** Mix de Lucide React e Material Symbols.

**Instruções:**

**1. Escolher um sistema (recomendado: Lucide):**
```bash
npm install lucide-react
```

**2. Criar componente wrapper:** `src/components/ui/Icon.tsx`
```tsx
import * as LucideIcons from 'lucide-react';

type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  const LucideIcon = LucideIcons[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} />;
}
```

**3. Migrar ícones Material Symbols para Lucide:**
```
- Criar mapeamento de ícones equivalentes
- Substituir gradualmente em cada componente
- Remover dependência de Material Symbols
```

---

### Tarefa 5.3: Otimizar Imagens e Assets

**Instruções:**

**1. Instalar plugin de otimização:**
```bash
npm install -D vite-plugin-image-optimizer
```

**2. Configurar em vite.config.ts:**
```tsx
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  plugins: [
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 80 },
    }),
  ],
});
```

**3. Usar lazy loading para imagens:**
```tsx
<img
  src={imageSrc}
  loading="lazy"
  decoding="async"
  alt="Descrição"
/>
```

---

## Checklist de Implementação

### Fase 1 - Performance Crítica
- [ ] 1.1 Quebrar OverviewTab.tsx em 6 componentes
- [ ] 1.1 Quebrar TripDetails.tsx em 4 componentes
- [ ] 1.2 Adicionar React.memo em componentes de lista (7+)
- [ ] 1.3 Implementar lazy loading para 12 páginas
- [ ] 1.3 Criar componente PageLoader
- [ ] 1.4 Adicionar useMemo em Dashboard, CalendarView, OverviewTab
- [ ] 1.5 Criar hook centralizado useGoogleMaps
- [ ] 1.5 Lazy load de modais com Google Maps

### Fase 2 - Organização do Código
- [ ] 2.1 Criar src/config/constants.ts
- [ ] 2.1 Atualizar 5+ modais para usar constants
- [ ] 2.2 Criar componente ModalForm
- [ ] 2.2 Criar hook useFormState
- [ ] 2.2 Refatorar 3+ modais para usar ModalForm
- [ ] 2.3 Agrupar contexts (de 10 para 5-6)
- [ ] 2.3 Criar hook useTripData
- [ ] 2.4 Criar camada de serviços (src/services/)
- [ ] 2.4 Implementar cache para Gemini
- [ ] 2.4 Implementar retry com backoff

### Fase 3 - Qualidade e Segurança
- [ ] 3.1 Eliminar 44+ tipos `any`
- [ ] 3.1 Criar types/api.ts
- [ ] 3.2 Criar ErrorBoundary
- [ ] 3.2 Criar ErrorFallback
- [ ] 3.2 Aplicar boundaries em rotas
- [ ] 3.3 Criar serviço de logging
- [ ] 3.3 Substituir 101 console statements
- [ ] 3.3 Substituir 4 alert() por toast
- [ ] 3.4 Instalar e configurar Zod
- [ ] 3.4 Criar schemas de validação

### Fase 4 - Testes e Acessibilidade
- [ ] 4.1 Configurar Vitest
- [ ] 4.1 Criar setup e utilitários de teste
- [ ] 4.2 Escrever testes para utils
- [ ] 4.2 Escrever testes para contexts
- [ ] 4.2 Escrever testes para componentes
- [ ] 4.3 Adicionar ARIA labels em botões
- [ ] 4.3 Adicionar roles em modais
- [ ] 4.3 Adicionar labels em formulários
- [ ] 4.4 Implementar focus trap
- [ ] 4.4 Implementar escape key handlers

### Fase 5 - Bundle
- [ ] 5.1 Configurar manualChunks no Vite
- [ ] 5.2 Migrar para Lucide icons
- [ ] 5.3 Configurar otimização de imagens

---

## Métricas de Sucesso

| Métrica | Antes | Meta |
|---------|-------|------|
| Bundle inicial | ~2MB (estimado) | < 500KB |
| Componentes com memo | 0 | 90+ |
| Tipos `any` | 44+ | 0 |
| Cobertura de testes | 0% | > 60% |
| Console statements | 101 | 0 |
| Atributos ARIA | 0 | 100+ |
| Tempo de First Paint | ~3s (estimado) | < 1.5s |

---

*Documento gerado em: 10 de Janeiro de 2026*
*Versão: 1.0*
