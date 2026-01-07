# Utility Functions Documentation

Helper functions organized by category for common operations throughout the app.

## Date Utils (`dateUtils.ts`)

### `parseDisplayDate(dateStr: string): string`
Parse DD/MM/YYYY format to YYYY-MM-DD for input fields.

```typescript
parseDisplayDate('25/12/2024') // '2024-12-25'
```

### `formatToDisplayDate(dateStr: string): string`
Format YYYY-MM-DD to DD/MM/YYYY for display.

```typescript
formatToDisplayDate('2024-12-25') // '25/12/2024'
```

### `calculateDuration(startDate: string, endDate: string): number | null`
Calculate duration in days between two dates.

```typescript
calculateDuration('2024-12-25', '2024-12-31') // 6
```

### `formatDate(dateStr: string, options?): string`
Format date to locale string.

```typescript
formatDate('2024-12-25') // '25 de dezembro de 2024'
```

### `isPast(dateStr: string): boolean`
Check if date is in the past.

### `isFuture(dateStr: string): boolean`
Check if date is in the future.

---

## String Utils (`stringUtils.ts`)

### `truncate(str: string, maxLength: number): string`
Truncate string with ellipsis.

```typescript
truncate('Long text here', 10) // 'Long text ...'
```

### `getInitials(name: string): string`
Generate initials from name.

```typescript
getInitials('John Doe') // 'JD'
getInitials('Alice') // 'A'
```

### `capitalize(str: string): string`
Capitalize first letter of each word.

```typescript
capitalize('hello world') // 'Hello World'
```

### `generateId(length?: number): string`
Generate random alphanumeric ID.

```typescript
generateId() // 'abc123xyz'
generateId(5) // 'x7k9m'
```

### `slugify(str: string): string`
Convert string to URL-safe slug.

```typescript
slugify('Hello World!') // 'hello-world'
```

### `isValidEmail(email: string): boolean`
Validate email format.

```typescript
isValidEmail('user@example.com') // true
isValidEmail('invalid') // false
```

---

## Image Utils (`imageUtils.ts`)

### `generateAvatarUrl(name: string, options?): string`
Generate avatar URL from UI Avatars API.

```typescript
generateAvatarUrl('John Doe') 
// 'https://ui-avatars.com/api/?name=John+Doe&background=random&color=fff'

generateAvatarUrl('Alice', { background: 'blue', size: 256 })
// With custom options
```

### `isValidImageUrl(url: string): boolean`
Check if URL is a valid image URL.

```typescript
isValidImageUrl('https://example.com/photo.jpg') // true
isValidImageUrl('https://example.com/page') // false
```

### `getOptimizedImageUrl(url: string, width?: number, quality?: number): string`
Get optimized image URL (supports Unsplash).

```typescript
getOptimizedImageUrl('https://images.unsplash.com/photo-123', 800, 80)
// Adds optimization parameters
```

### `base64ToBlob(base64: string, mimeType?: string): Blob`
Convert base64 string to Blob.

```typescript
const blob = base64ToBlob('data:image/png;base64,...')
```

---

## Usage

Import utilities as needed:

```typescript
// Individual imports
import { formatDate, calculateDuration } from '../lib/dateUtils';
import { truncate, getInitials } from '../lib/stringUtils';

// Or from barrel export
import { formatDate, truncate, generateAvatarUrl } from '../lib';
```

---

## Adding New Utilities

When adding new utility functions:

1. Group by category (create new file if needed)
2. Add TypeScript types
3. Include JSDoc comments
4. Export from `lib/index.ts`
5. Add documentation here
6. Write unit tests (if applicable)

---

## Migration Notes

These utilities were extracted from existing components to reduce duplication:

- **dateUtils**: Extracted from `AddTripModal.tsx` (lines 34-52)
- **stringUtils**: Common string operations used across multiple components
- **imageUtils**: Avatar and image URL generation from various components
