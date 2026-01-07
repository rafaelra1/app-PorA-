import React from 'react';
import { CityGuide } from '../../../types';
import { Card, Button } from '../../ui/Base';

interface TipsTabProps {
    cityGuide: CityGuide | null;
}

const TipsTab: React.FC<TipsTabProps> = ({ cityGuide }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-300">
            <Card className="p-10 bg-[#111111] text-white border-none shadow-2xl rounded-[10px] h-fit">
                <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-10 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">verified</span> Dicas do Especialista
                </h3>
                <ul className="space-y-8">
                    {(cityGuide?.tips || []).map((tip, idx) => (
                        <li key={idx} className="flex gap-6 text-base font-semibold leading-relaxed group">
                            <span className="material-symbols-outlined text-indigo-400 shrink-0">check_circle</span> {tip}
                        </li>
                    ))}
                </ul>
            </Card>
            <div className="space-y-8">
                <Card className="p-10 bg-white border border-gray-100 shadow-soft rounded-[10px]">
                    <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-8">Próximos Passos</h4>
                    <p className="text-lg font-bold text-text-main mb-8 leading-relaxed">Pronto para transformar estas ideias em sua próxima grande jornada?</p>
                    <div className="space-y-4">
                        <Button variant="dark" className="w-full !py-4 !text-[9px] uppercase tracking-[0.2em]">Reservar Agora</Button>
                        <Button variant="outline" className="w-full !py-4 !text-[9px] uppercase tracking-[0.2em] !border-gray-100">Verificar Voos</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TipsTab;
