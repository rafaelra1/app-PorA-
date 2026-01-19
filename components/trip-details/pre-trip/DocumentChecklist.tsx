import React, { useState, useEffect } from 'react';
import { Trip } from '../../../types';

interface DocumentChecklistProps {
    trip: Trip;
}

interface DocItem {
    name: string;
    checked: boolean;
}

interface DocState {
    handbag: DocItem[];
    backup: DocItem[];
}

const DEFAULT_DOCS: DocState = {
    handbag: [
        { name: 'Passaporte', checked: false },
        { name: 'Cartão de Embarque', checked: false },
        { name: 'Seguro Viagem (Apólice)', checked: false },
        { name: 'Reserva Hotel (1ª Noite)', checked: false }
    ],
    backup: [
        { name: 'Cópia do Passaporte', checked: false },
        { name: 'Todas as Reservas', checked: false },
        { name: 'Contatos de Emergência', checked: false }
    ]
};

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ trip }) => {
    const [state, setState] = useState<DocState | null>(null);

    // Initialize
    useEffect(() => {
        const key = `smart_docs_v1_${trip.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setState(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing docs', e);
                setState(DEFAULT_DOCS);
            }
        } else {
            setState(DEFAULT_DOCS);
        }
    }, [trip.id]);

    // Save
    useEffect(() => {
        if (!state) return;
        const key = `smart_docs_v1_${trip.id}`;
        localStorage.setItem(key, JSON.stringify(state));
    }, [state, trip.id]);

    const [isAddingHandbag, setIsAddingHandbag] = useState(false);
    const [newHandbag, setNewHandbag] = useState('');

    const [isAddingBackup, setIsAddingBackup] = useState(false);
    const [newBackup, setNewBackup] = useState('');

    const handleAddHandbag = () => {
        if (!newHandbag.trim() || !state) return;
        setState({
            ...state,
            handbag: [...state.handbag, { name: newHandbag, checked: false }]
        });
        setNewHandbag('');
        setIsAddingHandbag(false);
    };

    const handleAddBackup = () => {
        if (!newBackup.trim() || !state) return;
        setState({
            ...state,
            backup: [...state.backup, { name: newBackup, checked: false }]
        });
        setNewBackup('');
        setIsAddingBackup(false);
    };

    const handleToggleHandbag = (idx: number) => {
        if (!state) return;
        const newHandbag = [...state.handbag];
        newHandbag[idx].checked = !newHandbag[idx].checked;
        setState({ ...state, handbag: newHandbag });
    };

    const handleToggleBackup = (idx: number) => {
        if (!state) return;
        const newBackup = [...state.backup];
        newBackup[idx].checked = !newBackup[idx].checked;
        setState({ ...state, backup: newBackup });
    };

    const handleRemoveHandbag = (idx: number) => {
        if (!state) return;
        const newHandbag = [...state.handbag];
        newHandbag.splice(idx, 1);
        setState({ ...state, handbag: newHandbag });
    };

    const handleRemoveBackup = (idx: number) => {
        if (!state) return;
        const newBackup = [...state.backup];
        newBackup.splice(idx, 1);
        setState({ ...state, backup: newBackup });
    };

    if (!state) return null;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">folder_open</span>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Documentos para Levar</h3>
                    <p className="text-xs text-gray-500">Tenha versões física e digital</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Handbag */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3 text-gray-800 font-semibold text-sm">
                        <span className="material-symbols-outlined text-gray-400">backpack</span>
                        Na Bolsa de Mão
                    </div>
                    <div className="bg-blue-50/50 rounded-xl p-3 space-y-2 mb-2">
                        {state.handbag.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-blue-100 rounded-lg group transition-colors">
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => handleToggleHandbag(idx)}
                                    className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                />
                                <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.name}</span>
                                <div className="ml-auto flex items-center gap-2">
                                    {/* Only show visibility for default items if we had separation, but for now just general remove */}
                                    {/* <span className="material-symbols-outlined text-gray-300 text-sm">visibility</span> */}
                                    <button
                                        onClick={() => handleRemoveHandbag(idx)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isAddingHandbag ? (
                        <div className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-blue-200 mt-2 shadow-sm">
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 px-1"
                                placeholder="Nome..."
                                autoFocus
                                value={newHandbag}
                                onChange={e => setNewHandbag(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddHandbag()}
                            />
                            <button onClick={handleAddHandbag} className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded transition-colors">
                                <span className="material-symbols-outlined text-[18px]">check</span>
                            </button>
                            <button onClick={() => setIsAddingHandbag(false)} className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingHandbag(true)}
                            className="flex items-center gap-2 text-xs text-blue-600 font-medium hover:text-blue-700 mt-auto pt-1 self-start ml-1"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar
                        </button>
                    )}
                </div>

                {/* Cloud Backup */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3 text-gray-800 font-semibold text-sm">
                        <span className="material-symbols-outlined text-gray-400">cloud_upload</span>
                        Backup Digital
                    </div>
                    <div className="bg-purple-50/50 rounded-xl p-3 space-y-2 mb-2">
                        {state.backup.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-purple-100 rounded-lg group transition-colors">
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => handleToggleBackup(idx)}
                                    className="rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                                />
                                <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.name}</span>
                                <button
                                    onClick={() => handleRemoveBackup(idx)}
                                    className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {isAddingBackup ? (
                        <div className="flex gap-2 items-center bg-white p-1.5 rounded-lg border border-purple-200 mt-2 shadow-sm">
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 px-1"
                                placeholder="Nome..."
                                autoFocus
                                value={newBackup}
                                onChange={e => setNewBackup(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddBackup()}
                            />
                            <button onClick={handleAddBackup} className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded transition-colors">
                                <span className="material-symbols-outlined text-[18px]">check</span>
                            </button>
                            <button onClick={() => setIsAddingBackup(false)} className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingBackup(true)}
                            className="flex items-center gap-2 text-xs text-purple-600 font-medium hover:text-purple-700 mt-auto pt-1 self-start ml-1"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
