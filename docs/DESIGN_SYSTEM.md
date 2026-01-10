# Design System - PorAí

Este documento descreve os componentes, tokens e padrões de design utilizados na aplicação PorAí.

## Componentes de Layout

Estes componentes formam a espinha dorsal de todas as páginas da aplicação, garantindo consistência visual e comportamento responsivo.

### PageContainer
Container principal para páginas. Centraliza o conteúdo, aplica padding responsivo e animação de entrada.

```tsx
<PageContainer>
  {/* Conteúdo da página */}
</PageContainer>
```

### PageHeader
Cabeçalho padrão para páginas. Inclui título, descrição e área para botões de ação (canto superior direito).

```tsx
<PageHeader
  title="Título da Página"
  description="Uma breve descrição da funcionalidade desta página."
  actions={
    <Button variant="primary">Ação Principal</Button>
  }
/>
```

### FilterBar
Barra de controle para filtrar listagens. Inclui input de busca padronizado, espaço para botões de filtro e área direita para ordenação/visualização.

```tsx
<FilterBar
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Buscar..."
  rightContent={/* Selects ou Toggles de View */}
>
  <FilterButton isActive={filter === 'all'} onClick={...} count={10}>Todos</FilterButton>
  <FilterButton isActive={filter === 'active'} onClick={...}>Ativos</FilterButton>
</FilterBar>
```

### FilterButton
Botão temático para uso dentro da `FilterBar` ou grupos de filtro.

```tsx
<FilterButton 
  isActive={true} 
  count={5} // Badge de contagem opcional
  onClick={() => setFilter('opt')}
>
  Filtro
</FilterButton>
```

## Componentes UI

### Button
Botões padrão da aplicação.
**Padrão:** `px-5 py-2.5 text-sm font-bold rounded-xl`

**Variantes:**
- `primary`: Fundo primário (#dcdaec), texto escuro.
- `secondary`: Fundo secundário (#ABE2FE).
- `outline`: Borda cinza, sem fundo.
- `ghost`: Sem fundo, hover cinza.
- `dark`: Fundo escuro, texto branco.

```tsx
<Button variant="primary">
  <span className="material-symbols-outlined text-sm mr-1">icon</span>
  Label
</Button>
```

### Card
Componente de superfície padrão.
**Sombra padrão:** `shadow-soft` (`--shadow-soft`)
**Interativo:** Adicionar `onClick` automaticamente aplica `cursor-pointer`, `hover:shadow-lg` e transição.

```tsx
<Card className="p-6">
   Conteúdo do Card
</Card>
```

### EmptyState
Componente para exibir estados vazios ou sem resultados.

**Variantes:**
- `default`: Padrão, padding maior.
- `minimal`: Compacto, ícone menor.
- `illustrated`: Para destaque maior.
- `dashed`: Borda tracejada, fundo sutil (usado em áreas de upload/drop).

```tsx
<EmptyState
  variant="default"
  icon="search_off"
  title="Nenhum resultado"
  description="Tente ajustar seus filtros."
  action={{ label: "Limpar", onClick: reset }}
/>
```

## Tokens de Design

Os tokens globais estão definidos em `styles/variables.css` e mapeados no `tailwind.config.js`.

### Cores Principais
- **Primary:** `--color-primary` (#dcdaec)
- **Secondary:** `--color-secondary` (#ABE2FE)
- **Background:** `--color-background-light` (#F8F9FA)
- **Text:** `--color-text-main` (#131316)

### Espaçamento (Gaps)
Novas variáveis CSS para garantir consistência de layout.

- `--gap-page-sections` (1.5rem / 24px): Espaço entre seções verticais principais.
- `--gap-card-content` (1rem / 16px): Espaço interno entre elementos de um card.
- `--gap-inline-items` (0.5rem / 8px): Espaço entre ícones/texto ou botões lado a lado.
- `--gap-form-fields` (1rem / 16px): Espaço entre inputs.

### Sombras
- `--shadow-soft`: Sombra suave e difusa para cards padrão.
- `--shadow-lg`: Sombra para elementos em hover ou destaque.

## Padrões de Uso

### Estrutura de Página
Toda página deve seguir esta hierarquia:
1. `PageContainer`
2. `PageHeader`
3. Content (Grids, Lists, Sections)

### Botões Primários
Sempre que houver um botão de ação principal ("Nova Viagem", "Salvar", "Upload"):
- Use `variant="primary"`
- Altura `h-10`
- Ícone `material-symbols-outlined` tamanho `text-sm`, margem direita `mr-1`.
- Texto `text-xs font-bold uppercase` (opcional o uppercase dependendo do contexto, mas consistente).

### Formulários
Use as variáveis de gap (`gap-form-fields`) em containers flex/grid de formulários para manter espaçamento vertical consistente.
