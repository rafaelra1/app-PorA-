import React, { useMemo, useState, useEffect } from 'react';
import { Trip } from '../../../types';

interface SmartBaggageProps {
    trip: Trip;
}

interface ClothingItem {
    item: string;
    qty: number;
}

interface EssentialItem {
    item: string;
    checked: boolean;
}

interface BaggageState {
    clothes: ClothingItem[];
    essentials: EssentialItem[];
}

// Extract logic to helper for initial state
const getSuggestions = (trip: Trip) => {
    const dest = trip.destination.toLowerCase();
    const startDate = trip.startDate || '';

    // Simple logic for cold/beach
    // Fallback if Date parsing fails (though trip.startDate should be ISO)
    let month = 0;
    try {
        month = new Date(startDate).getMonth();
    } catch (e) {
        month = 0;
    }

    let isCold = false;
    let isBeach = false;

    if ((dest.includes('lisboa') || dest.includes('porto') || dest.includes('paris') || dest.includes('london')) && (month <= 2 || month >= 10)) {
        isCold = true;
    } else if (dest.includes('bahia') || dest.includes('rio') || dest.includes('nordeste') || dest.includes('praia')) {
        isBeach = true;
    }

    return {
        title: isCold ? 'Mala de Inverno' : isBeach ? 'Mala de Praia' : 'Mala Essencial',
        temp: isCold ? '8-15°C' : isBeach ? '25-30°C' : '20-25°C',
        clothes: isCold ? [
            { item: 'Casacos (1 impermeável)', qty: 2 },
            { item: 'Calças (jeans/veludo)', qty: 3 },
            { item: 'Blusas (camadas)', qty: 5 },
            { item: 'Sapatos confortáveis', qty: 2 },
            { item: 'Cachecol/Luvas', qty: 1 }
        ] : [
            { item: 'Camisetas leves', qty: 5 },
            { item: 'Shorts/Bermudas', qty: 3 },
            { item: 'Roupa de banho', qty: 2 },
            { item: 'Chinelo', qty: 1 },
            { item: 'Óculos de sol', qty: 1 }
        ],
        essentials: [
            { item: 'Adaptador de tomada', checked: false },
            { item: 'Carregador + Powerbank', checked: false },
            { item: 'Fones de ouvido', checked: false },
            { item: 'Nécessaire (líquidos <100ml)', checked: false }
        ]
    };
};

export const SmartBaggage: React.FC<SmartBaggageProps> = ({ trip }) => {
    // Derived info (title/temp) can stay memoized or derived from helpers, 
    // but the lists need to be stateful.
    // We'll calculate the base info just for the header text.
    const baseInfo = useMemo(() => getSuggestions(trip), [trip.destination, trip.startDate]);

    const [state, setState] = useState<BaggageState | null>(null);

    // Load from LocalStorage or Init
    useEffect(() => {
        const key = `smart_baggage_v1_${trip.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setState(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing saved baggage', e);
                const initial = getSuggestions(trip);
                setState({ clothes: initial.clothes, essentials: initial.essentials });
            }
        } else {
            const initial = getSuggestions(trip);
            setState({ clothes: initial.clothes, essentials: initial.essentials });
        }
    }, [trip.id]); // We might want to re-run if trip *actually* changes completely, but id should cover it.

    // Save to LocalStorage
    useEffect(() => {
        if (!state) return;
        const key = `smart_baggage_v1_${trip.id}`;
        localStorage.setItem(key, JSON.stringify(state));
    }, [state, trip.id]);

    // Adding Items
    const [isAddingCloth, setIsAddingCloth] = useState(false);
    const [newClothName, setNewClothName] = useState('');
    const [newClothQty, setNewClothQty] = useState(1);

    const [isAddingEssential, setIsAddingEssential] = useState(false);
    const [newEssentialName, setNewEssentialName] = useState('');

    const handleAddCloth = () => {
        if (!newClothName.trim() || !state) return;
        setState({
            ...state,
            clothes: [...state.clothes, { item: newClothName, qty: newClothQty }]
        });
        setNewClothName('');
        setNewClothQty(1);
        setIsAddingCloth(false);
    };

    const handleAddEssential = () => {
        if (!newEssentialName.trim() || !state) return;
        setState({
            ...state,
            essentials: [...state.essentials, { item: newEssentialName, checked: false }]
        });
        setNewEssentialName('');
        setIsAddingEssential(false);
    };

    const handleToggleEssential = (idx: number) => {
        if (!state) return;
        const newEssentials = [...state.essentials];
        newEssentials[idx].checked = !newEssentials[idx].checked;
        setState({ ...state, essentials: newEssentials });
    };

    const handleRemoveCloth = (idx: number) => {
        if (!state) return;
        const newClothes = [...state.clothes];
        newClothes.splice(idx, 1);
        setState({ ...state, clothes: newClothes });
    };

    const handleRemoveEssential = (idx: number) => {
        if (!state) return;
        const newEssentials = [...state.essentials];
        newEssentials.splice(idx, 1);
        setState({ ...state, essentials: newEssentials });
    };

    if (!state) return null; // or skeleton

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">luggage</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Bagagem Inteligente</h3>
                        <p className="text-xs text-gray-500">Baseado em: {trip.destination} • {baseInfo.temp}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clothes */}
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roupas Sugeridas</h4>
                    </div>
                    <ul className="space-y-2 mb-2">
                        {state.clothes.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm text-gray-700 group">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRemoveCloth(idx)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                        title="Remover"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                    <span>{item.item}</span>
                                </div>
                                <span className="font-medium text-gray-900">{item.qty}</span>
                            </li>
                        ))}
                    </ul>

                    {isAddingCloth ? (
                        <div className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-orange-200 mt-2 shadow-sm">
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 px-1"
                                placeholder="Nome..."
                                autoFocus
                                value={newClothName}
                                onChange={e => setNewClothName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCloth()}
                            />
                            <input
                                type="number"
                                className="w-10 text-sm bg-gray-50 rounded px-1 py-0.5 outline-none text-center"
                                value={newClothQty}
                                min={1}
                                onChange={e => setNewClothQty(parseInt(e.target.value) || 1)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCloth()}
                            />
                            <button onClick={handleAddCloth} className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded transition-colors">
                                <span className="material-symbols-outlined text-[18px]">check</span>
                            </button>
                            <button onClick={() => setIsAddingCloth(false)} className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingCloth(true)}
                            className="flex items-center gap-2 text-xs text-orange-600 font-medium hover:text-orange-700 mt-auto pt-2 self-start"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar Item
                        </button>
                    )}
                </div>

                {/* Essentials */}
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens Essenciais</h4>
                    </div>
                    <ul className="space-y-2 mb-2">
                        {state.essentials.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between text-sm text-gray-700 group">
                                <div
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => handleToggleEssential(idx)}
                                >
                                    <span className={`material-symbols-outlined text-lg ${item.checked ? 'text-orange-500' : 'text-gray-400'}`}>
                                        {item.checked ? 'check_box' : 'check_box_outline_blank'}
                                    </span>
                                    <span className={item.checked ? 'line-through text-gray-400 transition-colors' : ''}>{item.item}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveEssential(idx)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                    title="Remover"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {isAddingEssential ? (
                        <div className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-orange-200 mt-2 shadow-sm">
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 px-1"
                                placeholder="Nome..."
                                autoFocus
                                value={newEssentialName}
                                onChange={e => setNewEssentialName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddEssential()}
                            />
                            <button onClick={handleAddEssential} className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded transition-colors">
                                <span className="material-symbols-outlined text-[18px]">check</span>
                            </button>
                            <button onClick={() => setIsAddingEssential(false)} className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingEssential(true)}
                            className="flex items-center gap-2 text-xs text-orange-600 font-medium hover:text-orange-700 mt-auto pt-2 self-start"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar Item
                        </button>
                    )}
                </div>
            </div>

            {/* Weight Bar Mock */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-600">Estimativa de Peso</span>
                    <span className="text-gray-400">~12kg / 23kg</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 w-1/2 rounded-full" />
                </div>
            </div>
        </div>
    );
};
