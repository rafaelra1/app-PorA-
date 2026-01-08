import React, { useState, useEffect } from 'react';

const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300">
            <span className="material-symbols-outlined text-amber-500">wifi_off</span>
            <div className="flex flex-col">
                <span className="text-sm font-bold">Sem conexão</span>
                <span className="text-[10px] text-gray-300">Usando modo offline</span>
            </div>
        </div>
    );
};

export default OfflineIndicator;
