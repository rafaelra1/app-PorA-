import React, { useState } from 'react';

interface OverviewQuickActionsProps {
    onChecklist?: () => void;
    onBudget?: () => void; // Using 'Budget' instead of 'Bagagem' based on context, or stick to Bagagem?
    // User asked for "checklist" and "bagagem". I'll stick to that.
    onLuggage?: () => void;
    onAlerts?: () => void;
}

export const OverviewQuickActions: React.FC<OverviewQuickActionsProps> = ({ onChecklist, onLuggage, onAlerts }) => {
    const [activeTab, setActiveTab] = useState<'alerts' | null>('alerts'); // Default active for demo

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => { setActiveTab('alerts'); onAlerts?.(); }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all text-center
          ${activeTab === 'alerts' ? 'bg-[#FF9F43] text-white shadow-md' : 'bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200'}
        `}
            >
                alertas
            </button>

            <button
                onClick={onChecklist}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200 transition-all text-center"
            >
                checklist
            </button>

            <button
                onClick={onLuggage}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200 transition-all text-center"
            >
                bagagem
            </button>
        </div>
    );
};
