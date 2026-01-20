import { PreTripBriefingData } from '../types/preTripBriefing';

export const PORTUGAL_BRIEFING_DATA: PreTripBriefingData = {
    destination: 'Portugal',
    tripDuration: '7 dias',
    season: 'Inverno',
    hookMessage: 'Portugal é familiar, mas tem diferenças importantes que todo brasileiro deve conhecer',
    quickFacts: [
        { label: 'FUSO', value: '+3h (BR)', subValue: 'Lisboa', icon: 'schedule' },
        { label: 'MOEDA', value: 'Euro (€)', subValue: '€1 = R$5,42', icon: 'euro', actionLabel: 'Conversor' },
        { label: 'IDIOMA', value: 'Português', subValue: '(diferenças!)', icon: 'translate' },
        { label: 'TOMADA', value: 'Tipo F', subValue: '230V', icon: 'power', actionLabel: 'Preciso?' },
        { label: 'CLIMA', value: '8-15°C', subValue: 'Chuva: 40%', icon: 'thermostat', actionLabel: '7 dias' },
        { label: 'TELEFONE', value: '+351', subValue: 'Chip local?', icon: 'call', actionLabel: 'Opções' },
        { label: 'TRÂNSITO', value: 'Mão direita', subValue: '(igual BR)', icon: 'directions_car' },
        { label: 'ÁGUA', value: 'Potável ✓', subValue: 'Pode beber da torneira', icon: 'water_drop' }
    ],
    differences: [
        {
            id: 'comm',
            title: 'Comunicação',
            icon: '💬',
            items: [
                { term: 'Pequeno almoço', description: 'café da manhã' },
                { term: 'Autocarro', description: 'ônibus' },
                { term: 'Casa de banho', description: 'banheiro' },
                { term: 'Telemóvel', description: 'celular' },
                'Evite usar "você" — portugueses preferem "tu" ou tratar pelo nome',
                'Falar alto pode ser mal visto em lugares fechados'
            ]
        },
        {
            id: 'money',
            title: 'Dinheiro & Gorjetas',
            icon: '💰',
            items: [
                'Gorjeta NÃO é obrigatória (diferente dos EUA)',
                'Se quiser dar: 5-10% ou arredondar a conta',
                'Cartão aceito em quase todo lugar',
                'Sempre tenha ~€20 em dinheiro para emergências pequenas'
            ]
        },
        {
            id: 'food',
            title: 'Alimentação',
            icon: '🍽️',
            items: [
                'Almoço: 12h-15h | Jantar: 19h-22h',
                'Porções são GRANDES (meia dose existe!)',
                '"Couvert" (pão, azeitonas) é cobrado — pode recusar se não tocar',
                'Água é sempre cobrada em restaurantes',
                'Café = expresso pequeno (não é "cafézinho" coado)'
            ]
        },
        {
            id: 'transport',
            title: 'Transporte',
            icon: '🚇',
            items: [
                'Metrô fecha às 1h da manhã',
                'Uber/Bolt funcionam bem e são baratos',
                'Trem (CP) é pontual — chegue no horário!',
                'Validar bilhete antes de entrar no trem é obrigatório'
            ]
        },
        {
            id: 'shopping',
            title: 'Comércio',
            icon: '🛍️',
            items: [
                'Lojas de rua fecham cedo (19h-20h)',
                'Domingo: muita coisa fechada (exceto shoppings)',
                'Centros comerciais (shoppings) abrem até mais tarde (23h)',
                'Farmácias: procure cruz verde luminosa'
            ]
        },
        {
            id: 'electricity',
            title: 'Eletricidade',
            icon: '⚡',
            items: [
                'Tomada tipo F (dois pinos redondos, fundo)',
                'Voltagem: 230V (verificar seus aparelhos!)',
                'Adaptador universal resolve'
            ]
        },
        {
            id: 'connectivity',
            title: 'Conectividade',
            icon: '📱',
            items: [
                'WiFi gratuito em muitos cafés e restaurantes e praças',
                'Chip local: Vodafone, MEO, NOS são as principais',
                'eSIM: Airalo, Holafly funcionam muito bem',
                'WhatsApp funciona normal com internet (geralmente não conta dados em alguns planos)'
            ]
        }
    ],
    culture: {
        dos: [
            { text: 'Cumprimente com "Bom dia/Boa tarde/Boa noite" ao entrar em lojas' },
            { text: 'Diga "Faz favor" ao chamar alguém ou pedir algo' },
            { text: 'Diga "Obrigado/Obrigada" sempre' },
            { text: 'Respeite filas — português leva isso a sério' },
            { text: 'Chegue no horário em compromissos' },
            { text: 'Elogie a comida (portugueses têm orgulho da culinária)' }
        ],
        donts: [
            { text: 'Falar muito alto em lugares públicos (restaurantes, transporte)' },
            { text: 'Comparar Portugal com Espanha o tempo todo' },
            { text: 'Chamar português de "espanhol"' },
            { text: 'Usar "você" excessivamente (soa formal demais ou agressivo dependendo do tom)' },
            { text: 'Piadas sobre colonização (tema sensível atualmente)' },
            { text: 'Reclamar do atendimento (é mais direto que no Brasil, não é rudeza)' },
            { text: 'Esperar abraços/beijos efusivos de desconhecidos (são mais reservados)' }
        ],
        greetings: [
            { context: 'Homens', description: 'Aperto de mão firme' },
            { context: 'Mulheres', description: 'Dois beijos no rosto (começando pela direita)' },
            { context: 'Negócios', description: 'Sempre aperto de mão primeiro' }
        ]
    },
    entry: {
        visaPolicy: {
            title: 'Visto para Brasileiros',
            description: 'DISPENSADO para turismo (até 90 dias). Espaço Schengen: pode visitar 26 países europeus.',
            isVisaFree: true
        },
        documents: [
            { name: 'Passaporte (validade > 3 meses após retorno)', required: true },
            { name: 'Passagem de volta confirmada', required: true },
            { name: 'Comprovante de hospedagem', required: true },
            { name: 'Seguro viagem (cobertura mínima €30.000)', required: true },
            { name: 'Comprovante financeiro (~€75/dia)', required: true, note: 'Dinheiro ou extrato de cartão' }
        ],
        vaccines: {
            mandatory: [],
            recommended: ['COVID-19 (Atualizada)', 'Antitetânica']
        }
    },
    money: {
        exchangeRate: {
            currencyCode: 'EUR',
            currencyName: 'Euro',
            rate: 5.42,
            lastUpdated: 'há 2 horas'
        },
        dailyBudget: {
            economic: '€50-80',
            moderate: '€100-150',
            comfortable: '€200+'
        },
        referencePrices: [
            { item: 'Café expresso', priceEuro: '€0,70-1,00', priceReal: '~R$ 4-5' },
            { item: 'Cerveja (bar/imperial)', priceEuro: '€2-4', priceReal: '~R$ 11-22' },
            { item: 'Almoço simples (prato do dia)', priceEuro: '€8-12', priceReal: '~R$ 43-65' },
            { item: 'Jantar médio', priceEuro: '€15-25', priceReal: '~R$ 81-135' },
            { item: 'Metrô (bilhete único)', priceEuro: '€1,80', priceReal: '~R$ 10' },
            { item: 'Uber (corrida 5km)', priceEuro: '€5-8', priceReal: '~R$ 27-43' },
            { item: 'Hotel 3★ (diária)', priceEuro: '€60-100', priceReal: '~R$ 325-540' }
        ],
        paymentMethods: [
            { method: 'Cartão de crédito internacional (Visa/Master)', accepted: true },
            { method: 'Cartão de débito internacional (Wise, Nomad)', accepted: true },
            { method: 'Apple Pay / Google Pay', accepted: true },
            { method: 'Dinheiro (Euros)', accepted: true },
            { method: 'PIX', accepted: false },
            { method: 'Cartões débito só bandeira nacional (Elo/VR)', accepted: false }
        ],
        tips: 'Gorjeta não é obrigatória em Portugal. O serviço geralmente já está incluído nas contas maiores, mas deixar um troco é visto como gentileza.'
    },
    safety: {
        safetyLevel: {
            status: 'safe',
            label: 'MUITO SEGURO',
            description: 'Portugal é o 3º país mais seguro do mundo (Global Peace Index). Crimes violentos são raros.'
        },
        numbers: [
            { label: 'Emergência Geral', number: '112' },
            { label: 'Polícia (PSP)', number: '112' },
            { label: 'Ambulância (INEM)', number: '112' },
            { label: 'Embaixada Brasil', number: '+351 21 724 8510' },
            { label: 'Consulado (Plantão)', number: '+351 96 399 9843' }
        ],
        precautions: [
            'Atenção a pickpockets (batedores de carteira) em áreas muito turísticas (elétrico 28, Baixa).',
            'Não deixe celular ou carteira no bolso de trás da calça em multidões.',
            'Cuidado com o "golpe do mapa" ou pessoas oferecendo ajuda excessiva no caixa eletrônico.',
            'Evite ostentar objetos de alto valor em ruas desertas à noite (senso comum).'
        ],
        health: {
            system: 'SNS (Serviço Nacional de Saúde). Atende turistas, mas é pago (não é gratuito como o SUS).',
            insurancePolicy: '#123456789 (Allianz)',
            pharmacies: 'Cruz verde luminosa. Farmácias de serviço 24h em todos os bairros.'
        }
    },
    phrases: [
        {
            category: 'Básico',
            phrases: [
                { original: 'Bom dia / Boa tarde / Boa noite' },
                { original: 'Obrigado / Obrigada' },
                { original: 'Faz favor (Por favor)' },
                { original: 'Com licença' },
                { original: 'Desculpe' }
            ]
        },
        {
            category: 'Restaurante',
            phrases: [
                { original: 'A conta, faz favor' },
                { original: 'Queria uma mesa para 2' },
                { original: 'Meia dose, faz favor', meaning: 'Porção menor (muito comum)' },
                { original: 'Não quero couvert', meaning: 'Recusar as entradas pagas' },
                { original: 'Uma imperial', meaning: 'Chopp / Cerveja de pressão (Lisboa)' },
                { original: 'Um fino', meaning: 'Chopp / Cerveja de pressão (Porto)' }
            ]
        },
        {
            category: 'Transporte',
            phrases: [
                { original: 'Onde fica...?' },
                { original: 'Quanto custa?' },
                { original: 'Um bilhete para...', meaning: 'Uma passagem' },
                { original: 'A que horas parte?', meaning: 'Que horas sai?' }
            ]
        },
        {
            category: 'Emergência',
            phrases: [
                { original: 'Preciso de ajuda' },
                { original: 'Chame a polícia' },
                { original: 'Onde fica o hospital?' },
                { original: 'Perdi meu passaporte' }
            ]
        }
    ],
    apps: [
        {
            name: 'Citymapper',
            category: 'Transporte',
            description: 'Melhor app para transporte público em Lisboa e Porto. Integra metrô, ônibus e caminhada.',
            icon: 'directions_transit',
            iosUrl: '#', androidUrl: '#'
        },
        {
            name: 'Uber / Bolt',
            category: 'Transporte',
            description: 'Apps de corrida. Bolt costuma ser ligeiramente mais barato que Uber em Portugal.',
            icon: 'local_taxi',
            iosUrl: '#', androidUrl: '#'
        },
        {
            name: 'CP (Comboios de Portugal)',
            category: 'Transporte',
            description: 'Oficial para horários e bilhetes de trem intermunicipais (Lisboa-Porto).',
            icon: 'train',
            iosUrl: '#', androidUrl: '#'
        },
        {
            name: 'Zomato',
            category: 'Restaurantes',
            description: 'Muito forte em Portugal para descobrir restaurantes e ver cardápios/fotos.',
            icon: 'restaurant',
            iosUrl: '#', androidUrl: '#'
        },
        {
            name: 'TheFork',
            category: 'Restaurantes',
            description: 'Ótimo para reservas e descontos de até 50% em restaurantes.',
            icon: 'percent',
            iosUrl: '#', androidUrl: '#'
        },
        {
            name: 'Google Translate',
            category: 'Comunicação',
            description: 'Use a câmera para traduzir placas ou cardápios instantaneamente.',
            icon: 'translate',
            iosUrl: '#', androidUrl: '#'
        }
    ],
    weather: {
        summary: 'Fevereiro é inverno e chuvoso! Traga casaco impermeável.',
        forecast: [
            { date: '2026-02-15', dayOfWeek: 'Sáb', conditionIcon: '🌤️', maxTemp: 15, minTemp: 8, rainProb: 10 },
            { date: '2026-02-16', dayOfWeek: 'Dom', conditionIcon: '🌧️', maxTemp: 13, minTemp: 9, rainProb: 70 },
            { date: '2026-02-17', dayOfWeek: 'Seg', conditionIcon: '⛅', maxTemp: 12, minTemp: 8, rainProb: 40 },
            { date: '2026-02-18', dayOfWeek: 'Ter', conditionIcon: '☀️', maxTemp: 14, minTemp: 7, rainProb: 10 },
            { date: '2026-02-19', dayOfWeek: 'Qua', conditionIcon: '☀️', maxTemp: 16, minTemp: 9, rainProb: 5 },
            { date: '2026-02-20', dayOfWeek: 'Qui', conditionIcon: '🌤️', maxTemp: 15, minTemp: 8, rainProb: 20 },
            { date: '2026-02-21', dayOfWeek: 'Sex', conditionIcon: '⛅', maxTemp: 14, minTemp: 8, rainProb: 30 }
        ],
        packingList: [
            'Casaco impermeável leve ou Trench coat',
            'Camadas (cebola): camiseta + malha + casaco',
            'Sapatos confortáveis e resistentes à água (botas)',
            'Cachecol (venta bastante)',
            'Guarda-chuva compacto e resistente',
            'Hidratante labial (frio resseca)'
        ]
    }
};

export const GENERIC_BRIEFING_DATA: PreTripBriefingData = {
    destination: 'Destino',
    tripDuration: 'Verificar datas',
    season: 'Verificar estação',
    hookMessage: 'Prepare-se para sua viagem internacional',
    quickFacts: [
        { label: 'FUSO', value: 'Verificar', subValue: 'GMT', icon: 'schedule' },
        { label: 'MOEDA', value: 'Local', subValue: 'Cotação?', icon: 'euro', actionLabel: 'Pesquisar' },
        { label: 'IDIOMA', value: 'Local/Inglês', subValue: 'Básico', icon: 'translate' },
        { label: 'TOMADA', value: 'Universal', subValue: 'Levar adaptador', icon: 'power' },
        { label: 'CLIMA', value: 'Variável', subValue: 'Ver previsão', icon: 'thermostat' },
        { label: 'TELEFONE', value: 'Roaming', subValue: 'eSIM recomendado', icon: 'call' },
        { label: 'TRÂNSITO', value: 'Local', subValue: 'Cuidado', icon: 'directions_car' },
        { label: 'ÁGUA', value: 'Pesquisar', subValue: 'Garrafa segura', icon: 'water_drop' }
    ],
    differences: [
        {
            id: 'general',
            title: 'Dicas Gerais',
            icon: 'info',
            items: [
                'Pesquise sobre costumes locais antes de viajar',
                'Verifique se é necessário visto',
                'Tenha sempre cópia do passaporte',
                'Respeite as leis e tradições locais'
            ]
        }
    ],
    culture: {
        dos: [
            { text: 'Aprenda palavras básicas no idioma local (Olá, Obrigado)' },
            { text: 'Respeite vestimentas em locais religiosos' },
            { text: 'Seja educado e paciente' }
        ],
        donts: [
            { text: 'Não tire fotos de pessoas sem permissão' },
            { text: 'Evite assuntos polêmicos (política, religião)' },
            { text: 'Não jogue lixo na rua' }
        ],
        greetings: [
            { context: 'Geral', description: 'Observe como os locais se cumprimentam' }
        ]
    },
    entry: {
        visaPolicy: {
            title: 'Requisitos de Entrada',
            description: 'Verifique a necessidade de visto para seu destino. A maioria dos destinos populares dispensa visto para brasileiros.',
            isVisaFree: true
        },
        documents: [
            { name: 'Passaporte (validade > 6 meses)', required: true },
            { name: 'Passagem de retorno', required: true },
            { name: 'Comprovante de hospedagem', required: true },
            { name: 'Seguro viagem internacional', required: true }
        ],
        vaccines: {
            mandatory: [],
            recommended: ['Vacinas em dia']
        }
    },
    money: {
        exchangeRate: {
            currencyCode: 'XXX',
            currencyName: 'Moeda Local',
            rate: 0,
            lastUpdated: '-'
        },
        dailyBudget: {
            economic: '$50-80',
            moderate: '$100-150',
            comfortable: '$200+'
        },
        referencePrices: [
            { item: 'Café', priceEuro: '-', priceReal: '-' },
            { item: 'Refeição simples', priceEuro: '-', priceReal: '-' },
            { item: 'Transporte', priceEuro: '-', priceReal: '-' }
        ],
        paymentMethods: [
            { method: 'Cartão de crédito internacional', accepted: true },
            { method: 'Dinheiro local', accepted: true }
        ],
        tips: 'Verifique a cultura de gorjetas do país.'
    },
    safety: {
        safetyLevel: {
            status: 'safe',
            label: 'VERIFIQUE',
            description: 'Pesquise sobre a segurança específica do seu destino antes de viajar.'
        },
        numbers: [
            { label: 'Emergência', number: '112 / 911' },
            { label: 'Seguro Viagem', number: 'Tenha em mãos' }
        ],
        precautions: [
            'Mantenha seus pertences seguros.',
            'Evite andar sozinho à noite em locais desconhecidos.',
            'Tenha cópias de documentos importantes.'
        ],
        health: {
            system: 'Verifique se precisa de seguro saúde (altamente recomendado).',
            insurancePolicy: '-',
            pharmacies: 'Leve seus medicamentos de uso contínuo.'
        }
    },
    phrases: [
        {
            category: 'Essencial',
            phrases: [
                { original: 'Olá' },
                { original: 'Obrigado' },
                { original: 'Por favor' },
                { original: 'Não entendo' },
                { original: 'Fala inglês?' }
            ]
        }
    ],
    apps: [
        {
            name: 'Google Maps',
            category: 'Navegação',
            description: 'Essencial para se locomover.',
            icon: 'map',
            iosUrl: '#', androidUrl: '#'
        },
        {
            name: 'Google Translate',
            category: 'Idioma',
            description: 'Tradução instantânea de textos e voz.',
            icon: 'translate',
            iosUrl: '#', androidUrl: '#'
        },
        {
            name: 'Uber',
            category: 'Transporte',
            description: 'Verifique se funciona no destino.',
            icon: 'local_taxi',
            iosUrl: '#', androidUrl: '#'
        }
    ],
    weather: {
        summary: 'Verifique a previsão do tempo antes de viajar.',
        forecast: [],
        packingList: [
            'Roupas adequadas ao clima',
            'Sapatos confortáveis',
            'Adaptador universal',
            'Power bank'
        ]
    }
};
