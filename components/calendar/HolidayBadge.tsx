import React, { useState } from 'react';

interface Holiday {
  date: string;
  name: string;
  type: string;
}

interface HolidayBadgeProps {
  holiday: Holiday;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showPopover?: boolean;
}

const HolidayBadge: React.FC<HolidayBadgeProps> = ({
  holiday,
  size = 'md',
  showName = false,
  showPopover = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      dot: 'size-2',
      icon: 'text-xs',
      text: 'text-[9px]',
      badge: 'px-1.5 py-0.5',
      popover: 'text-[10px] p-2'
    },
    md: {
      dot: 'size-3',
      icon: 'text-sm',
      text: 'text-[10px]',
      badge: 'px-2 py-1',
      popover: 'text-xs p-3'
    },
    lg: {
      dot: 'size-4',
      icon: 'text-base',
      text: 'text-xs',
      badge: 'px-3 py-1.5',
      popover: 'text-sm p-4'
    }
  };

  const config = sizeConfig[size];

  // Color configurations based on holiday type
  const colors = holiday.type === 'nacional'
    ? {
      bg: 'bg-emerald-50',
      bgDark: 'bg-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      icon: 'text-emerald-600'
    }
    : {
      bg: 'bg-amber-50',
      bgDark: 'bg-amber-100',
      border: 'border-amber-200',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      icon: 'text-amber-600'
    };

  // Simple indicator (dot only)
  if (!showName && !showPopover) {
    return (
      <div className={`${config.dot} rounded-full ${colors.dot}`} title={holiday.name} />
    );
  }

  // Indicator with icon
  if (!showName && showPopover) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`flex items-center gap-1 ${colors.icon} cursor-pointer`}>
          <span className={`material-symbols-outlined ${config.icon}`}>celebration</span>
          <div className={`${config.dot} rounded-full ${colors.dot}`} />
        </div>

        {/* Popover */}
        {isHovered && (
          <div className={`absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 ${config.popover} ${colors.bgDark} ${colors.text} rounded-lg shadow-lg border ${colors.border} whitespace-nowrap animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">event</span>
              <div className="flex flex-col">
                <p className="font-bold leading-tight">{holiday.name}</p>
                <p className={`${config.text} opacity-75 capitalize leading-tight`}>
                  Feriado {holiday.type}
                </p>
              </div>
            </div>
            {/* Arrow */}
            <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 rotate-45 ${colors.bgDark} border-l border-t ${colors.border}`} />
          </div>
        )}
      </div>
    );
  }

  // Full badge with name
  return (
    <div
      className={`${config.badge} rounded-lg ${config.text} font-bold truncate ${colors.bgDark} ${colors.text} border ${colors.border} flex items-center gap-1`}
      title={holiday.name}
    >
      <span className={`material-symbols-outlined ${config.icon}`}>event</span>
      <span className="truncate">{holiday.name}</span>
    </div>
  );
};

// Utility component for day cell background
export const HolidayDayBackground: React.FC<{ holiday: Holiday | null; children: React.ReactNode; className?: string }> = ({
  holiday,
  children,
  className = ''
}) => {
  if (!holiday) {
    return <>{children}</>;
  }

  const bgColor = holiday.type === 'nacional' ? 'bg-emerald-50/70' : 'bg-amber-50/70';
  const borderColor = holiday.type === 'nacional' ? 'ring-emerald-200' : 'ring-amber-200';

  return (
    <div className={`${bgColor} ring-1 ring-inset ${borderColor} ${className}`}>
      {children}
    </div>
  );
};

export default HolidayBadge;
