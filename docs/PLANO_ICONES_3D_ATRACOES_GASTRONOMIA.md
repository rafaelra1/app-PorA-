# Plano de Implementação: Ícones 3D para Top Attractions

## Problema Atual

O componente `AttractionsTab.tsx` exibe a seção "Destaques Imperdíveis da Cidade" com um **ícone genérico de ticket** para todas as atrações:

```tsx
// AttractionsTab.tsx:475-476
<div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center...">
    <Ticket className="w-5 h-5" />  // ❌ Mesmo ícone para TODAS
</div>
```

## Solução Proposta

Gerar um **ícone 3D personalizado** para cada atração quando a lista é carregada.

---

## 1. Fluxo Atual vs. Novo Fluxo

### Fluxo Atual
```
generateTopAttractions(cityName)
    └── Retorna: [{ name, description, tags, history_trivia, category }]
        └── Exibe com ícone <Ticket /> genérico
```

### Novo Fluxo
```
generateTopAttractions(cityName)
    └── Retorna: [{ name, description, tags, history_trivia, category }]
        └── generateAttractionIcons(attractions, cityName)
            └── Retorna: [{ name, iconImage }]
                └── Associa cada iconImage ao attraction correspondente
                    └── Exibe com <img src={attr.iconImage} />
```

---

## 2. Alterações Necessárias

### 2.1 Atualizar Interface TopAttraction

**Arquivo:** `components/trip-details/city-guide/AttractionsTab.tsx:61-67`

```typescript
// ANTES
interface TopAttraction {
    name: string;
    description: string;
    tags: { label: string; value: string }[];
    history_trivia: string;
    category: string;
}

// DEPOIS
interface TopAttraction {
    name: string;
    description: string;
    tags: { label: string; value: string }[];
    history_trivia: string;
    category: string;
    iconImage?: string;        // NOVO: URL/base64 do ícone 3D
    isGeneratingIcon?: boolean; // NOVO: Flag de loading
}
```

### 2.2 Adicionar Prompt para Geração de Ícones

**Arquivo:** `services/geminiService.ts` (na seção PROMPTS)

```typescript
// Adicionar ao objeto PROMPTS
attractionIcon: (attractionName: string, cityName: string, category: string) =>
  `Create a single 3D icon representing "${attractionName}" in ${cityName}.

STYLE:
- Friendly, modern 3D style with smooth gradients
- Soft shadows giving depth
- Isometric perspective (3/4 view)
- Warm, vibrant color palette
- NO text labels - just the icon itself

DESIGN:
- Capture the essence of this ${category} attraction
- Use recognizable architectural/visual features
- Soft, rounded edges for a friendly feel
- Single centered icon on pure white background

OUTPUT: Square image (1:1), icon centered, white background, no text.`,

foodIcon: (dishName: string, cityName: string) =>
  `Create a single 3D icon representing "${dishName}" from ${cityName}.

STYLE:
- Friendly, modern 3D style with smooth gradients
- Soft shadows giving depth
- Slightly elevated angle (3/4 view)
- Warm, appetizing color palette
- NO text labels - just the icon itself

DESIGN:
- Show the dish in an appetizing way
- Include recognizable ingredients and presentation
- Soft, rounded edges for a friendly feel
- Subtle steam or freshness indicators if appropriate

OUTPUT: Square image (1:1), icon centered, white background, no text.`,
```

### 2.3 Adicionar Método no GeminiService

**Arquivo:** `services/geminiService.ts`

```typescript
/**
 * Generate a 3D icon for a single attraction
 */
async generateAttractionIcon(
  attractionName: string,
  cityName: string,
  category: string
): Promise<string | null> {
  try {
    const prompt = PROMPTS.attractionIcon(attractionName, cityName, category);
    return await this.generateImage(prompt, {
      aspectRatio: '1:1',
      imageSize: '1K'  // Pequeno, só precisa de ícone
    });
  } catch (error) {
    console.error(`Error generating icon for ${attractionName}:`, error);
    return null;
  }
}

/**
 * Generate a 3D icon for a single dish
 */
async generateFoodIcon(
  dishName: string,
  cityName: string
): Promise<string | null> {
  try {
    const prompt = PROMPTS.foodIcon(dishName, cityName);
    return await this.generateImage(prompt, {
      aspectRatio: '1:1',
      imageSize: '1K'
    });
  } catch (error) {
    console.error(`Error generating icon for ${dishName}:`, error);
    return null;
  }
}

/**
 * Generate icons for multiple attractions in parallel
 */
async generateAttractionIconsBatch(
  attractions: Array<{ name: string; category: string }>,
  cityName: string
): Promise<Map<string, string>> {
  const iconMap = new Map<string, string>();

  // Gerar em paralelo (máximo 4 simultâneos para não sobrecarregar)
  const batchSize = 4;
  for (let i = 0; i < attractions.length; i += batchSize) {
    const batch = attractions.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(attr => this.generateAttractionIcon(attr.name, cityName, attr.category))
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        iconMap.set(batch[idx].name, result.value);
      }
    });
  }

  return iconMap;
}
```

### 2.4 Modificar Carregamento no AttractionsTab

**Arquivo:** `components/trip-details/city-guide/AttractionsTab.tsx:176-193`

```typescript
// Fetch Top Attractions on mount
useEffect(() => {
    const loadTopAttractions = async () => {
        if (topAttractions.length === 0 && !isLoadingTopAttractions && cityName) {
            setIsLoadingTopAttractions(true);
            try {
                const service = getGeminiService();

                // 1. Gerar lista de atrações
                const attractions = await service.generateTopAttractions(cityName);

                if (attractions) {
                    // 2. Salvar atrações (sem ícones ainda)
                    setTopAttractions(attractions);

                    // 3. Gerar ícones em paralelo (não bloqueia UI)
                    generateIconsForAttractions(attractions, cityName, service);
                }
            } catch (e) {
                console.error('Error loading top attractions:', e);
            } finally {
                setIsLoadingTopAttractions(false);
            }
        }
    };
    loadTopAttractions();
}, [cityName]);

// Função auxiliar para gerar ícones
const generateIconsForAttractions = async (
    attractions: TopAttraction[],
    cityName: string,
    service: GeminiService
) => {
    // Gerar ícones um por um para não sobrecarregar
    for (let i = 0; i < attractions.length; i++) {
        const attr = attractions[i];

        // Marcar como gerando
        setTopAttractions(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], isGeneratingIcon: true };
            return updated;
        });

        // Gerar ícone
        const iconImage = await service.generateAttractionIcon(
            attr.name,
            cityName,
            attr.category
        );

        // Atualizar com ícone gerado
        setTopAttractions(prev => {
            const updated = [...prev];
            updated[i] = {
                ...updated[i],
                iconImage: iconImage || undefined,
                isGeneratingIcon: false
            };
            return updated;
        });
    }
};
```

### 2.5 Modificar Renderização do Card

**Arquivo:** `components/trip-details/city-guide/AttractionsTab.tsx:474-477`

```tsx
// ANTES
<div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-3 group-hover/card:scale-110 transition-transform">
    <Ticket className="w-5 h-5" />
</div>

// DEPOIS
<div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 group-hover/card:scale-110 transition-transform overflow-hidden shadow-sm">
    {attr.isGeneratingIcon ? (
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
    ) : attr.iconImage ? (
        <img
            src={attr.iconImage}
            alt={attr.name}
            className="w-full h-full object-contain"
        />
    ) : (
        <Ticket className="w-5 h-5 text-indigo-500" />
    )}
</div>
```

---

## 3. Otimizações

### 3.1 Cache de Ícones

Os ícones já serão salvos automaticamente via `useLocalStorage`:

```typescript
const [topAttractions, setTopAttractions] = useLocalStorage<TopAttraction[]>(
    `porai_city_${cityName}_top_attractions`,
    []
);
```

Quando `iconImage` for adicionado ao objeto, será persistido junto.

### 3.2 Verificar Cache Antes de Gerar

```typescript
const generateIconsForAttractions = async (...) => {
    for (let i = 0; i < attractions.length; i++) {
        const attr = attractions[i];

        // Pular se já tem ícone
        if (attr.iconImage) continue;

        // ... resto do código
    }
};
```

### 3.3 Botão para Regenerar Ícones

Adicionar opção no UI para regenerar ícones manualmente:

```tsx
<Button
    variant="ghost"
    size="sm"
    onClick={() => regenerateAllIcons()}
    disabled={isRegeneratingIcons}
>
    <Sparkles className="w-4 h-4 mr-1" />
    Gerar Ícones 3D
</Button>
```

---

## 4. Mesma Abordagem para Gastronomia

Aplicar a mesma lógica para `GastronomyTab.tsx` e `TypicalDish`:

### 4.1 Atualizar Interface TypicalDish

```typescript
// types.ts
export interface TypicalDish {
  name: string;
  description: string;
  image: string;
  aiImage?: string;
  iconImage?: string;        // NOVO
  isGeneratingIcon?: boolean; // NOVO
}
```

### 4.2 Gerar Ícones para Pratos

```typescript
const generateIconsForDishes = async (
    dishes: TypicalDish[],
    cityName: string,
    service: GeminiService
) => {
    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        if (dish.iconImage) continue;

        // Marcar como gerando
        setCityGuide(prev => {
            if (!prev) return prev;
            const updated = [...prev.typicalDishes];
            updated[i] = { ...updated[i], isGeneratingIcon: true };
            return { ...prev, typicalDishes: updated };
        });

        const iconImage = await service.generateFoodIcon(dish.name, cityName);

        // Atualizar
        setCityGuide(prev => {
            if (!prev) return prev;
            const updated = [...prev.typicalDishes];
            updated[i] = {
                ...updated[i],
                iconImage: iconImage || undefined,
                isGeneratingIcon: false
            };
            return { ...prev, typicalDishes: updated };
        });
    }
};
```

---

## 5. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `types.ts` | Adicionar `iconImage` e `isGeneratingIcon` a `TypicalDish` |
| `services/geminiService.ts` | Adicionar prompts e métodos de geração de ícones |
| `components/trip-details/city-guide/AttractionsTab.tsx` | Interface, carregamento, renderização |
| `components/trip-details/city-guide/GastronomyTab.tsx` | Mesmas alterações para pratos |
| `contexts/AIContext.tsx` | (Opcional) Centralizar geração de ícones |

---

## 6. Plano de Execução

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| 1 | Adicionar prompts no geminiService.ts | 30min |
| 2 | Adicionar métodos de geração de ícones | 1h |
| 3 | Modificar AttractionsTab.tsx | 1h |
| 4 | Modificar GastronomyTab.tsx | 45min |
| 5 | Atualizar types.ts | 15min |
| 6 | Testar e ajustar prompts | 1h |
| **Total** | | **4-5 horas** |

---

## 7. Exemplo Visual Esperado

### Antes (Atual)
```
┌─────────────────────┐
│  [🎫]               │  <- Ícone Ticket genérico
│  Table Mountain     │
│  O ícone definitivo │
│  Ver detalhes >     │
└─────────────────────┘
```

### Depois (Com Ícone 3D)
```
┌─────────────────────┐
│  [🏔️ 3D]            │  <- Ícone 3D da montanha
│  Table Mountain     │
│  O ícone definitivo │
│  Ver detalhes >     │
└─────────────────────┘
```

---

## 8. Considerações de Performance

### Chamadas de API
- **Atual**: 1 chamada para gerar lista de atrações
- **Novo**: 1 + N chamadas (lista + ícone para cada)

### Mitigações
1. **Geração assíncrona**: UI não bloqueia enquanto ícones são gerados
2. **Cache persistente**: Ícones salvos no localStorage
3. **Batch com limite**: Máximo 4 gerações simultâneas
4. **Skip se existe**: Não regera ícones já salvos

### Custo Estimado (Gemini 3)
- ~$0.50 por 1M tokens de entrada
- ~$3.00 por 1M tokens de saída
- ~$0.13 por imagem gerada
- **Para 8 atrações**: ~$1.04 em imagens

---

*Documento atualizado em 14/01/2026*
