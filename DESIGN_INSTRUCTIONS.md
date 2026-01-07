# Documentação do Sistema de Design (PorAí)

Este documento descreve os padrões de design, fontes, cores e regras visuais utilizadas no projeto "PorAí". Siga estas diretrizes para manter a consistência visual da aplicação.

## 1. Tipografia

A tipografia é baseada em uma hierarquia clara usando famílias de fontes modernas e legíveis.

### Fontes
- **Família Principal:** `Hellix`, `Outfit`, `Plus Jakarta Sans`, sans-serif.
- **Família Monospaced:** `SF Mono`, `Monaco`, `Cascadia Code`, monospace.

### Pesos
- **Normal:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700
- **Extra Bold:** 800

### Classes Utilitárias de Texto
O projeto possui classes CSS pré-definidas para tamanhos e estilos (ver `styles/typography.css`):

| Classe | Tamanho (rem/px) | Peso | Uso |
|:---|:---|:---|:---|
| `.heading-1` | 3rem (48px) | 800 | Títulos principais |
| `.heading-2` | 2.25rem (36px) | 800 | Subtítulos grandes |
| `.heading-3` | 1.875rem (30px) | 700 | Títulos de seção |
| `.heading-4` | 1.5rem (24px) | 700 | Títulos de cartão |
| `.heading-5` | 1.25rem (20px) | 600 | Subtítulos de seção |
| `.heading-6` | 1.125rem (18px) | 600 | Títulos pequenos |
| `.text-base` | 1rem (16px) | 400 | Texto padrão |
| `.text-sm` | 0.875rem (14px) | 400 | Texto auxiliar |
| `.text-xs` | 0.75rem (12px) | 400 | Legendas/Labels |

Use também: `.text-muted`, `.text-light`, `.text-bold`, `.text-semibold`.

## 2. Cores

As cores são definidas como variáveis CSS em `styles/variables.css` e integradas ao Tailwind config.

### Cores Principais
- **Primary:** `#dcdaec` (Light Lavender) - Usado para destaques sutis e fundos de seleção.
  - Dark: `#b0aed4`
  - Light: `#efeef7`
- **Secondary:** `#ABE2FE` (Light Blue)
  - Dark: `#6ac8fa`
  - Light: `#d5f1fe`

### Cores de Fundo
- **Light:** `#F8F9FA` (Gray 50-ish)
- **White:** `#ffffff`
- **Dark:** `#16161c` (Para modo escuro ou elementos escuros)

### Texto
- **Main:** `#131316` (Quase preto)
- **Muted:** `#706e7c` (Cinza médio)
- **Light:** `#9ca3af` (Cinza claro)

### Cores Semânticas
- **Success:** `#10b981` (Green)
- **Warning:** `#f59e0b` (Amber)
- **Error:** `#ef4444` (Red)
- **Info:** `#3b82f6` (Blue)

## 3. Espaçamento e Layout

### Border Radius
O projeto usa bordas arredondadas consistentes, favorecendo cantos suaves.
- **Default:** `10px` (`--radius-default`)
- **Medium:** `12px` (`--radius-md` / `rounded-2xl` no Tailwind)
- **Large:** `16px` (`--radius-lg` / `rounded-3xl` no Tailwind - *Nota: verifique a config, pois o tailwind mapeia 3xl para 12px também, cuidado com conflitos*)
- **Small:** `6px` (`--radius-sm`)

### Espaçamento
Escala baseada em múltiplos de 4px (rem).
- `--space-1`: 0.25rem (4px)
- `--space-2`: 0.5rem (8px)
- `--space-4`: 1rem (16px)
- ...até `--space-24`: 6rem (96px)

## 4. Efeitos Visuais

### Sombras
Sombras suaves são utilizadas para dar profundidade (`styles/variables.css`).
- `--shadow-sm` até `--shadow-2xl`
- `--shadow-soft`: `0 10px 40px -10px rgba(0, 0, 0, 0.08)`
- `--shadow-glass`: `0 8px 32px 0 rgba(31, 38, 135, 0.05)`

### Efeito Vidro (Glassmorphism)
Utilize a classe `.glass-effect` ou `.glass-sidebar`:
```css
.glass-effect {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
}
```

## 5. Animações

Animações CSS puras estão disponíveis em `styles/animations.css`.
Classes prontas:
- `.animate-fade-in`
- `.animate-slide-in-up`, `.animate-slide-in-down`
- `.animate-zoom-in`
- `.hover-lift` (elevação ao passar o mouse)
- `.hover-scale` (zoom leve ao passar o mouse)

## 6. Ícones
O projeto utiliza **Material Symbols Outlined**.
- Fonte importada no `index.html`.
- Classe base: `.material-symbols-outlined`.

## Resumo para Desenvolvedores
1. **Sempre use as variáveis CSS** (`var(--color-primary)`) ou classes do Tailwind (`text-primary`) ao invés de valores hexadecimais hardcoded.
2. **Siga a hierarquia de fontes** usando as classes `.heading-X` e `.text-X`.
3. **Mantenha o padrão de arredondamento** (preferência por 10px ou 12px para cards).
4. **Use micro-interações** como `.hover-lift` em elementos clicáveis para melhor UX.
