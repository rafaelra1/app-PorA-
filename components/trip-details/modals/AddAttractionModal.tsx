import React, { useState } from 'react';
import Modal from './Modal';
import { Attraction } from '../../../types';
import { StyledInput } from '../../ui/StyledInput';
import { StyledSelect } from '../../ui/StyledSelect';

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

const categoryOptions = CATEGORIES.map(c => ({ label: c, value: c }));

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

    const labelStyle = "w-full bg-[#8B5CF6] text-white px-4 py-2 rounded-lg font-bold text-sm tracking-wide lowercase mb-1";
    const inputStyle = "w-full px-4 py-3 bg-white border border-gray-400 rounded-lg text-gray-900 placeholder-gray-400 font-medium focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Atração Manualmente">
            <form onSubmit={handleSubmit} className="space-y-4">
                <StyledInput
                    label="Nome da Atração"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Torre Eiffel"
                />

                <StyledSelect
                    label="Categoria"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    options={categoryOptions}
                />

                <div>
                    <div className={labelStyle}>Descrição</div>
                    <textarea
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className={`${inputStyle} resize-none`}
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
        </Modal >
    );
};

export default AddAttractionModal;
