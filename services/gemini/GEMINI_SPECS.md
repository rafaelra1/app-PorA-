# Referência da API Gemini - Modelos e Geração de Imagens

Esta documentação fornece informações essenciais sobre os modelos Gemini e suas capacidades de geração de imagens para uso em aplicações web.

---

## 📋 Índice

1. [Modelos Gemini 3](#modelos-gemini-3)
2. [Geração de Imagens com Gemini](#geração-de-imagens-com-gemini)
3. [Modelos Imagen](#modelos-imagen)
4. [Configurações e Parâmetros](#configurações-e-parâmetros)
5. [Exemplos de Código](#exemplos-de-código)

---

## 🤖 Modelos Gemini 3

### Modelos Disponíveis

| Modelo | ID | Janela de Contexto | Corte de Conhecimento | Preços (entrada/saída)* |
|--------|----|--------------------|----------------------|------------------------|
| **Gemini 3 Pro Preview** | `gemini-3-pro-preview` | 1M / 64k | Jan 2025 | $2/$12 (<200k tokens)<br>$4/$18 (>200k tokens) |
| **Gemini 3 Pro Image Preview** | `gemini-3-pro-image-preview` | 65k / 32k | Jan 2025 | $2 (entrada texto)<br>$0.134 (saída imagem)** |

*Preços por 1 milhão de tokens  
**Preço varia por resolução

### Características Principais do Gemini 3

#### 1. Nível de Pensamento (Thinking Level)
Controla a profundidade do processo de raciocínio do modelo:

- **`low`**: Minimiza latência e custo. Ideal para instruções simples e alta capacidade de processamento
- **`medium`**: Indisponível no momento
- **`high`** (padrão): Maximiza profundidade de raciocínio. Melhor para tarefas complexas

```javascript
// Exemplo JavaScript
const response = await ai.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: "Como funciona a IA?",
  config: {
    thinkingConfig: {
      thinkingLevel: "low"
    }
  }
});
```

#### 2. Resolução de Mídia
Controla o processamento de visão multimodal:

| Tipo de Mídia | Configuração Recomendada | Máx. Tokens | Uso |
|---------------|-------------------------|-------------|-----|
| **Imagens** | `media_resolution_high` | 1120 | Análise de imagens em geral |
| **PDFs** | `media_resolution_medium` | 560 | Compreensão de documentos |
| **Vídeo** (Geral) | `media_resolution_low` | 70 (por frame) | Reconhecimento de ações |
| **Vídeo** (com texto) | `media_resolution_high` | 280 (por frame) | OCR em vídeos |

**Níveis disponíveis:**
- `media_resolution_low`: 280 tokens (imagens) / 70 tokens (vídeo)
- `media_resolution_medium`: 560 tokens (imagens) / 70 tokens (vídeo)
- `media_resolution_high`: 1120 tokens (imagens) / 280 tokens (vídeo)
- `media_resolution_ultra_high`: Disponível apenas por imagem

```javascript
// Exemplo JavaScript com resolução de mídia
const response = await ai.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: [
    {
      parts: [
        { text: "O que há nesta imagem?" },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64ImageData
          },
          mediaResolution: {
            level: "media_resolution_high"
          }
        }
      ]
    }
  ]
});
```

#### 3. Temperatura
**Recomendação:** Manter em `1.0` (padrão) para o Gemini 3.
- Alterar a temperatura pode causar comportamento inesperado em tarefas de raciocínio

---

## 🎨 Geração de Imagens com Gemini

### Modelos de Geração de Imagens

| Modelo | ID | Características |
|--------|----|-----------------| 
| **Gemini 2.5 Flash Image** | `gemini-2.5-flash-image` | Rápido, ideal para uso geral |
| **Gemini 3 Pro Image Preview** | `gemini-3-pro-image-preview` | Avançado, alta qualidade, resolução até 4K |

### Configuração de Imagens (imageConfig)

```javascript
const imageConfig = {
  aspectRatio: "16:9",  // Proporção da imagem
  imageSize: "2K"       // Resolução (apenas Gemini 3 Pro Image)
}
```

#### Proporções Disponíveis (aspectRatio)
- `"1:1"` - Quadrado (padrão)
- `"2:3"` / `"3:2"` - Retrato/Paisagem
- `"3:4"` / `"4:3"` - Tela cheia retrato/paisagem
- `"4:5"` / `"5:4"` - Proporções alternativas
- `"9:16"` / `"16:9"` - Retrato/Widescreen
- `"21:9"` - Ultra-widescreen

#### Tamanhos de Imagem (imageSize)
Disponível apenas para Gemini 3 Pro Image Preview:
- `"1K"` - 1024 pixels (padrão)
- `"2K"` - 2048 pixels
- `"4K"` - 4096 pixels

**⚠️ Importante:** Use "K" maiúsculo (1K, 2K, 4K). Minúsculo será rejeitado.

### Recursos do Gemini 3 Pro Image

#### 1. Até 14 Imagens de Referência
- **6 imagens de objetos** de alta fidelidade
- **5 imagens de humanos** para consistência de personagens

#### 2. Embasamento com Google Search
Gera imagens baseadas em dados em tempo real:

```javascript
const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: "Visualize a previsão do tempo para os próximos 5 dias em São Francisco",
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: "16:9",
      imageSize: "2K"
    },
    tools: [{ googleSearch: {} }]
  }
});
```

#### 3. Renderização de Texto de Alta Fidelidade
- Texto legível e bem posicionado
- Ideal para logos, diagramas, pôsteres
- Limite: 25 caracteres ou menos por melhor resultado

#### 4. Edição Conversacional
Edite imagens em múltiplas rodadas através de chat:

```javascript
const chat = ai.chats.create({
  model: "gemini-3-pro-image-preview",
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: "16:9",
      imageSize: "2K"
    }
  }
});

// Primeira geração
let response = await chat.sendMessage("Crie um infográfico sobre fotossíntese");

// Edição subsequente
response = await chat.sendMessage("Atualize para espanhol");
```

---

## 🖼️ Modelos Imagen

### Versões Disponíveis

#### Imagen 4 (Junho 2025)

| Modelo | ID | Limite de Entrada | Imagens de Saída |
|--------|----|-------------------|------------------|
| **Imagen 4 Standard** | `imagen-4.0-generate-001` | 480 tokens | 1-4 |
| **Imagen 4 Ultra** | `imagen-4.0-ultra-generate-001` | 480 tokens | 1-4 |
| **Imagen 4 Fast** | `imagen-4.0-fast-generate-001` | 480 tokens | 1-4 |

#### Imagen 3 (Fevereiro 2025)

| Modelo | ID | Imagens de Saída |
|--------|----|------------------|
| **Imagen 3** | `imagen-3.0-generate-002` | Até 4 |

### Usar Imagen

```javascript
// Gerar imagem com Imagen
const response = await ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: 'Robô segurando um skate vermelho',
  config: {
    numberOfImages: 4,
    imageSize: "2K",        // "1K" ou "2K"
    aspectRatio: "1:1"
  }
});

// Acessar imagens geradas
for (const generatedImage of response.generatedImages) {
  const imgBytes = generatedImage.image.imageBytes;
  const buffer = Buffer.from(imgBytes, "base64");
  fs.writeFileSync(`imagen-${idx}.png`, buffer);
}
```

---

## ⚙️ Configurações e Parâmetros

### Configurações do Imagen

```javascript
const config = {
  numberOfImages: 4,              // 1-4 imagens
  imageSize: "2K",               // "1K" ou "2K" (Standard/Ultra)
  aspectRatio: "16:9",           // Ver proporções acima
  personGeneration: "allow_adult" // Controle de geração de pessoas
}
```

#### Person Generation (personGeneration)
- `"dont_allow"` - Bloqueia geração de pessoas
- `"allow_adult"` - Gera adultos, não crianças (padrão)
- `"allow_all"` - Gera adultos e crianças (⚠️ não permitido na UE/UK/Suíça/MENA)

### Assinaturas de Pensamento (Thought Signatures)

**Importante:** Para geração e edição de imagens com Gemini 3 Pro Image, sempre retorne as assinaturas de pensamento:

```javascript
// Estrutura de resposta com assinaturas
{
  "role": "model",
  "parts": [
    {
      "text": "Aqui está o infográfico...",
      "thoughtSignature": "<Signature_A>"  // Retornar exatamente como recebido
    },
    {
      "inlineData": { ... },
      "thoughtSignature": "<Signature_B>"  // Todas as imagens têm assinaturas
    }
  ]
}
```

**Regras:**
- Se usar SDKs oficiais do Google, assinaturas são processadas automaticamente
- Para implementação manual: sempre retornar assinaturas exatamente como recebidas
- Para edição conversacional: incluir todas as assinaturas do histórico

---

## 💻 Exemplos de Código

### Exemplo 1: Geração Simples de Texto para Imagem

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: "Crie uma ilustração de um prato de nano banana em um restaurante elegante com tema Gemini"
});

// Salvar imagem
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const imageData = part.inlineData.data;
    const buffer = Buffer.from(imageData, "base64");
    fs.writeFileSync("imagem-gerada.png", buffer);
  }
}
```

### Exemplo 2: Edição de Imagem (Texto + Imagem para Imagem)

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});

// Carregar imagem existente
const imagePath = "minha-imagem.png";
const imageData = fs.readFileSync(imagePath);
const base64Image = imageData.toString("base64");

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: [
    { text: "Adicione um chapéu de festa neste cachorro" },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image
      }
    }
  ]
});
```

### Exemplo 3: Geração com Alta Resolução (Gemini 3 Pro Image)

```javascript
const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: "Esboço anatômico estilo Da Vinci de uma borboleta monarca dissecada",
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: "1:1",
      imageSize: "4K"  // Alta resolução
    }
  }
});
```

### Exemplo 4: Geração com Google Search

```javascript
const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: "Crie um gráfico mostrando os resultados do último jogo do Arsenal na Champions League",
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: "16:9"
    },
    tools: [{ googleSearch: {} }]
  }
});
```

### Exemplo 5: Edição Conversacional Multi-turno

```javascript
const chat = ai.chats.create({
  model: "gemini-3-pro-image-preview",
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: "16:9",
      imageSize: "2K"
    }
  }
});

// Turno 1: Gerar infográfico
let response = await chat.sendMessage(
  "Crie um infográfico vibrante explicando fotossíntese como receita de comida"
);

// Salvar primeira imagem
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const buffer = Buffer.from(part.inlineData.data, "base64");
    fs.writeFileSync("fotossintese-v1.png", buffer);
  }
}

// Turno 2: Editar infográfico
response = await chat.sendMessage(
  "Atualize este infográfico para espanhol. Não mude outros elementos."
);

// Salvar segunda imagem
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const buffer = Buffer.from(part.inlineData.data, "base64");
    fs.writeFileSync("fotossintese-v2-spanish.png", buffer);
  }
}
```

### Exemplo 6: Usar Múltiplas Imagens de Referência

```javascript
// Carregar múltiplas imagens
const person1 = fs.readFileSync("pessoa1.png").toString("base64");
const person2 = fs.readFileSync("pessoa2.png").toString("base64");
const person3 = fs.readFileSync("pessoa3.png").toString("base64");

const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: [
    { text: "Foto de grupo de escritório dessas pessoas fazendo caretas engraçadas" },
    {
      inlineData: {
        mimeType: "image/png",
        data: person1
      }
    },
    {
      inlineData: {
        mimeType: "image/png",
        data: person2
      }
    },
    {
      inlineData: {
        mimeType: "image/png",
        data: person3
      }
    }
  ],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: "5:4",
      imageSize: "2K"
    }
  }
});
```

### Exemplo 7: Geração com Imagen 4

```javascript
const response = await ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: 'Robô segurando um skate vermelho',
  config: {
    numberOfImages: 4,
    imageSize: "2K",
    aspectRatio: "16:9",
    personGeneration: "allow_adult"
  }
});

// Salvar todas as imagens
let idx = 1;
for (const generatedImage of response.generatedImages) {
  const buffer = Buffer.from(generatedImage.image.imageBytes, "base64");
  fs.writeFileSync(`robot-skate-${idx}.png`, buffer);
  idx++;
}
```

---

## 🎯 Dicas para Prompts Efetivos

### Para Imagens Fotorrealistas

Use termos de fotografia:
- **Tipo de tomada**: close-up, wide shot, aerial
- **Iluminação**: golden hour, dramatic lighting, soft lighting
- **Câmera/Lente**: 35mm, 50mm, macro lens, fisheye
- **Estilo**: photorealistic, studio lighting, HDR

Exemplo:
```
"A photorealistic close-up portrait of an elderly ceramicist inspecting 
a tea bowl, illuminated by soft golden hour light, captured with 85mm 
portrait lens, bokeh background"
```

### Para Ilustrações e Arte

Especifique o estilo artístico:
- **Meio**: watercolor, oil painting, digital art, pencil sketch
- **Movimento artístico**: art deco, impressionist, pop art
- **Características**: minimalist, detailed, stylized

Exemplo:
```
"A kawaii-style sticker of a red panda with bold outlines, 
simple cel-shading, vibrant colors, white background"
```

### Para Texto em Imagens

- Mantenha texto em **25 caracteres ou menos**
- Use **2-3 frases distintas** no máximo
- Especifique estilo de fonte descritivamente
- Indique tamanho (pequeno, médio, grande)

Exemplo:
```
"Create a modern minimalist logo for 'Daily Grind' coffee shop 
with clean bold sans-serif font, black and white, circular design"
```

---

## 📚 Recursos Adicionais

### Endpoints da API

**Gemini (generateContent):**
```
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

**Imagen (predict):**
```
https://generativelanguage.googleapis.com/v1beta/models/{model}:predict
```

### Headers Necessários

```javascript
{
  "x-goog-api-key": "SUA_API_KEY",
  "Content-Type": "application/json"
}
```

### Formato de Resposta

#### Gemini (Texto e Imagem)
```json
{
  "candidates": [{
    "content": {
      "parts": [
        { "text": "Descrição..." },
        { 
          "inlineData": {
            "mimeType": "image/png",
            "data": "base64_encoded_image"
          },
          "thoughtSignature": "..." 
        }
      ]
    }
  }]
}
```

#### Imagen
```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "base64_encoded_image",
      "mimeType": "image/png"
    }
  ]
}
```

---

## ⚠️ Observações Importantes

1. **Marca d'água SynthID**: Todas as imagens geradas incluem marca d'água invisível
2. **Limites de Taxa**: Consulte a [documentação oficial](https://ai.google.dev/gemini-api/docs/rate-limits) para limites atuais
3. **Preços**: Verificar [página de preços](https://ai.google.dev/gemini-api/docs/pricing) para valores atualizados
4. **Idioma**: Imagen aceita apenas comandos em inglês
5. **Ferramentas**: Gemini 3 suporta Google Search, Code Execution, URL Context e File Search

---

## 📝 Notas de Versão

- **Gemini 3 Pro**: Lançado em Jan 2025
- **Gemini 3 Pro Image**: Lançado em Jan 2025
- **Imagen 4**: Lançado em Jun 2025
- **Imagen 3**: Lançado em Fev 2025

---

**Documentação oficial completa:**
- [Gemini 3 Docs](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- [Imagen Docs](https://ai.google.dev/gemini-api/docs/imagen)
