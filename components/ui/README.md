# UI Components Architecture

This document describes the refactored UI component architecture for the App Poraí application.

## 📁 Directory Structure

```
components/
├── ui/                           # Base UI components
│   ├── Base.tsx                  # Core components (Card, Button, Badge)
│   ├── Input.tsx                 # Text input with validation
│   ├── Select.tsx                # Dropdown select
│   ├── Textarea.tsx              # Multi-line text input
│   ├── FormComponents.tsx        # Form-specific components
│   ├── Icon.tsx                  # Icon wrapper
│   ├── LoadingSpinner.tsx        # Loading states
│   ├── Skeleton.tsx              # Skeleton loaders
│   └── EmptyState.tsx            # Empty state displays
│
├── trip-details/
│   └── modals/                   # Modal components
│       ├── Modal.tsx             # Base modal component
│       ├── AddExpenseModal.tsx   # ✅ Refactored
│       ├── AddAccommodationModal.tsx # ✅ Refactored
│       ├── AddTransportModal.tsx # ✅ Refactored
│       ├── AddActivityModal.tsx  # ✅ Refactored
│       ├── AddDocumentModal.tsx  # ✅ Refactored
│       ├── AddCityModal.tsx      # ✅ Refactored
│       ├── ShareTripModal.tsx    # ✅ Refactored
│       └── ...
```

## 🎯 Design Principles

### 1. Component Composition
All modals should extend the base `Modal` component:

```tsx
import Modal from './Modal';

const MyModal = ({ isOpen, onClose }) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Modal Title"
        size="sm"
        footer={<FooterButtons />}
    >
        {/* Content */}
    </Modal>
);
```

### 2. Reusable Form Components
Use the standardized form components from `ui/`:

```tsx
import { Input, Select, Textarea } from '../../ui/Base';

<Input
    label="Nome"
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Digite o nome"
    required
    fullWidth
/>
```

### 3. State Management Pattern
Use objects for form state and `useCallback` for handlers:

```tsx
interface FormData {
    title: string;
    description: string;
}

const INITIAL_STATE: FormData = {
    title: '',
    description: '',
};

const [formData, setFormData] = useState(INITIAL_STATE);

const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
) => {
    setFormData(prev => ({ ...prev, [field]: value }));
}, []);
```

### 4. Constants Organization
Define constants at the top of the file:

```tsx
// Types first
interface CategoryConfig {
    value: string;
    label: string;
    icon: string;
}

// Constants
const CATEGORIES: CategoryConfig[] = [
    { value: 'food', label: 'Alimentação', icon: 'restaurant' },
    // ...
];

const INITIAL_FORM_STATE = {
    // ...
};
```

## 📦 Available Components

### FormComponents (`ui/FormComponents.tsx`)

| Component | Description | Usage |
|-----------|-------------|-------|
| `ToggleGroup` | Switch between options | Mode selection (manual/AI) |
| `DocumentUploadZone` | Drag & drop file upload | AI document analysis |
| `FormSection` | Form section with title | Grouping related fields |
| `FormRow` | Side-by-side inputs | Grid layout for inputs |
| `RatingInput` | Star rating input | Hotel/restaurant ratings |
| `PriceInput` | Currency input | Expense amounts |
| `CategorySelector` | Category selection grid | Expense/activity types |

### Custom Hooks (`hooks/`)

| Hook | Description | Usage |
|------|-------------|-------|
| `useFormState` | Form state management | Any form with validation |
| `useFormSubmit` | Submission with loading | Async form submissions |
| `useModalForm` | Modal + form integration | Modals with forms |

## 🔧 Refactoring Checklist

When refactoring a modal component:

- [ ] Import and use `Modal` base component
- [ ] Replace inline inputs with `Input`, `Select`, `Textarea`
- [ ] Create TypeScript interface for form data
- [ ] Define constants for categories/options
- [ ] Use `useCallback` for all handlers
- [ ] Extract complex UI into sub-components
- [ ] Use utility functions from `lib/dateUtils.ts`
- [ ] Add proper accessibility attributes

## 📚 Utility Functions

### `lib/dateUtils.ts`

```tsx
import { 
    formatDate,           // Full date format
    formatShortDate,      // Short format (e.g., "seg, 15 jan")
    formatDateRange,      // Date range (e.g., "15 jan - 20 jan 2024")
    calculateDuration,    // Days between dates
    calculateNights,      // Nights between dates
    getToday,             // Today in YYYY-MM-DD
    addDays,              // Add days to date
    isPast,               // Check if date is past
    isFuture,             // Check if date is future
} from '../lib/dateUtils';
```

## 🎨 Styling Conventions

### Tailwind Class Order
1. Layout (flex, grid)
2. Sizing (w-, h-)
3. Spacing (p-, m-)
4. Visual (bg-, border-, rounded-)
5. Typography (text-, font-)
6. States (hover:, focus:, disabled:)
7. Animation (transition-, animate-)

### Color Palette
- Primary: `primary`, `primary-dark`
- Text: `text-main`, `text-muted`
- Status: `green-*` (success), `rose-*` (error), `amber-*` (warning)

## 🧪 Testing

Components should be testable in isolation:

```tsx
// Reset singleton for testing
import { resetGeminiService } from '../services/geminiService';

beforeEach(() => {
    resetGeminiService();
});
```

## 📝 Migration Guide

### Before (Legacy Pattern)
```tsx
// ❌ Inline modal structure
<div className="fixed inset-0 bg-black/50...">
    <div className="bg-white rounded-2xl...">
        <div className="p-6 border-b...">
            <h2>Title</h2>
            <button onClick={onClose}>X</button>
        </div>
        {/* form */}
    </div>
</div>

// ❌ Multiple useState
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
```

### After (Refactored Pattern)
```tsx
// ✅ Use Modal component
<Modal isOpen={isOpen} onClose={onClose} title="Title" footer={footer}>
    {/* form content only */}
</Modal>

// ✅ Object state
const [formData, setFormData] = useState({ title: '', description: '' });
```
