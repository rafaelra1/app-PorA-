/// <reference types="vite/client" />

import { ItineraryDay, CityGuide, Attraction, ImageGenerationOptions, GroundingInfo, DocumentAnalysisResult, FieldWithConfidence, BatchAnalysisResult, DebugInfo, TripContext, EnhancedTripContext, ChecklistAnalysisResult, TripViabilityAnalysis, TravelPeriod } from '../types';

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



// =============================================================================
// Constants
// =============================================================================

const GEMINI_DIRECT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const API_PROXY_URL = '/api/gemini';

// Use proxy in production to protect API key
const USE_PROXY = import.meta.env.PROD || import.meta.env.VITE_USE_API_PROXY === 'true';
const API_BASE_URL = USE_PROXY ? API_PROXY_URL : GEMINI_DIRECT_URL;

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

  classifyDocument: () => `
  Analise esta imagem e classifique o tipo de documento.
  Categorias possíveis:
  - flight (Passagens aéreas, cartões de embarque, e-tickets)
  - hotel (Reservas de hotel, confirmações de Airbnb/Booking)
  - car (Comprovantes de aluguel de carro)
  - train (Bilhetes de trem/metrô)
  - bus (Passagens de ônibus)
  - insurance (Apólices de seguro viagem)
  - passport (Página de identificação do passaporte)
  - visa (Vistos de viagem)
  - activity (Ingressos, tickets de passeios)
  - other (Outros documentos não listados)

  Retorne APENAS um JSON: {"type": "categoria", "confidence": 0.0-1.0}
  `,

  documentAnalysis: (type: string) => {
    let specificFields = "";
    switch (type) {
      case 'flight':
        specificFields = `
        - airline (Nome da companhia aérea)
        - flightNumber (Número do voo. IMPORTANTE: Deve ter código da cia + 3 ou 4 dígitos, ex: LA3040, G31234. Não confunda com horário)
        - pnr (Código de Reserva / Localizador. Geralmente 6 caracteres alfanuméricos, ex: ABC123. NÃO confunda com E-Ticket)
        - ticketNumber (Número do E-Ticket / Bilhete. Geralmente uma sequência longa de 13 dígitos, ex: 957-2345678901)
        - departureAirport (Código IATA da origem, ex: GRU)
        - arrivalAirport (Código IATA do destino, ex: JFK)
        - departureDate (Data de partida YYYY-MM-DD)
        - arrivalDate (Data de chegada YYYY-MM-DD)
        - departureTime (Horário de partida HH:MM)
        - arrivalTime (Horário de chegada HH:MM)
        - terminal (Terminal de embarque)
        - gate (Portão de embarque)
        - seat (Assento)
        - class (Classe, ex: Econômica)
        `;
        break;
      case 'hotel':
        specificFields = `
        - hotelName (Nome do hotel)
        - address (Endereço completo)
        - checkInDate (Data de entrada YYYY-MM-DD)
        - checkInTime (Horário de check-in)
        - checkOutDate (Data de saída YYYY-MM-DD)
        - checkOutTime (Horário de check-out)
        - roomType (Tipo de quarto)
        - confirmationNumber (Número da confirmação)
        - guestName (Nome do hóspede)
        `;
        break;
      case 'car':
        specificFields = `
        - company (Empresa locadora)
        - pickupLocation (Local de retirada)
        - pickupDate (Data de retirada YYYY-MM-DD)
        - pickupTime (Horário de retirada)
        - dropoffLocation (Local de devolução)
        - dropoffDate (Data de devolução YYYY-MM-DD)
        - dropoffTime (Horário de devolução)
        - vehicleModel (Modelo do carro)
        - confirmationNumber (Número da reserva)
        `;
        break;
      case 'insurance':
        specificFields = `
        - provider (Seguradora)
        - policyNumber (Número da apólice)
        - insuredName (Nome do segurado)
        - coverageStart (Início da vigência YYYY-MM-DD)
        - coverageEnd (Fim da vigência YYYY-MM-DD)
        - emergencyPhone (Telefone de emergência)
        `;
        break;
      case 'passport':
        specificFields = `
        - fullName (Nome completo)
        - passportNumber (Número do passaporte)
        - nationality (Nacionalidade)
        - birthDate (Data de nascimento YYYY-MM-DD)
        - expiryDate (Data de validade YYYY-MM-DD)
        - issueDate (Data de emissão YYYY-MM-DD)
        - issuingCountry (País emissor)
        `;
        break;
      case 'visa':
        specificFields = `
        - country (País do visto)
        - visaType (Tipo de visto)
        - visaNumber (Número do visto)
        - expiryDate (Data de validade YYYY-MM-DD)
        - entries (Número de entradas: Single/Multiple)
        `;
        break;
      default: // Generic/Other
        specificFields = `
        - name (Nome principal do serviço/entidade)
        - date (Data principal YYYY-MM-DD)
        - reference (Código de referência)
        - details (Descrição curta)
        `;
    }

    return `Analise esta imagem de um documento do tipo "${type}".
      Extraia os seguintes campos específicos para CADA item encontrado:
      ${specificFields}

      IMPORTANTE: Se houver múltiplos itens (ex: vários voos em um itinerário), extraia TODOS eles.

      Retorne um JSON com a seguinte estrutura:
      {
        "type": "${type}",
        "items": [
          {
            "fields": {
              "nomeDoCampo": { "value": "valor extraído", "confidence": 0.0-1.0 },
              ...
            },
            "overallConfidence": 0.0-1.0
          }
        ]
      }

      Regras:
      1. Se um campo não for encontrado, NÃO o inclua ou retorne null no value.
      2. Para datas, use SEMPRE o formato YYYY-MM-DD.
      3. Confidence deve refletir sua certeza sobre a leitura (1.0 = certeza absoluta, 0.5 = incerto).
      4. Se houver múltiplos itens (ex: 5 voos), inclua TODOS no array "items".
      5. Se houver apenas 1 item, retorne um array com 1 elemento.
    `;
  },

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

  typicalDishes: (city: string) => `
Você é um especialista em gastronomia local e cultural de ${city}.
Liste os 5 a 10 pratos mais tradicionais e típicos desta cidade/região.
Para cada prato, forneça:
- Nome em português (e original se aplicável)
- Breve descrição apetitosa (max 2 frases)
- Ingredientes principais (lista curta)
- Breve história cultural ou origem (1 frase)

Retorne APENAS um array JSON. Schema: [{ "name": string, "description": string, "ingredients": string[], "history": string }].
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

  analyzeChecklist: (context: EnhancedTripContext) => {
    // Calculate days until trip and trip duration
    const today = new Date();
    const startDate = new Date(context.startDate);
    const endDate = new Date(context.endDate);
    const daysUntilTrip = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const travelMonth = startDate.toLocaleString('pt-BR', { month: 'long' });

    // Extract traveler details
    const travelerSummary = context.travelers?.map((t, i) => {
      // ... existing traveler formatting logic ...
      const details: string[] = [];
      if ('name' in t) details.push(`Nome: ${t.name}`);
      if ('ageGroup' in t) details.push(`Grupo: ${t.ageGroup}`);
      if ('age' in t) details.push(`Idade: ${t.age}`);
      if ('dietaryRestrictions' in t && Array.isArray(t.dietaryRestrictions) && t.dietaryRestrictions.length > 0) {
        details.push(`Restrições: ${t.dietaryRestrictions.join(', ')}`);
      }
      return `Viajante ${i + 1}: ${details.join(', ') || 'Sem detalhes'}`;
    }).join('\n') || 'Não especificado';

    // Extract detailed context
    const flightSummary = context.flights?.map(f =>
      `- Voo ${f.reference} (${f.operator}): ${f.departureLocation} -> ${f.arrivalLocation} em ${f.departureDate}`
    ).join('\n') || 'Nenhum voo registrado';

    const hotelSummary = context.hotels?.map(h =>
      `- ${h.name} (${h.address || 'Endereço n/d'}) - ${h.checkIn} a ${h.checkOut}`
    ).join('\n') || 'Nenhuma hospedagem registrada';

    const activitySummary = context.activities?.map(a =>
      `- ${a.date} ${a.time}: ${a.title} (${a.type})`
    ).join('\n') || 'Nenhuma atividade planejada';

    const citiesSummary = context.cities?.map(c => `${c.name} (${c.country})`).join(', ') || context.destination;

    const gapAlerts = context.planningGaps?.map(gap =>
      `⚠️ ALERTA DE PLANEJAMENTO (${gap.severity}): ${gap.description} (Data: ${gap.date || 'Geral'})`
    ).join('\n') || '';

    return `Você é um assistente de viagem experiente e meticuloso. Analise o contexto desta viagem DETALHADAMENTE e gere sugestões de tarefas e insights altamente personalizados.

CONTEXTO DA VIAGEM:
Destino(s): ${citiesSummary}
Datas: ${context.startDate} a ${context.endDate} (${travelMonth})
Duração: ${tripDuration} dias
Faltam: ${daysUntilTrip} dias para a viagem

ALERTAS CRÍTICOS (FALTA DE RESERVAS):
${gapAlerts || 'Nenhum gap crítico detectado pela análise automática.'}

LOGÍSTICA CONFIRMADA:
Voos:
${flightSummary}

Hospedagem:
${hotelSummary}

Atividades Planejadas:
${activitySummary}

PERFIL DOS VIAJANTES:
${travelerSummary}

INTERESSES: ${context.interests?.join(', ') || 'Geral'}

TAREFAS JÁ EXISTENTES (Ignorar duplicatas):
${context.existingTasks?.join('\n') || 'Nenhuma'}

Gere um JSON com sugestões PERSONALIZADAS e INSIGHTS úteis.

Estrutura esperada (JSON PURO):
{
  "insights": [
    {
      "id": "insight-X",
      "type": "weather|event|logistics|local_tip",
      "title": "Título curto",
      "description": "Descrição útil (max 2 frases)",
      "confidence": "high|medium|low"
    }
  ],
  "suggestedTasks": [
    {
      "id": "task-X",
      "title": "Título da tarefa",
      "category": "documentation|health|reservations|packing|financial|tech",
      "reason": "Por que isso é específico para ESTA viagem",
      "isUrgent": boolean
    }
  ]
}

REGRAS DE ANÁLISE ESPECIALIZADA:
0. **PRIORIDADE MÁXIMA**: Se houver "ALERTAS CRÍTICOS" acima, gere IMEDIATAMENTE tarefas para resolvê-los (ex: "Reservar hotel para os dias X", "Comprar passagem aérea"). Marque como URGENTE.
1. **Documentação & Vistos**: Verifique se os países (${citiesSummary}) exigem passaporte/visto para a nacionalidade (assuma Brasileiros se não especificado). Se faltar < 30 dias e não houver tarefa de visto, crie alerta URGENTE.
2. **Saúde & Vacinas**: Se o destino exige vacina (ex: Febre Amarela para alguns países), verifique se está no checklist.
3. **Clima & Bagagem**: Baseado no mês (${travelMonth}) e destino, sugira itens Específicos (ex: "Levar adaptador tipo G para UK", "Roupas térmicas para neve").
4. **Logística**: Se houver troca de cidades ou voos complexos, sugira "Imprimir comprovantes" ou "Verificar transfer".
5. **Atividades**: Se tiver atividades físicas (trilhas) ou jantares chiques, sugira roupas adequadas.
6. **Anti-Alucinação**: Apenas sugira eventos/feriados se tiver certeza que ocorrem nestas datas específicas em ${citiesSummary}.
7. **Não Repita**: Se a tarefa já existe na lista "TAREFAS JÁ EXISTENTES", NÃO sugira novamente.
8. **Categorias Validas**: documentation, health, reservations, packing, financial, tech.

Retorne APENAS o JSON válido.`;
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

  countryInfo: (country: string) => `Forneça informações práticas para viajantes brasileiros sobre ${country}.

Retorne APENAS um JSON com o seguinte formato:
{
  "currency": { "code": "EUR", "symbol": "€", "name": "Euro" },
  "language": "Idioma principal",
  "timezone": "Fuso horário (ex: GMT+1)",
  "plugType": "Tipo de tomada (ex: Tipo C/F, 230V)",
  "visaRequired": true ou false (para brasileiros em turismo até 90 dias),
  "emergencyNumber": "Número de emergência geral",
  "drivingSide": "left" ou "right"
}

IMPORTANTE: Dados reais e precisos para turistas brasileiros.`,

  costOfLiving: (city: string, country: string) => `Forneça índices de custo de vida para ${city}, ${country} comparados com o Brasil.

Retorne APENAS um JSON:
{
  "restaurant": 25, // Custo médio de refeição em restaurante simples (USD)
  "transport": 5,   // Bilhete de transporte público (USD)
  "hotel": 80,      // Diária média hotel 3 estrelas (USD)
  "overall": 130    // Índice geral (100 = igual ao Brasil, 130 = 30% mais caro)
}

Use dados aproximados mas realistas.`,

  localEvents: (city: string, dates: string) => `Liste 3 a 5 eventos especiais que ocorrerão em ${city} durante as datas: ${dates}.
Inclua feriados, festivais, shows importantes, exposições temporárias ou eventos sazonais.
Se não houver eventos específicos confirmados, sugira eventos sazonais típicos da época.

Retorne APENAS um JSON:
[
  {
    "title": "Nome do Evento",
    "date": "Data ou período (ex: 15 Out)",
    "description": "Breve descrição (1 frase)",
    "type": "festival" | "music" | "art" | "holiday" | "other"
  }
]`,
  fillItineraryGaps: (destination: string, date: string, existingActivities: any[]) => `
  Você é um assistente de viagens. Sugira 3 atividades para preencher as lacunas no roteiro de viagem em ${destination} para o dia ${date}.

  ATIVIDADES JÁ PLANEJADAS:
  ${JSON.stringify(existingActivities)}

  Sugira atividades que complementem as já planejadas, considerando horários livres.

  Retorne APENAS um JSON array de objetos:
  [
    {
      "time": "HH:MM",
      "title": "Título da atividade",
      "description": "Descrição curta",
      "type": "culture|food|nature|shopping|nightlife|sightseeing",
      "location": "Localização aproximada"
    }
  ]
  `,

  analyzeDestinationViability: (destination: string, period: string) => `
Você é um consultor de viagens especializado em ajudar viajantes brasileiros.
Analise a viabilidade de viajar para ${destination} durante ${period}.

Considere os seguintes fatores:
1. Clima e temperatura média no período
2. Alta/baixa temporada turística
3. Eventos, feriados e festivais relevantes
4. Preços médios e lotação esperada
5. Condições específicas do destino (monções, neve, calor extremo, etc.)

Retorne APENAS um JSON com esta estrutura exata:
{
  "viability": "recommended" | "acceptable" | "not_recommended",
  "summary": "Resumo em 2-3 frases sobre a viabilidade geral",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "climate": {
    "description": "Descrição do clima esperado no período",
    "avgTemp": "Temperatura média (ex: 18°C - 25°C)"
  },
  "events": ["evento1", "evento2"],
  "tips": ["dica1", "dica2", "dica3"]
}

REGRAS:
- "viability" deve ser:
  - "recommended": Época ideal ou muito boa para visitar
  - "acceptable": Pode visitar, mas com ressalvas
  - "not_recommended": Época problemática (monções, calor extremo, fechamentos)
- Liste 2-4 prós e 1-3 contras realistas
- Eventos devem ser específicos para o período (feriados, festivais)
- Dicas devem ser práticas e específicas para o período
- Responda em Português do Brasil
`,
  attractionSuggestions: (cityName: string, country: string, existingAttractions: string[]) => `
Você é um guia de viagem especializado. Sugira 12 atrações turísticas imperdíveis em ${cityName}, ${country}.

IMPORTANTE: 
- Evite estas atrações já adicionadas pelo usuário: ${existingAttractions.join(', ') || 'nenhuma'}
- Inclua uma mistura de: pontos turísticos famosos, lugares escondidos (hidden gems), experiências culturais
- Seja específico com nomes reais de lugares

Para cada atração, forneça:
- name: Nome exato do lugar (como aparece no Google Maps)
- description: Descrição curta (1-2 frases)
- category: Uma categoria (Museu, Parque, Monumento, Igreja, Mercado, Mirante, Praia, etc.)
- aiReason: Por que esta atração é perfeita para o viajante (personalize, seja criativo)

Responda APENAS com um JSON array válido:
[
  {
    "name": "Nome do Lugar",
    "description": "Descrição curta",
    "category": "Categoria",
    "aiReason": "Perfeito para você porque..."
  }
    "aiReason": "Perfeito para você porque..."
  }
]`,
  topAttractions: (cityName: string) => `
Você é um curador de viagens especialista. Liste as 8 atrações turísticas "Top Tier" (as mais famosas e imperdíveis) de ${cityName}.

Para cada atração, forneça:
- name: Nome exato
- description: Descrição curta e envolvente (max 2 frases)
- tags: 3 etiquetas curtas com informações chave (ex: "Tempo: 2h", "Tipo: Museu", "Entrada: Pago", "Vibe: Romântico")
- history_trivia: Uma curiosidade histórica fascinante ou "Por que é imperdível?" (max 2 frases)
- category: Categoria principal (ex: Monumento, Natureza, Museu)

Retorne APENAS um JSON array válido:
[
  {
    "name": "Nome",
    "description": "Descrição",
    "tags": [
      { "label": "Tempo", "value": "2h" },
      { "label": "Tipo", "value": "Museu" },
      { "label": "Entrada", "value": "Pago" }
    ],
    "history_trivia": "Curiosidade...",
    "category": "Categoria"
  }
]`,
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
   * Make a request to the Gemini API (supports both direct and proxy modes)
   */
  private async callGeminiAPI(
    prompt: string,
    image?: ImageData,
    tools?: unknown[],
    responseMimeType?: string
  ): Promise<string> {
    try {
      let response: Response;

      if (USE_PROXY) {
        // Use server proxy (production mode - protects API key)
        response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            image,
            tools,
            responseMimeType
          }),
        });
      } else {
        // Direct API call (development mode)
        const url = `${this.baseUrl}?key=${this.apiKey}`;
        const body = this.buildRequestBody(prompt, image, tools, responseMimeType);

        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

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
   * Generate curated attraction suggestions for Discovery Mode
   */
  async generateAttractionSuggestions(
    cityName: string,
    country: string,
    existingAttractions: string[]
  ): Promise<any[]> {
    try {
      const prompt = PROMPTS.attractionSuggestions(cityName, country, existingAttractions);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, []);
    } catch (error) {
      console.error('Error generating attraction suggestions:', error);
      throw new Error('Failed to generate attraction suggestions');
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
   * Generate an AI image using Gemini Imagen 3
   */
  async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<string | null> {
    console.log(`Generating image for prompt: ${prompt}`);

    try {
      // Try Gemini Imagen 3 first with retries
      const imagenUrl = await this.generateWithImagenAPI(prompt, options);
      if (imagenUrl) {
        console.log('Image generated successfully with Gemini Imagen');
        return imagenUrl;
      }
    } catch (error) {
      console.warn('Gemini Imagen failed after retries, falling back to Unsplash:', error);
    }

    // Fallback to Unsplash
    return this.generateFallbackImage(prompt);
  }

  /**
   * Generate image using Gemini Imagen 3 API
   */
  private async generateWithImagenAPI(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<string | null> {
    try {
      const maxRetries = 3;
      let lastError;

      // Clean up prompt for extraction if needed
      let cityName = '';
      if (prompt.startsWith('City of')) {
        cityName = prompt.replace('City of ', '').split(',')[0];
      }

      // Build enhanced prompt
      const enhancedPrompt = this.buildEnhancedImagePrompt(prompt, options);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // ALWAYS use server proxy for Image Generation to avoid CORS and Key issues
          // The proxy handles the secure communication with Google's API
          // Ensure we use the relative path so Vite proxies it to the backend (port 3001)
          const proxyUrl = '/api/gemini/imagen'; // Relative path is key

          const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: enhancedPrompt,
              aspectRatio: options.aspectRatio,
              negativePrompt: 'blurry, low quality, distorted, ugly, watermark, text, signature, grainy, deformed'
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(`Imagen proxy error (attempt ${attempt}):`, errorData);
            throw new Error(`Imagen API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
          }

          const data = await response.json();

          if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
            const base64Image = data.predictions[0].bytesBase64Encoded;
            return `data:image/png;base64,${base64Image}`;
          }

          throw new Error('No image data in response');

        } catch (error) {
          console.warn(`Imagen attempt ${attempt} failed:`, error);
          lastError = error;
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError || new Error('Failed to generate image after retries');

      return null;
    } catch (error) {
      console.error('Error generating image with Imagen API:', error);
      return null;
    }
  }

  /**
   * Build enhanced prompt for better image generation
   */
  private buildEnhancedImagePrompt(prompt: string, options: ImageGenerationOptions): string {
    let enhancedPrompt = prompt;

    // Extract city name if present
    const cityMatch = prompt.match(/Cinematic travel photography of (.+?)(,|$)/i) || prompt.match(/City of (.+?)(,|$)/i);

    if (cityMatch) {
      const cityName = cityMatch[1];
      // Updated to match the specific "National Geographic style" request
      enhancedPrompt = `A breathtaking, cinematic travel photograph of ${cityName}. Wide angle landscape, golden hour light, featuring iconic landmarks and local culture. High resolution, detailed, vibrant colors, National Geographic style. No text.`;
    } else if (prompt.includes(',')) {
      // Heuristic: if it looks like "Paris, France" or similar simple string
      enhancedPrompt = `A breathtaking, cinematic travel photograph of ${prompt}. Wide angle landscape, golden hour light, featuring iconic landmarks and local culture. High resolution, detailed, vibrant colors, National Geographic style. No text.`;
    } else {
      // General enhancement fallback
      enhancedPrompt = `A breathtaking, cinematic travel photograph of ${prompt}. Wide angle landscape, golden hour light, featuring iconic landmarks and local culture. High resolution, detailed, vibrant colors, National Geographic style. No text.`;
    }

    // Add size-specific quality hints (appended to keep technical specs at end)
    if (options.imageSize === '4K') {
      enhancedPrompt += ' 8k ultra hd';
    } else if (options.imageSize === '2K') {
      enhancedPrompt += ' 4k high definition';
    }

    return enhancedPrompt;
  }

  /**
   * Fallback image generation with multi-tier strategy
   * Tries: Unsplash → Pexels → Local Placeholder
   */
  private async generateFallbackImage(prompt: string): Promise<string> {
    // Extract city name from prompt "City of {name}, {country}" or use raw prompt
    let query = prompt;
    if (prompt.startsWith('City of')) {
      query = prompt.replace('City of ', '').split(',')[0];
    }

    const keywords = `${query},landmark,city,travel`;

    try {
      // Try LoremFlickr (reliable placeholder)
      // Format: /width/height/comma,separated,keywords/all
      const formattedKeywords = keywords.split(',').map(k => encodeURIComponent(k.trim())).join(',');
      const loremFlickrUrl = `https://loremflickr.com/800/600/${formattedKeywords}/all`;

      // Verify if LoremFlickr is accessible (HEAD request)
      const check = await fetch(loremFlickrUrl, { method: 'HEAD' });
      if (check.ok) {
        console.log('Using LoremFlickr fallback');
        return loremFlickrUrl;
      }
    } catch (error) {
      console.warn('Unsplash fallback failed:', error);
    }

    try {
      // Try Pexels as second fallback
      const pexelsUrl = await this.getPexelsImage(keywords);
      if (pexelsUrl) {
        console.log('Using Pexels fallback');
        return pexelsUrl;
      }
    } catch (error) {
      console.warn('Pexels fallback failed:', error);
    }

    // Final fallback: colored placeholder with icon
    console.log('Using local placeholder fallback');
    return this.generateLocalPlaceholder(query);
  }

  /**
   * Get image from Pexels API (free alternative)
   */
  private async getPexelsImage(keywords: string): Promise<string | null> {
    try {
      // Pexels requires API key, but has a public endpoint for basic searches
      // Note: For production, add VITE_PEXELS_API_KEY to environment
      const pexelsApiKey = import.meta.env.VITE_PEXELS_API_KEY;

      if (!pexelsApiKey) {
        // No API key, skip Pexels and fall back to local placeholder
        return null;
      }

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=1&orientation=landscape`,
        {
          headers: {
            'Authorization': pexelsApiKey
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.large;
      }

      return null;
    } catch (error) {
      console.error('Pexels API error:', error);
      return null;
    }
  }

  /**
   * Generate local placeholder with color and icon
   */
  private generateLocalPlaceholder(query: string): string {
    // Generate a deterministic color based on query
    const colors = [
      '#3B82F6', // blue
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#F59E0B', // amber
      '#10B981', // green
      '#EF4444', // red
      '#06B6D4', // cyan
    ];

    const hash = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hash % colors.length];

    // Create SVG placeholder
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="${color}"/>
        <text x="400" y="280" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" opacity="0.9">
          📍
        </text>
        <text x="400" y="340" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">
          ${query}
        </text>
      </svg>
    `.trim();

    // Convert to base64 data URL
    // Convert to base64 data URL with UTF-8 support
    const base64 = typeof window !== 'undefined'
      ? window.btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Edit an existing image using AI
   *
   * Supported operations:
   * - Remove background
   * - Adjust colors/lighting
   * - Add/remove elements
   * - Style transfer
   * - Upscaling
   *
   * @param currentImageBase64 - Base64 encoded image (with or without data URI prefix)
   * @param editPrompt - Description of desired changes (e.g., "remove background", "make it brighter")
   * @returns Base64 encoded edited image or null on failure
   */
  async editImageWithAI(
    currentImageBase64: string,
    editPrompt: string
  ): Promise<string | null> {
    try {
      console.log(`Editing image with prompt: ${editPrompt}`);

      // Extract base64 content and mime type
      const { base64Content, mimeType } = this.extractImageData(currentImageBase64);

      // Use Gemini's vision model for image editing via description
      // Note: Gemini doesn't have direct image editing, so we:
      // 1. Analyze the image with vision
      // 2. Generate a new image based on analysis + edit prompt
      const editedImage = await this.editImageWithGemini(base64Content, mimeType, editPrompt);

      if (editedImage) {
        console.log('Image edited successfully with Gemini');
        return editedImage;
      }

      console.warn('Gemini image editing failed');
      return null;
    } catch (error) {
      console.error('Error editing image with AI:', error);
      return null;
    }
  }

  /**
   * Edit image using Gemini's vision + generation capabilities
   */
  private async editImageWithGemini(
    base64Content: string,
    mimeType: string,
    editPrompt: string
  ): Promise<string | null> {
    try {
      // Step 1: Analyze current image with Gemini Vision
      const analysisPrompt = `Analyze this image in detail. Describe:
1. Main subject and composition
2. Colors and lighting
3. Style and mood
4. Background and context

Be specific and detailed for accurate recreation.`;

      const visionEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`;

      const analysisRequest = {
        contents: [{
          parts: [
            { text: analysisPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Content
              }
            }
          ]
        }]
      };

      const analysisResponse = await fetch(`${visionEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisRequest)
      });

      if (!analysisResponse.ok) {
        throw new Error(`Vision API error: ${analysisResponse.status}`);
      }

      const analysisData = await analysisResponse.json();
      const imageDescription = analysisData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!imageDescription) {
        console.error('Failed to analyze image');
        return null;
      }

      // Step 2: Generate new image based on analysis + edit instructions
      const generationPrompt = `${imageDescription}

EDIT INSTRUCTIONS: ${editPrompt}

Create a new image that maintains the essence of the original but applies the requested edits.`;

      const newImage = await this.generateWithImagenAPI(generationPrompt, {
        aspectRatio: '16:9',
        imageSize: '2K'
      });

      return newImage;
    } catch (error) {
      console.error('Error in editImageWithGemini:', error);
      return null;
    }
  }

  /**
   * Extract base64 content and mime type from image data
   */
  private extractImageData(imageData: string): { base64Content: string; mimeType: string } {
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          mimeType: matches[1],
          base64Content: matches[2]
        };
      }
    }

    // Default to JPEG if no mime type detected
    return {
      mimeType: 'image/jpeg',
      base64Content: imageData
    };
  }

  /**
   * Generate variations of an image
   *
   * @param prompt - Image generation prompt
   * @param count - Number of variations to generate (1-4)
   * @param options - Generation options
   * @returns Array of generated image URLs
   */
  async generateImageVariations(
    prompt: string,
    count: number = 4,
    options: ImageGenerationOptions = {}
  ): Promise<string[]> {
    const variations: string[] = [];
    const maxCount = Math.min(count, 4);

    console.log(`Generating ${maxCount} image variations for: ${prompt}`);

    // Generate variations in parallel
    const promises = Array.from({ length: maxCount }, async (_, index) => {
      // Add variation seed to prompt for diversity
      const variantPrompt = `${prompt}, variation ${index + 1}, unique perspective`;
      return await this.generateImage(variantPrompt, options);
    });

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        variations.push(result.value);
      }
    }

    console.log(`Generated ${variations.length}/${maxCount} variations successfully`);

    return variations;
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
   * Generate country information for travelers
   */
  async generateCountryInfo(country: string): Promise<{
    currency: { code: string; symbol: string; name: string };
    language: string;
    timezone: string;
    plugType: string;
    visaRequired: boolean;
    emergencyNumber: string;
    drivingSide: 'left' | 'right';
  } | null> {
    try {
      const prompt = PROMPTS.countryInfo(country);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error generating country info:', error);
      return null;
    }
  }

  /**
   * Generate cost of living data for a city
   */
  async generateCostOfLiving(city: string, country: string): Promise<{
    restaurant: number;
    transport: number;
    hotel: number;
    overall: number;
  } | null> {
    try {
      const prompt = PROMPTS.costOfLiving(city, country);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error generating cost of living:', error);
      return null;
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
   * Suggest activities to fill gaps in an itinerary
   */
  async fillItineraryGaps(destination: string, date: string, existingActivities: any[]): Promise<any[]> {
    try {
      const prompt = PROMPTS.fillItineraryGaps(destination, date, existingActivities);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely<any[]>(text, []);
    } catch (error) {
      console.error('Error filling itinerary gaps:', error);
      return [];
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

      // Step 1: Classify Document (pass full data URL to preserve MIME type)
      const classification = await this.classifyDocumentType(base64Image);
      console.log('Document Classified as:', classification);

      // Step 2: Extract Data using specialized prompt
      // If confidence is too low, treat as generic 'other' or the guessed type but with caution
      const effectiveType = classification.confidence > 0.4 ? classification.type : 'other';

      // Step 3: Extract data (pass full data URL to preserve MIME type)
      const extractionResults = await this.extractDocumentData(base64Image, effectiveType);

      if (!extractionResults || extractionResults.length === 0) return null;

      // Add classification metadata to all results
      extractionResults.forEach(result => {
        result.typeConfidence = classification.confidence;
      });

      console.log(`Extracted ${extractionResults.length} items from document`);
      return extractionResults;
    } catch (error) {
      console.error('Error analyzing document:', error);
      return null;
    }
  }

  /**
   * Analyze multiple documents in batch with concurrency limit and duplicate detection
   */
  async analyzeDocumentBatch(files: File[]): Promise<BatchAnalysisResult> {
    const BATCH_LIMIT = 3;
    const results: BatchAnalysisResult = {
      successful: [],
      failed: [],
      duplicates: []
    };

    // Helper to read file as base64
    const readFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    // Helper to process a single file
    const processFile = async (file: File) => {
      try {
        const base64 = await readFile(file);
        const analysis = await this.analyzeDocumentImage(base64);

        if (analysis && analysis.length > 0) {
          return { file, result: analysis[0], fileName: file.name };
        } else {
          results.failed.push({ file, error: 'Could not analyze document', fileName: file.name });
          return null;
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.failed.push({ file, error: error instanceof Error ? error.message : 'Unknown error', fileName: file.name });
        return null;
      }
    };

    // Process in chunks
    for (let i = 0; i < files.length; i += BATCH_LIMIT) {
      const chunk = files.slice(i, i + BATCH_LIMIT);
      const chunkPromises = chunk.map(processFile);
      const chunkResults = await Promise.all(chunkPromises);

      // Collect successful results
      chunkResults.forEach(item => {
        if (item) {
          // Check for duplicates
          const isDuplicate = results.successful.some(existing =>
            existing.type === item.result.type &&
            existing.date === item.result.date &&
            (existing.reference === item.result.reference || existing.name === item.result.name)
          );

          if (isDuplicate) {
            results.duplicates.push({
              file: item.file,
              duplicateOf: item.result.reference || item.result.name || 'Unknown',
              fileName: item.fileName
            });
          } else {
            // Attach original file metadata
            item.result.originalFile = item.file;
            item.result.fileName = item.fileName;
            results.successful.push(item.result);
          }
        }
      });
    }

    // Sort successful results by date
    results.successful.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return results;
  }


  /**
   * Step 1: Classify the document type
   */
  async classifyDocumentType(base64Image: string): Promise<{ type: string; confidence: number }> {
    try {
      const mimeType = detectMimeType(base64Image);
      const base64Data = extractBase64Data(base64Image);

      const prompt = PROMPTS.classifyDocument();
      const text = await this.callGeminiAPI(prompt, { mimeType, data: base64Data }, undefined, 'application/json');

      const result = parseJsonSafely<{ type: string; confidence: number }>(text, { type: 'other', confidence: 0 });
      return result;
    } catch (error) {
      console.error('Error classifying document:', error);
      return { type: 'other', confidence: 0 };
    }
  }

  /**
   * Step 2: Extract data using specialized prompt
   * Returns an array of results (can contain multiple items like multiple flights)
   */
  async extractDocumentData(base64Image: string, type: string): Promise<DocumentAnalysisResult[] | null> {
    try {
      const mimeType = detectMimeType(base64Image);
      const base64Data = extractBase64Data(base64Image);

      const prompt = PROMPTS.documentAnalysis(type);
      const text = await this.callGeminiAPI(prompt, { mimeType, data: base64Data }, undefined, 'application/json');

      const rawData = parseJsonSafely<any>(text, null);
      if (!rawData) return null;

      // Handle new array structure with "items"
      const items = rawData.items || [];

      // Fallback: if no items array, try legacy single-item structure
      if (items.length === 0 && rawData.fields) {
        items.push({ fields: rawData.fields, overallConfidence: rawData.overallConfidence });
      }

      if (items.length === 0) {
        console.warn('No items found in document extraction response');
        return null;
      }

      const results: DocumentAnalysisResult[] = items.map((item: any, index: number) => {
        const f = item.fields || {};
        const result: DocumentAnalysisResult = {
          type: this.mapTypeToEnum(rawData.type || type),
          fields: f,
          overallConfidence: item.overallConfidence,
          debugInfo: index === 0 ? {
            prompt: prompt,
            rawResponse: text,
            model: 'gemini-2.5-flash'
          } : undefined
        };

        // Populate legacy flat fields for compatibility
        this.populateLegacyFields(result, f, type);

        return result;
      });

      return results;
    } catch (error) {
      console.error('Error extracting document data:', error);
      return null;
    }
  }

  private mapTypeToEnum(type: string): DocumentAnalysisResult['type'] {
    const validTypes = ['flight', 'hotel', 'car', 'activity', 'insurance', 'passport', 'visa', 'other'];
    // Map some synonyms if necessary
    if (type === 'train' || type === 'bus') return 'other'; // Map transport to other/generic if not explicitly supported in Enum yet
    if (validTypes.includes(type)) return type as DocumentAnalysisResult['type'];
    return 'other';
  }

  private populateLegacyFields(result: DocumentAnalysisResult, fields: Record<string, any>, type: string) {
    const getValue = (key: string) => fields[key]?.value;

    // Common fields
    result.name = getValue('name') || getValue('airline') || getValue('hotelName') || getValue('company') || getValue('provider') || getValue('fullName');

    // Dates are trickier, depends on type
    if (type === 'flight') {
      result.date = getValue('departureDate');
      result.endDate = getValue('arrivalDate'); // Not standard but useful
      result.departureTime = getValue('departureTime');
      result.arrivalTime = getValue('arrivalTime');
      // Prioritize flightNumber for reference (matches UI label "Número do Voo")
      // PNR should ideally go to confirmation, but legacy fields don't have it.
      // We'll rely on MapResultToFormData using fields directly for PNR.
      result.reference = getValue('flightNumber') || getValue('pnr');
      result.pickupLocation = getValue('departureAirport');
      result.dropoffLocation = getValue('arrivalAirport');
      result.details = `${getValue('class') || ''} ${getValue('seat') ? 'Seat: ' + getValue('seat') : ''}`.trim();
    } else if (type === 'hotel') {
      result.date = getValue('checkInDate');
      result.endDate = getValue('checkOutDate');
      result.reference = getValue('confirmationNumber');
      result.address = getValue('address');
      result.details = getValue('roomType');
    } else if (type === 'car') {
      result.date = getValue('pickupDate');
      result.endDate = getValue('dropoffDate');
      result.pickupLocation = getValue('pickupLocation');
      result.dropoffLocation = getValue('dropoffLocation');
      result.reference = getValue('confirmationNumber');
      result.model = getValue('vehicleModel');
    } else if (type === 'insurance') {
      result.date = getValue('coverageStart');
      result.endDate = getValue('coverageEnd');
      result.reference = getValue('policyNumber');
    } else if (type === 'passport' || type === 'visa') {
      result.date = getValue('issueDate');
      result.endDate = getValue('expiryDate');
      result.reference = getValue('passportNumber') || getValue('visaNumber');
    } else {
      result.date = getValue('date');
      result.reference = getValue('reference');
      result.details = getValue('details');
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
   * Generate typical regional dishes for a city
   */
  async generateTypicalDishes(city: string): Promise<Array<{
    name: string;
    description: string;
    ingredients: string[];
    history: string;
  }> | null> {
    try {
      const prompt = PROMPTS.typicalDishes(city);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error generating typical dishes:', error);
      return null;
    }
  }

  /**
   * Generate top tier attractions for the highlights carousel
   */
  async generateTopAttractions(cityName: string): Promise<Array<{
    name: string;
    description: string;
    tags: { label: string; value: string }[];
    history_trivia: string;
    category: string;
  }> | null> {
    try {
      const prompt = PROMPTS.topAttractions(cityName);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error generating top attractions:', error);
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


  /**
   * Search for local events in a city for specific dates
   */
  async searchLocalEvents(city: string, dates: string): Promise<Array<{
    title: string;
    date: string;
    description: string;
    type: 'festival' | 'music' | 'art' | 'holiday' | 'other';
  }> | null> {
    try {
      const prompt = PROMPTS.localEvents(city, dates);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');
      return parseJsonSafely(text, null);
    } catch (error) {
      console.error('Error finding local events:', error);
      return null;
    }
  }

  /**
   * Analyze trip context and generate intelligent checklist suggestions
   */
  async analyzeChecklist(context: TripContext): Promise<ChecklistAnalysisResult | null> {
    try {
      const prompt = PROMPTS.analyzeChecklist(context);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');

      const result = parseJsonSafely<ChecklistAnalysisResult>(text, null);

      if (!result) {
        console.error('Failed to parse checklist analysis result');
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error analyzing checklist:', error);
      return null;
    }
  }

  /**
   * Analyze the viability of traveling to a destination during a specific period
   */
  async analyzeDestinationViability(
    destination: string,
    period: TravelPeriod
  ): Promise<TripViabilityAnalysis | null> {
    try {
      // Format period string for the prompt
      let periodStr: string;
      if (period.type === 'exact' && period.startDate && period.endDate) {
        periodStr = `de ${period.startDate} a ${period.endDate}`;
      } else if (period.type === 'estimated' && period.month && period.year) {
        periodStr = `${period.month} de ${period.year}`;
      } else {
        periodStr = 'período não especificado';
      }

      console.log(`Analyzing destination viability: ${destination} - ${periodStr}`);

      const prompt = PROMPTS.analyzeDestinationViability(destination, periodStr);
      const text = await this.callGeminiAPI(prompt, undefined, undefined, 'application/json');

      console.log('Gemini API response:', text?.substring(0, 200));

      if (!text) {
        console.error('Empty response from Gemini API');
        return null;
      }

      const result = parseJsonSafely<TripViabilityAnalysis | null>(text, null);

      if (!result) {
        console.error('Failed to parse destination viability result. Raw response:', text);
        return null;
      }

      // Validate required fields
      if (!result.viability || !result.summary || !result.pros || !result.cons) {
        console.error('Invalid response structure:', result);
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error analyzing destination viability:', error);
      return null;
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
