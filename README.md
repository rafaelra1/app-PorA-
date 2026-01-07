# PorAí - Travel Planning App

A modern, AI-powered travel planning application built with React and TypeScript.

## 📁 Project Structure

```
app_poraí/
├── components/           # React components
│   ├── ui/              # Reusable UI components (Button, Input, etc.)
│   └── trip-details/    # Trip-specific components
│       ├── cities/      # Cities view
│       ├── city-guide/  # City guide tabs
│       ├── documents/   # Documents management
│       ├── itinerary/   # Itinerary view
│       ├── journal/     # Journal entries
│       └── modals/      # Modal components
│
├── contexts/            # React Context providers
│   ├── AIContext.tsx    # AI service state management
│   ├── TripContext.tsx  # Trip data management
│   └── UIContext.tsx    # UI state (modals, navigation)
│
├── hooks/               # Custom React hooks
│   ├── useModal.ts      # Modal state management
│   ├── useDebounce.ts   # Input debouncing
│   ├── useLocalStorage.ts # Persistent storage
│   ├── useImageGeneration.ts # AI image generation
│   ├── useCityGuide.ts  # City guide data fetching
│   └── index.ts         # Barrel export
│
├── lib/                 # Utility functions
│   ├── dateUtils.ts     # Date formatting and manipulation
│   ├── stringUtils.ts   # String operations
│   ├── imageUtils.ts    # Image URL helpers
│   └── index.ts         # Barrel export
│
├── pages/               # Page components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Travels.tsx      # Travels overview
│   ├── TripDetails.tsx  # Trip details page
│   ├── AIAssistant.tsx  # AI assistant page
│   ├── CalendarView.tsx # Calendar view
│   ├── Documents.tsx    # Documents page
│   └── Journal.tsx      # Journal page
│
├── services/            # API services
│   └── geminiService.ts # Google Gemini AI integration
│
├── styles/              # Design system
│   ├── variables.css    # CSS custom properties (colors, spacing, etc.)
│   ├── typography.css   # Typography system
│   ├── animations.css   # Animation utilities
│   └── index.css        # Main stylesheet
│
├── constants.tsx        # App constants and demo data
├── types.ts             # TypeScript type definitions
├── index.html           # HTML entry point
├── index.tsx            # React app entry point
└── vite.config.ts       # Vite configuration
```

---

## 🎨 Design System

The app uses a comprehensive design system with CSS custom properties:

### Colors
- Primary: `#dcdaec`
- Secondary: `#ABE2FE`
- Background: `#F8F9FA`
- Text: `#131316` (main), `#706e7c` (muted)

### Typography
- Font Family: Plus Jakarta Sans
- Scale: xs (12px) to 5xl (48px)
- Weights: 400, 500, 600, 700, 800

### Spacing
- Scale: 0 to 24 (0px to 96px)
- Based on 4px increments

See [styles/variables.css](styles/variables.css) for complete token system.

---

## 🧩 Component Architecture

### UI Components (`components/ui/`)

Reusable base components:
- **Card** - Container with shadow and border
- **Button** - 5 variants (primary, secondary, outline, ghost, dark)
- **Badge** - Labels and tags
- **Input** - Text input with icons and validation
- **Textarea** - Auto-resize text area
- **Select** - Custom dropdown
- **Icon** - Material Symbols wrapper

See [components/ui/README.md](components/ui/README.md) for usage.

### Feature Components (`components/trip-details/`)

Organized by feature:
- `cities/` - Cities management
- `city-guide/` - City guide with tabs (Info, Attractions, Gastronomy, Tips)
- `documents/` - Travel documents
- `itinerary/` - Trip itinerary
- `journal/` - Travel journal
- `modals/` - Reusable modals

---

## 🪝 Custom Hooks

### State Management
- `useModal` - Modal open/close state
- `useLocalStorage` - Persistent state with localStorage

### Data Fetching
- `useCityGuide` - City guide and grounding info
- `useImageGeneration` - AI image generation

### Utilities
- `useDebounce` - Debounce values for search/filters

See [hooks/README.md](hooks/README.md) for detailed usage.

---

## 🛠️ Utility Functions (`lib/`)

### Date Utils
- `parseDisplayDate` - DD/MM/YYYY ↔ YYYY-MM-DD conversion
- `formatToDisplayDate` - Format for display
- `calculateDuration` - Days between dates
- `formatDate` - Locale formatting
- `isPast` / `isFuture` - Date comparisons

### String Utils
- `truncate` - Truncate with ellipsis
- `getInitials` - Generate initials from name
- `capitalize` - Capitalize words
- `generateId` - Random ID generation
- `slugify` - URL-safe slugs
- `isValidEmail` - Email validation

### Image Utils
- `generateAvatarUrl` - UI Avatars API
- `isValidImageUrl` - Validate image URLs
- `getOptimizedImageUrl` - Image optimization
- `base64ToBlob` - Base64 conversion

---

## 🎯 State Management

The app uses **React Context** for global state:

### TripContext
- Manages trips data
- CRUD operations for trips
- Selected trip state

### UIContext
- Modal states (add modal, mobile menu)
- Active tab navigation

### AIContext
- AI service configuration
- Error handling
- API key management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

The app runs on `http://localhost:5173` (or next available port).

Hot module replacement (HMR) is enabled for fast development.

---

## 🧪 Key Features

- ✨ **AI-Powered** - Google Gemini integration for itineraries and city guides
- 🎨 **Beautiful UI** - Modern design with glassmorphism and smooth animations
- 📱 **Responsive** - Mobile-first design
- 🗺️ **City Guides** - AI-generated guides with attractions and gastronomy
- 📸 **Image Generation** - AI-generated travel images
- 📝 **Travel Journal** - Document your experiences
- 📄 **Document Manager** - Organize reservations and tickets

---

## 📦 Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **Google Gemini AI** - AI capabilities
- **Material Symbols** - Icon system

---

## 🎨 Design Philosophy

1. **Component Reusability** - All UI elements are modular components
2. **Type Safety** - Full TypeScript coverage
3. **Design Tokens** - CSS variables for consistent theming
4. **Performance** - Optimized with hooks and memoization
5. **Accessibility** - Semantic HTML and ARIA attributes

---

## 📝 Coding Conventions

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `use{Name}.ts`
- Utils: `{category}Utils.ts`
- Types: `types.ts`

### Import Order
1. React imports
2. Third-party libraries
3. Types
4. Components
5. Hooks
6. Utils
7. Constants
8. Styles

### Component Structure
```tsx
// 1. Imports
import React from 'react';
import { SomeType } from '../types';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export const Component: React.FC<Props> = ({ prop }) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Functions
  const handleClick = () => {};
  
  // 6. Render
  return <div>...</div>;
};
```

---

## 🤝 Contributing

When adding new features:

1. Follow the project structure
2. Use TypeScript for type safety
3. Create reusable components in `components/ui/`
4. Extract logic to custom hooks
5. Use design tokens from `styles/variables.css`
6. Document complex components

---

## 📄 License

This project is for educational and portfolio purposes.
