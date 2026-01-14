# Plano de Implementação: Ícones 3D para Atrações e Gastronomia

## Resumo Executivo

Este documento detalha o plano para implementar um novo sistema de geração de imagens usando ícones 3D consistentes para atrações turísticas e pratos típicos. O sistema gera uma coleção unificada de ícones e depois associa cada ícone individualmente ao seu item correspondente.

---

## 1. Conceito do Sistema

### 1.1 Problema Atual

Atualmente, cada atração/prato gera sua própria imagem de forma independente:
- **Inconsistência visual**: Cada imagem tem estilo diferente
- **Múltiplas chamadas de API**: Uma requisição por item
- **Falta de identidade visual**: Não há coesão entre as imagens

### 1.2 Solução Proposta

Gerar uma **coleção unificada de ícones** em um único prompt, garantindo:
- **Consistência visual**: Todos os ícones seguem o mesmo estilo
- **Eficiência**: Uma única chamada de API para múltiplos itens
- **Identidade visual**: Set coeso e profissional

### 1.3 Fluxo do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE GERAÇÃO                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. COLETA                                                          │
│     ├── Lista de atrações: ["Coliseu", "Fontana di Trevi", ...]     │
│     └── Lista de pratos: ["Carbonara", "Tiramisu", ...]             │
│                                                                      │
│  2. GERAÇÃO (1 prompt por tipo)                                     │
│     ├── Prompt Atrações → Imagem Grid 3x4 de ícones                │
│     └── Prompt Gastronomia → Imagem Grid 3x4 de ícones              │
│                                                                      │
│  3. PROCESSAMENTO                                                    │
│     ├── Receber imagem em grid                                      │
│     ├── Fazer crop/split por posição (Canvas API)                   │
│     └── Associar cada ícone ao item correspondente                  │
│                                                                      │
│  4. ARMAZENAMENTO                                                    │
│     └── Salvar ícone individual em cada Attraction/TypicalDish      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prompts de Geração

### 2.1 Prompt para Atrações Turísticas

```typescript
const generateAttractionIconsPrompt = (
  attractions: string[],
  cityName: string
): string => {
  const attractionList = attractions
    .map((name, i) => `${i + 1}. ${name}`)
    .join('\n');

  const gridSize = calculateGridSize(attractions.length);

  return `Create a collection of ${attractions.length} icons representing famous attractions in ${cityName}, arranged in a ${gridSize.cols}x${gridSize.rows} grid.

Each icon depicts one specific landmark and is clearly labeled by its name below:
${attractionList}

IMPORTANT LAYOUT RULES:
- Icons must be arranged in reading order (left-to-right, top-to-bottom)
- Each icon occupies exactly one grid cell
- Labels must be inside each icon's cell, centered below the icon
- Maintain equal spacing between all icons

STYLE REQUIREMENTS:
- Icons are rendered in a friendly, modern 3D style
- Smooth gradients and soft shadows
- Consistent proportions across all icons
- Color harmony using a cohesive palette
- Background is pure white
- No title header - only the icons grid

ICON DESIGN:
- Each icon should capture the essence of the landmark
- Use recognizable silhouettes and architectural features
- Soft, rounded edges for a friendly feel
- Subtle depth with 3D perspective

OUTPUT: A single image with all ${attractions.length} icons in a perfect grid, each clearly identifiable and labeled.`;
};
```

### 2.2 Prompt para Gastronomia

```typescript
const generateFoodIconsPrompt = (
  dishes: string[],
  cityName: string,
  country: string
): string => {
  const dishList = dishes
    .map((name, i) => `${i + 1}. ${name}`)
    .join('\n');

  const gridSize = calculateGridSize(dishes.length);

  return `Create a collection of ${dishes.length} icons representing traditional dishes from ${cityName}, ${country}, arranged in a ${gridSize.cols}x${gridSize.rows} grid.

Each icon depicts one specific dish and is clearly labeled by its name below:
${dishList}

IMPORTANT LAYOUT RULES:
- Icons must be arranged in reading order (left-to-right, top-to-bottom)
- Each icon occupies exactly one grid cell
- Labels must be inside each icon's cell, centered below the icon
- Maintain equal spacing between all icons

STYLE REQUIREMENTS:
- Icons are rendered in a friendly, modern 3D style
- Smooth gradients and soft shadows giving depth
- Consistent proportions across all icons
- Warm, appetizing color palette
- Background is pure white
- No title header - only the icons grid

ICON DESIGN:
- Each icon should show the dish in an appetizing way
- Include recognizable ingredients and presentation
- Soft, rounded edges for a friendly feel
- Subtle steam or freshness indicators where appropriate
- Dishes shown from a slightly elevated angle (3/4 view)

OUTPUT: A single image with all ${dishes.length} icons in a perfect grid, each clearly identifiable and labeled.`;
};
```

### 2.3 Cálculo do Grid

```typescript
/**
 * Calcula o tamanho ideal do grid baseado no número de itens
 */
const calculateGridSize = (itemCount: number): { rows: number; cols: number } => {
  // Grids sugeridos por quantidade
  const gridMap: Record<number, { rows: number; cols: number }> = {
    1: { rows: 1, cols: 1 },
    2: { rows: 1, cols: 2 },
    3: { rows: 1, cols: 3 },
    4: { rows: 2, cols: 2 },
    5: { rows: 2, cols: 3 }, // 1 célula vazia
    6: { rows: 2, cols: 3 },
    7: { rows: 2, cols: 4 }, // 1 célula vazia
    8: { rows: 2, cols: 4 },
    9: { rows: 3, cols: 3 },
    10: { rows: 2, cols: 5 },
    11: { rows: 3, cols: 4 }, // 1 célula vazia
    12: { rows: 3, cols: 4 },
  };

  if (gridMap[itemCount]) {
    return gridMap[itemCount];
  }

  // Para mais de 12 itens, calcular dinamicamente
  const cols = Math.ceil(Math.sqrt(itemCount));
  const rows = Math.ceil(itemCount / cols);
  return { rows, cols };
};
```

---

## 3. Arquitetura Técnica

### 3.1 Novo Serviço: IconGridService

**Criar arquivo:** `/services/iconGridService.ts`

```typescript
// /services/iconGridService.ts

import { getGeminiService } from './geminiService';

export interface GridIcon {
  name: string;
  imageData: string; // base64 do ícone individual
  position: { row: number; col: number };
}

export interface IconGridResult {
  fullGridImage: string; // imagem completa do grid
  icons: GridIcon[];
  gridSize: { rows: number; cols: number };
}

export class IconGridService {
  private geminiService = getGeminiService();

  /**
   * Gera grid de ícones para atrações
   */
  async generateAttractionIcons(
    attractions: string[],
    cityName: string,
    options?: { aspectRatio?: string; imageSize?: string }
  ): Promise<IconGridResult> {
    const prompt = this.buildAttractionPrompt(attractions, cityName);
    const gridSize = this.calculateGridSize(attractions.length);

    // Gerar imagem do grid completo
    const fullGridImage = await this.geminiService.generateImage(prompt, {
      aspectRatio: this.getOptimalAspectRatio(gridSize),
      imageSize: options?.imageSize || '2K'
    });

    if (!fullGridImage) {
      throw new Error('Failed to generate attraction icons grid');
    }

    // Dividir grid em ícones individuais
    const icons = await this.splitGridIntoIcons(
      fullGridImage,
      attractions,
      gridSize
    );

    return {
      fullGridImage,
      icons,
      gridSize
    };
  }

  /**
   * Gera grid de ícones para pratos
   */
  async generateFoodIcons(
    dishes: string[],
    cityName: string,
    country: string,
    options?: { aspectRatio?: string; imageSize?: string }
  ): Promise<IconGridResult> {
    const prompt = this.buildFoodPrompt(dishes, cityName, country);
    const gridSize = this.calculateGridSize(dishes.length);

    const fullGridImage = await this.geminiService.generateImage(prompt, {
      aspectRatio: this.getOptimalAspectRatio(gridSize),
      imageSize: options?.imageSize || '2K'
    });

    if (!fullGridImage) {
      throw new Error('Failed to generate food icons grid');
    }

    const icons = await this.splitGridIntoIcons(
      fullGridImage,
      dishes,
      gridSize
    );

    return {
      fullGridImage,
      icons,
      gridSize
    };
  }

  /**
   * Divide a imagem do grid em ícones individuais
   */
  private async splitGridIntoIcons(
    gridImage: string,
    itemNames: string[],
    gridSize: { rows: number; cols: number }
  ): Promise<GridIcon[]> {
    const icons: GridIcon[] = [];

    // Carregar imagem no canvas
    const img = await this.loadImage(gridImage);

    const cellWidth = img.width / gridSize.cols;
    const cellHeight = img.height / gridSize.rows;

    for (let i = 0; i < itemNames.length; i++) {
      const row = Math.floor(i / gridSize.cols);
      const col = i % gridSize.cols;

      // Criar canvas para o ícone individual
      const canvas = document.createElement('canvas');
      canvas.width = cellWidth;
      canvas.height = cellHeight;
      const ctx = canvas.getContext('2d')!;

      // Recortar a célula do grid
      ctx.drawImage(
        img,
        col * cellWidth,      // x source
        row * cellHeight,     // y source
        cellWidth,            // width source
        cellHeight,           // height source
        0,                    // x dest
        0,                    // y dest
        cellWidth,            // width dest
        cellHeight            // height dest
      );

      icons.push({
        name: itemNames[i],
        imageData: canvas.toDataURL('image/png'),
        position: { row, col }
      });
    }

    return icons;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private calculateGridSize(count: number): { rows: number; cols: number } {
    // ... implementação conforme seção 2.3
  }

  private getOptimalAspectRatio(gridSize: { rows: number; cols: number }): string {
    const ratio = gridSize.cols / gridSize.rows;

    if (ratio >= 2) return '21:9';
    if (ratio >= 1.5) return '16:9';
    if (ratio >= 1.2) return '4:3';
    if (ratio >= 0.8) return '1:1';
    if (ratio >= 0.6) return '3:4';
    return '9:16';
  }

  private buildAttractionPrompt(attractions: string[], cityName: string): string {
    // ... implementação conforme seção 2.1
  }

  private buildFoodPrompt(dishes: string[], cityName: string, country: string): string {
    // ... implementação conforme seção 2.2
  }
}

// Singleton
let iconGridServiceInstance: IconGridService | null = null;

export const getIconGridService = (): IconGridService => {
  if (!iconGridServiceInstance) {
    iconGridServiceInstance = new IconGridService();
  }
  return iconGridServiceInstance;
};
```

### 3.2 Novo Hook: useIconGeneration

**Criar arquivo:** `/hooks/useIconGeneration.ts`

```typescript
// /hooks/useIconGeneration.ts

import { useState, useCallback } from 'react';
import { getIconGridService, IconGridResult } from '../services/iconGridService';

interface UseIconGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  attractionIcons: IconGridResult | null;
  foodIcons: IconGridResult | null;
  generateAttractionIcons: (attractions: string[], cityName: string) => Promise<IconGridResult | null>;
  generateFoodIcons: (dishes: string[], cityName: string, country: string) => Promise<IconGridResult | null>;
  getIconForItem: (itemName: string, type: 'attraction' | 'food') => string | null;
}

export const useIconGeneration = (): UseIconGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attractionIcons, setAttractionIcons] = useState<IconGridResult | null>(null);
  const [foodIcons, setFoodIcons] = useState<IconGridResult | null>(null);

  const generateAttractionIcons = useCallback(async (
    attractions: string[],
    cityName: string
  ): Promise<IconGridResult | null> => {
    if (attractions.length === 0) return null;

    setIsGenerating(true);
    setError(null);

    try {
      const service = getIconGridService();
      const result = await service.generateAttractionIcons(attractions, cityName);
      setAttractionIcons(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate icons';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateFoodIcons = useCallback(async (
    dishes: string[],
    cityName: string,
    country: string
  ): Promise<IconGridResult | null> => {
    if (dishes.length === 0) return null;

    setIsGenerating(true);
    setError(null);

    try {
      const service = getIconGridService();
      const result = await service.generateFoodIcons(dishes, cityName, country);
      setFoodIcons(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate icons';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getIconForItem = useCallback((
    itemName: string,
    type: 'attraction' | 'food'
  ): string | null => {
    const icons = type === 'attraction' ? attractionIcons : foodIcons;
    if (!icons) return null;

    const icon = icons.icons.find(
      i => i.name.toLowerCase() === itemName.toLowerCase()
    );
    return icon?.imageData || null;
  }, [attractionIcons, foodIcons]);

  return {
    isGenerating,
    error,
    attractionIcons,
    foodIcons,
    generateAttractionIcons,
    generateFoodIcons,
    getIconForItem
  };
};
```

---

## 4. Integração com Componentes Existentes

### 4.1 Modificar AIContext.tsx

**Arquivo:** `/contexts/AIContext.tsx`

#### Alterações Necessárias:

```typescript
// Adicionar import
import { getIconGridService, IconGridResult } from '../services/iconGridService';

// Adicionar estados
const [attractionIconGrid, setAttractionIconGrid] = useState<IconGridResult | null>(null);
const [foodIconGrid, setFoodIconGrid] = useState<IconGridResult | null>(null);
const [isGeneratingIconGrid, setIsGeneratingIconGrid] = useState(false);

// Novo método: generateIconGrids
const generateIconGrids = useCallback(async () => {
  if (!selectedCity || !cityGuide) return;

  setIsGeneratingIconGrid(true);

  try {
    const iconService = getIconGridService();

    // Gerar ícones de atrações
    if (cityGuide.attractions.length > 0) {
      const attractionNames = cityGuide.attractions.map(a => a.name);
      const attractionResult = await iconService.generateAttractionIcons(
        attractionNames,
        selectedCity.name
      );
      setAttractionIconGrid(attractionResult);

      // Atualizar cada atração com seu ícone
      attractionResult.icons.forEach((icon, idx) => {
        updateAttractionImage(idx, icon.imageData);
      });
    }

    // Gerar ícones de pratos
    if (cityGuide.typicalDishes.length > 0) {
      const dishNames = cityGuide.typicalDishes.map(d => d.name);
      const foodResult = await iconService.generateFoodIcons(
        dishNames,
        selectedCity.name,
        selectedCity.country
      );
      setFoodIconGrid(foodResult);

      // Atualizar cada prato com seu ícone
      foodResult.icons.forEach((icon, idx) => {
        updateDishImage(idx, icon.imageData);
      });
    }
  } catch (error) {
    console.error('Error generating icon grids:', error);
  } finally {
    setIsGeneratingIconGrid(false);
  }
}, [selectedCity, cityGuide, updateAttractionImage, updateDishImage]);

// Substituir generateAllImages por generateIconGrids no value
```

### 4.2 Modificar AttractionsTab.tsx

Adicionar opção para escolher entre modo "Foto" e modo "Ícone 3D":

```typescript
// Adicionar estado
const [imageMode, setImageMode] = useState<'photo' | 'icon'>('icon');

// Adicionar toggle no UI
<div className="flex gap-2 mb-4">
  <Button
    variant={imageMode === 'icon' ? 'primary' : 'secondary'}
    size="sm"
    onClick={() => setImageMode('icon')}
  >
    <Sparkles className="w-4 h-4 mr-1" />
    Ícones 3D
  </Button>
  <Button
    variant={imageMode === 'photo' ? 'primary' : 'secondary'}
    size="sm"
    onClick={() => setImageMode('photo')}
  >
    <Camera className="w-4 h-4 mr-1" />
    Fotos
  </Button>
</div>
```

### 4.3 Modificar GastronomyTab.tsx

Mesma lógica do AttractionsTab - adicionar toggle para modo de imagem.

---

## 5. Otimizações e Considerações

### 5.1 Cache de Ícones

```typescript
// Usar localStorage para cache
const CACHE_KEY = (cityName: string, type: string) =>
  `porai_icons_${cityName}_${type}`;

// Antes de gerar, verificar cache
const cached = localStorage.getItem(CACHE_KEY(cityName, 'attractions'));
if (cached) {
  return JSON.parse(cached) as IconGridResult;
}

// Após gerar, salvar no cache
localStorage.setItem(CACHE_KEY(cityName, 'attractions'), JSON.stringify(result));
```

### 5.2 Limitações do Grid

| Itens | Grid | Aspect Ratio | Observações |
|-------|------|--------------|-------------|
| 1-4 | 2x2 | 1:1 | Ideal para poucos itens |
| 5-6 | 2x3 | 3:2 | Bom equilíbrio |
| 7-9 | 3x3 | 1:1 | Grid quadrado |
| 10-12 | 3x4 | 4:3 | Máximo recomendado |
| 13+ | Dividir em múltiplos grids | - | Gerar em batches |

### 5.3 Fallback

Se a divisão do grid falhar (ex: labels não legíveis), usar fallback:
1. Tentar regenerar com prompt mais específico
2. Gerar cada ícone individualmente (modo antigo)
3. Usar placeholder genérico por categoria

### 5.4 Qualidade da Divisão

Para melhorar a precisão do split:
- Usar `imageSize: '4K'` para maior resolução
- Adicionar padding interno nos ícones no prompt
- Considerar usar OCR (Gemini Vision) para verificar labels

---

## 6. Arquivos a Criar/Modificar

### 6.1 Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `/services/iconGridService.ts` | Serviço de geração de grid de ícones |
| `/hooks/useIconGeneration.ts` | Hook React para geração de ícones |
| `/utils/imageGrid.ts` | Utilitários para manipulação de grid |

### 6.2 Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `/contexts/AIContext.tsx` | Adicionar `generateIconGrids`, estados de grid |
| `/components/trip-details/city-guide/AttractionsTab.tsx` | Toggle modo foto/ícone |
| `/components/trip-details/city-guide/GastronomyTab.tsx` | Toggle modo foto/ícone |
| `/types.ts` | Adicionar tipos `IconGridResult`, `GridIcon` |

---

## 7. Plano de Execução

### Fase 1: Infraestrutura (2-3 horas)
1. [ ] Criar `/services/iconGridService.ts`
2. [ ] Criar `/hooks/useIconGeneration.ts`
3. [ ] Criar `/utils/imageGrid.ts`
4. [ ] Adicionar tipos em `/types.ts`

### Fase 2: Integração Backend (2-3 horas)
1. [ ] Implementar `generateAttractionIcons` no serviço
2. [ ] Implementar `generateFoodIcons` no serviço
3. [ ] Implementar `splitGridIntoIcons` com Canvas API
4. [ ] Testar geração de grids

### Fase 3: Integração Frontend (2-3 horas)
1. [ ] Modificar `AIContext.tsx`
2. [ ] Adicionar toggle em `AttractionsTab.tsx`
3. [ ] Adicionar toggle em `GastronomyTab.tsx`
4. [ ] Implementar cache local

### Fase 4: Testes e Refinamento (1-2 horas)
1. [ ] Testar com diferentes quantidades de itens
2. [ ] Testar qualidade da divisão do grid
3. [ ] Implementar fallbacks
4. [ ] Ajustar prompts conforme necessário

### Estimativa Total: 7-11 horas

---

## 8. Exemplos de Output Esperado

### 8.1 Grid de Atrações (Roma)

```
┌─────────────────────────────────────────────┐
│  [Coliseu]    [Fontana di    [Vaticano]    │
│               Trevi]                        │
│                                             │
│  [Pantheon]   [Piazza       [Forum         │
│               Navona]        Romano]        │
└─────────────────────────────────────────────┘
```

### 8.2 Grid de Pratos (Itália)

```
┌─────────────────────────────────────────────┐
│  [Carbonara]  [Cacio e      [Amatriciana]  │
│               Pepe]                         │
│                                             │
│  [Tiramisu]   [Supplì]      [Gelato]       │
└─────────────────────────────────────────────┘
```

---

## 9. Referências

- [Canvas API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Gemini Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- Plano de atualização Gemini 3: `/docs/PLANO_ATUALIZACAO_GEMINI_3.md`

---

*Documento criado em 14/01/2026*
