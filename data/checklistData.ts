export interface CheckListTask {
    id: string;
    text: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
    isCritical?: boolean;
    deadline?: string;
    category: 'visa' | 'booking' | 'health' | 'insurance' | 'other' | 'packing';
}

export const STANDARD_TASKS: CheckListTask[] = [
    {
        id: 'std-1',
        text: 'Fazer check-in online',
        completed: false,
        priority: 'high',
        category: 'other',
        isCritical: true,
        deadline: '10/02/2026' // This would ideally be dynamic based on trip date
    },
    {
        id: 'std-2',
        text: 'Contratar seguro viagem',
        completed: false,
        priority: 'high',
        category: 'insurance',
        isCritical: true
    },
    {
        id: 'std-3',
        text: 'Verificar validade do passaporte',
        completed: true,
        priority: 'high',
        category: 'visa'
    },
    {
        id: 'std-4',
        text: 'Confirmar reservas de hotel',
        completed: false,
        priority: 'medium',
        category: 'booking'
    }
];

export const RANDOM_TASKS: CheckListTask[] = [
    {
        id: 'rnd-1',
        text: 'Baixar mapas offline',
        completed: false,
        priority: 'medium',
        category: 'other'
    },
    {
        id: 'rnd-2',
        text: 'Comprar chip de internet internacional',
        completed: false,
        priority: 'medium',
        category: 'other'
    },
    {
        id: 'rnd-3',
        text: 'Pesquisar restaurantes locais',
        completed: false,
        priority: 'low',
        category: 'other'
    },
    {
        id: 'rnd-4',
        text: 'Avisar o banco sobre a viagem',
        completed: false,
        priority: 'high',
        category: 'other'
    },
    {
        id: 'rnd-5',
        text: 'Montar playlist para a viagem',
        completed: false,
        priority: 'low',
        category: 'other'
    },
    {
        id: 'rnd-6',
        text: 'Verificar previsão do tempo',
        completed: false,
        priority: 'medium',
        category: 'packing'
    },
    {
        id: 'rnd-7',
        text: 'Separar documentos impressos',
        completed: false,
        priority: 'high',
        category: 'visa'
    }
];

export const getInitialTasks = (): CheckListTask[] => {
    // Clone standard tasks so we don't mutate the source
    const tasks = [...STANDARD_TASKS.map(t => ({ ...t }))];

    // Select 3 random tasks
    const randomSelection = [...RANDOM_TASKS]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(t => ({ ...t })); // Clone to avoid mutation

    return [...tasks, ...randomSelection];
};
