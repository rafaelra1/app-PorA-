import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
    delay?: number;
    className?: string;
}

/**
 * Simple tooltip component for hover hints
 * Used in compact sidebar mode to show navigation labels
 */
export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    side = 'right',
    delay = 200,
    className = '',
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const offset = 8;

            let x = 0;
            let y = 0;

            switch (side) {
                case 'right':
                    x = rect.right + offset;
                    y = rect.top + rect.height / 2;
                    break;
                case 'left':
                    x = rect.left - offset;
                    y = rect.top + rect.height / 2;
                    break;
                case 'top':
                    x = rect.left + rect.width / 2;
                    y = rect.top - offset;
                    break;
                case 'bottom':
                    x = rect.left + rect.width / 2;
                    y = rect.bottom + offset;
                    break;
            }

            setPosition({ x, y });
        }
    }, [isVisible, side]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const getTransformOrigin = () => {
        switch (side) {
            case 'right': return 'left center';
            case 'left': return 'right center';
            case 'top': return 'center bottom';
            case 'bottom': return 'center top';
        }
    };

    const getTranslate = () => {
        switch (side) {
            case 'right': return 'translateY(-50%)';
            case 'left': return 'translate(-100%, -50%)';
            case 'top': return 'translate(-50%, -100%)';
            case 'bottom': return 'translateX(-50%)';
        }
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                className={className}
            >
                {children}
            </div>

            {isVisible && (
                <div
                    role="tooltip"
                    className="fixed z-[100] px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: getTranslate(),
                        transformOrigin: getTransformOrigin(),
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${side === 'right' ? '-left-1 top-1/2 -translate-y-1/2' :
                                side === 'left' ? '-right-1 top-1/2 -translate-y-1/2' :
                                    side === 'top' ? 'left-1/2 -translate-x-1/2 -bottom-1' :
                                        'left-1/2 -translate-x-1/2 -top-1'
                            }`}
                    />
                </div>
            )}
        </>
    );
};

export default Tooltip;
