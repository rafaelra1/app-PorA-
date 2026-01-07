
import React from 'react';

// Added onClick prop to Card
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-gray-800/50 rounded-2xl shadow-soft border border-gray-100/50 dark:border-gray-700/50 transition-colors ${className}`}
  >
    {children}
  </div>
);

// Added type prop and updated onClick to accept MouseEvent
// Added type prop and updated onClick to accept MouseEvent
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark';
}> = ({ children, variant = 'primary', className = "", ...props }) => {
  const variants = {
    primary: 'bg-primary text-text-main shadow-sm hover:bg-primary-dark',
    secondary: 'bg-secondary text-text-main hover:bg-secondary-dark',
    outline: 'border-2 border-gray-100 text-text-muted hover:border-primary hover:text-text-main',
    ghost: 'text-text-muted hover:bg-gray-50 hover:text-text-main',
    dark: 'bg-text-main text-white hover:bg-gray-800'
  };

  return (
    <button
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-primary" }) => (
  <span className={`px-2 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${color}`}>
    {children}
  </span>
);

// Export new UI components
export { Input } from './Input';
export { Textarea } from './Textarea';
export { Select } from './Select';
export { Icon } from './Icon';
export { LoadingSpinner } from './LoadingSpinner';
export { Skeleton, SkeletonText } from './Skeleton';
export { EmptyState } from './EmptyState';

// Export form components
export {
  ToggleGroup,
  DocumentUploadZone,
  FormSection,
  FormRow,
  RatingInput,
  PriceInput,
  CategorySelector,
} from './FormComponents';
