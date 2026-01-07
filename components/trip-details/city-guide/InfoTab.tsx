import React, { useRef, useEffect, useState } from 'react';
import { City } from '../../../types';
import { weatherService, WeatherData } from '../../../services/weatherService';
import { getFlagsForDestinations } from '../../../lib/countryUtils';
import {
    Sparkles, Compass, Lightbulb, Map as MapIcon, Info,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Bold, Italic, Type, Plus,
    Pencil, Check, X,
    MapPin, Star, Phone, Utensils, Zap, Droplets, Banknote
} from 'lucide-react';
import { Card } from '../../ui/Base';
import WhatToKnowModal from '../modals/WhatToKnowModal';
import { getGeminiService } from '../../../services/geminiService';

interface InfoTabProps {
    city: City;
    cityGuide: any;
    onEditorialChange: (content: string) => void;
    onGenerateEditorial: () => void;
    isGeneratingEditorial: boolean;
    groundingInfo?: any;
    groundingLinks?: any[];
    isGroundingLoading?: boolean;
    onTabChange?: (tab: any) => void;
    // New Props for Integration
    accommodations?: any[];
    transports?: any[];
    onAddAccommodation?: () => void;
    onAddTransport?: () => void;
    onViewAccommodation?: () => void;
    onViewTransport?: () => void;
}

const RichTextToolbar: React.FC<{ editorRef: React.RefObject<HTMLDivElement> }> = ({ editorRef }) => {
    const handleCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) editorRef.current.focus();
    };

    return (
        <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 rounded-t-xl overflow-x-auto">
            <button onClick={() => handleCommand('bold')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Negrito"><Bold className="w-4 h-4" /></button>
            <button onClick={() => handleCommand('italic')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Itálico"><Italic className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button onClick={() => handleCommand('justifyLeft')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Esquerda"><AlignLeft className="w-4 h-4" /></button>
            <button onClick={() => handleCommand('justifyCenter')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Centro"><AlignCenter className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button onClick={() => handleCommand('fontSize', '3')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Normal"><Type className="w-4 h-4" /></button>
        </div>
    );
};

const InfoTab: React.FC<InfoTabProps> = ({
    city,
    cityGuide,
    onEditorialChange,
    onGenerateEditorial,
    isGeneratingEditorial,
    onTabChange,
    accommodations,
    transports,
    onAddAccommodation,
    onAddTransport,
    onViewAccommodation,
    onViewTransport
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Notes state
    const [userNotes, setUserNotes] = useState('Adicione suas notas pessoais aqui...');
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    // Weather state
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);

    // Fetch Weather
    useEffect(() => {
        let isMounted = true;

        const fetchWeather = async () => {
            if (!city.name) return;
            setIsLoadingWeather(true);
            try {
                const data = await weatherService.getCurrentWeather(city.name);
                if (isMounted) setWeather(data);
            } catch (err) {
                console.error("Failed to load weather", err);
            } finally {
                if (isMounted) setIsLoadingWeather(false);
            }
        };

        fetchWeather();

        return () => { isMounted = false; };
    }, [city.name]);

    // Sync content
    useEffect(() => {
        if (isEditing && editorRef.current && city.editorialContent) {
            if (editorRef.current.innerHTML !== city.editorialContent) {
                editorRef.current.innerHTML = city.editorialContent;
            }
        }
    }, [isEditing, city.editorialContent]);

    const handleSave = () => {
        if (editorRef.current) {
            onEditorialChange(editorRef.current.innerHTML);
        }
        setIsEditing(false);
    };

    // What to Know State
    const [isWhatToKnowModalOpen, setIsWhatToKnowModalOpen] = useState(false);
    const [whatToKnowContent, setWhatToKnowContent] = useState<string | null>(null);
    const [isGeneratingWhatToKnow, setIsGeneratingWhatToKnow] = useState(false);

    const handleOpenWhatToKnow = async () => {
        setIsWhatToKnowModalOpen(true);
        if (!whatToKnowContent) {
            await handleGenerateWhatToKnow();
        }
    };

    const handleGenerateWhatToKnow = async () => {
        setIsGeneratingWhatToKnow(true);
        try {
            const content = await getGeminiService().generateWhatToKnow(city.name);
            setWhatToKnowContent(content);
        } catch (error) {
            console.error("Failed to generate tips", error);
        } finally {
            setIsGeneratingWhatToKnow(false);
        }
    };

    // MOCK DATA for Dashboard Widgets - REMOVED


    return (
        <div className="w-full space-y-8 animate-in fade-in duration-300">

            {/* TOP ROW: About & Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* About Box (Editable) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {(() => {
                                const flags = getFlagsForDestinations(city.country);
                                return flags.length > 0 ? (
                                    <img
                                        src={flags[0]}
                                        alt={city.country}
                                        className="size-8 rounded-full object-cover border border-gray-100 shadow-sm"
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-green-500 text-3xl">deck</span>
                                );
                            })()}
                            <h3 className="text-3xl font-black text-text-main tracking-tight">Sobre {city.name}</h3>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="p-1.5 text-text-muted hover:text-primary transition-colors bg-gray-50 rounded-lg">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={onGenerateEditorial} disabled={isGeneratingEditorial} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                                {isGeneratingEditorial ? 'Gerando...' : 'Reescrever com IA'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1">
                        {isEditing ? (
                            <div className="h-full border border-gray-200 rounded-xl bg-gray-50/50">
                                <RichTextToolbar editorRef={editorRef} />
                                <div ref={editorRef} contentEditable className="p-4 outline-none min-h-[200px]" />
                                <div className="p-2 flex justify-end gap-2 border-t border-gray-200">
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs font-bold text-gray-500">Cancelar</button>
                                    <button onClick={handleSave} className="px-3 py-1 text-xs font-bold text-white bg-text-main rounded-lg">Salvar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none text-text-muted leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: city.editorialContent || "<p>Uma cidade incrível esperando para ser explorada.</p>" }}
                            />
                        )}
                    </div>
                </div>

                {/* Right Column Stack */}
                <div className="space-y-4">
                    {/* Weather Box */}
                    <div className="bg-blue-50/50 rounded-3xl p-6 flex items-center justify-between border border-blue-100/50 min-h-[140px]">
                        {isLoadingWeather ? (
                            <div className="flex-1 flex flex-col gap-2 animate-pulse">
                                <div className="h-4 w-12 bg-blue-200/50 rounded"></div>
                                <div className="h-10 w-24 bg-blue-200/50 rounded"></div>
                                <div className="h-4 w-32 bg-blue-200/50 rounded"></div>
                            </div>
                        ) : weather ? (
                            <>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">AGORA</p>
                                    <h4 className="text-4xl font-black text-blue-950 mb-1">{weather.temp}°C</h4>
                                    <p className="text-xs font-bold text-blue-800/60">{weather.condition}</p>
                                </div>
                                <div className={`${weather.isNight ? 'text-blue-900' : 'text-yellow-400'}`}>
                                    <span className="material-symbols-outlined text-5xl">{weather.icon}</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full text-blue-300 gap-1">
                                <span className="material-symbols-outlined text-3xl">cloud_off</span>
                                <span className="text-xs font-medium">Clima indisponível</span>
                            </div>
                        )}
                    </div>

                    {/* Horizontal Row: Map, Attractions, Gastronomy */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* City Map Box */}
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city.name + ' ' + (city.country || ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative h-28 rounded-2xl overflow-hidden group shadow-sm cursor-pointer hover:shadow-md transition-all block"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt="Mapa"
                            />
                            <div className="absolute inset-0 bg-black/50"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-2 drop-shadow-lg">
                                <span className="material-symbols-outlined text-3xl mb-1 drop-shadow-md text-white">map</span>
                                <span className="text-sm font-black drop-shadow-md text-white">Mapa</span>
                            </div>
                        </a>

                        {/* Attractions Box */}
                        <div
                            onClick={() => onTabChange && onTabChange('attractions')}
                            className="relative h-28 rounded-2xl overflow-hidden group shadow-sm cursor-pointer hover:shadow-md transition-all"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=400"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt="Atrações"
                            />
                            <div className="absolute inset-0 bg-black/50"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-2 drop-shadow-lg">
                                <span className="material-symbols-outlined text-3xl mb-1 drop-shadow-md text-white">attractions</span>
                                <span className="text-sm font-black drop-shadow-md text-white">Atrações</span>
                            </div>
                        </div>

                        {/* Gastronomy Box */}
                        <div
                            onClick={() => onTabChange && onTabChange('gastronomy')}
                            className="relative h-28 rounded-2xl overflow-hidden group shadow-sm cursor-pointer hover:shadow-md transition-all"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt="Gastronomia"
                            />
                            <div className="absolute inset-0 bg-black/50"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-2 drop-shadow-lg">
                                <span className="material-symbols-outlined text-3xl mb-1 drop-shadow-md text-white">restaurant</span>
                                <span className="text-sm font-black drop-shadow-md text-white">Comida</span>
                            </div>
                        </div>
                    </div>

                    {/* What to Know Widget */}
                    <div
                        onClick={handleOpenWhatToKnow}
                        className="bg-purple-50 rounded-3xl p-5 border border-purple-100 shadow-sm cursor-pointer group hover:shadow-md transition-all relative overflow-hidden"
                    >
                        {/* Decorator */}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-purple-600">lightbulb</span>
                        </div>

                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-500">lightbulb</span> O Que Saber
                            </h3>
                            <span className="text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded-full shadow-sm">AI Dicas</span>
                        </div>

                        <div className="relative z-10">
                            <p className="font-bold text-sm text-text-main mb-1">Antes de chegar</p>
                            <p className="text-xs text-text-muted line-clamp-2">
                                {whatToKnowContent
                                    ? "Informações essenciais sobre mala, clima e chegada prontos para você."
                                    : "Descubra o que levar na mala, dicas de moeda e costumes locais."}
                            </p>

                            <button className="mt-3 w-full py-1.5 bg-white rounded-xl text-xs font-bold text-purple-600 hover:bg-purple-100 transition-colors shadow-sm">
                                {whatToKnowContent ? "Ler Dicas" : "Gerar com IA"}
                            </button>
                        </div>
                    </div>

                    {/* Accommodation Widget */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-500">bed</span> Hospedagem
                            </h3>
                            {accommodations && accommodations.length > 0 && (
                                <button onClick={onViewAccommodation} className="text-[10px] font-bold text-primary hover:underline">Ver</button>
                            )}
                        </div>

                        {accommodations && accommodations.length > 0 ? (
                            <div className="flex gap-3 items-center group cursor-pointer" onClick={onViewAccommodation}>
                                <img
                                    src={accommodations[0].image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=200"}
                                    alt={accommodations[0].name}
                                    className="size-12 rounded-lg object-cover"
                                />
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-text-main truncate">{accommodations[0].name}</p>
                                    <p className="text-xs text-text-muted">{accommodations[0].nights} noites • Check-in {accommodations[0].checkIn}</p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={onAddAccommodation}
                                className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-text-muted hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">add</span> Adicionar Hotel
                            </button>
                        )}
                    </div>

                    {/* Transport Widget */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">flight_takeoff</span> Transporte (Chegada)
                            </h3>
                            {transports && transports.length > 0 && (
                                <button onClick={onViewTransport} className="text-[10px] font-bold text-primary hover:underline">Ver</button>
                            )}
                        </div>

                        {transports && transports.length > 0 ? (
                            <div className="flex gap-3 items-center group cursor-pointer" onClick={onViewTransport}>
                                <div className="size-12 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-xl">
                                        {transports[0].type === 'flight' ? 'flight' : transports[0].type === 'train' ? 'train' : 'directions_car'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-text-main truncate">{transports[0].operator || 'Transporte'}</p>
                                    <p className="text-xs text-text-muted">{transports[0].arrivalDate}</p>
                                    {transports[0].reference && <p className="text-[10px] text-gray-400">{transports[0].reference}</p>}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={onAddTransport}
                                className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-text-muted hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">add</span> Adicionar Chegada
                            </button>
                        )}
                    </div>

                    {/* USER NOTES SECTION */}
                    <div className="border border-gray-200 rounded-3xl p-6 bg-yellow-50/30 shadow-sm border border-yellow-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-600">edit_note</span> Minhas Notas
                            </h3>
                        </div>
                        <textarea
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 text-text-main text-sm leading-relaxed p-0 placeholder:text-gray-400 placeholder:italic"
                            placeholder="Escreva aqui suas anotações, reservas ou lembretes..."
                        />
                    </div>


                </div>
            </div>







            {/* What To Know Modal */}
            <WhatToKnowModal
                isOpen={isWhatToKnowModalOpen}
                onClose={() => setIsWhatToKnowModalOpen(false)}
                content={whatToKnowContent || ''}
                isLoading={isGeneratingWhatToKnow}
                onRegenerate={handleGenerateWhatToKnow}
                locationName={city.name}
            />

        </div >
    );
};

export default InfoTab;
