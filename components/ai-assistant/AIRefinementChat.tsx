import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';

interface AIRefinementChatProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    onSurpriseMe: () => void;
    isLoading: boolean;
}

const AIRefinementChat: React.FC<AIRefinementChatProps> = ({
    messages,
    onSendMessage,
    onSurpriseMe,
    isLoading,
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const quickActions = [
        { label: 'Menos cansativo', icon: '😴', action: 'Achei o roteiro muito cansativo. Remova uma atividade de cada dia.' },
        { label: 'Mais cultural', icon: '🏛️', action: 'Adicione mais atividades culturais, como museus e monumentos históricos.' },
        { label: 'Opções indoor', icon: '🏠', action: 'Preciso de alternativas indoor caso esteja chovendo.' },
        { label: 'Mais gastronômico', icon: '🍽️', action: 'Troque algumas atividades por experiências gastronômicas locais.' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">chat</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Refinar Roteiro</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Peça ajustes ou sugestões</p>
                    </div>
                </div>
                <button
                    onClick={onSurpriseMe}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-medium rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg shadow-amber-200 dark:shadow-amber-900 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-lg">auto_fix_high</span>
                    Surpreenda-me
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[200px] max-h-[300px]">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">forum</span>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Não gostou de algo? Peça para eu mudar...
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                            <div className="flex items-center gap-2">
                                <span className="animate-spin material-symbols-outlined text-indigo-500 text-sm">refresh</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Atualizando roteiro...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => onSendMessage(action.action)}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full transition-colors disabled:opacity-50"
                        >
                            <span>{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ex: Troque o almoço do dia 2 por comida japonesa..."
                        disabled={isLoading}
                        className="flex-1 rounded-xl border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 py-3 px-4 text-sm disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIRefinementChat;
