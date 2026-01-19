import React from 'react';
import { EmergencySafety } from '../../../../types/preTripBriefing';

interface EmergencySafetySectionProps {
    safety: EmergencySafety;
}

export const EmergencySafetySection: React.FC<EmergencySafetySectionProps> = ({ safety }) => {
    return (
        <section className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🆘</span> Emergências & Segurança
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emergency Numbers */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-rose-500 text-lg">campaign</span>
                        Telefones Úteis
                    </h3>
                    <div className="space-y-2">
                        {safety.numbers.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                <span className="text-gray-700 font-medium text-xs">{item.label}</span>
                                <a href={`tel:${item.number}`} className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded hover:bg-rose-100 transition-colors text-sm">
                                    {item.number}
                                </a>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-sm">save_alt</span>
                        Salvar nos Contatos
                    </button>
                </div>

                {/* Safety & Health */}
                <div className="space-y-4">
                    {/* Safety Level */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-emerald-600 text-2xl">verified_user</span>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Nível de Segurança</span>
                                <h3 className="text-lg font-bold text-emerald-900 leading-none">{safety.safetyLevel.label}</h3>
                            </div>
                        </div>
                        <p className="text-emerald-800 text-xs leading-relaxed mb-3">
                            {safety.safetyLevel.description}
                        </p>

                        <div className="bg-white/60 rounded-lg p-2">
                            <span className="text-[10px] font-bold text-emerald-900 uppercase mb-1 block">Cuidados Básicos:</span>
                            <ul className="space-y-1">
                                {safety.precautions.map((p, i) => (
                                    <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                                        <span className="text-emerald-500 mt-0.5">•</span>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Health */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5 text-sm">
                            <span className="material-symbols-outlined text-blue-500 text-lg">medical_services</span>
                            Saúde
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">
                            <strong className="text-gray-900">Sistema Público:</strong> {safety.health.system}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="material-symbols-outlined text-green-600 text-sm">local_pharmacy</span>
                            {safety.health.pharmacies}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
