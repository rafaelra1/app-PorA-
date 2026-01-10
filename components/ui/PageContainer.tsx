import React, { ReactNode } from 'react';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    animate?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
    children,
    className = "",
    animate = true
}) => {
    return (
        <div
            className={`
        flex flex-col gap-6 
        ${animate ? 'animate-in fade-in duration-500' : ''} 
        ${className}
      `}
        >
            {children}
        </div>
    );
};
