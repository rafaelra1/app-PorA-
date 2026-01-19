import React from 'react';
import { MoneyCosts } from '../../../../types/preTripBriefing';

interface MoneyCostsSectionProps {
    money: MoneyCosts;
}

export const MoneyCostsSection: React.FC<MoneyCostsSectionProps> = ({ money }) => {
    return (
        <section className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💶</span> Dinheiro & Custos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Exchange Rate Card */}
                <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-indigo-200 text-[10px] font-medium mb-1 uppercase tracking-wide">Cotação Atual ({money.exchangeRate.currencyCode})</p>
                        <div className="text-2xl font-mono font-bold tracking-tight mb-1">
                            € 1 = R$ {money.exchangeRate.rate.toFixed(2)}
                        </div>
                        <p className="text-indigo-200 text-[10px]">
                            Atualizado: {money.exchangeRate.lastUpdated}
                        </p>
                    </div>
                    <div className="absolute top-2 right-2 text-indigo-500 opacity-20">
                        <span className="material-symbols-outlined text-4xl">currency_exchange</span>
                    </div>
                </div>

                {/* Daily Budget */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-gray-400 text-base">account_balance_wallet</span>
                        Média Diária (por pessoa)
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🎒</span>
                                <span className="font-medium text-gray-700 text-xs">Econômico</span>
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{money.dailyBudget.economic}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-l-4 border-indigo-500">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">💼</span>
                                <span className="font-medium text-gray-700 text-xs">Moderado</span>
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{money.dailyBudget.moderate}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">💎</span>
                                <span className="font-medium text-gray-700 text-xs">Confortável</span>
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{money.dailyBudget.comfortable}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reference Prices Table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-[10px] uppercase tracking-wide">Preços de Referência</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {money.referencePrices.map((item, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 text-base">sell</span>
                                <span className="text-gray-700 font-medium text-xs">{item.item}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-gray-900 font-bold text-sm">{item.priceEuro}</div>
                                <div className="text-[10px] text-gray-500">{item.priceReal}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Methods & Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-2 text-[10px] uppercase">Formas de Pagamento</h3>
                    <ul className="space-y-1">
                        {money.paymentMethods.map((pm, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className={`material-symbols-outlined text-sm mt-0.5 ${pm.accepted ? 'text-green-600' : 'text-rose-500'}`}>
                                    {pm.accepted ? 'check_circle' : 'cancel'}
                                </span>
                                <span className={`${pm.accepted ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                    {pm.method}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                        <strong>Dica:</strong> Use cartões como Wise ou Nomad para economizar no IOF.
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">Gorjetas</h3>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                        {money.tips}
                    </p>
                    <div className="flex gap-2">
                        <div className="bg-gray-100 px-3 py-1 rounded text-xs font-bold text-gray-600">Restaurantes: 5-10%</div>
                        <div className="bg-gray-100 px-3 py-1 rounded text-xs font-bold text-gray-600">Táxi: Arredondar</div>
                    </div>
                </div>
            </div>

        </section>
    );
};
