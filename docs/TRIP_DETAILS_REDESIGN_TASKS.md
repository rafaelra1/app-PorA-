# Trip Details Redesign - Tarefas de Implementação

> **Objetivo:** Reformular a página de detalhes da viagem seguindo o design com sidebar lateral, inspirado em Materio e AirAxis.

---

## 📋 Índice de Tarefas

| Fase | Descrição | Prioridade | Status |
|------|-----------|------------|--------|
| 1 | Sidebar de Navegação | 🔴 Alta | ✅ Concluída |
| 2 | Header Aprimorado | 🟡 Média | ⬜ Pendente |
| 3 | Overview Dashboard | 🔴 Alta | ⬜ Pendente |
| 4 | Seções Individuais | 🟡 Média | ⬜ Pendente |
| 5 | Animações e Micro-interações | 🟢 Baixa | ⬜ Pendente |
| 6 | Responsividade Mobile | 🔴 Alta | ⬜ Pendente |

---

## ✅ FASE 1: Sidebar de Navegação (CONCLUÍDA)

### Arquivos Modificados
- `components/trip-details/TripSidebar.tsx`
- `pages/TripDetails.tsx`

### Funcionalidades Implementadas
- [x] Sidebar compacta (72px)
- [x] Ícones com gradientes coloridos
- [x] Tooltips no hover
- [x] Badges com contadores
- [x] Botão voltar integrado
- [x] Indicador de seção ativa

---

## ⬜ FASE 2: Header Aprimorado

### Arquivo Alvo
```
components/trip-details/TripDetailsHeader.tsx
```

### Tarefa 2.1: Countdown Badge Animado
**Descrição:** Adicionar badge com contagem regressiva até a viagem

**Instruções:**
1. Criar componente `CountdownBadge` em `components/ui/CountdownBadge.tsx`
2. Props: `targetDate: string`, `variant?: 'default' | 'urgent'`
3. Mostrar "X DIAS RESTANTES" com ícone de avião
4. Quando < 7 dias, usar cor de urgência (laranja/vermelho)
5. Adicionar animação de pulso sutil

**Código Base:**
```tsx
interface CountdownBadgeProps {
  targetDate: string;
  variant?: 'default' | 'urgent';
}

const CountdownBadge: React.FC<CountdownBadgeProps> = ({ targetDate, variant = 'default' }) => {
  const daysRemaining = calculateDaysRemaining(targetDate);
  const isUrgent = daysRemaining <= 7;

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full
      ${isUrgent ? 'bg-amber-500 text-white' : 'bg-white/20 backdrop-blur-md text-white'}
      animate-pulse-subtle
    `}>
      <span className="material-symbols-outlined text-sm">flight_takeoff</span>
      <span className="text-xs font-bold uppercase tracking-wide">
        {daysRemaining} {daysRemaining === 1 ? 'Dia Restante' : 'Dias Restantes'}
      </span>
    </div>
  );
};
```

### Tarefa 2.2: Status Badge Melhorado
**Descrição:** Redesenhar badge de status (Planejamento/Confirmado/Concluído)

**Instruções:**
1. Criar variantes de cor por status
2. Adicionar ícone correspondente
3. Implementar animação de entrada

**Mapeamento de Status:**
| Status | Cor | Ícone |
|--------|-----|-------|
| planning | Azul (#3B82F6) | edit_calendar |
| confirmed | Verde (#10B981) | check_circle |
| completed | Cinza (#6B7280) | task_alt |

### Tarefa 2.3: Avatares dos Participantes
**Descrição:** Melhorar exibição dos participantes com hover

**Instruções:**
1. Limitar a 4 avatares visíveis
2. Mostrar "+X" para excedentes
3. No hover, mostrar tooltip com nome
4. Adicionar borda de destaque para o organizador

**Código Base:**
```tsx
<div className="flex -space-x-2">
  {participants.slice(0, 4).map((p, i) => (
    <div key={i} className="relative group">
      <img
        src={p.avatar}
        className={`
          size-8 rounded-full border-2
          ${p.isOrganizer ? 'border-amber-400' : 'border-white'}
          transition-transform group-hover:scale-110 group-hover:z-10
        `}
      />
      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2
                      opacity-0 group-hover:opacity-100 transition-opacity
                      bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
        {p.name} {p.isOrganizer && '(Organizador)'}
      </div>
    </div>
  ))}
</div>
```

### Tarefa 2.4: Parallax Suave no Banner
**Descrição:** Adicionar efeito parallax na imagem de fundo

**Instruções:**
1. Usar `transform: translateY()` baseado no scroll
2. Limitar movimento a 20-30px máximo
3. Usar `will-change: transform` para performance

**Código Base:**
```tsx
const [scrollY, setScrollY] = useState(0);

useEffect(() => {
  const handleScroll = () => setScrollY(window.scrollY);
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// No img:
style={{ transform: `translateY(${scrollY * 0.3}px)` }}
```

---

## ⬜ FASE 3: Overview Dashboard

### Arquivo Alvo
```
components/trip-details/overview/OverviewTab.tsx
```

### Tarefa 3.1: Criar Widget de Countdown
**Descrição:** Card com progresso circular até a viagem

**Arquivo:** `components/trip-details/overview/widgets/CountdownWidget.tsx`

**Instruções:**
1. Usar SVG para círculo de progresso
2. Mostrar dias restantes no centro
3. Calcular % baseado em data de criação → data de início
4. Adicionar gradiente no stroke

**Props:**
```tsx
interface CountdownWidgetProps {
  startDate: string;
  createdAt?: string;
}
```

**Visual:**
```
┌─────────────────┐
│   ┌─────────┐   │
│  /    14    \   │
│ │    dias   │   │
│  \   ███░   /   │
│   └─────────┘   │
│  Faltam 14 dias │
│  para a viagem  │
└─────────────────┘
```

### Tarefa 3.2: Criar Widget de Orçamento
**Descrição:** Card com barra de progresso do orçamento

**Arquivo:** `components/trip-details/overview/widgets/BudgetWidget.tsx`

**Instruções:**
1. Mostrar valor gasto / valor total
2. Barra de progresso com cores (verde → amarelo → vermelho)
3. Indicador de média diária
4. Click navega para aba de Despesas

**Props:**
```tsx
interface BudgetWidgetProps {
  spent: number;
  total: number;
  currency?: string;
  onNavigate?: () => void;
}
```

**Cores por percentual:**
| % Gasto | Cor |
|---------|-----|
| 0-50% | Verde (#10B981) |
| 51-80% | Amarelo (#F59E0B) |
| 81-100% | Vermelho (#EF4444) |

### Tarefa 3.3: Criar Widget de Cidades
**Descrição:** Card com preview das cidades do roteiro

**Arquivo:** `components/trip-details/overview/widgets/CitiesWidget.tsx`

**Instruções:**
1. Mostrar até 3 cidades com imagem thumbnail
2. Indicador de progresso (visitadas/total)
3. Click em cidade navega para CityGuide

**Visual:**
```
┌─────────────────────────┐
│  🗺️ Cidades             │
│  ─────────────────────  │
│  [IMG] Rio de Janeiro   │
│  [IMG] Búzios          │
│  [IMG] Paraty     +1   │
│                         │
│  ●●●○  3 de 4 cidades  │
└─────────────────────────┘
```

### Tarefa 3.4: Criar Widget de Transportes
**Descrição:** Card resumo dos transportes

**Arquivo:** `components/trip-details/overview/widgets/TransportsWidget.tsx`

**Instruções:**
1. Agrupar por tipo (voos, carros, etc.)
2. Mostrar próximo transporte com destaque
3. Status indicator (confirmado/pendente)

**Visual:**
```
┌─────────────────────────┐
│  ✈️ Transportes         │
│  ─────────────────────  │
│  ✈️ 2 voos              │
│  🚗 1 aluguel           │
│  ─────────────────────  │
│  Próximo:               │
│  GRU → GIG  23/01 06:30 │
└─────────────────────────┘
```

### Tarefa 3.5: Criar Widget de Timeline
**Descrição:** Lista de próximos eventos/tarefas

**Arquivo:** `components/trip-details/overview/widgets/TimelineWidget.tsx`

**Instruções:**
1. Listar próximos 5 eventos cronologicamente
2. Incluir atividades, check-ins, voos
3. Permitir marcar como concluído
4. Mostrar linha de tempo visual

**Tipos de evento:**
| Tipo | Ícone | Cor |
|------|-------|-----|
| flight | flight_takeoff | Azul |
| hotel | hotel | Roxo |
| activity | local_activity | Verde |
| restaurant | restaurant | Laranja |
| task | task_alt | Cinza |

### Tarefa 3.6: Criar Widget de Clima
**Descrição:** Previsão do tempo no destino principal

**Arquivo:** `components/trip-details/overview/widgets/WeatherWidget.tsx`

**Instruções:**
1. Integrar com API de clima (OpenWeatherMap ou similar)
2. Mostrar temperatura atual e condição
3. Previsão para próximos 3-5 dias
4. Cache de 30 minutos

**Props:**
```tsx
interface WeatherWidgetProps {
  cityName: string;
  countryCode?: string;
}
```

**Nota:** Pode usar mock data inicialmente, integrar API depois.

### Tarefa 3.7: Criar Grid Layout do Overview
**Descrição:** Organizar widgets em grid responsivo

**Arquivo:** Modificar `components/trip-details/overview/OverviewTab.tsx`

**Layout Desktop:**
```
┌───────────┬───────────┬───────────┬───────────┐
│ Countdown │  Budget   │  Cities   │ Transports│
├───────────┴───────────┼───────────┴───────────┤
│      Timeline         │       Weather         │
├───────────────────────┴───────────────────────┤
│              Route Map (opcional)             │
└───────────────────────────────────────────────┘
```

**Classes Tailwind:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Row 1: 4 widgets pequenos */}
  <CountdownWidget />
  <BudgetWidget />
  <CitiesWidget />
  <TransportsWidget />
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
  {/* Row 2: 2 widgets médios */}
  <TimelineWidget />
  <WeatherWidget />
</div>
```

---

## ⬜ FASE 4: Seções Individuais

### Tarefa 4.1: Redesign do Itinerário
**Arquivo:** `components/trip-details/itinerary/ItineraryView.tsx`

**Mudanças:**
1. Adicionar visual de timeline vertical
2. Agrupar por dia com header destacado
3. Cards de atividade com ícone, hora, status
4. Drag and drop para reordenar

**Componentes a criar:**
- `ItineraryDayHeader.tsx` - Header do dia
- `ItineraryActivityCard.tsx` - Card de atividade
- `ItineraryTimeline.tsx` - Linha de tempo visual

### Tarefa 4.2: Redesign de Hospedagem
**Arquivo:** `components/trip-details/accommodation/` (nova pasta)

**Mudanças:**
1. Card estilo horizontal com imagem
2. Informações de check-in/out destacadas
3. Botões de ação (mapa, editar, excluir)
4. Badge de status

**Componente:** `AccommodationCard.tsx`

### Tarefa 4.3: Redesign de Transportes
**Arquivo:** `components/trip-details/transport/TransportView.tsx`

**Mudanças:**
1. Card estilo "boarding pass"
2. Linha visual origem → destino
3. Informações de voo/veículo
4. QR code mockup para embarque

**Componente:** `TransportCard.tsx` (estilo AirAxis)

### Tarefa 4.4: Redesign de Despesas
**Arquivo:** `components/trip-details/budget/` (nova pasta)

**Mudanças:**
1. Dashboard com gráfico circular
2. Breakdown por categoria
3. Lista de transações
4. Filtros por tipo

**Componentes:**
- `BudgetDashboard.tsx`
- `ExpenseList.tsx`
- `CategoryBreakdown.tsx`

---

## ⬜ FASE 5: Animações e Micro-interações

### Tarefa 5.1: Definir Tokens de Animação
**Arquivo:** `styles/animations.css`

**Adicionar:**
```css
/* Pulse sutil para badges */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Entrada de widgets */
@keyframes slide-up-fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Preenchimento de progresso */
@keyframes fill-progress {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: var(--progress); }
}
```

### Tarefa 5.2: Animações de Hover
**Aplicar em:**
- Cards: `hover:shadow-lg hover:-translate-y-1`
- Ícones: `hover:scale-110`
- Botões: `active:scale-95`

### Tarefa 5.3: Transições de Página
**Usar Framer Motion:**
```tsx
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.2 }}
>
  {content}
</motion.div>
```

---

## ⬜ FASE 6: Responsividade Mobile

### Tarefa 6.1: Sidebar para Bottom Tab Bar
**Arquivo:** `components/trip-details/TripSidebar.tsx`

**Instruções:**
1. Criar variante mobile com bottom tabs
2. Usar media query `md:` para alternar
3. Limitar a 5 itens visíveis + "mais"

**Layout Mobile:**
```
┌────────────────────────────────────────┐
│              Content                   │
│                                        │
├────────────────────────────────────────┤
│  📊    📅    🚗    💰    •••           │
└────────────────────────────────────────┘
```

### Tarefa 6.2: Grid Responsivo dos Widgets
**Breakpoints:**
- Mobile (`< 768px`): 1 coluna
- Tablet (`768-1024px`): 2 colunas
- Desktop (`> 1024px`): 4 colunas

### Tarefa 6.3: Header Compacto Mobile
**Mudanças:**
- Reduzir altura do banner (150px → 120px)
- Esconder alguns metadados
- Menu de ações em dropdown

### Tarefa 6.4: Touch Interactions
**Adicionar:**
- Swipe para navegar entre seções
- Pull to refresh
- Long press para ações rápidas

---

## 📁 Estrutura de Arquivos Final

```
components/trip-details/
├── TripSidebar.tsx ✅
├── TripDetailsHeader.tsx
├── overview/
│   ├── OverviewTab.tsx
│   └── widgets/
│       ├── CountdownWidget.tsx
│       ├── BudgetWidget.tsx
│       ├── CitiesWidget.tsx
│       ├── TransportsWidget.tsx
│       ├── TimelineWidget.tsx
│       └── WeatherWidget.tsx
├── itinerary/
│   ├── ItineraryView.tsx
│   ├── ItineraryDayHeader.tsx
│   ├── ItineraryActivityCard.tsx
│   └── ItineraryTimeline.tsx
├── accommodation/
│   ├── AccommodationView.tsx
│   └── AccommodationCard.tsx
├── transport/
│   ├── TransportView.tsx
│   └── TransportCard.tsx
├── budget/
│   ├── BudgetDashboard.tsx
│   ├── ExpenseList.tsx
│   └── CategoryBreakdown.tsx
├── documents/
│   └── DocumentsView.tsx
└── journal/
    └── JournalView.tsx
```

---

## 🎯 Ordem de Execução Recomendada

1. **Fase 3.7** - Grid Layout do Overview (estrutura base)
2. **Fase 3.1** - Widget de Countdown
3. **Fase 3.2** - Widget de Orçamento
4. **Fase 3.5** - Widget de Timeline
5. **Fase 2.1** - Countdown Badge no Header
6. **Fase 4.1** - Redesign do Itinerário
7. **Fase 6.1** - Bottom Tab Bar Mobile
8. **Demais tarefas** em paralelo

---

## 📝 Notas de Implementação

### Padrões a Seguir
- Usar `cn()` ou `clsx()` para classes condicionais
- Manter consistência com design tokens existentes
- Documentar props com JSDoc
- Criar stories no Storybook (se disponível)

### Cores de Referência (do design system)
```css
--primary: #dcdaec;
--secondary: #ABE2FE;
--text-main: #131316;
--text-muted: #706e7c;
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
```

### Ícones (Material Symbols)
Usar sempre `material-symbols-outlined` com classes:
- Tamanho: `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Filled: adicionar classe `fill` quando ativo
