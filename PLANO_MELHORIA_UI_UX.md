# Plano de Melhoria UI/UX - PorAí App

## Resumo Executivo
Este documento detalha os problemas de UI/UX identificados no aplicativo PorAí e as tarefas necessárias para melhorar a usabilidade e visibilidade dos componentes.

---

## 1. Problemas de Legibilidade de Texto

### 1.1 Textos Muito Pequenos (Crítico)
**Problema:** 142 instâncias de texto com tamanho entre 9-12px, abaixo do mínimo recomendado de 14px para legibilidade.

**Arquivos Afetados:**
| Arquivo | Linha | Tamanho Atual | Tamanho Recomendado |
|---------|-------|---------------|---------------------|
| `components/trip-details/city-guide/PlaceCard.tsx` | 88 | `text-[9px]` | `text-xs` (12px) |
| `components/trip-details/city-guide/PlaceCard.tsx` | 100-101 | `text-[10px]` | `text-xs` |
| `components/trip-details/city-guide/PlaceCard.tsx` | 107 | `text-[10px]` | `text-xs` |
| `components/trip-details/city-guide/PlaceCard.tsx` | 123 | `text-[11px]` | `text-xs` |
| `components/trip-details/city-guide/PlaceCard.tsx` | 196, 266-267, 275-276, 290-291, 301, 308, 317 | `text-[10px]`/`text-[11px]` | `text-xs` |
| `components/NotificationFeed.tsx` | 77 | `text-[10px]` | `text-xs` |
| `components/NotificationFeed.tsx` | 151 | `text-[10px]` | `text-xs` |
| `components/TopNavigation.tsx` | 68, 99 | `text-[10px]` | `text-xs` |

**Tarefas:**
- [ ] Substituir todas as classes `text-[9px]`, `text-[10px]`, `text-[11px]` por `text-xs` (12px) no mínimo
- [ ] Revisar hierarquia tipográfica para manter consistência

---

## 2. Problemas de Visibilidade de Botões

### 2.1 Botões Escondidos com Opacity-0 (Alto)
**Problema:** Botões importantes só aparecem no hover, prejudicando a descoberta de funcionalidades.

**Arquivos Afetados:**
| Arquivo | Linha | Descrição |
|---------|-------|-----------|
| `components/trip-details/city-guide/PlaceCard.tsx` | 73-79 | Botão de editar imagem com IA |
| `components/trip-details/city-guide/PlaceCard.tsx` | 202-208 | Botão de geração IA (versão vertical) |
| `components/NotificationFeed.tsx` | 141-147 | Botão de excluir notificação |
| `components/trip-details/TripSidebar.tsx` | 42, 60 | Labels de navegação |

**Tarefas:**
- [ ] Remover `opacity-0 group-hover:opacity-100` dos botões de ação
- [ ] Usar opacidade reduzida (ex: `opacity-70 hover:opacity-100`) em vez de esconder completamente
- [ ] Garantir que botões importantes estejam sempre visíveis

---

## 3. Problemas de Touch Targets

### 3.1 Áreas de Toque Muito Pequenas (Alto)
**Problema:** Botões com tamanho inferior ao mínimo de 44x44px recomendado para mobile.

**Arquivos Afetados:**
| Arquivo | Linha | Tamanho Atual | Tamanho Recomendado |
|---------|-------|---------------|---------------------|
| `components/trip-details/city-guide/PlaceCard.tsx` | 131-157 | `w-8 h-8` (32px) | `w-11 h-11` (44px) |
| `components/trip-details/city-guide/PlaceCard.tsx` | 158 | `w-8 h-8` | `w-11 h-11` |
| `components/trip-details/city-guide/PlaceCard.tsx` | 227-250 | `w-8 h-8` | `w-10 h-10` (40px min) |
| `components/NotificationFeed.tsx` | 86-97 | `size-7` (28px) | `size-10` (40px) |
| `components/NotificationFeed.tsx` | 141-147 | `size-5` (20px) | `size-8` (32px) |

**Tarefas:**
- [ ] Aumentar todos os botões de ação para mínimo 40x40px
- [ ] Priorizar 44x44px para botões primários em mobile
- [ ] Aumentar área de padding em elementos clicáveis menores

---

## 4. Problemas de Feedback ao Usuário

### 4.1 Uso de Alert() do Browser (Crítico)
**Problema:** Mensagens de erro/sucesso usam `alert()` nativo, má experiência.

**Arquivos Afetados:**
| Arquivo | Linha | Mensagem |
|---------|-------|----------|
| `App.tsx` | 53 | `alert('Erro ao criar viagem')` |
| `App.tsx` | 63 | `alert('Erro ao atualizar viagem')` |
| `App.tsx` | 88 | `alert('Erro ao excluir viagem')` |
| `pages/Login.tsx` | 58 | `alert('Cadastro realizado com sucesso!')` |
| `pages/AIAssistant.tsx` | - | `alert('Funcionalidade em desenvolvimento!')` |

**Tarefas:**
- [ ] Criar componente Toast/Snackbar reutilizável
- [ ] Criar ToastContext para gerenciar notificações globais
- [ ] Substituir todos os `alert()` por toast notifications
- [ ] Implementar variantes: success, error, warning, info

---

## 5. Problemas de Acessibilidade

### 5.1 Falta de ARIA Labels (Alto)
**Problema:** Apenas 3 atributos ARIA em mais de 100 componentes.

**Arquivos Afetados:**
- Todos os componentes com botões interativos
- Modais sem `aria-modal` e `aria-labelledby`
- Formulários sem labels adequados

**Tarefas:**
- [ ] Adicionar `aria-label` em todos os botões de ícone
- [ ] Adicionar `aria-labelledby` em modais
- [ ] Adicionar `role="dialog"` e `aria-modal="true"` em modais
- [ ] Implementar focus trap em modais

### 5.2 Estados de Foco Inconsistentes (Médio)
**Problema:** Apenas 71 estados de foco definidos, muitos elementos sem indicador visual de foco.

**Tarefas:**
- [ ] Adicionar `focus:ring-2 focus:ring-primary focus:outline-none` em todos os elementos interativos
- [ ] Garantir contraste adequado no anel de foco
- [ ] Implementar `focus-visible` para melhor UX com teclado

---

## 6. Problemas de Contraste de Cores

### 6.1 Cores com Baixo Contraste (Médio)
**Problema:** Algumas combinações de cores não atendem WCAG 2.1 AA.

**Arquivos Afetados:**
| Arquivo | Problema |
|---------|----------|
| `styles/variables.css` | `--color-primary: #dcdaec` muito claro para texto |
| `styles/variables.css` | `--color-text-muted: #706e7c` contraste insuficiente |

**Tarefas:**
- [ ] Verificar todas as combinações de cores com ferramenta de contraste
- [ ] Ajustar `--color-primary` para uso como background apenas
- [ ] Criar variante `--color-primary-text` com maior contraste
- [ ] Aumentar contraste de `--color-text-muted`

---

## 7. Problemas de Responsividade

### 7.1 Navegação Mobile (Médio)
**Problema:** Sidebar completamente escondida em mobile.

**Arquivos Afetados:**
| Arquivo | Linha | Problema |
|---------|-------|----------|
| `components/Sidebar.tsx` | 13 | `hidden md:flex` sem alternativa mobile |

**Tarefas:**
- [ ] Implementar menu hamburger funcional para mobile
- [ ] Criar bottom navigation como alternativa mobile
- [ ] Testar navegação em diferentes tamanhos de tela

### 7.2 TripSidebar Labels Invisíveis (Médio)
**Problema:** Labels só aparecem ao expandir sidebar no hover.

**Arquivo:** `components/trip-details/TripSidebar.tsx`

**Tarefas:**
- [ ] Adicionar tooltips nos ícones quando colapsado
- [ ] Considerar mostrar labels em versão compacta
- [ ] Melhorar affordance visual de que sidebar é expansível

---

## 8. Problemas de Loading States

### 8.1 Falta de Skeleton Screens (Baixo)
**Problema:** Componente Skeleton existe mas não é usado consistentemente.

**Tarefas:**
- [ ] Implementar skeleton em TripDetails durante carregamento
- [ ] Adicionar skeleton em lista de notificações
- [ ] Implementar skeleton em cards de viagem

### 8.2 Botões sem Estado de Loading (Médio)
**Problema:** Formulários não mostram estado de processamento.

**Tarefas:**
- [ ] Adicionar prop `isLoading` nos botões principais
- [ ] Desabilitar botão e mostrar spinner durante submit
- [ ] Implementar texto dinâmico ("Salvando...", "Enviando...")

---

## 9. Problemas de Consistência Visual

### 9.1 Variantes de Botão Inconsistentes (Baixo)
**Problema:** Botões customizados não seguem sistema de design.

**Arquivo:** `components/ui/Base.tsx`

**Tarefas:**
- [ ] Revisar hierarquia de variantes de botão
- [ ] Garantir que `primary` tenha contraste adequado
- [ ] Documentar quando usar cada variante

### 9.2 Sombras e Bordas Inconsistentes (Baixo)
**Problema:** Cards usam diferentes sombras sem padrão claro.

**Tarefas:**
- [ ] Definir sistema de elevação (shadow-sm, shadow-md, shadow-lg)
- [ ] Aplicar consistentemente em cards similares
- [ ] Documentar uso de bordas vs sombras

---

## 10. Melhorias de Motion/Animação

### 10.1 Sem Suporte a prefers-reduced-motion (Baixo)
**Problema:** 42 transforms de escala sem respeitar preferência do usuário.

**Tarefas:**
- [ ] Adicionar media query `@media (prefers-reduced-motion: reduce)`
- [ ] Desabilitar animações não essenciais
- [ ] Manter transições de fade sutis

---

## Priorização das Tarefas

### Prioridade Alta (Implementar Primeiro)
1. Substituir `alert()` por toast notifications
2. Aumentar tamanhos de texto mínimos para 12px
3. Aumentar touch targets para 44x44px
4. Tornar botões escondidos sempre visíveis
5. Adicionar aria-labels em botões de ícone

### Prioridade Média
6. Melhorar contraste de cores
7. Adicionar estados de foco consistentes
8. Implementar estados de loading em botões
9. Melhorar navegação mobile

### Prioridade Baixa
10. Implementar skeleton screens
11. Padronizar sombras e bordas
12. Suporte a prefers-reduced-motion
13. Revisar sistema de variantes de botão

---

## Arquivos Principais para Revisão

1. `components/trip-details/city-guide/PlaceCard.tsx` - Múltiplos problemas
2. `components/NotificationFeed.tsx` - Texto pequeno, botões escondidos
3. `components/TopNavigation.tsx` - Texto pequeno
4. `components/trip-details/TripSidebar.tsx` - Labels invisíveis
5. `components/ui/Base.tsx` - Sistema de design base
6. `App.tsx` - Substituir alerts
7. `styles/variables.css` - Revisar cores

---

## Métricas de Sucesso

- [ ] Todos os textos com mínimo 12px
- [ ] Todos os botões com mínimo 40x40px
- [ ] Zero uso de `alert()` nativo
- [ ] 100% dos botões de ícone com aria-label
- [ ] Contraste WCAG AA em todas as combinações de cores
- [ ] Estados de foco visíveis em todos os elementos interativos
