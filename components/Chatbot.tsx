
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiService } from '../services/geminiService';
import { MessageCircle, X, Send, Bot, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const Chatbot: React.FC = () => {
    const geminiService = getGeminiService();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Olá! Sou o assistente virtual do PorAí. Como posso ajudar na sua viagem hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || !geminiService) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Prepare history for API (excluding the very first greeting if needed, 
            // but keeping it simple for now)
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await geminiService.chat(userMessage, history);

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReset = () => {
        setMessages([
            { role: 'assistant', content: 'Olá! Sou o assistente virtual do PorAí. Como posso ajudar na sua viagem hoje?' }
        ]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Assistente PorAí</h3>
                                    <p className="text-xs text-emerald-100 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleReset}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/90 hover:text-white"
                                    title="Reiniciar conversa"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/90 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                            }`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                                <Bot size={12} />
                                                <span className="text-[10px] uppercase font-bold tracking-wider">PorAí AI</span>
                                            </div>
                                        )}
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-emerald-600" />
                                        <span className="text-xs text-gray-500 font-medium">Digitando...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-gray-100">
                            <div className="flex items-end gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Pergunte sobre sua viagem..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-sm max-h-32 resize-none text-gray-700 placeholder-gray-400"
                                    rows={1}
                                    style={{ minHeight: '40px' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mb-0.5"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">Powered by Gemini AI ✨</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center pointer-events-auto"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
};

export default Chatbot;
