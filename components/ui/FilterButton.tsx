import React, { ReactNode } from 'react';

interface FilterButtonProps {
    children: ReactNode;
    isActive: boolean;
    onClick: () => void;
    count?: number;
    className?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
    children,
    isActive,
    onClick,
    count,
    className = ""
}) => {
    const activeClasses = "bg-text-main text-white shadow-sm";
    const inactiveClasses = "bg-gray-50 text-text-muted hover:bg-gray-100";

    return (
        <button
            onClick={onClick}
            className={`
        px-4 py-2 rounded-xl text-xs font-bold transition-all
        ${isActive ? activeClasses : inactiveClasses}
        ${className}
      `}
        >
            {children}
            {count !== undefined && (
                <span className={`ml-1.5 opacity-80 ${isActive ? 'text-white' : 'text-text-muted'}`}>
                    ({count})
                </span>
            )}
        </button>
    );
};
