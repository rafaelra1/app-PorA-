import { Task, TaskCategory } from '../types/checklist';
import { Trip } from '../types';

export interface EnrichedTaskContext {
    why?: string;
    when?: string; // Textual recommendation
    how?: string;
    links?: Array<{ label: string; url: string; appLink?: string }>;
    timeWindow?: 'months_before' | 'weeks_before' | 'days_before' | 'departure_day' | 'overdue';
}

export interface EnrichedTask extends Task {
    context?: EnrichedTaskContext;
    smartTimeWindow?: string; // "2 Weeks Before", etc.
}

// Rules for enriching tasks based on keywords
const ENRICHMENT_RULES: Record<string, EnrichedTaskContext> = {
    // Documentation
    'passaporte': {
        why: 'Documento essencial para viagens internacionais. Muitos países exigem 6 meses de validade.',
        when: 'Verificar 6 meses antes. Renovar com urgência se < 6 meses.',
        how: 'Acesse o site da Polícia Federal (Brasil). Agende e pague a GRU.',
        links: [{ label: 'Agendar na PF', url: 'https://www.gov.br/pf/pt-br' }]
    },
    'visto': {
        why: 'Permissão de entrada obrigatória em alguns países (EUA, China, etc).',
        when: 'Solicitar 3-6 meses antes. Processos podem ser longos.',
        links: [{ label: 'Verificar requisitos', url: 'https://www.iatatravelcentre.com/' }]
    },
    'seguro': {
        why: 'Cobertura para emergências médicas e extravio de bagagem. Obrigatório na Europa (Schengen).',
        when: 'Contratar logo após a compra das passagens.',
        how: 'Compare coberturas. Mínimo €30k para Europa.',
    },

    // Financial
    'banco': {
        why: 'Evitar bloqueio dos cartões por suspeita de fraude no exterior.',
        when: '3 a 7 dias antes da viagem.',
        how: 'Ative o "Aviso Viagem" no app do seu banco.',
    },
    'câmbio': {
        why: 'Ter dinheiro em espécie para lugares que não aceitam cartão.',
        when: 'Acompanhe a cotação e compre aos poucos (DCA). Leve ~100 EUR/USD em espécie.',
    },

    // Health
    'vacina': {
        why: 'Alguns países exigem vacina de Febre Amarela ou outras.',
        when: 'Pelo menos 10 dias antes do embarque (tempo para imunidade e certificado).',
        how: 'Emita o CIVP no ConecteSUS se necessário.',
        links: [{ label: 'ConecteSUS', url: 'https://conectesus.saude.gov.br/' }]
    },
    'remédios': {
        why: 'Medicamentos de uso contínuo podem precisar de receita em inglês.',
        how: 'Peça ao médico uma receita com o nome genérico (substância) do medicamento.',
    },

    // Packing
    'mala': {
        why: 'Companhias aéreas têm limites rígidos de peso e tamanho.',
        when: 'Comece a organizar 3 dias antes. Feche 1 dia antes.',
        how: 'Pese a mala em casa. Identifique com tags coloridas.',
    },
    'líquidos': {
        why: 'Regra internacional de segurança para bagagem de mão.',
        how: 'Frascos de max 100ml, todos dentro de um saco zip-lock transparente de 1L.',
    },
    'adaptador': {
        why: 'Padrões de tomada variam (Europa Tipo C/F, EUA Tipo A/B, UK Tipo G).',
        when: 'Verifique e compre antes de ir (aeroporto é caro).',
    },

    // Logistics
    'check-in': {
        why: 'Garante seu assento e evita overbooking. Fila menor no aeroporto.',
        when: 'Abre 24h a 48h antes do voo.',
        how: 'Faça pelo app da cia aérea.',
    },
    'roaming': {
        why: 'Ficar conectado para mapas e tradutor é essencial.',
        when: 'Verifique plano do seu chip ou compre um eSIM internacional antes de sair.',
    }
};

/**
 * Enriches a task with contextual information based on its title and category.
 */
export function enrichTask(task: Task, trip: Trip): EnrichedTask {
    const lowerTitle = task.title.toLowerCase();

    // Find matching enrichment rule
    let context: EnrichedTaskContext = {};

    for (const [keyword, rule] of Object.entries(ENRICHMENT_RULES)) {
        if (lowerTitle.includes(keyword)) {
            context = { ...rule };
            break;
        }
    }

    // Fallback to Category-generic advice if no keyword match
    if (!context.why && !context.how) {
        switch (task.category) {
            case 'documentation':
                context.why = 'Documentação em dia evita problemas na imigração.';
                break;
            case 'health':
                context.why = 'Saúde e bem-estar para aproveitar a viagem sem preocupações.';
                break;
        }
    }

    // Determine standard time window base on due date relative to trip start
    let smartTimeWindow = 'Geral';
    let timeWindowKey: EnrichedTaskContext['timeWindow'] = 'months_before';

    if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const now = new Date();
        const tripStart = new Date(trip.startDate);

        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const daysUntilTrip = Math.ceil((tripStart.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (diffDays < 0 && !task.is_completed) {
            smartTimeWindow = 'Atrasado';
            timeWindowKey = 'overdue';
        } else if (daysUntilTrip > 30) {
            smartTimeWindow = 'Mais de 30 dias antes';
            timeWindowKey = 'months_before';
        } else if (daysUntilTrip > 14) {
            smartTimeWindow = '2 Semanas Antes';
            timeWindowKey = 'weeks_before';
        } else if (daysUntilTrip > 7) {
            smartTimeWindow = '1 Semana Antes';
            timeWindowKey = 'weeks_before';
        } else if (daysUntilTrip > 3) {
            smartTimeWindow = 'Essa Semana';
            timeWindowKey = 'days_before';
        } else if (daysUntilTrip > 0) {
            smartTimeWindow = 'Véspera / 3 Dias Antes';
            timeWindowKey = 'days_before';
        } else {
            smartTimeWindow = 'Dia do Embarque / Durante';
            timeWindowKey = 'departure_day';
        }
    }

    return {
        ...task,
        context: { ...context, timeWindow: timeWindowKey },
        smartTimeWindow
    };
}

export function groupTasksByWindow(tasks: EnrichedTask[]): Record<string, EnrichedTask[]> {
    const grouped: Record<string, EnrichedTask[]> = {};

    tasks.forEach(task => {
        const window = task.smartTimeWindow || 'Outros';
        if (!grouped[window]) {
            grouped[window] = [];
        }
        grouped[window].push(task);
    });

    // Sort keys logic could go here to ensure chronological order
    return grouped;
}
