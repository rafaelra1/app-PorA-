# Bug Report: Atividades não aparecem no Itinerário

## Problema
Quando o usuário adiciona uma atração ao itinerário através do modal "Adicionar ao Itinerário", a atividade não aparece na página de itinerário na data e horário correspondentes.

---

## Causa Raiz: Incompatibilidade de Formato de Data

### Fluxo Atual (Com Bug)

```
1. AddToItineraryModal
   └── Input date: "2026-01-23" (YYYY-MM-DD - formato HTML)
   └── Envia para onConfirm: { date: "2026-01-23", time: "12:30", ... }

2. AttractionsTab.handleConfirmItinerary
   └── Repassa para: onAddToItinerary(data)

3. TripDetails.handleAddItineraryActivity (linha 600)
   └── Converte data: formatToDisplayDate("2026-01-23") → "23/01/2026" (DD/MM/YYYY)
   └── Cria: newActivity = { date: "23/01/2026", ... }
   └── Chama: addActivity(trip.id, newActivity)

4. ItineraryContext.addActivity (linha 81)
   └── Salva no Supabase: date: "23/01/2026" ❌ (Supabase espera YYYY-MM-DD)

5. ItineraryContext.fetchActivities (linha 43)
   └── Lê do Supabase: item.date (retorna como foi salvo ou NULL se inválido)
   └── Retorna: activities com date em formato inconsistente

6. ItineraryView.generatedItinerary (linha 318)
   └── dateStr = formatDate("2026-01-23") → "23/01/2026"
   └── Filtra: customActivities.filter(a => a.date === dateStr)
   └── ❌ NÃO ENCONTRA porque o formato pode estar diferente
```

---

## Problema Específico

**Linha 600 em TripDetails.tsx:**
```tsx
date: data.date.includes('-') ? formatToDisplayDate(data.date) : data.date,
```

Esta linha converte `YYYY-MM-DD` para `DD/MM/YYYY` ANTES de salvar no banco.

**Mas o Supabase:**
- Espera formato `DATE` ou `YYYY-MM-DD` para colunas de data
- Se receber `DD/MM/YYYY`, pode:
  - Falhar silenciosamente
  - Salvar como string sem validação
  - Interpretar incorretamente (mês/dia invertidos)

**Linha 318 em ItineraryView.tsx:**
```tsx
const dateCustomActivities = customActivities.filter(a => a.date === dateStr);
```

O `dateStr` é gerado como `DD/MM/YYYY`, mas se o banco retornou `YYYY-MM-DD`, não haverá correspondência.

---

## Solução Proposta

### Opção 1: Manter formato ISO no banco (Recomendado)

**1. Alterar TripDetails.tsx (linha 600):**
```tsx
// ANTES (com bug):
date: data.date.includes('-') ? formatToDisplayDate(data.date) : data.date,

// DEPOIS (corrigido):
date: data.date, // Manter YYYY-MM-DD para o banco
```

**2. Alterar ItineraryView.tsx (linha 253 e 318):**
```tsx
// Linha 253 - Gerar dateStr em formato ISO para comparação
const dateStr = current.toISOString().split('T')[0]; // "2026-01-23"

// Linha 318 - Filtrar usando formato ISO
const dateCustomActivities = customActivities.filter(a => {
    // Normalizar ambos os formatos para comparação
    const activityDateISO = a.date.includes('/')
        ? parseDisplayDate(a.date)  // DD/MM/YYYY → YYYY-MM-DD
        : a.date;
    return activityDateISO === dateStr;
});
```

**3. Exibição - Converter para DD/MM/YYYY apenas no render:**
```tsx
// No header do dia:
<h3>{formatDate(day.date)}</h3>  // Exibe como DD/MM/YYYY
```

### Opção 2: Normalização no Contexto (Alternativa)

Converter formatos no `ItineraryContext` ao ler/salvar:

```tsx
// addActivity - garantir formato ISO antes de salvar
const normalizedDate = activity.date.includes('/')
    ? parseDisplayDate(activity.date)
    : activity.date;

await supabase.from('itinerary_activities').insert([{
    ...
    date: normalizedDate, // Sempre YYYY-MM-DD
    ...
}]);

// fetchActivities - garantir formato DD/MM/YYYY ao ler
const validActivities = data.map(item => ({
    ...
    date: item.date.includes('-') ? formatToDisplayDate(item.date) : item.date,
    ...
}));
```

---

## Arquivos a Modificar

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `pages/TripDetails.tsx` | 600 | Não converter data - manter YYYY-MM-DD |
| `contexts/ItineraryContext.tsx` | 81 | Normalizar para YYYY-MM-DD antes de salvar |
| `contexts/ItineraryContext.tsx` | 43 | Normalizar para DD/MM/YYYY após ler |
| `components/trip-details/itinerary/ItineraryView.tsx` | 253, 318 | Usar formato consistente na comparação |

---

## Teste de Validação

1. Adicionar atração ao itinerário via City Guide
2. Navegar para aba "Roteiro"
3. Verificar se atividade aparece no dia correto
4. Verificar se horário está correto
5. Editar atividade e verificar se mantém dados
6. Recarregar página e verificar persistência

---

## Prioridade
**ALTA** - Funcionalidade core quebrada

## Impacto
- Usuários não conseguem ver atividades adicionadas
- Planejamento de viagem comprometido
- Dados podem estar sendo perdidos ou corrompidos no banco
