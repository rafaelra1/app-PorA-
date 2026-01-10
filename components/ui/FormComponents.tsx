import React from 'react';

// =============================================================================
// Toggle Button Group
// =============================================================================

export interface ToggleOption<T = string> {
    value: T;
    label: string;
    icon?: string;
    activeColor?: string;
}

export interface ToggleGroupProps<T = string> {
    options: ToggleOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

export function ToggleGroup<T extends string>({
    options,
    value,
    onChange,
    className = ''
}: ToggleGroupProps<T>) {
    return (
        <div className={`flex gap-2 p-1 bg-gray-100 rounded-xl ${className}`}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${value === option.value
                        ? `bg-white shadow-sm ${option.activeColor || 'text-text-main'}`
                        : 'text-text-muted'
                        }`}
                >
                    {option.icon && (
                        <span className="material-symbols-outlined text-base">{option.icon}</span>
                    )}
                    {option.label}
                </button>
            ))}
        </div>
    );
}

// =============================================================================
// Document Upload Zone
// =============================================================================

export interface DocumentUploadZoneProps {
    isProcessing: boolean;
    onFileSelect?: (file: File) => void;
    onFilesSelect?: (files: File[]) => void;
    accept?: string;
    title?: string;
    subtitle?: string;
    processingTitle?: string;
    processingSubtitle?: string;
    multiple?: boolean;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
    isProcessing,
    onFileSelect,
    onFilesSelect,
    accept = 'image/*,application/pdf',
    title = 'Envie seu documento',
    subtitle = 'PDF, imagem ou captura de tela',
    processingTitle = 'Analisando documento...',
    processingSubtitle = 'Extraindo informações com IA',
    multiple = false
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => fileInputRef.current?.click();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            if (multiple && onFilesSelect) {
                onFilesSelect(Array.from(files));
            } else if (onFileSelect) {
                onFileSelect(files[0]);
            }
            // Reset input to allow re-uploading same file
            e.target.value = '';
        }
    };

    return (
        <div
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isProcessing
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                }`}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleChange}
                className="hidden"
                aria-label="Upload de documento"
            />
            {isProcessing ? (
                <>
                    <div className="size-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-primary text-2xl animate-spin">
                            sync
                        </span>
                    </div>
                    <p className="font-bold text-text-main">{processingTitle}</p>
                    <p className="text-sm text-text-muted mt-1">{processingSubtitle}</p>
                </>
            ) : (
                <>
                    <div className="size-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-2xl">
                            {multiple ? 'uploads' : 'cloud_upload'}
                        </span>
                    </div>
                    <p className="font-bold text-text-main">{title}</p>
                    <p className="text-sm text-text-muted mt-1">
                        {multiple ? 'Selecione múltiplos arquivos' : subtitle}
                    </p>
                    <p className="text-xs text-primary font-bold mt-3">
                        A IA extrairá os dados automaticamente
                    </p>
                </>
            )}
        </div>
    );
};

// =============================================================================
// Form Section
// =============================================================================

export interface FormSectionProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children, className = '' }) => (
    <div className={`space-y-4 ${className}`}>
        {title && (
            <h3 className="text-sm font-bold text-text-main border-b border-gray-100 pb-2">
                {title}
            </h3>
        )}
        {children}
    </div>
);

// =============================================================================
// Form Row (for side-by-side inputs)
// =============================================================================

export interface FormRowProps {
    children: React.ReactNode;
    cols?: 2 | 3 | 4;
    className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({ children, cols = 2, className = '' }) => {
    const colClasses = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    };

    return (
        <div className={`grid ${colClasses[cols]} gap-4 ${className}`}>
            {children}
        </div>
    );
};

// =============================================================================
// Rating Input
// =============================================================================

export interface RatingInputProps {
    label?: string;
    value: number;
    onChange: (value: number) => void;
    max?: number;
    step?: number;
}

export const RatingInput: React.FC<RatingInputProps> = ({
    label = 'Avaliação',
    value,
    onChange,
    max = 5,
    step = 0.1
}) => (
    <div>
        <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
            {label}
        </label>
        <div className="flex items-center gap-2">
            <input
                type="number"
                min="1"
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 4.0)}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-medium"
            />
            <span className="material-symbols-outlined text-amber-500 fill">star</span>
        </div>
    </div>
);

// =============================================================================
// Price Input
// =============================================================================

export interface PriceInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    currency?: string;
    placeholder?: string;
    required?: boolean;
}

export const PriceInput: React.FC<PriceInputProps> = ({
    label = 'Valor',
    value,
    onChange,
    currency = 'R$',
    placeholder = '0,00',
    required = false
}) => (
    <div>
        {label && (
            <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                {label} {required && '*'}
            </label>
        )}
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">
                {currency}
            </span>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-medium"
            />
        </div>
    </div>
);

// =============================================================================
// Category Selector
// =============================================================================

export interface CategoryOption<T = string> {
    value: T;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

export interface CategorySelectorProps<T extends string> {
    label?: string;
    categories: CategoryOption<T>[];
    selected: T;
    onChange: (value: T) => void;
    cols?: 2 | 3 | 4 | 6;
}

export function CategorySelector<T extends string>({
    label = 'Categoria',
    categories,
    selected,
    onChange,
    cols = 3
}: CategorySelectorProps<T>) {
    const colClasses = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        6: 'grid-cols-6',
    };

    return (
        <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
                {label}
            </label>
            <div className={`grid ${colClasses[cols]} gap-2`}>
                {categories.map((cat) => (
                    <button
                        key={cat.value}
                        type="button"
                        onClick={() => onChange(cat.value)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selected === cat.value
                            ? `${cat.borderColor} ${cat.bgColor}`
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <span className={`material-symbols-outlined ${cat.color}`}>{cat.icon}</span>
                        <span className="text-xs font-bold text-text-main">{cat.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default {
    ToggleGroup,
    DocumentUploadZone,
    FormSection,
    FormRow,
    RatingInput,
    PriceInput,
    CategorySelector,
};
