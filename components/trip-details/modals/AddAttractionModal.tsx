import React, { useState } from 'react';
import Modal from './Modal';
import { Attraction } from '../../../types';

interface AddAttractionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (attraction: { name: string; category: string; description: string }) => void;
}

const CATEGORIES = [
    "Marcos Históricos",
    "Museus e Galerias",
    "Parques e Natureza",
    "Vida Noturna",
    "Compras",
    "Gastronomia",
    "Outro"
];

const AddAttractionModal: React.FC<AddAttractionModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({ name, category, description });
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Atração Manualmente">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Atração</label>
                    <input
                        required
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-semibold"
                        placeholder="Ex: Torre Eiffel"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-semibold"
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                    <textarea
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                        placeholder="Uma breve descrição do local..."
                    />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-[10px] transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" className="px-6 py-2 bg-[#111111] text-white font-bold rounded-[10px] shadow-soft hover:shadow-lg transition-all transform hover:-translate-y-1">
                        Adicionar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddAttractionModal;
