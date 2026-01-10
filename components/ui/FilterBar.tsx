import React, { ReactNode } from 'react';
import { Icon } from './Icon';

interface FilterBarProps {
    children?: ReactNode;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    rightContent?: ReactNode;
    className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    children,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    rightContent,
    className = ""
}) => {
    return (
        <div className={`
      flex flex-col md:flex-row items-start md:items-center justify-between gap-4 
      bg-white p-4 rounded-2xl shadow-soft border border-gray-100
      ${className}
    `}>
            {/* Filters Area */}
            {children && (
                <div className="flex flex-wrap items-center gap-2">
                    {children}
                </div>
            )}

            {/* Search & Controls Area */}
            <div className={`flex items-center gap-3 w-full md:w-auto ${!children ? 'md:ml-auto' : ''}`}>
                {onSearchChange && (
                    <div className="relative w-full md:w-auto">
                        <Icon
                            name="search"
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
                        />

                        <input
                            type="text"
                            value={searchValue || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="
                pl-9 pr-8 py-2 rounded-xl border border-gray-100 text-xs font-medium 
                focus:ring-2 focus:ring-primary focus:border-primary w-full md:w-48
                bg-gray-50/50 focus:bg-white transition-all outline-none
              "
                        />

                        {searchValue && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main"
                            >
                                <Icon name="close" size="sm" />
                            </button>
                        )}
                    </div>
                )}

                {rightContent}
            </div>
        </div>
    );
};
