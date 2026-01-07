/// <reference types="vite/client" />

import { ItineraryDay, CityGuide, Attraction, ImageGenerationOptions, GroundingInfo } from '../types';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>;
  }>;
  tools?: unknown[];
  generationConfig?: {
    response_mime_type?: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    groundingMetadata?: unknown;
  }>;
  error?: {
    message: string;
    code: number;
  };
}

interface ImageData {
  mimeType: string;
  data: string;
}

export interface DocumentAnalysisResult {
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'insurance' | 'other';
  name?: string;
  date?: string;
  endDate?: string;
  reference?: string;
  departureTime?: string;
  arrivalTime?: string;
  details?: string;
  address?: string;
  stars?: number;
  rating?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  model?: string;
}

// =============================================================================
// Constants
// =============================================================================

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const MIME_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
  PDF: 'application/pdf',
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Detect MIME type from base64 data URL prefix
 */
function detectMimeType(base64Image: string): string {
  if (base64Image.includes('data:image/png')) return MIME_TYPES.PNG;
  if (base64Image.includes('data:image/webp')) return MIME_TYPES.WEBP;
  if (base64Image.includes('data:application/pdf')) return MIME_TYPES.PDF;
  if (base64Image.includes('data:image/jpeg') || base64Image.includes('data:image/jpg')) {
    return MIME_TYPES.JPEG;
  }
  return MIME_TYPES.JPEG; // Default
}

/**
 * Extract base64 data from data URL
 */
function extractBase64Data(base64Image: string): string {
  return base64Image.includes('base64,')
    ? base64Image.split('base64,')[1]
    : base64Image;
}

/**
 * Parse JSON safely, cleaning markdown code blocks if present
 */
function parseJsonSafely<T>(text: string, fallback: T): T {
  try {
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleanText) as T;
  } catch {
    console.error('Failed to parse JSON response');
    return fallback;
  }
}

/**
 * Generate random signature for image URLs to prevent caching
 */
function generateRandomSig(): number {
  return Math.floor(Math.random() * 1000);
}

// =============================================================================
// Prompts (Portuguese)
// =============================================================================

const PROMPTS = {
  itinerary: (destination: string, startDate: string, endDate: string) =>
    `Crie um roteiro dia a dia para ${destination}. A viagem dura de ${startDate} a ${endDate}. Retorne um array JSON de objetos contendo "day", "title" e um array "activities" com "time", "activity", "description" e "type" (culture, food, rest, transport).`,

  enhancedItinerary: (
    destination: string,
    startDate: string,
    endDate: string,
    budget: string,
    rhythm: string,
    company: string,
    interests: string[]
  ) => `Você é um consultor de viagens especializado. Crie um roteiro personalizado para ${destination}.
Período: ${startDate} a ${endDate}.

PERFIL DO VIAJANTE:
- Orçamento: ${budget === 'economic' ? 'Econômico (prefere opções gratuitas ou baratas)' : budget === 'balanced' ? 'Equilibrado (custo-benefício)' : 'Luxo (experiências premium)'}
- Ritmo: ${rhythm === 'relaxed' ? 'Relaxado (poucas atividades, aproveitar cada momento)' : rhythm === 'moderate' ? 'Moderado (equilíbrio entre explorar e descansar)' : 'Intenso (ver o máximo possível)'}
- Companhia: ${company === 'solo' ? 'Viajando sozinho(a)' : company === 'couple' ? 'Casal romântico' : company === 'family' ? 'Família com crianças' : 'Grupo de amigos'}
- Interesses principais: ${interests.join(', ')}

Retorne um JSON com esta estrutura EXATA:
{
  "destination": "${destination}",
  "weatherSummary": "Breve descrição do clima esperado",
  "totalEstimatedCost": "R$ X.XXX - R$ X.XXX",
  "days": [
    {
      "day": 1,
      "title": "Título criativo do dia",
      "date": "${startDate}",
      "summary": "Resumo do dia em uma frase",
      "totalCost": "R$ XXX",
      "activities": [
        {
          "id": "unique-id-1",
          "time": "09:00",
          "title": "Nome da atividade",
          "description": "Descrição envolvente da atividade",
          "type": "culture|food|nature|shopping|nightlife|rest|transport|other",
          "location": "Nome do local ou endereço",
          "coordinates": { "lat": -23.5505, "lng": -46.6333 },
          "reasoning": "Por que esta atividade combina com o perfil do viajante",
          "estimatedCost": "R$ XX ou Grátis",
          "duration": "2 horas"
        }
      ]
    }
  ]
}

IMPORTANTE:
- Use coordenadas REAIS de ${destination} para cada atividade
- CRÍTICO: Verifique se o endereço de cada atividade realmente pertence à cidade ${destination}. Não invente endereços.
- Agrupe atividades por proximidade geográfica para otimizar deslocamentos
- Justifique cada escolha baseado no perfil do viajante
- Seja criativo nos títulos dos dias
- Inclua pelo menos uma "jóia escondida" que turistas normalmente não conhecem`,

  refineItinerary: (currentPlan: string, userInstruction: string) =>
    `Você recebeu uma instrução do usuário para modificar o roteiro de viagem.

ROTEIRO ATUAL:
${currentPlan}

INSTRUÇÃO DO USUÁRIO:
"${userInstruction}"

Modifique o roteiro conforme solicitado e retorne o JSON completo atualizado com a mesma estrutura.
Mantenha as coordenadas reais e atualize os raciocínios quando necessário.
Se a instrução for "surpreenda-me" ou similar, troque uma atividade turística comum por uma jóia escondida local.`,

  cityGuide: (cityName: string, country: string) =>
    `Guia editorial para ${cityName}, ${country}. JSON: {
      overview,
      attractions: [{name, category, description, longDescription}],
      typicalDishes: [{name, description}],
      gastronomy: [{name, category, description}],
      tips: [],
      essentials: [{icon: "plug|water|money", title, description}],
      emergency: {police, ambulance, embassy: {label: "Embaixada Brasileira", phone, address}}
    }`,

  grounding: (city: string) =>
    `O que está acontecendo hoje em ${city}? Eventos e notícias.`,

  editorial: (city: string, country: string) =>
    `Escreva um texto editorial poético, profundo e envolvente sobre ${city}, ${country}. Não use clichês de turismo. Foque na alma do lugar, suas contradições, história e sensação. Estilo: New Yorker / Monocle. Em Português. Limite: 3 parágrafos.`,

  suggestAttractions: (city: string, country: string, category: string, currentAttractions: string[]) =>
    `Sugira 4 atrações turísticas para ${city}, ${country} da categoria "${category}".
        Evite estas atrações já listadas: ${currentAttractions.join(', ')}.
        Retorne APENAS um JSON array. Schema: [{name: string, description: string, category: string, location: string}].
        A descrição deve ser curta e envolvente (max 20 palavras).`,

  documentAnalysis: () =>
    `Analise esta imagem de um ou mais documentos de viagem (ex: múltiplos voos, conexões, reservas).
        Identifique o tipo de cada item (flight, hotel, car, activity, insurance, other).
        
        Retorne SEMPRE um ARRAY JSON, onde cada objeto representa um item/segmento identificado:
        [
          {
            "type": "flight|hotel|car|activity|insurance|other",
            "name": "Nome da companhia, hotel ou serviço",
            "date": "Data principal ou Check-in (Formato YYYY-MM-DD)",
            "endDate": "Data final ou Check-out (Formato YYYY-MM-DD) (se houver)",
            "reference": "Código de reserva/ticket",
            "departureTime": "Horário de partida (HH:MM)",
            "arrivalTime": "Horário de chegada (HH:MM)",
            "details": "Descrição curta adicional (Ex: Quarto Duplo)",
            "address": "Endereço completo do hotel (se disponível)",
            "stars": "Classificação do hotel em estrelas (1 a 5, número inteiro, ex: 4 ou 5)",
            "rating": "Nota de avaliação dos usuários (0 a 10 ou 0 a 5, ex: 8.5 ou 4.5)",
            "pickupLocation": "Para VOOS: Código IATA ou Cidade de Origem (Ex: GRU, São Paulo). Para Carros: Local de retirada.",
            "dropoffLocation": "Para VOOS: Código IATA ou Cidade de Destino (Ex: JFK, Nova York).",
            "model": "(Apenas se carro) Modelo do veículo"
          }
        ]
        
        Se não encontrar algum dado em um item, deixe em branco. Para datas, converta para o formato YYYY-MM-DD.`,

  hotelMetadata: (hotelName: string, city: string = '') =>
    `Busque informações sobre o hotel "${hotelName}" ${city ? `em ${city}` : ''}.
        Retorne um JSON com:
        {
            "stars": number (Classificação em estrelas de 1 a 5, ex: 4),
            "rating": number (Nota média de avaliação de 0 a 5, ex: 4.5),
            "address": "Endereço completo (Rua, Número, Bairro, Cidade)",
            "description": "Breve descrição de uma frase"
        }
        Se não encontrar exato, estime com base em hotéis similares da marca ou retorne null.`,

  itineraryV2: (
    destinations: string[],
    timing: { type: string; startDate?: string; endDate?: string; month?: number; year?: number; duration?: number; seasonPreference?: string },
    party: { type: string; size: number; travelers: Array<{ ageGroup: string; age?: number; dietaryRestrictions?: string[]; mobilityRestrictions?: string[] }> },
    budget: { total: number; accommodation?: number; food?: number; transport?: number; activities?: number },
    interests: string[]
  ) => {
    const destStr = destinations.join(' + ');
    const timingStr = timing.type === 'exact'
      ? `De ${timing.startDate} até ${timing.endDate}`
      : timing.type === 'month'
        ? `Em ${timing.month}/${timing.year}, duração de ${timing.duration} dias`
        : `Flexível, ${timing.duration} dias, preferência: ${timing.seasonPreference || 'qualquer'}`;

    const partyStr = party.travelers.map((t, i) =>
      `Viajante ${i + 1}: ${t.ageGroup}${t.age ? ` (${t.age} anos)` : ''}${t.dietaryRestrictions?.length ? `, restrições alimentares: ${t.dietaryRestrictions.join(', ')}` : ''}${t.mobilityRestrictions?.length ? `, mobilidade: ${t.mobilityRestrictions.join(', ')}` : ''}`
    ).join('\n');

    return `Você é um consultor de viagens de elite. Crie um roteiro COMPLETO e DETALHADO para:

🌍 DESTINO(S): ${destStr}

📅 QUANDO:
${timingStr}

👥 QUEM VIAJA (${party.size} pessoa(s), tipo: ${party.type}):
${partyStr}

💰 ORÇAMENTO TOTAL: R$ ${budget.total.toLocaleString('pt-BR')}
${budget.accommodation ? `- Hospedagem: R$ ${budget.accommodation.toLocaleString('pt-BR')}` : ''}
${budget.food ? `- Alimentação: R$ ${budget.food.toLocaleString('pt-BR')}` : ''}
${budget.transport ? `- Transporte: R$ ${budget.transport.toLocaleString('pt-BR')}` : ''}
${budget.activities ? `- Atividades: R$ ${budget.activities.toLocaleString('pt-BR')}` : ''}

🎯 INTERESSES: ${interests.join(', ')}

=== RETORNE EXATAMENTE ESTE JSON (sem markdown, apenas JSON puro) ===
{
  "id": "plan-${Date.now()}",
  "createdAt": "${new Date().toISOString()}",
  "destinations": ${JSON.stringify(destinations)},
  "destinationMetadata": [
    {
      "name": "Nome da cidade",
      "country": "País",
      "timezone": "ex: GMT-3",
      "currency": { "code": "BRL", "symbol": "R$", "rateToBRL": 1 },
      "language": "Idioma principal",
      "voltage": "ex: 220V",
      "plugType": "ex: Tipo C",
      "visaRequired": false,
      "visaNotes": "Nota sobre visto para brasileiros",
      "emergencyNumbers": { "police": "190", "ambulance": "192", "fire": "193" }
    }
  ],
  "days": [
    {
      "day": 1,
      "title": "Título criativo do dia",
      "date": "YYYY-MM-DD",
      "city": "Nome da cidade",
      "summary": "Resumo de uma frase",
      "activities": [
        {
          "id": "uuid",
          "time": "09:00",
          "title": "Nome da atividade",
          "description": "Descrição detalhada",
          "title": "Nome da atividade",
          "description": "Descrição detalhada",
          "type": "culture|food|nature|shopping|nightlife|rest|transport|other",
          "location": "Endereço completo (Rua, Número, Cidade)",
          "coordinates": { "lat": 0, "lng": 0 },
          "estimatedCost": "R$ XX",
          "duration": "2 horas",
          "reasoning": "Por que essa atividade combina com o viajante",
          "priority": "essential|desirable|optional",
          "travelTimeFromPrevious": "15 min de táxi",
          "approximateCost": 50,
          "bookingRequired": false
        }
      ],
      "totalCost": 200,
      "weatherForecast": "Ensolarado, 25°C"
    }
  ],
  "weatherSummary": "Clima geral durante a viagem",
  "purchaseAdvice": "Dica sobre melhor momento para comprar passagens/hospedagem",
  "seasonalityStatus": "high|low|shoulder",
  "eventAlerts": ["Eventos importantes durante as datas"],
  "estimatedBudget": {
    "total": ${budget.total},
    "accommodation": ${budget.accommodation || Math.round(budget.total * 0.35)},
    "food": ${budget.food || Math.round(budget.total * 0.25)},
    "transport": ${budget.transport || Math.round(budget.total * 0.2)},
    "activities": ${budget.activities || Math.round(budget.total * 0.15)},
    "emergency": ${Math.round(budget.total * 0.05)}
  },
  "totalEstimatedCost": ${budget.total},
  "costPerDay": ${Math.round(budget.total / (timing.duration || 7))},
  "preparationTasks": [
    {
      "id": "task-1",
      "title": "Verificar validade do passaporte",
      "description": "Deve ter 6 meses de validade além da viagem",
      "category": "documentation",
      "status": "pending",
      "isAutoGenerated": true,
      "priority": "high"
    }
  ],
  "connectivityAdvice": {
    "recommendedType": "esim|local_sim|roaming",
    "estimatedCost": "R$ XX",
    "providers": ["Nome do provedor"],
    "notes": "Dica sobre internet"
  },
  "suggestedApps": [
    {
      "name": "Nome do app",
      "category": "transport|maps|translation|payment",
      "reason": "Por que é útil",
      "isOfflineCapable": true
    }
  ]
}

REGRAS IMPORTANTES:
1. Use coordenadas REAIS para cada atividade.
2. CRÍTICO: Verifique se o endereço de cada atividade realmente pertence à cidade do dia correspondente.
3. Agrupe atividades por proximidade geográfica.
3. Considere as restrições de idade e mobilidade dos viajantes
4. Gere pelo menos 3-5 atividades por dia
5. Inclua custos realistas em Reais (R$)
6. Gere 2-4 tarefas de preparação relevantes
7. Sugira 2-3 apps úteis para o destino
8. Retorne APENAS JSON válido, sem texto adicional`;
  },
  suggestLocation: (query: string, context: string) =>
    `Identify the precise physical location or address for "${query}"${context ? ` in the context of ${context}` : ''}.
     Return ONLY the address or specific location name (e.g., "Champ de Mars, 5 Av. Anatole France, 75007 Paris").
     Do not include any other text or labels. If the location is ambiguous or unknown, return the query ("${query}") exactly.`,

  classifyActivity: (query: string) =>
    `Classify the following activity or place into exactly ONE of these categories: 
    transport, accommodation, meal, culture, nature, shopping, nightlife, other.
    
    Query: "${query}"
    
    Return ONLY the category name in lowercase. Do not add any punctuation or explanation.
    Examples:
    - "Dinner at Eiffel Tower" -> meal
    - "Louvre Museum" -> culture
    - "Central Park" -> nature
    - "Uber to Hotel" -> transport
    - "Shopping at Ginza" -> shopping
    - "Clubbing in Roppongi" -> nightlife`,

  placeDetails: (query: string) =>
    `Provide a brief description and a summary of visitor reviews for "${query}".
    IMPORTANT: The response MUST be in Portuguese (pt-BR).
    Return a JSON object with:
    {
      "description": "A concise and engaging description of the place in Portuguese (max 3 sentences).",
      "reviewSummary": "A summary of what people typically say about this place in Portuguese, highlighting pros and cons (max 3 sentences)."
    }`,

  whatToKnow: (city: string) =>
    `Você é um especialista local em ${city}. Crie um guia essencial "O que saber antes de ir" para um viajante.
    Foque em informações práticas e úteis para organização da mala e chegada.
    Tópicos sugeridos (mas adapte conforme a cidade):
    - Clima típico nesta época e o que levar na mala (roupas, adaptadores, etc).
    - Moeda e pagamentos (aceitam cartão? precisa de dinheiro vivo?).
    - Dicas de transporte do aeroporto/chegada.
    - Etiqueta local ou costumes importantes.
    - Segurança.

    O tom deve ser útil, direto e acolhedor. Em Português.
    Use formatação HTML simples (<b> para negrito, <br> para quebra de linha, listas <ul><li>).
    Retorne APENAS o texto formatado em HTML, sem markdown (ex: não use \`\`\`html).`,

  gastronomyCuration: (city: string) => `
Atue como um crítico gastronômico experiente e curador para um guia de viagens focado em alta qualidade culinária.

Sua tarefa é pesquisar e listar os 20 melhores restaurantes da cidade de ${city}.

Critérios Rigorosos de Seleção:
1. Foco Total na Comida: Priorize sabor, técnica, frescor dos ingredientes e autenticidade.
2. Anti-Hype: EXCLUA lugares que são famosos apenas por serem "instagramáveis" ou pela decoração, se a comida não for excepcional. Evite armadilhas para turistas.
3. Diversidade Gastronômica:
   - Instituições locais e "Gemas Escondidas" (onde os locais comem).
   - Alta Gastronomia (premiados ou reconhecidos pela excelência técnica).
   - Comida de Rua/Casual (desde que higiênica e reconhecida pelo sabor superior).
4. Fonte de dados: Cruze dados de avaliações com guias respeitados.

Retorne APENAS um JSON com o seguinte formato EXATO:
{
  "overview": {
    "description": "Um parágrafo resumindo a cena gastronômica da cidade (max 4 linhas).",
    "goldenTip": "Uma dica de ouro valiosa sobre a cultura alimentar local."
  },
  "restaurants": [
    {
      "name": "Nome do Restaurante",
      "location": "Bairro ou Endereço resumido",
      "hours": "Horário de funcionamento aproximado (ex: Ter-Dom 19h-23h)",
      "price": "$, $$, $$$ ou $$$$",
      "category": "Tipo de comida (ex: Tailandesa, Bistrô, Street Food)",
      "specialty": "O prato que define o lugar e que é obrigatório pedir",
      "highlight": "Dica de Viajante (max 2 frases)",
      "description": "Breve descrição do lugar e porque ele é especial (max 2 frases)"
    }
  ]
  "restaurants": [
    {
      "name": "Nome do Restaurante",
      "location": "Bairro ou Endereço resumido",
      "hours": "Horário de funcionamento aproximado (ex: Ter-Dom 19h-23h)",
      "price": "$, $$, $$$ ou $$$$",
      "category": "Tipo de comida (ex: Tailandesa, Bistrô, Street Food)",
      "specialty": "O prato que define o lugar e que é obrigatório pedir",
      "highlight": "Dica de Viajante (max 2 frases)",
      "description": "Breve descrição do lugar e porque ele é especial (max 2 frases)",
      "reviewSummary": "Resumo conciso das avaliações recentes do local, destacando pontos positivos e negativos citados pelos visitantes."
    }
  ]
}
`,

  importRestaurantList: (city: string, listText: string) => `
Você é um assistente de dados gastronômicos. O usuário forneceu uma lista bruta de restaurantes para a cidade de ${city}.
Sua tarefa é identificar cada restaurante na lista, limpá-lo e buscar seus detalhes completos.

LISTA DO USUÁRIO:
${listText}

Para CADA restaurante identificado, busque/infira as informações para preencher o seguinte schema JSON.
Ignore itens que claramente não são restaurantes (ex: títulos, notas pessoais irrelevantes).

Retorne APENAS um JSON com o seguinte formato, contendo um array "restaurants":
{
  "restaurants": [
    {
      "name": "Nome Oficial do Restaurante",
      "location": "Bairro ou Endereço resumido em ${city}",
      "hours": "Horário típico (ex: Ter-Dom 19h-23h) ou 'Consultar'",
      "price": "Estimate: $, $$, $$$ ou $$$$",
      "category": "Culinária principal",
      "specialty": "Prato famoso ou 'Variado'",
      "highlight": "Uma frase curta sobre o que o torna especial",
      "description": "Breve descrição (max 2 frases)"
    }
  ]
}
`,

  gastronomyGuide: (city: string) => `
Você é um especialista em gastronomia local de ${city}. Crie um guia prático "Guia Gastronômico Local" para ajudar viajantes a aproveitarem melhor as experiências culinárias.

Fornece informações práticas e úteis sobre:
- Horários típicos de refeições (almoço e jantar)
- Faixa de preço média por pessoa
- Necessidade de reserva antecipada em restaurantes
- Pratos típicos imperdíveis da região
- Gorjeta esperada (porcentagem ou costume local)
- Formas de pagamento mais aceitas
- Apps de delivery populares na cidade
- Dicas sobre restrições alimentares e como comunicá-las

O tom deve ser útil, direto e acolhedor. Em Português.
Use formatação HTML simples (<b> para negrito, <br> para quebra de linha, listas <ul><li>).
Retorne APENAS o texto formatado em HTML, sem markdown (ex: não use \`\`\`html).
`,

  visitorGuide: (city: string) => `
Você é um guia turístico experiente de ${city}. Crie um "Guia do Visitante" com dicas práticas para quem vai visitar pontos turísticos.

Fornece informações úteis sobre:
- Compra antecipada de ingressos (quando é recomendada)
- Melhor horário para visitar atrações (evitar multidões)
- Código de vestimenta (se aplicável em templos, igrejas, etc)
- Regras de fotografia em locais turísticos
- Acessibilidade para pessoas com mobilidade reduzida
- Transporte público e como chegar às principais atrações
- Tempo médio de visita sugerido
- Dias de fechamento ou eventos especiais
- O que levar (água, protetor solar, etc)

O tom deve ser útil, prático e amigável. Em Português.
Use formatação HTML simples (<b> para negrito, <br> para quebra de linha, listas <ul><li>).
Retorne APENAS o texto formatado em HTML, sem markdown (ex: não use \`\`\`html).
`,

  enrichAttractions: (names: string[], city: string) => `
Você é um especialista em turismo local em ${city}. O usuário forneceu uma lista de nomes de atrações.
Sua tarefa é identificar cada uma e fornecer detalhes reais para cada item.

LISTA DE ATRAÇÕES:
${names.join('\n')}

Para CADA atração da lista, retorne um objeto JSON com:
- name: Nome oficial da atração
- description: Descrição curta (max 20 palavras)
- longDescription: Descrição detalhada (max 50 palavras)
- category: Categoria (ex: Museus, Parques, Monumentos, etc)
- rating: Nota média de avaliação (ex: 4.8)
- time: Horário típico de funcionamento (ex: 09:00 - 18:00)
- price: Preço médio ou "Grátis"
- address: Endereço completo ou localização (ex: Kreuzberg, Mehringdamm)
- openingHours: Horário detalhado de funcionamento (ex: Diariamente 10h-02h)
- reviewSummary: Um resumo conciso do que os visitantes costumam dizer sobre o local, destacando pontos positivos e negativos (max 2 frases)

Retorne APENAS um JSON array. Schema: [{name: string, description: string, longDescription: string, category: string, rating: string, time: string, price: string, address: string, openingHours: string, reviewSummary: string}].
`,

  tripAlerts: (cities: Array<{ name: string; country: string }>) => {
    const destinations = cities.map(c => `${c.name}, ${c.country}`).join('; ');
    return `Você é um consultor de viagens especializado. Analise os seguintes destinos de uma viagem: ${destinations}.

Gere alertas CONSOLIDADOS e RELEVANTES para o viajante brasileiro em formato JSON.
Agrupe alertas semelhantes (ex: se múltiplos países exigem visto, faça UM alerta listando todos).

Categorias de alertas a considerar:
1. VISTO: Países que exigem visto para brasileiros (type: "danger")
2. SAÚDE: Vacinas obrigatórias ou recomendadas (type: "warning")
3. CLIMA: Condições climáticas importantes (type: "info")
4. SEGURANÇA: Alertas de segurança relevantes (type: "warning" or "danger")
5. DICAS: Informações práticas úteis (type: "info")

Retorne APENAS um JSON array com max 4-5 alertas mais importantes:
[
  {
    "id": "unique-id",
    "type": "danger|warning|info",
    "title": "Título curto e direto",
    "message": "Mensagem explicativa concisa (max 100 caracteres)",
    "icon": "material-symbols icon name (ex: vaccines, badge, security, ac_unit, rainy, event, flight_takeoff)",
    "cities": ["Lista de cidades afetadas por este alerta"]
  }
]

IMPORTANTE:
- Priorize alertas críticos (visto, vacinas obrigatórias)
- Seja específico e baseado em fatos reais
- Use ícones do Material Symbols
- Retorne APENAS o JSON, sem markdown`;
  },

  alertDetails: (title: string, message: string, cities: string) => {
    return `Você é um consultor de viagens sênior especializado em atender turistas brasileiros.
Seu objetivo é fornecer uma explicação DETALHADA, ATUALIZADA e PRÁTICA sobre um alerta de viagem específico.

ALERTA: "${title}" - "${message}"
DESTINOS ENVOLVIDOS: ${cities}

Por favor, gere um texto explicativo rico em detalhes (aprox. 2-3 parágrafos e bullets/listas onde necessário).
O texto deve seguir ESPECIFICAMENTE este nível de qualidade e estrutura:

1. **Contexto e Regras**: Explique a regra atual para brasileiros (ex: se precisa de visto, validade de passaporte, regras de vacina). Cite anos se relevante (ex: "facilitado desde 2023").
2. **Custos e Prazos**: Se for visto/documento, informe custos estimados (em Dólares/Euros e Reais), validade (ex: 90 dias) e tempo de processamento.
3. **Como Proceder**: Dê o caminho das pedras. Cite sites oficiais (ex: evisa.gov.vn), onde solicitar, ou quais documentos levar.
4. **Alternativas/Dicas**: Compare opções (ex: E-visa vs Embaixada) ou dê dicas extras de segurança/preparação.

IMPORTANTE:
- Use markdown para estruturar (**negrito**, listas).
- Seja preciso. Evite generalismos.
- Fale especificamente para o público BRASILEIRO.
- Se for sobre Visto para o Vietnã, mencione o E-Visa de 90 dias e custos.
- NÃO use introduções genéricas como "Aqui está a informação". Comece direto no assunto.
- O tom deve ser profissional, jornalístico e útil.
- **FOCO TOTAL NO TEMA DO ALERTA**: Se o alerta for sobre VACINA, fale APENAS de saúde/vacinação. NÃO mencione visto, moeda ou clima a menos que seja o tema do alerta.
- Se o alerta for sobre VISTO, fale APENAS sobre documentação de entrada.`;
  },

  chat: (history: Array<{ role: string; content: string }>, message: string, tripContext?: any) => {
    // Convert history to a string format for context
    const conversationContext = history
      .map((msg) => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
      .join('\n');

    let contextPrompt = '';
    if (tripContext) {
      contextPrompt = `
    CONTEXTO DA VIAGEM ATUAL (Use estas informações para responder perguntas sobre o roteiro):
    Destino: ${tripContext.destination}
    Datas: ${tripContext.startDate} a ${tripContext.endDate}
    Resumo do Roteiro:
    ${JSON.stringify(tripContext.days, null, 2)}
    `;
    }

    return `Você é o assistente virtual do "PorAí", um aplicativo de planejamento de viagens.
    
    ${contextPrompt}

    CONTEXTO DA CONVERSA:
    ${conversationContext}
    
    MENSAGEM DO USUÁRIO AGORA:
    "${message}"
    
    INSTRUÇÕES:
    1. Responda de forma útil, amigável e concisa em Português.
    2. Você pode ajudar com roteiros, dicas de cidades, informações sobre atrações e preparativos de viagem.
    3. Se o usuário perguntar sobre o roteiro (ex: "O que vou fazer amanhã?", "Qual meu voo?"), USE O CONTEXTO DA VIAGEM fornecido acima.
    4. Se a informação não estiver no contexto, diga que não encontrou essa informação específica no roteiro, mas dê uma resposta geral útil se possível.
    5. Mantenha respostas com no máximo 3 parágrafos curtos, a menos que o usuário peça algo muito detalhado.
    6. Use formatação markdown simples se necessário (*itálico*, **negrito**).
    
    Retorne APENAS a sua resposta.`;
  },
};

// =============================================================================
// GeminiService Class
// =============================================================================

export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = API_BASE_URL;
  }

  // -------------------------------------------------------------------------
  // Private API Methods
  // -------------------------------------------------------------------------

  /**
   * Make a request to the Gemini API
   */
  private async callGeminiAPI(
    prompt: string,
    image?: ImageData,
    tools?: unknown[],
    responseMimeType?: string
  ): Promise<string> {
    const url = `${this.baseUrl}?key=${this.apiKey}`;
    const body = this.buildRequestBody(prompt, image, tools, responseMimeType);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      return this.extractTextFromResponse(data);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Build the request body for Gemini API
   */
  private buildRequestBody(
    prompt: string,
    image?: ImageData,
    tools?: unknown[],
    responseMimeType?: string
  ): GeminiRequestBody {
    const parts: GeminiRequestBody['contents'][0]['parts'] = [{ text: prompt }];

    if (image) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data,
        },
      });
    }

    const body: GeminiRequestBody = {
      contents: [{ parts }],
    };

    if (tools) {
      body.tools = tools;
    }

    if (responseMimeType) {
      body.generationConfig = { response_mime_type: responseMimeType };
    }

    return body;
  }

  /**
   * Extract text content from Gemini API response
   */
  private extractTextFromResponse(data: GeminiResponse): string {
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No content generated');
    }

    const content = data.candidates[0]?.content;
    if (!content?.parts || content.parts.length === 0) {
      throw new Error('Empty content parts');
    }

    return content.parts[0]?.text || '';
  }

  // -------------------------------------------------------------------------
  // Public API Methods
  // -------------------------------------------------------------------------

  /**
   * Generate an AI-powered itinerary for a trip
   */
  async generateItinerary(
    destination: string,
    startDate: string,
    endDate: string
  ): Promise<ItineraryDay[]> {
    try {
      const prompt = PROMPTS.itinerary(destination, startDate, endDate);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely<ItineraryDay[]>(text, []);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw new Error('Failed to generate itinerary');
    }
  }

  /**
   * Generate an enhanced AI-powered itinerary with travel preferences
   */
  async generateEnhancedItinerary(
    destination: string,
    startDate: string,
    endDate: string,
    budget: string,
    rhythm: string,
    company: string,
    interests: string[]
  ): Promise<any> {
    try {
      const prompt = PROMPTS.enhancedItinerary(
        destination,
        startDate,
        endDate,
        budget,
        rhythm,
        company,
        interests
      );
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error generating enhanced itinerary:', error);
      throw new Error('Failed to generate enhanced itinerary');
    }
  }

  /**
   * Generate a V2 AI-powered itinerary with all advanced preferences
   */
  async generateItineraryV2(
    destinations: string[],
    timing: { type: string; startDate?: string; endDate?: string; month?: number; year?: number; duration?: number; seasonPreference?: string },
    party: { type: string; size: number; travelers: Array<{ ageGroup: string; age?: number; dietaryRestrictions?: string[]; mobilityRestrictions?: string[] }> },
    budget: { total: number; accommodation?: number; food?: number; transport?: number; activities?: number },
    interests: string[]
  ): Promise<any> {
    try {
      const prompt = PROMPTS.itineraryV2(destinations, timing, party, budget, interests);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error generating V2 itinerary:', error);
      throw new Error('Failed to generate V2 itinerary');
    }
  }

  /**
   * Chat with the AI assistant, optionally providing trip context
   */
  async chat(message: string, history: Array<{ role: string; content: string }>, tripContext?: any): Promise<string> {
    try {
      // Clean up trip context to avoid token limits if necessary
      // For now passing it directly, but in production we might want to strip images or huge descriptions
      const prompt = PROMPTS.chat(history, message, tripContext);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'text/plain');
      return text;
    } catch (error) {
      console.error('Error in chat:', error);
      throw new Error('Failed to chat');
    }
  }

  /**
   * Refine an existing itinerary based on user instructions
   */
  async refineItinerary(currentPlan: any, userInstruction: string): Promise<any> {
    try {
      const planJson = JSON.stringify(currentPlan, null, 2);
      const prompt = PROMPTS.refineItinerary(planJson, userInstruction);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error refining itinerary:', error);
      throw new Error('Failed to refine itinerary');
    }
  }

  /**
   * Generate a comprehensive city guide with attractions, gastronomy, and tips
   */
  async generateCityGuide(cityName: string, country: string): Promise<CityGuide> {
    try {
      const prompt = PROMPTS.cityGuide(cityName, country);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      const data = parseJsonSafely<Partial<CityGuide>>(text, {});

      // Add placeholder images
      return {
        overview: data.overview || '',
        attractions: (data.attractions || []).map((a, i) => ({
          ...a,
          image: '',
        })),
        typicalDishes: (data.typicalDishes || []).map((d, i) => ({
          ...d,
          image: `https://loremflickr.com/800/600/food?sig=${i + 10}`,
        })),
        gastronomy: data.gastronomy || [],
        tips: data.tips || [],
        essentials: data.essentials || [],
        emergency: data.emergency,
      };
    } catch (error) {
      console.error('Error generating city guide:', error);
      throw new Error('Failed to generate city guide');
    }
  }

  /**
   * Generate an AI image (uses placeholder service)
   */
  async generateImage(
    prompt: string,
    _options: ImageGenerationOptions = {}
  ): Promise<string | null> {
    console.log(`Generating image for prompt: ${prompt}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Extract city name from prompt "City of {name}, {country}" or use raw prompt
    let query = prompt;
    if (prompt.startsWith('City of')) {
      query = prompt.replace('City of ', '').split(',')[0];
    }

    // Return a high-quality placeholder image
    const keywords = encodeURIComponent(`${query},landmark,city,travel`);
    return `https://source.unsplash.com/800x600/?${keywords}&sig=${generateRandomSig()}`;
  }

  /**
   * Edit an existing image using AI (Not implemented)
   */
  async editImageWithAI(
    _currentImageBase64: string,
    _editPrompt: string
  ): Promise<string | null> {
    // TODO: Implement image editing with Gemini
    return null;
  }

  /**
   * Enrich a list of attraction names with detailed real-world info
   */
  async enrichAttractions(names: string[], city: string): Promise<Attraction[]> {
    try {
      const prompt = PROMPTS.enrichAttractions(names, city);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      const enrichedData = parseJsonSafely<any[]>(text, []);

      return enrichedData.map((a, i) => ({
        id: `enriched-${Date.now()}-${i}`,
        name: a.name || names[i],
        description: a.description || '',
        longDescription: a.longDescription || '',
        reviewSummary: a.reviewSummary || '',
        category: a.category || 'Atração',
        rating: a.rating || '4.5',
        time: a.time || 'Consultar',
        price: a.price || 'Consultar',
        address: a.address || '',
        openingHours: a.openingHours || a.time || 'Consultar',
        image: '',
      }));
    } catch (error) {
      console.error('Error enriching attractions:', error);
      throw new Error('Failed to enrich attractions');
    }
  }

  /**
   * Fetch grounding information using Google Search
   */
  async fetchGroundingInfo(city: string): Promise<GroundingInfo> {
    try {
      const prompt = PROMPTS.grounding(city);
      const tools = [{ google_search_retrieval: {} }];
      const text = await this.callGeminiAPI(prompt, undefined, tools);

      return {
        text,
        links: [], // Would need to extract from groundingMetadata if needed
      };
    } catch (error) {
      console.error('Error fetching grounding info:', error);
      return { text: '', links: [] };
    }
  }

  /**
   * Generate a poetic editorial text about the city
   */
  async generateEditorial(city: string, country: string): Promise<string> {
    try {
      const prompt = PROMPTS.editorial(city, country);
      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error('Error generating editorial:', error);
      throw new Error('Failed to generate editorial');
    }
  }

  /**
   * Generate "What to know before you go" tips
   */
  async generateWhatToKnow(city: string): Promise<string> {
    try {
      const prompt = PROMPTS.whatToKnow(city);
      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error('Error generating what to know tips:', error);
      throw new Error('Failed to generate tips');
    }
  }

  /**
   * Suggest attractions based on category
   */
  async suggestAttractions(
    city: string,
    country: string,
    category: string,
    currentAttractions: string[]
  ): Promise<Array<{ name: string; description: string; category: string; location: string }>> {
    try {
      const prompt = PROMPTS.suggestAttractions(city, country, category, currentAttractions);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, []);
    } catch (error) {
      console.error('Error suggesting attractions:', error);
      return [];
    }
  }

  /**
   * Analyze an uploaded document image to extract travel details
   */
  async analyzeDocumentImage(base64Image: string): Promise<DocumentAnalysisResult[] | null> {
    try {
      // Validate input
      if (!base64Image || typeof base64Image !== 'string') {
        console.error('Invalid base64 input');
        return null;
      }

      const base64Data = extractBase64Data(base64Image);

      if (!base64Data || base64Data.length === 0) {
        console.error('Empty base64 data after extraction');
        return null;
      }

      const mimeType = detectMimeType(base64Image);
      console.log(`Analyzing document with MIME type: ${mimeType}, data length: ${base64Data.length}`);

      const prompt = PROMPTS.documentAnalysis();
      const text = await this.callGeminiAPI(
        prompt,
        { mimeType, data: base64Data },
        undefined,
        'application/json'
      );

      console.log('Raw AI response for document analysis:', text);

      const parsed = parseJsonSafely<DocumentAnalysisResult[] | DocumentAnalysisResult | null>(text, null);

      // Handle case where AI returns single object instead of array
      if (parsed && !Array.isArray(parsed)) {
        console.log('AI returned single object, wrapping in array');
        return [parsed];
      }

      console.log('Parsed results count:', Array.isArray(parsed) ? parsed.length : 0);
      return parsed as DocumentAnalysisResult[] | null;
    } catch (error) {
      console.error('Error analyzing document:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      return null;
    }
  }

  /**
   * Get metadata (stars, rating, address) for a hotel by name
   */
  async getHotelMetadata(hotelName: string, city?: string): Promise<{ stars?: number; rating?: number; address?: string; description?: string } | null> {
    try {
      const prompt = PROMPTS.hotelMetadata(hotelName, city);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error getting hotel metadata:', error);
      return null;
    }
  }
  /**
   * Suggest a specific location/address based on a name/query
   */
  async suggestLocation(query: string, context?: string): Promise<string> {
    try {
      const prompt = PROMPTS.suggestLocation(query, context || '');
      // We expect a simple string response, not JSON
      const text = await this.callGeminiAPI(prompt);
      return text.trim();
    } catch (error) {
      console.error('Error suggesting location:', error);
      return query; // Fallback to the query itself
    }
  }

  /**
   * Classify an activity title/location into a category
   */
  async classifyActivity(query: string): Promise<string> {
    try {
      const prompt = PROMPTS.classifyActivity(query);
      const text = await this.callGeminiAPI(prompt);
      const category = text.trim().toLowerCase();

      const validCategories = ['transport', 'accommodation', 'meal', 'food', 'sightseeing', 'culture', 'nature', 'shopping', 'nightlife', 'other'];

      if (validCategories.includes(category)) {
        return category === 'meal' ? 'food' : category; // Normalize 'meal' to 'food' if needed, or keep consistent with types
      }
      return 'sightseeing'; // Default fallback
    } catch (error) {
      console.error('Error classifying activity:', error);
      return 'sightseeing';
    }
  }

  /**
   * Get details (description and review summary) for a place
   */
  async getPlaceDetails(query: string): Promise<{ description: string; reviewSummary: string } | null> {
    try {
      const prompt = PROMPTS.placeDetails(query);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  /**
   * Generate a curated list of restaurants for a city
   */
  async generateGastronomyCuration(city: string): Promise<{
    overview: { description: string; goldenTip: string };
    restaurants: Array<{
      name: string;
      location: string;
      hours: string;
      price: string;
      category: string;
      specialty: string;
      highlight: string;
      description: string;
      reviewSummary?: string;
    }>;
  } | null> {
    try {
      const prompt = PROMPTS.gastronomyCuration(city);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error generating gastronomy curation:', error);
      return null;
    }
  }

  /**
   * Parse and enrich a raw text list of restaurants
   */
  async importRestaurantList(city: string, listText: string): Promise<Array<{
    name: string;
    location: string;
    hours: string;
    price: string;
    category: string;
    specialty: string;
    highlight: string;
    description: string;
  }> | null> {
    try {
      const prompt = PROMPTS.importRestaurantList(city, listText);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      const data = parseJsonSafely<{ restaurants: any[] }>(text, { restaurants: [] });
      return data.restaurants || [];
    } catch (error) {
      console.error('Error importing restaurant list:', error);
      return null;
    }
  }

  /**
   * Generate gastronomy guide content with practical tips
   */
  async generateGastronomyGuide(city: string): Promise<string> {
    try {
      const prompt = PROMPTS.gastronomyGuide(city);
      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error('Error generating gastronomy guide:', error);
      throw new Error('Failed to generate gastronomy guide');
    }
  }

  /**
   * Generate visitor guide content with practical tips for tourists
   */
  async generateVisitorGuide(city: string): Promise<string> {
    try {
      const prompt = PROMPTS.visitorGuide(city);
      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error('Error generating visitor guide:', error);
      throw new Error('Failed to generate visitor guide');
    }
  }

  /**
   * Generate travel alerts based on trip cities/countries
   */
  async generateTripAlerts(cities: Array<{ name: string; country: string }>): Promise<Array<{
    id: string;
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
    icon: string;
    cities?: string[];
  }>> {
    if (!cities || cities.length === 0) {
      return [];
    }

    try {
      const prompt = PROMPTS.tripAlerts(cities);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      const alerts = parseJsonSafely<Array<{
        id: string;
        type: 'danger' | 'warning' | 'info';
        title: string;
        message: string;
        icon: string;
        cities?: string[];
      }>>(text, []);
      return alerts;
    } catch (error) {
      console.error('Error generating trip alerts:', error);
      return [];
    }
  }

  /**
   * Generates detailed explanation for a specific trip alert
   */
  async generateAlertDetails(title: string, message: string, cities: string = ''): Promise<string> {
    if (!this.apiKey) return "Informações detalhadas indisponíveis no momento (API Key não configurada).";

    try {
      const prompt = PROMPTS.alertDetails(title, message, cities);
      // We expect plain text (markdown), not JSON
      const text = await this.callGeminiAPI(prompt);
      return text;
    } catch (error) {
      console.error('Error generating alert details:', error);
      return "Não foi possível gerar detalhes adicionais no momento. Por favor, consulte fontes oficiais.";
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let geminiServiceInstance: GeminiService | null = null;

/**
 * Get the singleton instance of GeminiService
 */
export const getGeminiService = (): GeminiService => {
  if (!geminiServiceInstance) {
    let apiKey = '';

    // Check Vite environment variable
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }
    // Fallback to process.env (legacy/node)
    else if (typeof process !== 'undefined' && process.env?.API_KEY) {
      apiKey = process.env.API_KEY;
    }

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      console.warn('Gemini API Key is missing or invalid. Check .env.local for VITE_GEMINI_API_KEY');
    }

    geminiServiceInstance = new GeminiService(apiKey);
  }
  return geminiServiceInstance;
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetGeminiService = (): void => {
  geminiServiceInstance = null;
};
