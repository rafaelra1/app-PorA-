import React from 'react';
import { EntryRequirements } from '../../../../types/preTripBriefing';

interface EntryRequirementsSectionProps {
    entry: EntryRequirements;
}

export const EntryRequirementsSection: React.FC<EntryRequirementsSectionProps> = ({ entry }) => {
    return (
        <section className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🛂</span> Requisitos de Entrada
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Visa Policy */}
                <div className={`rounded-xl p-4 border ${entry.visaPolicy.isVisaFree ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${entry.visaPolicy.isVisaFree ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            <span className="material-symbols-outlined text-xl">verified_user</span>
                        </div>
                        <div>
                            <h3 className={`text-base font-bold mb-1 ${entry.visaPolicy.isVisaFree ? 'text-emerald-900' : 'text-amber-900'}`}>
                                {entry.visaPolicy.title}
                            </h3>
                            <p className={`text-sm ${entry.visaPolicy.isVisaFree ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {entry.visaPolicy.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Documents */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm h-full">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-gray-400 text-base">description</span>
                            Documentos Sugeridos
                        </h3>
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            Para imigração
                        </span>
                    </div>
                    <div className="p-4">
                        <div className="bg-amber-50 text-amber-800 text-xs p-2 rounded-lg mb-3 flex gap-2">
                            <span className="material-symbols-outlined text-xs mt-0.5">warning</span>
                            <p>Embora nem sempre peçam todos, ter estes documentos impressos ou salvos offline evita problemas.</p>
                        </div>
                        <ul className="space-y-2">
                            {entry.documents.map((doc, idx) => (
                                <li key={idx} className="flex items-start gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className={`mt-0.5 rounded flex items-center justify-center p-0.5 ${doc.required ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 bg-gray-100'}`}>
                                        <span className="material-symbols-outlined text-base">
                                            {doc.required ? 'check_box' : 'check_box_outline_blank'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <span className={`text-xs font-medium block ${doc.required ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {doc.name}
                                        </span>
                                        {doc.note && (
                                            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{doc.note}</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Vaccines */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-6 lg:col-span-2">
                    <div className="flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Obrigatórias</span>
                        {entry.vaccines.mandatory.length > 0 ? (
                            <ul className="space-y-1">
                                {entry.vaccines.mandatory.map((v, i) => (
                                    <li key={i} className="flex items-center gap-2 text-rose-700 font-medium bg-rose-50 px-2 py-1 rounded-md inline-block mr-2 text-xs">
                                        <span className="material-symbols-outlined text-[10px]">vaccines</span>
                                        {v}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-xs italic">Nenhuma vacina obrigatória.</p>
                        )}
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Recomendadas</span>
                        {entry.vaccines.recommended.length > 0 ? (
                            <ul className="space-y-1">
                                {entry.vaccines.recommended.map((v, i) => (
                                    <li key={i} className="flex items-center gap-2 text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded-md inline-block mr-2 text-xs">
                                        <span className="material-symbols-outlined text-[10px]">medical_services</span>
                                        {v}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-xs italic">Nenhuma recomendação específica.</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
