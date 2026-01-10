import React, { useState } from 'react';
import { DebugInfo } from '../../types';

export const DebugPanel: React.FC<{ info: DebugInfo }> = ({ info }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-[10px] uppercase font-bold text-gray-400 hover:text-indigo-600 tracking-wider mt-4 flex items-center gap-1 transition-colors"
            >
                <span className="material-symbols-outlined text-sm">bug_report</span>
                Debug Info
            </button>
        );
    }

    return (
        <div className="mt-4 p-3 bg-gray-900 text-gray-200 rounded-xl text-xs font-mono overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-green-400">terminal</span>
                    <span className="font-bold text-green-400">DEBUG INFO</span>
                    <span className="text-gray-500 px-1.5 py-0.5 bg-gray-800 rounded">{info.model}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `debug-case-${Date.now()}.json`;
                            a.click();
                        }}
                        className="text-gray-400 hover:text-blue-400 flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white"
                    >
                        Hide
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <div className="font-bold text-gray-500 mb-1 text-[10px] uppercase">Prompt</div>
                    <div className="max-h-32 overflow-y-auto whitespace-pre-wrap bg-black/30 p-2 rounded text-gray-300">{info.prompt}</div>
                </div>
                <div>
                    <div className="font-bold text-gray-500 mb-1 text-[10px] uppercase">Raw Response</div>
                    <div className="max-h-64 overflow-y-auto whitespace-pre-wrap bg-black/30 p-2 rounded text-amber-100">{info.rawResponse}</div>
                </div>
            </div>
        </div>
    );
};
