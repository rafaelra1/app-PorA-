import React, { ReactNode } from 'react';

interface PageHeaderProps {
    title: ReactNode;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    actions,
    className = ""
}) => {
    return (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
            <div>
                <h1 className="text-2xl font-extrabold text-text-main">{title}</h1>
                {description && (
                    <p className="text-text-muted text-sm mt-1">{description}</p>
                )}
            </div>

            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};
