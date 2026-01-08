# Plano de Padronização de Modais - PorAí App

## Problema Identificado

O modal "Adicionar Transporte" (e outros modais similares) está ultrapassando a altura visível da viewport, cortando parte do conteúdo e botões de ação.

**Screenshot de Referência:** Modal com muitos campos de formulário sem scroll adequado.

---

## 1. Correções de Altura dos Modais

### 1.1 Melhorar o Componente Modal Base
**Arquivo:** `components/trip-details/modals/Modal.tsx`

**Problema Atual:**
```tsx
// Linha 68 - Estrutura atual do modal
<div className={`relative bg-white ... w-full ${sizeClasses[size]} mx-4`}>
  {/* Header - altura fixa */}
  <div className="p-6 border-b">...</div>

  {/* Content - com max-height */}
  <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
    {children}
  </div>

  {/* Footer - pode ficar fora da viewport */}
  {footer && <div className="p-6 border-t">{footer}</div>}
</div>
```

**Solução Proposta:**
```tsx
// Usar flexbox para garantir que o footer sempre fique visível
<div className={`relative bg-white flex flex-col max-h-[90vh] w-full ${sizeClasses[size]} mx-4`}>
  {/* Header - shrink-0 para não comprimir */}
  <div className="shrink-0 p-6 border-b">...</div>

  {/* Content - flex-1 com overflow para ocupar espaço disponível */}
  <div className="flex-1 p-6 overflow-y-auto min-h-0">
    {children}
  </div>

  {/* Footer - shrink-0 sempre visível no fundo */}
  {footer && <div className="shrink-0 p-6 border-t">{footer}</div>}
</div>
```

**Tarefas:**
- [ ] Adicionar `flex flex-col` no container principal do modal
- [ ] Adicionar `max-h-[90vh]` no container principal
- [ ] Adicionar `shrink-0` no header e footer
- [ ] Alterar content para `flex-1 min-h-0 overflow-y-auto`
- [ ] Remover `max-h-[calc(95vh-180px)]` do content (será controlado pelo flex)

### 1.2 Adicionar Prop de Tamanho Vertical
**Arquivo:** `components/trip-details/modals/Modal.tsx`

**Adicionar nova prop `maxHeight`:**
```tsx
interface ModalProps {
  // ... props existentes
  maxHeight?: 'auto' | 'sm' | 'md' | 'lg' | 'full';
}

const maxHeightClasses = {
  auto: 'max-h-[90vh]',      // Padrão - 90% da viewport
  sm: 'max-h-[50vh]',        // Modais pequenos (confirmação)
  md: 'max-h-[70vh]',        // Modais médios
  lg: 'max-h-[85vh]',        // Modais grandes (formulários)
  full: 'max-h-[95vh]'       // Modais muito grandes
};
```

**Tarefas:**
- [ ] Adicionar prop `maxHeight` com default `'auto'`
- [ ] Criar objeto `maxHeightClasses` com variantes
- [ ] Aplicar classe dinâmica no container do modal

---

## 2. Otimização dos Formulários Longos

### 2.1 Compactar Layout do AddTransportModal
**Arquivo:** `components/trip-details/modals/AddTransportModal.tsx`

**Problemas:**
- Grid 3 colunas para tipo de transporte ocupa muito espaço vertical (6 tipos)
- Seções de Partida/Chegada muito espaçadas
- Campos adicionais (Classe, Assento, Status) em linha separada

**Soluções:**

**a) Tipo de Transporte em linha horizontal com scroll:**
```tsx
// De: grid-cols-3 (2 linhas de 3)
<div className="grid grid-cols-3 gap-2">

// Para: flex horizontal com scroll
<div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
  {TRANSPORT_TYPES.map((t) => (
    <button className="flex flex-col items-center gap-1 p-2.5 min-w-[70px] ...">
```

**b) Seções Partida/Chegada lado a lado (desktop):**
```tsx
// De: stack vertical
<LocationSection title="Partida" ... />
<LocationSection title="Chegada" ... />

// Para: grid 2 colunas em desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <LocationSection title="Partida" ... />
  <LocationSection title="Chegada" ... />
</div>
```

**c) Reduzir padding das seções:**
```tsx
// De: p-4 space-y-3
<div className="p-4 bg-gray-50 rounded-xl space-y-3">

// Para: p-3 space-y-2
<div className="p-3 bg-gray-50 rounded-xl space-y-2">
```

**Tarefas:**
- [ ] Converter grid de tipos para flex horizontal scrollável
- [ ] Colocar seções Partida/Chegada em grid responsivo
- [ ] Reduzir padding interno das seções de p-4 para p-3
- [ ] Reduzir espaçamento entre campos de space-y-3 para space-y-2

### 2.2 Implementar Formulário em Steps (Opcional - Melhoria Futura)
**Conceito:** Dividir formulários longos em etapas

```tsx
// Step 1: Tipo de transporte + Operadora
// Step 2: Partida
// Step 3: Chegada
// Step 4: Detalhes adicionais

const [currentStep, setCurrentStep] = useState(1);

<StepIndicator current={currentStep} total={4} />
{currentStep === 1 && <TransportTypeStep />}
{currentStep === 2 && <DepartureStep />}
// ...
```

**Tarefas (Baixa Prioridade):**
- [ ] Criar componente `StepIndicator`
- [ ] Refatorar AddTransportModal para usar steps
- [ ] Adicionar navegação Next/Previous

---

## 3. Padronização Visual dos Modais

### 3.1 Criar Sistema de Design para Modais
**Novo arquivo:** `components/ui/ModalStyles.ts`

```tsx
// Constantes de estilo padronizadas
export const MODAL_STYLES = {
  // Tamanhos de largura
  widths: {
    xs: 'max-w-sm',      // 384px - Confirmações
    sm: 'max-w-md',      // 448px - Formulários simples
    md: 'max-w-lg',      // 512px - Formulários médios
    lg: 'max-w-2xl',     // 672px - Formulários complexos
    xl: 'max-w-4xl',     // 896px - Visualizações
    full: 'max-w-[95vw]' // Quase tela cheia
  },

  // Tamanhos de altura máxima
  heights: {
    auto: 'max-h-[90vh]',
    compact: 'max-h-[60vh]',
    standard: 'max-h-[80vh]',
    tall: 'max-h-[90vh]'
  },

  // Espaçamentos
  padding: {
    header: 'px-6 py-4',
    content: 'px-6 py-4',
    footer: 'px-6 py-4',
    section: 'p-4'
  },

  // Cores e bordas
  colors: {
    headerBorder: 'border-gray-200 dark:border-gray-700',
    footerBorder: 'border-gray-200 dark:border-gray-700',
    sectionBg: 'bg-gray-50 dark:bg-gray-800/50',
    sectionBorder: 'border border-gray-100 dark:border-gray-700'
  },

  // Border radius
  radius: {
    modal: 'rounded-2xl',
    section: 'rounded-xl',
    input: 'rounded-lg'
  }
};
```

**Tarefas:**
- [ ] Criar arquivo `ModalStyles.ts` com constantes
- [ ] Atualizar Modal.tsx para usar constantes
- [ ] Documentar uso no código

### 3.2 Padronizar Headers dos Modais
**Padrão atual inconsistente:**
- Alguns usam gradiente no título
- Alguns usam ícone + título
- Tamanhos de fonte variados

**Padrão proposto:**
```tsx
// Header padronizado
<div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
  <div className="flex items-center gap-3">
    {icon && (
      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon name={icon} className="text-primary text-xl" />
      </div>
    )}
    <div>
      <h2 className="text-xl font-bold text-text-main">{title}</h2>
      {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
    </div>
  </div>
  <CloseButton onClick={onClose} />
</div>
```

**Tarefas:**
- [ ] Adicionar props `icon` e `subtitle` ao Modal
- [ ] Criar padrão visual consistente de header
- [ ] Aplicar em todos os modais

### 3.3 Padronizar Footers dos Modais
**Padrão proposto:**
```tsx
// Footer padronizado
<div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
  <div className="flex items-center gap-2">
    {/* Ações secundárias à esquerda (opcional) */}
  </div>
  <div className="flex items-center gap-3">
    <Button variant="outline" onClick={onClose}>
      Cancelar
    </Button>
    <Button type="submit">
      {submitLabel}
    </Button>
  </div>
</div>
```

**Tarefas:**
- [ ] Padronizar ordem dos botões (Cancelar | Ação primária)
- [ ] Adicionar background sutil ao footer `bg-gray-50/50`
- [ ] Garantir espaçamento consistente `gap-3`

### 3.4 Padronizar Seções de Formulário
**Componente reutilizável:**
```tsx
interface FormSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon,
  children,
  collapsible = false
}) => (
  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-2">
      {icon && <Icon name={icon} className="text-text-muted text-lg" />}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
        {title}
      </h3>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);
```

**Tarefas:**
- [ ] Criar/atualizar componente `FormSection`
- [ ] Padronizar uso em todos os modais de formulário
- [ ] Garantir espaçamento interno consistente

---

## 4. Responsividade dos Modais

### 4.1 Mobile-First Approach
**Ajustes para telas pequenas:**

```tsx
// Container do modal
<div className={`
  relative bg-white flex flex-col
  // Mobile: tela cheia
  w-full h-full md:h-auto
  // Desktop: tamanho limitado com bordas arredondadas
  md:w-auto md:max-h-[90vh] md:rounded-2xl md:mx-4
  ${sizeClasses[size]}
`}>
```

**Tarefas:**
- [ ] Modais em tela cheia no mobile
- [ ] Bordas arredondadas apenas no desktop
- [ ] Scroll nativo do body no mobile

### 4.2 Bottom Sheet para Mobile (Melhoria Futura)
**Conceito:** Em mobile, modais aparecem de baixo como bottom sheet

```tsx
// Animação de entrada diferente para mobile
const mobileAnimation = 'animate-in slide-in-from-bottom duration-300';
const desktopAnimation = 'animate-in zoom-in-95 duration-200';

<div className={`${isMobile ? mobileAnimation : desktopAnimation}`}>
```

**Tarefas (Baixa Prioridade):**
- [ ] Detectar viewport mobile
- [ ] Implementar animação bottom sheet
- [ ] Adicionar gesture de swipe para fechar

---

## 5. Lista de Modais para Atualizar

### Alta Prioridade (Formulários Longos)
| Modal | Arquivo | Problema |
|-------|---------|----------|
| AddTransportModal | `modals/AddTransportModal.tsx` | Muito longo, corta footer |
| AddAccommodationModal | `modals/AddAccommodationModal.tsx` | Formulário extenso |
| AddTripModal | `components/AddTripModal.tsx` | Muitos campos |
| AddActivityModal | `modals/AddActivityModal.tsx` | Formulário médio |
| AddAttractionModal | `modals/AddAttractionModal.tsx` | Formulário médio |
| JournalEntryModal | `modals/JournalEntryModal.tsx` | Editor de texto longo |

### Média Prioridade (Visualização)
| Modal | Arquivo | Ajuste |
|-------|---------|--------|
| ActivityDetailsModal | `modals/ActivityDetailsModal.tsx` | Padronizar estilo |
| AttractionDetailModal | `modals/AttractionDetailModal.tsx` | Padronizar estilo |
| RestaurantDetailModal | `modals/RestaurantDetailModal.tsx` | Padronizar estilo |
| EventDetailsModal | `calendar/EventDetailsModal.tsx` | Padronizar estilo |

### Baixa Prioridade (Simples)
| Modal | Arquivo | Ajuste |
|-------|---------|--------|
| ShareTripModal | `modals/ShareTripModal.tsx` | Apenas padronizar |
| WhatToKnowModal | `modals/WhatToKnowModal.tsx` | Apenas padronizar |
| ImageEditorModal | `modals/ImageEditorModal.tsx` | Verificar altura |
| ExportModal | `calendar/ExportModal.tsx` | Apenas padronizar |

---

## 6. Cronograma Sugerido

### Fase 1: Correção Urgente (Modal Base)
1. Atualizar `Modal.tsx` com flexbox
2. Testar em AddTransportModal
3. Verificar outros modais quebrados

### Fase 2: Otimização de Formulários
1. Compactar AddTransportModal
2. Compactar AddAccommodationModal
3. Revisar AddTripModal

### Fase 3: Padronização Visual
1. Criar `ModalStyles.ts`
2. Padronizar headers
3. Padronizar footers
4. Padronizar seções

### Fase 4: Responsividade
1. Ajustar modais para mobile
2. Testar em diferentes viewports

---

## 7. Métricas de Sucesso

- [ ] Nenhum modal ultrapassa viewport (90vh máximo)
- [ ] Footer sempre visível sem scroll
- [ ] Scroll interno funciona corretamente
- [ ] Headers visuais padronizados
- [ ] Footers com botões na mesma ordem
- [ ] Seções de formulário com estilo consistente
- [ ] Modais funcionam bem em mobile (320px - 768px)
- [ ] Modais funcionam bem em desktop (768px+)

---

## 8. Código de Referência

### Modal.tsx Atualizado (Proposta)
```tsx
import React, { useEffect } from 'react';
import { Icon } from '../../ui/Base';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  maxHeight?: 'compact' | 'standard' | 'tall';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = 'md',
  maxHeight = 'standard',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer
}) => {
  // ... useEffect para ESC e body overflow

  if (!isOpen) return null;

  const sizeClasses = {
    xs: 'max-w-sm',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]'
  };

  const maxHeightClasses = {
    compact: 'max-h-[60vh]',
    standard: 'max-h-[80vh]',
    tall: 'max-h-[90vh]'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`
          relative bg-white dark:bg-gray-800
          flex flex-col
          w-full ${sizeClasses[size]} ${maxHeightClasses[maxHeight]}
          rounded-2xl shadow-2xl
          animate-in zoom-in-95 duration-200
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sempre visível */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name={icon} className="text-primary text-xl" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-text-main">{title}</h2>
              {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="size-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              aria-label="Fechar modal"
            >
              <Icon name="close" className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Content - Scrollável */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer - Sempre visível */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
```

---

## Conclusão

Este plano aborda:
1. **Correção imediata** do problema de altura dos modais
2. **Otimização** dos formulários longos
3. **Padronização** visual consistente
4. **Responsividade** para diferentes dispositivos

A implementação deve seguir a ordem de prioridade para resolver primeiro os problemas mais críticos (modais cortados) antes de partir para melhorias visuais.
