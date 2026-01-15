# Plano de Redesign: Navegação Lateral com Perguntas Guiadas

## Visão Geral

Transformar a navegação horizontal atual (`TripSidebar`) em uma **sidebar lateral esquerda** com formato de **perguntas guiadas** e **estilo híbrido** (colapsável entre modo expandido e compacto).

---

## 1. Arquitetura Proposta

### 1.1 Estrutura de Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    TripDetailsHeader                            │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│   SIDEBAR    │              CONTENT AREA                        │
│   (Nova)     │                                                  │
│              │         (renderTripDetailContent)                │
│  240px-64px  │                                                  │
│  colapsável  │                                                  │
│              │                                                  │
│              │                                                  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### 1.2 Modos da Sidebar

| Modo | Largura | Conteúdo Visível |
|------|---------|------------------|
| **Expandido** | 280px | Ícone + Pergunta + Descrição + Badge + Progresso |
| **Compacto** | 64px | Ícone + Tooltip no hover |
| **Mobile** | Overlay | Drawer deslizante da esquerda |

---

## 2. Estrutura de Dados

### 2.1 Nova Interface de Item de Navegação

```typescript
// types/navigation.ts

export interface NavQuestion {
  id: SubTab;

  // Textos
  question: string;           // Pergunta principal (modo expandido)
  shortLabel: string;         // Label curto (modo compacto tooltip)
  description?: string;       // Descrição auxiliar

  // Visual
  icon: string;               // Material Symbol name
  gradient: string;           // Tailwind gradient classes
  iconColor: string;          // Cor do ícone quando inativo

  // Estado
  badge?: number;             // Contador de itens
  progress?: number;          // 0-100, progresso da seção
  isComplete?: boolean;       // Seção completa?

  // Subnavegação
  children?: NavQuestion[];   // Itens aninhados (ex: cidades)
  isExpanded?: boolean;       // Subnavegação expandida?
}

export interface SidebarState {
  isCollapsed: boolean;
  expandedItems: string[];    // IDs de itens com subnavegação aberta
  activeTab: SubTab;
}
```

### 2.2 Definição dos Itens de Navegação

```typescript
// constants/tripNavigation.ts

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
    // children preenchidos dinamicamente com as cidades da viagem
  },
  {
    id: 'logistics',
    question: 'Onde vou ficar e como me locomover?',
    shortLabel: 'Logística',
    description: 'Hospedagem e transporte',
    icon: 'hotel',
    gradient: 'from-amber-500 to-orange-600',
    iconColor: 'text-amber-500',
    children: [
      {
        id: 'accommodation',
        question: 'Onde vou dormir?',
        shortLabel: 'Hotéis',
        icon: 'bed',
        gradient: 'from-amber-400 to-orange-500',
        iconColor: 'text-amber-400',
      },
      {
        id: 'transport',
        question: 'Como vou me locomover?',
        shortLabel: 'Transportes',
        icon: 'directions_car',
        gradient: 'from-orange-400 to-red-500',
        iconColor: 'text-orange-400',
      },
    ],
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
    question: 'O que preciso fazer antes?',
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
];
```

---

## 3. Componentes a Criar

### 3.1 Hierarquia de Componentes

```
components/trip-details/navigation/
├── TripNavigationSidebar.tsx      # Container principal
├── NavItem.tsx                     # Item individual de navegação
├── NavItemExpanded.tsx             # Versão expandida do item
├── NavItemCompact.tsx              # Versão compacta (só ícone)
├── NavSubItems.tsx                 # Lista de subitens (cidades, etc)
├── NavProgressIndicator.tsx        # Indicador de progresso
├── CollapseToggle.tsx              # Botão para colapsar/expandir
├── MobileDrawer.tsx                # Drawer para mobile
└── index.ts                        # Exports
```

### 3.2 Componente Principal: TripNavigationSidebar

```typescript
// components/trip-details/navigation/TripNavigationSidebar.tsx

interface TripNavigationSidebarProps {
  activeTab: SubTab;
  onTabChange: (tab: SubTab) => void;
  tripStats: TripStats;
  cities: City[];
  onCitySelect?: (city: City) => void;
  selectedCityId?: string;
}

const TripNavigationSidebar: React.FC<TripNavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  tripStats,
  cities,
  onCitySelect,
  selectedCityId,
}) => {
  // Estado local para colapso (persiste no localStorage)
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    'porai_sidebar_collapsed',
    false
  );

  // Estado para subitens expandidos
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Detectar mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Construir items com dados dinâmicos
  const navItems = useMemo(() => {
    return buildNavItems(TRIP_NAV_QUESTIONS, {
      tripStats,
      cities,
      selectedCityId,
    });
  }, [tripStats, cities, selectedCityId]);

  // ... implementação
};
```

### 3.3 Componente NavItem (Modo Expandido)

```typescript
// components/trip-details/navigation/NavItemExpanded.tsx

interface NavItemExpandedProps {
  item: NavQuestion;
  isActive: boolean;
  onClick: () => void;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
}

const NavItemExpanded: React.FC<NavItemExpandedProps> = ({
  item,
  isActive,
  onClick,
  onToggleExpand,
  isExpanded,
}) => {
  return (
    <div className="group">
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
          "text-left",
          isActive
            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
            : "hover:bg-gray-50 text-gray-700"
        )}
      >
        {/* Ícone com container */}
        <div className={cn(
          "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          isActive ? "bg-white/20" : "bg-gray-100"
        )}>
          <Icon
            name={item.icon}
            className={cn(
              "text-xl",
              isActive ? "text-white" : item.iconColor
            )}
          />
        </div>

        {/* Conteúdo textual */}
        <div className="flex-1 min-w-0">
          {/* Pergunta */}
          <p className={cn(
            "text-sm font-medium leading-tight",
            isActive ? "text-white" : "text-gray-900"
          )}>
            {item.question}
          </p>

          {/* Descrição (só quando inativo) */}
          {!isActive && item.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {item.description}
            </p>
          )}

          {/* Progress bar (quando aplicável) */}
          {item.progress !== undefined && (
            <div className="mt-2">
              <NavProgressIndicator
                progress={item.progress}
                isActive={isActive}
              />
            </div>
          )}
        </div>

        {/* Badge / Indicadores */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          {item.badge !== undefined && item.badge > 0 && (
            <span className={cn(
              "min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full",
              "flex items-center justify-center",
              isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
            )}>
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}

          {/* Chevron para itens com filhos */}
          {item.children && item.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center",
                "transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            >
              <Icon name="chevron_right" className="text-sm" />
            </button>
          )}
        </div>
      </button>

      {/* Subitens */}
      {item.children && isExpanded && (
        <NavSubItems items={item.children} parentActive={isActive} />
      )}
    </div>
  );
};
```

### 3.4 Componente NavItem (Modo Compacto)

```typescript
// components/trip-details/navigation/NavItemCompact.tsx

const NavItemCompact: React.FC<NavItemCompactProps> = ({
  item,
  isActive,
  onClick,
}) => {
  return (
    <Tooltip content={item.question} side="right">
      <button
        onClick={onClick}
        className={cn(
          "relative w-12 h-12 rounded-xl flex items-center justify-center",
          "transition-all duration-200",
          isActive
            ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
            : `hover:bg-gray-100 ${item.iconColor}`
        )}
      >
        <Icon name={item.icon} className="text-xl" />

        {/* Badge minificado */}
        {item.badge !== undefined && item.badge > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 min-w-[16px] h-4 px-1",
            "text-[10px] font-bold rounded-full",
            "flex items-center justify-center",
            isActive ? "bg-white text-gray-900" : "bg-rose-500 text-white"
          )}>
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}

        {/* Indicador de progresso circular */}
        {item.progress !== undefined && !isActive && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="24" cy="24" r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${(item.progress / 100) * 138} 138`}
              className="text-green-500 opacity-30"
            />
          </svg>
        )}
      </button>
    </Tooltip>
  );
};
```

---

## 4. Integração com TripDetails.tsx

### 4.1 Modificações no Layout Principal

```typescript
// pages/TripDetails.tsx

const TripDetailsContent: React.FC<TripDetailsProps> = ({ trip, onBack, onEdit }) => {
  // ... estados existentes ...

  // NOVO: Estado da sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    'porai_trip_sidebar_collapsed',
    false
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Header - permanece igual */}
      <div className="shrink-0 p-6 md:p-8 pb-0 bg-white">
        <TripDetailsHeader ... />
      </div>

      {/* NOVO: Layout com Sidebar + Conteúdo */}
      <div className="flex flex-1 overflow-hidden">

        {/* NOVA Sidebar Lateral */}
        <TripNavigationSidebar
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          tripStats={tripStats}
          cities={cities}
          onCitySelect={(city) => {
            handleOpenCityDetail(city);
          }}
          selectedCityId={selectedCity?.id}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Conteúdo Principal */}
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-white transition-all duration-300",
            // Ajusta margem baseado no estado da sidebar
            sidebarCollapsed ? "ml-16" : "ml-0 md:ml-[280px]"
          )}
        >
          <div className="p-6 md:p-8 pt-4 pb-32 space-y-8">
            {renderTripDetailContent()}
          </div>
        </main>
      </div>

      {/* Modals - permanecem iguais */}
    </div>
  );
};
```

---

## 5. Funcionalidades Avançadas

### 5.1 Cálculo de Progresso por Seção

```typescript
// hooks/useTripProgress.ts

interface SectionProgress {
  overview: number;
  itinerary: number;
  logistics: number;
  docs: number;
  budget: number;
  checklist: number;
}

export function useTripProgress(trip: Trip, stats: TripStats): SectionProgress {
  return useMemo(() => {
    const tripDays = calculateDays(trip.startDate, trip.endDate);

    return {
      // Overview: sempre 100% (é informativo)
      overview: 100,

      // Itinerary: % de dias com pelo menos 1 atividade
      itinerary: tripDays > 0
        ? Math.min(100, (stats.activeDays / tripDays) * 100)
        : 0,

      // Logistics: tem hotel E transporte de chegada?
      logistics: calculateLogisticsProgress(stats),

      // Docs: tem documentos essenciais?
      docs: calculateDocsProgress(stats, trip.travelers),

      // Budget: tem orçamento definido?
      budget: trip.totalBudget ? 100 : 0,

      // Checklist: % de itens completos
      checklist: stats.checklistTotal > 0
        ? (stats.checklistComplete / stats.checklistTotal) * 100
        : 0,
    };
  }, [trip, stats]);
}
```

### 5.2 Navegação por Teclado

```typescript
// hooks/useSidebarKeyboard.ts

export function useSidebarKeyboard(
  items: NavQuestion[],
  activeTab: SubTab,
  onTabChange: (tab: SubTab) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Só ativa se sidebar está focada
      if (!document.activeElement?.closest('[data-sidebar]')) return;

      const currentIndex = items.findIndex(i => i.id === activeTab);

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          onTabChange(items[nextIndex].id);
          break;

        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + items.length) % items.length;
          onTabChange(items[prevIndex].id);
          break;

        case 'Home':
          e.preventDefault();
          onTabChange(items[0].id);
          break;

        case 'End':
          e.preventDefault();
          onTabChange(items[items.length - 1].id);
          break;

        // Colapsar com [
        case '[':
          // dispatch collapse event
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, activeTab, onTabChange]);
}
```

### 5.3 Persistência de Estado

```typescript
// Estado salvo no localStorage
interface SidebarPreferences {
  isCollapsed: boolean;
  expandedSections: string[];  // ex: ['logistics', 'cities']
  lastActiveTab: SubTab;
}

// Chave: porai_sidebar_prefs
```

---

## 6. Responsividade

### 6.1 Breakpoints

| Breakpoint | Comportamento |
|------------|---------------|
| `< 768px` (mobile) | Sidebar como Drawer overlay, botão hamburguer |
| `768px - 1024px` (tablet) | Sidebar colapsada por padrão |
| `> 1024px` (desktop) | Sidebar expandida por padrão |

### 6.2 Mobile Drawer

```typescript
// components/trip-details/navigation/MobileDrawer.tsx

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-[280px] bg-white z-50",
          "transform transition-transform duration-300 ease-out",
          "shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Navegação</h2>
          <button onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {children}
        </div>
      </aside>
    </>
  );
};
```

---

## 7. Animações e Transições

### 7.1 Transição de Colapso

```css
/* Sidebar collapse animation */
.sidebar {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-collapsed {
  width: 64px;
}

.sidebar-expanded {
  width: 280px;
}

/* Content labels fade */
.nav-item-text {
  transition: opacity 200ms ease-out;
}

.sidebar-collapsed .nav-item-text {
  opacity: 0;
  pointer-events: none;
}
```

### 7.2 Hover Effects

```typescript
// Efeito de hover suave nos itens
className={cn(
  "transition-all duration-200",
  "hover:translate-x-1",           // Leve movimento para direita
  "hover:shadow-sm",               // Sombra sutil
  "active:scale-[0.98]",           // Feedback de clique
)}
```

---

## 8. Acessibilidade (a11y)

### 8.1 Atributos ARIA

```typescript
<nav
  role="navigation"
  aria-label="Navegação da viagem"
  data-sidebar
>
  <ul role="menubar" aria-orientation="vertical">
    {items.map((item) => (
      <li key={item.id} role="none">
        <button
          role="menuitem"
          aria-current={isActive ? 'page' : undefined}
          aria-expanded={item.children ? isExpanded : undefined}
          aria-haspopup={item.children ? 'menu' : undefined}
        >
          ...
        </button>
      </li>
    ))}
  </ul>
</nav>
```

### 8.2 Focus Management

- Focus trap quando drawer mobile está aberto
- Skip link para pular navegação
- Focus visível em todos os elementos interativos

---

## 9. Plano de Migração

### Fase 1: Preparação (sem breaking changes)
1. Criar estrutura de pastas `navigation/`
2. Criar tipos e constantes
3. Implementar componentes isolados
4. Criar hook `useTripProgress`

### Fase 2: Implementação Core
1. Implementar `TripNavigationSidebar`
2. Implementar `NavItemExpanded` e `NavItemCompact`
3. Implementar toggle de colapso
4. Testes unitários dos componentes

### Fase 3: Integração
1. Modificar layout do `TripDetails.tsx`
2. Substituir `TripSidebar` pelo novo componente
3. Remover navegação horizontal antiga
4. Ajustar espaçamentos do conteúdo

### Fase 4: Mobile & Polish
1. Implementar `MobileDrawer`
2. Adicionar animações
3. Testar em diferentes dispositivos
4. Ajustes finos de UX

### Fase 5: Limpeza
1. Remover `TripSidebar.tsx` antigo
2. Remover código não utilizado
3. Atualizar documentação
4. Code review final

---

## 10. Arquivos a Criar/Modificar

### Novos Arquivos
```
components/trip-details/navigation/
├── TripNavigationSidebar.tsx
├── NavItem.tsx
├── NavItemExpanded.tsx
├── NavItemCompact.tsx
├── NavSubItems.tsx
├── NavProgressIndicator.tsx
├── CollapseToggle.tsx
├── MobileDrawer.tsx
└── index.ts

constants/
└── tripNavigation.ts

types/
└── navigation.ts

hooks/
├── useTripProgress.ts
├── useSidebarKeyboard.ts
└── useMediaQuery.ts (se não existir)
```

### Arquivos a Modificar
```
pages/TripDetails.tsx           # Layout principal
types.ts                        # Adicionar tipos de navegação
```

### Arquivos a Remover (após migração)
```
components/trip-details/TripSidebar.tsx   # Navegação horizontal antiga
components/trip-details/TripTabs.tsx      # Se existir e não usado
```

---

## 11. Métricas de Sucesso

### UX Metrics
- [ ] Tempo para encontrar seção específica reduzido
- [ ] Feedback positivo dos usuários sobre clareza
- [ ] Redução de cliques para navegação profunda

### Technical Metrics
- [ ] Bundle size delta < 5KB
- [ ] First paint não afetado
- [ ] Smooth 60fps nas animações
- [ ] 100% coverage em testes de acessibilidade

---

## 12. Considerações Finais

### Vantagens da Nova Abordagem
1. **Clareza**: Perguntas guiam melhor que labels técnicos
2. **Escalabilidade**: Fácil adicionar novas seções
3. **Hierarquia**: Subitens permitem organização mais profunda
4. **Progresso**: Usuário vê status de completude
5. **Flexibilidade**: Modo compacto para power users

### Riscos e Mitigações
| Risco | Mitigação |
|-------|-----------|
| Sidebar ocupar muito espaço | Modo compacto persistente |
| Usuários acostumados com tabs | Tutorial de onboarding |
| Complexidade de implementação | Migração em fases |
| Performance em mobile | Lazy loading de subitens |

---

*Documento criado em: Janeiro 2026*
*Versão: 1.0*
*Branch de desenvolvimento: claude/redesign-trip-navigation-D5DIN*
