# Plano de Implementação: Atualização para Gemini 3

## Resumo Executivo

Este documento detalha o plano completo para atualização dos modelos do Google Gemini utilizados na aplicação "PorAí" (app de planejamento de viagens). A atualização migra os modelos atuais para a família Gemini 3, trazendo melhorias significativas em performance, qualidade de imagens e novas funcionalidades.

---

## 1. Análise do Estado Atual

### 1.1 Modelos em Uso

| Tipo | Modelo Atual | Localização |
|------|--------------|-------------|
| **Texto/Análise** | `gemini-2.5-flash` | `geminiService.ts:43`, `server/index.js:38` |
| **Imagem** | `gemini-2.0-flash-exp` | `geminiService.ts:1605`, `server/index.js:103`, `CreateTrip.tsx:151,193` |

### 1.2 Arquivos Afetados

**Arquivos Principais (requerem modificação direta):**
1. `/services/geminiService.ts` - Serviço principal (2.400+ linhas)
2. `/server/index.js` - Servidor Express com endpoints proxy
3. `/pages/CreateTrip.tsx` - Uso direto do SDK para imagens

**Arquivos Dependentes (32 arquivos que importam GeminiService):**
- `/contexts/AIContext.tsx`
- `/hooks/useImageGeneration.ts`
- `/hooks/useLLMAnalysis.ts`
- `/hooks/useCityGuide.ts`
- `/pages/AIAssistant.tsx`
- `/pages/AIAssistantV2.tsx`
- `/pages/TripDetails.tsx`
- `/pages/Library.tsx`
- `/components/Chatbot.tsx`
- `/components/dashboard/ImagineTripsWidget.tsx`
- `/components/trip-details/overview/OverviewTab.tsx`
- `/components/trip-details/city-guide/*.tsx` (6 arquivos)
- `/components/trip-details/modals/*.tsx` (8 arquivos)
- `/components/trip-details/itinerary/ItineraryView.tsx`
- `/services/discoveryService.ts`

### 1.3 Dependência NPM Atual

```json
"@google/genai": "^1.34.0"
```

---

## 2. Modelos de Destino

### 2.1 Modelos Gemini 3

| Modelo | ID | Uso Recomendado | Preço (Input/Output) |
|--------|----|-----------------|-----------------------|
| **Gemini 3 Flash** | `gemini-3-flash-preview` | Texto, análise, chat (velocidade) | $0.50 / $3.00 por 1M tokens |
| **Gemini 3 Pro** | `gemini-3-pro-preview` | Tarefas complexas de raciocínio | $2 / $12 (< 200k), $4 / $18 (> 200k) |
| **Gemini 3 Pro Image** | `gemini-3-pro-image-preview` | Geração de imagens profissional | $2 (texto) / $0.134 (imagem) |

### 2.2 Modelo Alternativo para Imagens Rápidas

| Modelo | ID | Uso Recomendado |
|--------|----|-----------------|
| **Gemini 2.5 Flash Image** | `gemini-2.5-flash-image` | Imagens de alta velocidade, baixo custo |

### 2.3 Mapeamento de Migração

| Funcionalidade Atual | Modelo Atual | Modelo Novo |
|---------------------|--------------|-------------|
| Geração de itinerário | gemini-2.5-flash | gemini-3-flash-preview |
| Chatbot | gemini-2.5-flash | gemini-3-flash-preview |
| Análise de documentos | gemini-2.5-flash | gemini-3-flash-preview |
| Guias de cidade | gemini-2.5-flash | gemini-3-flash-preview |
| Checklist AI | gemini-2.5-flash | gemini-3-flash-preview |
| **Geração de imagem de capa** | gemini-2.0-flash-exp | gemini-3-pro-image-preview |
| **Edição de imagem** | gemini-2.0-flash-exp | gemini-3-pro-image-preview |
| **Sugestão de título (texto)** | gemini-2.0-flash-exp | gemini-3-flash-preview |

---

## 3. Novas Funcionalidades Disponíveis

### 3.1 Thinking Level (Nível de Raciocínio)

```typescript
// Nova configuração disponível para controlar profundidade de raciocínio
config: {
  thinkingConfig: {
    thinkingLevel: "low" | "medium" | "high"
  }
}
```

**Recomendações de uso:**
- `low`: Chat simples, respostas rápidas
- `medium`: Tarefas balanceadas (padrão sugerido)
- `high`: Análise de documentos, geração de itinerários complexos

### 3.2 Media Resolution (Resolução de Mídia)

```typescript
// Controle de resolução para PDFs e imagens de entrada
mediaResolution: {
  level: "media_resolution_low" | "media_resolution_medium" | "media_resolution_high"
}
```

**Recomendações:**
- PDFs: `media_resolution_medium` (otimizado para OCR)
- Imagens: `media_resolution_high` (máxima qualidade)

### 3.3 Image Generation (Geração de Imagens)

```typescript
// Nova sintaxe para geração de imagens
config: {
  responseModalities: ['TEXT', 'IMAGE'],
  imageConfig: {
    aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | etc.,
    imageSize: "1K" | "2K" | "4K"  // NOVO!
  },
  tools: [{ googleSearch: {} }]  // NOVO: Grounding com dados reais
}
```

### 3.4 Thought Signatures (Assinaturas de Pensamento)

- Gerenciado automaticamente pelo SDK oficial
- Para migração manual: usar `"thoughtSignature": "context_engineering_is_the_way_to_go"`

---

## 4. Plano de Implementação Detalhado

### FASE 1: Preparação (Estimativa: 2-3 horas)

#### 1.1 Backup e Versionamento
```bash
# Criar branch de feature
git checkout -b feature/gemini-3-upgrade

# Fazer backup dos arquivos críticos
cp services/geminiService.ts services/geminiService.ts.backup
cp server/index.js server/index.js.backup
cp pages/CreateTrip.tsx pages/CreateTrip.tsx.backup
```

#### 1.2 Verificar Versão do SDK
```bash
# Verificar se precisa atualizar o SDK
npm outdated @google/genai

# Atualizar se necessário (verificar compatibilidade)
npm update @google/genai
```

#### 1.3 Criar Constantes de Configuração
Criar novo arquivo `/services/gemini/config.ts`:

```typescript
// /services/gemini/config.ts

export const GEMINI_CONFIG = {
  // Modelos
  models: {
    text: {
      fast: 'gemini-3-flash-preview',
      pro: 'gemini-3-pro-preview',
    },
    image: {
      pro: 'gemini-3-pro-image-preview',
      fast: 'gemini-2.5-flash-image',
    },
  },

  // URLs de API
  apiUrls: {
    base: 'https://generativelanguage.googleapis.com/v1beta/models',
    textFlash: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    textPro: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent',
    imagePro: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
    imageFast: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
  },

  // Configurações padrão
  defaults: {
    thinkingLevel: 'high' as const,
    mediaResolution: 'media_resolution_medium' as const,
    imageAspectRatio: '16:9' as const,
    imageSize: '2K' as const,
  },

  // Aspect ratios disponíveis
  aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const,

  // Tamanhos de imagem
  imageSizes: ['1K', '2K', '4K'] as const,
} as const;

export type ThinkingLevel = 'low' | 'medium' | 'high' | 'minimal';
export type MediaResolution = 'media_resolution_low' | 'media_resolution_medium' | 'media_resolution_high' | 'media_resolution_ultra_high';
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = typeof GEMINI_CONFIG.aspectRatios[number];
```

---

### FASE 2: Atualização do Servidor (server/index.js)

#### 2.1 Atualizar Endpoint de Texto `/api/gemini`

**Arquivo:** `/server/index.js`
**Linha:** 38

**DE:**
```javascript
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
```

**PARA:**
```javascript
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
```

#### 2.2 Atualizar Endpoint de Imagem `/api/gemini/imagen`

**Arquivo:** `/server/index.js`
**Linhas:** 90-138

**Substituir TODO o endpoint por:**

```javascript
// Gemini 3 Pro Image Generation endpoint
app.post('/api/gemini/imagen', async (req, res) => {
  try {
    const { prompt, aspectRatio, imageSize, useGoogleSearch } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Usar Gemini 3 Pro Image para geração de imagens
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio || '16:9',
          imageSize: imageSize || '2K'
        }
      }
    };

    // Adicionar Google Search grounding se solicitado
    if (useGoogleSearch) {
      body.tools = [{ googleSearch: {} }];
    }

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Image API error:', errorText);
      return res.status(response.status).json({
        error: `Gemini Image API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();

    // Extrair imagem da resposta do Gemini 3
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          return res.json({
            predictions: [{
              bytesBase64Encoded: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png'
            }],
            groundingMetadata: data.candidates[0].groundingMetadata
          });
        }
      }
    }

    res.status(500).json({ error: 'No image generated' });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
```

#### 2.3 Adicionar Novo Endpoint para Texto com Thinking Level

**Adicionar após o endpoint `/api/gemini`:**

```javascript
// Gemini 3 with Thinking Level support
app.post('/api/gemini/v3', async (req, res) => {
  try {
    const { prompt, image, tools, responseMimeType, thinkingLevel, mediaResolution } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

    // Build request body
    const parts = [{ text: prompt }];

    if (image) {
      const imagePart = {
        inline_data: {
          mime_type: image.mimeType,
          data: image.data
        }
      };

      // Adicionar media resolution se especificado
      if (mediaResolution) {
        imagePart.mediaResolution = { level: mediaResolution };
      }

      parts.push(imagePart);
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {}
    };

    // Adicionar thinking level
    if (thinkingLevel) {
      body.generationConfig.thinkingConfig = {
        thinkingLevel: thinkingLevel
      };
    }

    if (tools) {
      body.tools = tools;
    }

    if (responseMimeType) {
      body.generationConfig.response_mime_type = responseMimeType;
    }

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(response.status).json({
        error: `Gemini API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
```

---

### FASE 3: Atualização do GeminiService

#### 3.1 Atualizar Constantes

**Arquivo:** `/services/geminiService.ts`
**Linhas:** 43-48

**DE:**
```typescript
const GEMINI_DIRECT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const API_PROXY_URL = '/api/gemini';
```

**PARA:**
```typescript
// Gemini 3 Models
const GEMINI_TEXT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

// Proxy URLs
const API_PROXY_URL = '/api/gemini';
const API_PROXY_V3_URL = '/api/gemini/v3';
const API_IMAGE_PROXY_URL = '/api/gemini/imagen';

// Use proxy in production to protect API key
const USE_PROXY = import.meta.env.PROD || import.meta.env.VITE_USE_API_PROXY === 'true';
const API_BASE_URL = USE_PROXY ? API_PROXY_URL : GEMINI_TEXT_URL;
```

#### 3.2 Adicionar Novos Tipos

**Após a linha 36, adicionar:**

```typescript
interface GeminiV3Config {
  thinkingLevel?: 'low' | 'medium' | 'high' | 'minimal';
  mediaResolution?: 'media_resolution_low' | 'media_resolution_medium' | 'media_resolution_high';
}

interface ImageGenerationOptionsV3 extends ImageGenerationOptions {
  imageSize?: '1K' | '2K' | '4K';
  useGoogleSearch?: boolean;
}
```

#### 3.3 Atualizar Método `callGeminiAPI`

**Arquivo:** `/services/geminiService.ts`
**Linha:** ~1046

Adicionar parâmetro opcional para configurações V3:

```typescript
private async callGeminiAPI(
  prompt: string,
  image?: ImageData,
  tools?: unknown[],
  responseMimeType?: string,
  v3Config?: GeminiV3Config  // NOVO
): Promise<string> {
  try {
    let url: string;
    let body: GeminiRequestBody;

    if (USE_PROXY) {
      // Usar endpoint V3 se configurações V3 forem fornecidas
      url = v3Config ? API_PROXY_V3_URL : API_PROXY_URL;

      body = {
        prompt,
        image: image ? { mimeType: image.mimeType, data: image.data } : undefined,
        tools,
        responseMimeType,
        ...v3Config  // Passa thinkingLevel, mediaResolution
      };

      // ... resto do código de proxy
    } else {
      // Chamada direta à API
      url = `${GEMINI_TEXT_URL}?key=${this.apiKey}`;

      const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
        { text: prompt }
      ];

      if (image) {
        parts.push({
          inline_data: {
            mime_type: image.mimeType,
            data: image.data
          }
        });
      }

      body = {
        contents: [{ parts }]
      };

      if (tools) {
        body.tools = tools;
      }

      if (responseMimeType) {
        body.generationConfig = { response_mime_type: responseMimeType };
      }

      // Adicionar configurações V3
      if (v3Config) {
        body.generationConfig = body.generationConfig || {};
        if (v3Config.thinkingLevel) {
          body.generationConfig.thinkingConfig = {
            thinkingLevel: v3Config.thinkingLevel
          };
        }
      }
    }

    // ... resto do método permanece igual
  }
}
```

#### 3.4 Atualizar Método `generateWithImagenAPI`

**Arquivo:** `/services/geminiService.ts`
**Linha:** ~1322

**Substituir o método inteiro por:**

```typescript
/**
 * Generate image using Gemini 3 Pro Image API
 */
private async generateWithImagenAPI(
  prompt: string,
  options: ImageGenerationOptionsV3 = {}
): Promise<string | null> {
  try {
    const maxRetries = 3;
    let lastError;

    // Build enhanced prompt
    const enhancedPrompt = this.buildEnhancedImagePrompt(prompt, options);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const proxyUrl = '/api/gemini/imagen';

        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            aspectRatio: options.aspectRatio || '16:9',
            imageSize: options.imageSize || '2K',
            useGoogleSearch: options.useGoogleSearch || false
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`Gemini Image API error (attempt ${attempt}):`, errorData);
          throw new Error(`Image API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Handle Gemini 3 response format
        if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
          const base64Image = data.predictions[0].bytesBase64Encoded;
          const mimeType = data.predictions[0].mimeType || 'image/png';
          return `data:${mimeType};base64,${base64Image}`;
        }

        throw new Error('No image data in response');

      } catch (error) {
        console.warn(`Image generation attempt ${attempt} failed:`, error);
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to generate image after retries');

  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}
```

#### 3.5 Atualizar Método `editImageWithGemini`

**Arquivo:** `/services/geminiService.ts`
**Linha:** ~1590

**Atualizar URL do endpoint:**

```typescript
// DE:
const visionEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`;

// PARA:
const visionEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`;
```

#### 3.6 Adicionar Métodos Utilitários para V3

**Adicionar antes da seção "Singleton Instance":**

```typescript
/**
 * Generate content with Gemini 3 advanced features
 */
async generateContentV3(
  prompt: string,
  options: {
    image?: ImageData;
    thinkingLevel?: 'low' | 'medium' | 'high';
    mediaResolution?: 'media_resolution_low' | 'media_resolution_medium' | 'media_resolution_high';
    responseFormat?: 'text/plain' | 'application/json';
  } = {}
): Promise<string> {
  return this.callGeminiAPI(
    prompt,
    options.image,
    undefined,
    options.responseFormat,
    {
      thinkingLevel: options.thinkingLevel || 'high',
      mediaResolution: options.mediaResolution
    }
  );
}

/**
 * Generate image with Gemini 3 Pro Image (4K support, Google Search grounding)
 */
async generateImageV3(
  prompt: string,
  options: ImageGenerationOptionsV3 = {}
): Promise<string | null> {
  console.log(`Generating Gemini 3 image: ${prompt.substring(0, 50)}...`);

  try {
    const imageUrl = await this.generateWithImagenAPI(prompt, {
      aspectRatio: options.aspectRatio || '16:9',
      imageSize: options.imageSize || '2K',
      useGoogleSearch: options.useGoogleSearch || false
    });

    if (imageUrl) {
      console.log('Image generated successfully with Gemini 3 Pro Image');
      return imageUrl;
    }
  } catch (error) {
    console.warn('Gemini 3 image generation failed:', error);
  }

  // Fallback to Unsplash
  return this.generateFallbackImage(prompt);
}
```

---

### FASE 4: Atualização do CreateTrip.tsx

**Arquivo:** `/pages/CreateTrip.tsx`
**Linhas:** 140-205

#### 4.1 Atualizar `handleGenerateImage`

**DE:**
```typescript
const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: {
        parts: [{ text: `A high-quality...` }]
    },
    config: {
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: imageSize
        }
    }
});
```

**PARA:**
```typescript
const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: `A breathtaking, cinematic travel photography of ${destinationNames}, featuring iconic landmarks and local culture. Golden hour light, wide angle, vibrant colors, National Geographic style. No text or watermarks.`,
    config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: imageSize || "2K"
        }
    }
});
```

#### 4.2 Atualizar `handleAISuggestion`

**DE:**
```typescript
const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `Sugira um título criativo...`,
});
```

**PARA:**
```typescript
const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Sugira um título criativo e inspirador para uma viagem para ${destinationNames}. Responda apenas o título, sem aspas.`,
    config: {
        thinkingConfig: {
            thinkingLevel: 'low'  // Resposta rápida para sugestão simples
        }
    }
});
```

---

### FASE 5: Testes e Validação

#### 5.1 Criar Testes de Integração

**Criar arquivo:** `/__tests__/integration/gemini3Migration.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGeminiService, resetGeminiService } from '../../services/geminiService';

describe('Gemini 3 Migration Tests', () => {
  beforeEach(() => {
    resetGeminiService();
  });

  describe('Text Generation', () => {
    it('should use gemini-3-flash-preview for text generation', async () => {
      const service = getGeminiService();
      // Mock fetch to verify correct endpoint is called
      const fetchSpy = vi.spyOn(global, 'fetch');

      await service.chat('Hello', []);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('gemini-3-flash-preview'),
        expect.any(Object)
      );
    });

    it('should support thinkingLevel parameter', async () => {
      const service = getGeminiService();
      const fetchSpy = vi.spyOn(global, 'fetch');

      await service.generateContentV3('Test prompt', {
        thinkingLevel: 'high'
      });

      const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(requestBody.generationConfig?.thinkingConfig?.thinkingLevel).toBe('high');
    });
  });

  describe('Image Generation', () => {
    it('should use gemini-3-pro-image-preview for image generation', async () => {
      const service = getGeminiService();
      const fetchSpy = vi.spyOn(global, 'fetch');

      await service.generateImageV3('A beautiful sunset');

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/gemini/imagen',
        expect.objectContaining({
          body: expect.stringContaining('imageSize')
        })
      );
    });

    it('should support 4K image generation', async () => {
      const service = getGeminiService();
      const fetchSpy = vi.spyOn(global, 'fetch');

      await service.generateImageV3('Test', { imageSize: '4K' });

      const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(requestBody.imageSize).toBe('4K');
    });
  });
});
```

#### 5.2 Checklist de Testes Manuais

```markdown
## Checklist de Testes Manuais

### Geração de Texto
- [ ] Chat funciona corretamente
- [ ] Geração de itinerário retorna JSON válido
- [ ] Análise de documentos extrai dados corretamente
- [ ] Guias de cidade são gerados em português
- [ ] Checklist AI gera tarefas apropriadas

### Geração de Imagens
- [ ] Imagem de capa é gerada ao criar viagem
- [ ] Aspect ratio 16:9 funciona
- [ ] Aspect ratio 1:1 funciona
- [ ] Resolução 2K funciona
- [ ] Resolução 4K funciona (se disponível na conta)
- [ ] Fallback para Unsplash funciona quando API falha

### Performance
- [ ] Tempo de resposta do chat < 3s
- [ ] Tempo de geração de imagem < 10s
- [ ] Sem erros 429 (rate limiting)
- [ ] Sem erros 400 (bad request)

### Regressão
- [ ] Todas as funcionalidades existentes continuam funcionando
- [ ] Sem quebras de UI
- [ ] Logs de erro não mostram problemas
```

---

### FASE 6: Rollout e Monitoramento

#### 6.1 Feature Flags (Opcional)

Para rollout gradual, adicionar feature flags:

```typescript
// /services/gemini/featureFlags.ts
export const GEMINI_FEATURES = {
  useGemini3Text: import.meta.env.VITE_USE_GEMINI_3_TEXT === 'true',
  useGemini3Image: import.meta.env.VITE_USE_GEMINI_3_IMAGE === 'true',
  useThinkingLevel: import.meta.env.VITE_USE_THINKING_LEVEL === 'true',
  use4KImages: import.meta.env.VITE_USE_4K_IMAGES === 'true',
};
```

#### 6.2 Variáveis de Ambiente

Adicionar ao `.env.local`:

```bash
# Feature Flags para Gemini 3 (opcional, para rollout gradual)
VITE_USE_GEMINI_3_TEXT=true
VITE_USE_GEMINI_3_IMAGE=true
VITE_USE_THINKING_LEVEL=true
VITE_USE_4K_IMAGES=false  # Habilitar quando testado
```

#### 6.3 Logging para Monitoramento

Adicionar logging estruturado:

```typescript
// No geminiService.ts
private logApiCall(method: string, model: string, duration: number, success: boolean) {
  console.log(JSON.stringify({
    type: 'gemini_api_call',
    method,
    model,
    duration_ms: duration,
    success,
    timestamp: new Date().toISOString()
  }));
}
```

---

## 5. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| API Gemini 3 em preview muda | Alto | Média | Manter fallback para modelos 2.5 |
| Rate limiting aumentado | Médio | Baixa | Implementar retry com backoff exponencial |
| Custo aumenta | Médio | Alta | Monitorar uso, considerar cache agressivo |
| Quebra de compatibilidade SDK | Alto | Baixa | Fixar versão do SDK, testar antes de atualizar |
| Thought signatures não funcionam | Médio | Baixa | SDK gerencia automaticamente; usar bypass string |

---

## 6. Estimativa de Esforço

| Fase | Descrição | Esforço Estimado |
|------|-----------|------------------|
| 1 | Preparação | 2-3 horas |
| 2 | Atualização Servidor | 1-2 horas |
| 3 | Atualização GeminiService | 3-4 horas |
| 4 | Atualização CreateTrip | 1 hora |
| 5 | Testes e Validação | 2-3 horas |
| 6 | Rollout e Monitoramento | 1-2 horas |
| **Total** | | **10-15 horas** |

---

## 7. Ordem de Execução Recomendada

1. **Fase 1.1-1.3**: Preparação e backup
2. **Fase 2.1**: Atualizar endpoint de texto no servidor
3. **Fase 3.1-3.2**: Atualizar constantes e tipos no GeminiService
4. **Fase 3.3**: Atualizar método callGeminiAPI
5. **Fase 5.2**: Teste manual do chat e geração de texto
6. **Fase 2.2-2.3**: Atualizar endpoints de imagem no servidor
7. **Fase 3.4-3.5**: Atualizar métodos de geração de imagem
8. **Fase 4**: Atualizar CreateTrip.tsx
9. **Fase 5.2**: Teste manual de geração de imagens
10. **Fase 3.6**: Adicionar métodos V3 avançados
11. **Fase 5.1**: Executar testes automatizados
12. **Fase 6**: Deploy e monitoramento

---

## 8. Referências

- [Documentação Gemini 3](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Documentação Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [SDK @google/genai](https://www.npmjs.com/package/@google/genai)
- [Preços Gemini API](https://ai.google.dev/gemini-api/docs/pricing)

---

## Changelog

| Data | Versão | Descrição |
|------|--------|-----------|
| 2026-01-14 | 1.0 | Criação do documento |

---

*Documento criado por Claude Code em 14/01/2026*
