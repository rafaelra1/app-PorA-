/**
 * LLM Analysis Prompts
 *
 * Prompts optimized for trip analysis with Gemini.
 * Structured to maximize prompt caching efficiency.
 *
 * Strategy:
 * - STATIC_CONTEXT: Cached portion (travel knowledge, output format)
 * - DYNAMIC_CONTEXT: Trip-specific data that changes each request
 */

import { SerializedTripForLLM } from './types';

// =============================================================================
// Prompt Version (for cache invalidation)
// =============================================================================

export const PROMPT_VERSION = '1.0.0';

// =============================================================================
// Static Context (Cacheable)
// =============================================================================

/**
 * Travel knowledge base - can be cached across all requests
 * This includes general travel rules, requirements, and best practices
 */
export const STATIC_TRAVEL_KNOWLEDGE = `
## CONHECIMENTO BASE DE VIAGENS

### Requisitos de Entrada por Região (para brasileiros)
- **Espaço Schengen**: Até 90 dias sem visto, passaporte válido 6+ meses, seguro €30k obrigatório
- **Estados Unidos**: Precisa de visto B1/B2 (turismo/negócios)
- **Reino Unido**: Até 6 meses sem visto para turismo
- **Canadá**: Precisa de eTA (Electronic Travel Authorization)
- **Austrália**: Precisa de eVisitor ou ETA
- **Japão**: Até 90 dias sem visto para turismo

### Prazos Típicos de Processamento
- Passaporte brasileiro: 6-15 dias úteis
- Visto americano: 2-8 semanas (incluindo entrevista)
- ESTA (países VWP): até 72 horas
- eTA Canadá: minutos a dias
- Seguro viagem: imediato (compra online)
- Vacinas: 10 dias para eficácia (febre amarela)

### Alertas Sazonais Comuns
- **Golden Week (Japão)**: Final abril/início maio - tudo lotado
- **Ramadã**: Horários reduzidos em países muçulmanos
- **Monções na Ásia**: Junho-setembro variável por país
- **Inverno europeu**: Novembro-fevereiro, dias curtos, atrações com horário reduzido
- **Temporada de furacões (Caribe)**: Junho-novembro

### Tempos de Conexão Seguros
- Voo doméstico → doméstico: mínimo 1h30
- Voo doméstico → internacional: mínimo 2h30
- Voo internacional → internacional (mesmo terminal): mínimo 2h
- Voo internacional → internacional (terminais diferentes): mínimo 3h
- Com imigração no destino: adicionar 1h

### Orçamento Médio por Região (USD/dia, viajante econômico)
- Europa Ocidental: $100-150
- Europa Oriental: $50-80
- EUA: $120-180
- Japão: $100-140
- Sudeste Asiático: $40-70
- América do Sul: $50-90
`;

/**
 * Output format instructions - cached
 */
export const OUTPUT_FORMAT_INSTRUCTIONS = `
## FORMATO DE RESPOSTA

Retorne APENAS JSON válido com esta estrutura EXATA:

{
  "summary": {
    "overallAssessment": "excellent|good|needs_attention|concerns",
    "keyHighlights": ["array de 2-3 pontos principais"],
    "criticalIssues": <número>,
    "warnings": <número>,
    "tips": <número>
  },
  "insights": [
    {
      "id": "insight-<uuid>",
      "category": "timing|budget|logistics|local_events|weather|health_safety|cultural|optimization|preparation",
      "title": "Título curto e direto (max 60 caracteres)",
      "description": "Descrição detalhada do insight (max 200 caracteres)",
      "confidence": "high|medium|low",
      "severity": "critical|warning|info|tip",
      "affectedDestinations": ["lista de cidades afetadas"],
      "affectedDates": ["datas no formato YYYY-MM-DD"],
      "reasoning": "Explicação de por que isso é relevante",
      "suggestedAction": "Ação recomendada (se aplicável)"
    }
  ],
  "suggestedTasks": [
    {
      "text": "Título da tarefa (imperativo, max 50 caracteres)",
      "description": "Descrição detalhada da tarefa",
      "category": "documentation|health|reservations|financial|packing|connectivity|transport|legal|other",
      "priority": "high|medium|low",
      "urgency": "blocking|important|recommended|optional",
      "daysBeforeTrip": <número ideal de dias antes>,
      "processingTimeDays": <tempo típico de processamento>,
      "bufferDays": <margem de segurança>,
      "confidence": "high|medium|low",
      "reasoning": "Por que esta tarefa é sugerida",
      "requiresUserValidation": true|false,
      "estimatedCost": "R$ XX ou Grátis (se aplicável)",
      "helpUrl": "URL útil (se aplicável)"
    }
  ]
}

## REGRAS IMPORTANTES

1. **Não invente informações**: Se não tiver certeza, use confidence: "low"
2. **Seja específico**: Mencione datas, locais e valores concretos
3. **Evite duplicatas**: Não sugira tarefas que já existem ou são cobertas por regras determinísticas
4. **Priorize valor**: Foque em insights que o usuário não conseguiria facilmente sozinho
5. **Considere o contexto brasileiro**: Viajante saindo do Brasil, usando Real como referência
`;

/**
 * Quality guidelines - cached
 */
export const QUALITY_GUIDELINES = `
## DIRETRIZES DE QUALIDADE

### O que INCLUIR:
- Feriados locais que afetam a viagem
- Eventos especiais durante as datas (festivais, greves previstas)
- Conflitos de tempo entre atividades planejadas
- Sugestões de otimização de rota
- Alertas de clima sazonal
- Dicas específicas do destino que não são óbvias
- Problemas de logística (ex: voo chega tarde, hotel longe do aeroporto)

### O que EVITAR:
- Informações genéricas que qualquer guia teria
- Tarefas básicas já cobertas (seguro, passaporte, visto) - estas são geradas por regras
- Especulações sem base
- Recomendações de restaurantes/atrações específicos (fora do escopo)
- Informações desatualizadas (assumir dados de 2024+)

### Classificação de Severidade:
- **critical**: Pode impedir a viagem (voo perdido, documento inválido)
- **warning**: Impacto significativo na experiência (evento fechado, tempo ruim)
- **info**: Bom saber, ajuda no planejamento
- **tip**: Otimização ou dica extra
`;

// =============================================================================
// Dynamic Prompt Builder
// =============================================================================

/**
 * Build the complete analysis prompt
 * Static parts are separated for potential caching
 */
export function buildAnalysisPrompt(tripData: SerializedTripForLLM): {
  staticPart: string;
  dynamicPart: string;
  fullPrompt: string;
} {
  // Static part (cacheable)
  const staticPart = `
Você é um consultor de viagens sênior especializado em análise de riscos e otimização de roteiros.
Sua função é analisar viagens planejadas e identificar problemas, oportunidades e sugestões que
vão ALÉM das verificações básicas de documentação.

${STATIC_TRAVEL_KNOWLEDGE}

${OUTPUT_FORMAT_INSTRUCTIONS}

${QUALITY_GUIDELINES}
`;

  // Dynamic part (trip-specific)
  const dynamicPart = buildDynamicContext(tripData);

  return {
    staticPart,
    dynamicPart,
    fullPrompt: `${staticPart}\n\n${dynamicPart}`,
  };
}

/**
 * Build the dynamic (trip-specific) part of the prompt
 */
function buildDynamicContext(trip: SerializedTripForLLM): string {
  const sections: string[] = [];

  // Header
  sections.push(`
## VIAGEM PARA ANÁLISE

**ID**: ${trip.tripId}
**Título**: ${trip.title}
**Duração total**: ${trip.totalDays} dias
**Dias até embarque**: ${trip.daysUntilDeparture}
`);

  // Travelers
  sections.push(`
### Viajantes
- **Quantidade**: ${trip.travelers.count} pessoa(s)
- **Nacionalidades**: ${trip.travelers.nationalities.join(', ')}
- **Inclui crianças**: ${trip.travelers.hasChildren ? 'Sim' : 'Não'}
- **Inclui idosos**: ${trip.travelers.hasElderly ? 'Sim' : 'Não'}
${trip.travelers.dietaryRestrictions?.length ? `- **Restrições alimentares**: ${trip.travelers.dietaryRestrictions.join(', ')}` : ''}
${trip.travelers.mobilityRestrictions?.length ? `- **Restrições de mobilidade**: ${trip.travelers.mobilityRestrictions.join(', ')}` : ''}
`);

  // Destinations
  sections.push(`
### Destinos (em ordem cronológica)
${trip.destinations.map((d, i) => `
${i + 1}. **${d.name}, ${d.country}** (${d.countryCode.toUpperCase()})
   - Chegada: ${d.arrivalDate}
   - Partida: ${d.departureDate}
   - Noites: ${d.nights}
   ${d.isSchengen ? '- ⚠️ Zona Schengen' : ''}
   ${d.altitude && d.altitude > 2500 ? `- ⚠️ Altitude elevada: ${d.altitude}m` : ''}
   ${d.timezone ? `- Fuso: ${d.timezone}` : ''}
`).join('')}
`);

  // Flights
  if (trip.bookings.flights.length > 0) {
    sections.push(`
### Voos Confirmados
${trip.bookings.flights.map((f, i) => `
${i + 1}. ${f.from} → ${f.to}
   - Data: ${f.date} às ${f.time}
   - Companhia: ${f.airline}
   ${f.duration ? `- Duração: ${f.duration}` : ''}
`).join('')}
`);
  }

  // Hotels
  if (trip.bookings.hotels.length > 0) {
    sections.push(`
### Hospedagem Confirmada
${trip.bookings.hotels.map((h, i) => `
${i + 1}. **${h.name}** (${h.city})
   - Check-in: ${h.checkIn}
   - Check-out: ${h.checkOut}
   - ${h.nights} noite(s)
`).join('')}
`);
  }

  // Activities
  if (trip.bookings.activities.length > 0) {
    sections.push(`
### Atividades Planejadas
${trip.bookings.activities.map((a, i) => `
${i + 1}. ${a.name} (${a.city})
   - Data: ${a.date}${a.time ? ` às ${a.time}` : ''}
   ${a.duration ? `- Duração estimada: ${a.duration}` : ''}
   - Status: ${a.isBooked ? 'Reservado' : 'Planejado (sem reserva)'}
`).join('')}
`);
  }

  // Budget
  if (trip.budget) {
    sections.push(`
### Orçamento
- **Total**: ${trip.budget.currency} ${trip.budget.total?.toLocaleString('pt-BR') || 'Não definido'}
${trip.budget.perDay ? `- **Por dia**: ${trip.budget.currency} ${trip.budget.perDay.toLocaleString('pt-BR')}` : ''}
`);
  }

  // Existing tasks
  if (trip.existingTasks.length > 0) {
    const completed = trip.existingTasks.filter(t => t.completed);
    const pending = trip.existingTasks.filter(t => !t.completed);

    sections.push(`
### Preparação Atual
**Tarefas concluídas (${completed.length}):** ${completed.map(t => t.text).join(', ') || 'Nenhuma'}
**Tarefas pendentes (${pending.length}):** ${pending.map(t => t.text).join(', ') || 'Nenhuma'}
`);
  }

  // User notes
  if (trip.userNotes) {
    sections.push(`
### Notas do Viajante
"${trip.userNotes}"
`);
  }

  // Trip type
  if (trip.tripType) {
    sections.push(`
### Tipo de Viagem
${trip.tripType}
`);
  }

  // Analysis request
  sections.push(`
---

## TAREFA

Analise esta viagem e forneça:

1. **Insights contextuais** que vão além das verificações básicas de documentação
2. **Potenciais problemas** de timing, logística ou planejamento
3. **Oportunidades de otimização** que o viajante pode não ter considerado
4. **Tarefas sugeridas** que complementem (não dupliquem) as verificações automáticas

Lembre-se: Tarefas básicas como "contratar seguro", "verificar passaporte", "solicitar visto" já são
geradas automaticamente por regras. Foque em insights que requerem análise contextual.

**Data de análise**: ${new Date().toISOString().split('T')[0]}
`);

  return sections.join('\n');
}

// =============================================================================
// Specialized Prompts
// =============================================================================

/**
 * Quick validation prompt - for validating LLM suggestions
 */
export function buildValidationPrompt(
  originalTrip: SerializedTripForLLM,
  suggestions: unknown
): string {
  return `
Você é um validador de sugestões de viagem. Analise as seguintes sugestões e verifique:

1. As datas mencionadas estão dentro do período da viagem?
2. Os destinos mencionados existem na viagem?
3. Os custos sugeridos são plausíveis?
4. As informações são atuais (2024+)?
5. Há sugestões duplicadas ou redundantes?

DADOS DA VIAGEM:
- Período: ${originalTrip.destinations[0]?.arrivalDate} a ${originalTrip.destinations[originalTrip.destinations.length - 1]?.departureDate}
- Destinos: ${originalTrip.destinations.map(d => d.name).join(', ')}

SUGESTÕES PARA VALIDAR:
${JSON.stringify(suggestions, null, 2)}

Retorne JSON:
{
  "isValid": true|false,
  "confidence": 0.0-1.0,
  "issues": [
    {
      "type": "hallucination|outdated|implausible|duplicate|irrelevant",
      "description": "Descrição do problema",
      "severity": "blocking|warning",
      "field": "campo afetado (opcional)"
    }
  ]
}
`;
}

/**
 * Focused analysis prompts for specific concerns
 */
export const FOCUSED_PROMPTS = {
  /**
   * Analyze time allocation
   */
  timeAnalysis: (trip: SerializedTripForLLM) => `
Analise a alocação de tempo desta viagem e identifique:
- Dias muito cheios ou muito vazios
- Tempo insuficiente em destinos específicos
- Conflitos de horário entre atividades
- Tempo de deslocamento subestimado

${buildDynamicContext(trip)}

Retorne JSON com insights focados em "timing".
`,

  /**
   * Analyze logistics
   */
  logisticsAnalysis: (trip: SerializedTripForLLM) => `
Analise a logística desta viagem e identifique:
- Conexões de voo apertadas
- Distância entre hotel e atrações
- Transporte entre cidades
- Potenciais problemas de bagagem

${buildDynamicContext(trip)}

Retorne JSON com insights focados em "logistics".
`,

  /**
   * Analyze local events
   */
  eventsAnalysis: (trip: SerializedTripForLLM) => `
Pesquise eventos locais relevantes para esta viagem:
- Feriados nacionais/locais nos destinos
- Festivais ou eventos especiais
- Greves ou manifestações previstas
- Fechamentos sazonais de atrações

${buildDynamicContext(trip)}

Retorne JSON com insights focados em "local_events".
`,
};
