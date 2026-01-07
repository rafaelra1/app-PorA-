import React from 'react';

interface AIEmptyStateProps {
    onPromptClick: (destination: string, days: string) => void;
}

const promptStarters = [
    {
        icon: '🗼',
        title: 'Fim de semana romântico em Paris',
        destination: 'Paris, França',
        days: '3',
    },
    {
        icon: '⛩️',
        title: '7 dias culturais no Japão',
        destination: 'Tokyo, Japão',
        days: '7',
    },
    {
        icon: '🏔️',
        title: '5 dias de aventura na Patagônia',
        destination: 'Patagônia, Argentina',
        days: '5',
    },
    {
        icon: '🏖️',
        title: 'Férias relaxantes em Bali',
        destination: 'Bali, Indonésia',
        days: '7',
    },
    {
        icon: '🗽',
        title: 'Explorar Nova York em 4 dias',
        destination: 'Nova York, EUA',
        days: '4',
    },
    {
        icon: '🏛️',
        title: 'Roteiro histórico por Roma',
        destination: 'Roma, Itália',
        days: '4',
    },
];

const trendingDestinations = [
    { name: 'Lisboa', country: 'Portugal', emoji: '🇵🇹', reason: 'Gastronomia e cultura' },
    { name: 'Medellín', country: 'Colômbia', emoji: '🇨🇴', reason: 'Inovação e clima' },
    { name: 'Kyoto', country: 'Japão', emoji: '🇯🇵', reason: 'Tradição e natureza' },
    { name: 'Marrakech', country: 'Marrocos', emoji: '🇲🇦', reason: 'Experiência única' },
];

const AIEmptyState: React.FC<AIEmptyStateProps> = ({ onPromptClick }) => {
    return (
        <div className="flex flex-col h-full">
            {/* Main empty state */}
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-6">
                <div className="size-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-indigo-500">explore</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Para onde vamos?
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                    Preencha os campos acima ou escolha uma das sugestões abaixo para começar a planejar sua viagem dos sonhos.
                </p>

                {/* Prompt Starters */}
                <div className="w-full max-w-2xl">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-4">
                        Comece com uma dessas ideias
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {promptStarters.map((prompt, index) => (
                            <button
                                key={index}
                                onClick={() => onPromptClick(prompt.destination, prompt.days)}
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl text-left transition-all group border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                            >
                                <span className="text-2xl">{prompt.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {prompt.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{prompt.days} dias</p>
                                </div>
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-indigo-500 transition-colors">
                                    arrow_forward
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Trending Destinations */}
            <div className="border-t border-gray-100 dark:border-gray-700 py-6 px-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-amber-500">trending_up</span>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                        Destinos em Alta para 2025
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {trendingDestinations.map((dest, index) => (
                        <button
                            key={index}
                            onClick={() => onPromptClick(`${dest.name}, ${dest.country}`, '5')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-full text-sm transition-colors group"
                        >
                            <span>{dest.emoji}</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {dest.name}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 text-xs hidden sm:inline">
                                {dest.reason}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIEmptyState;
