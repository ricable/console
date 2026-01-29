# Component Refactoring Guide

This guide documents the approach for refactoring large, complex React components in the KubeStellar Console.

## Problem

The Auto-QA system identified 74 components with high complexity:
- **Line counts**: 400-2268 lines  
- **Hook counts**: 5-52 React hooks
- **Maintainability issues**: Hard to test, difficult to understand, prone to bugs

## Refactoring Strategy

### 1. Extract Types and Interfaces

Move all TypeScript interfaces, types, and type aliases to a separate `types.ts` file.

**Before:**
```typescript
// MyComponent.tsx (1000+ lines)
interface DataItem {
  id: string
  name: string
}

interface Config {
  url: string
  timeout: number
}

export function MyComponent() {
  // 900 lines of component logic...
}
```

**After:**
```typescript
// MyComponent/types.ts
export interface DataItem {
  id: string
  name: string
}

export interface Config {
  url: string
  timeout: number
}

// MyComponent.tsx
import { DataItem, Config } from './MyComponent/types'

export function MyComponent() {
  // component logic...
}
```

### 2. Extract Constants

Move configuration objects, default values, and constant data to `constants.ts`.

**Benefits:**
- Easy to locate and update configuration
- Can be reused across components
- Reduces noise in main component file

**Example:**
```typescript
// constants.ts
export const DEFAULT_TIMEOUT = 5000
export const API_ENDPOINTS = {
  getData: '/api/data',
  postData: '/api/submit'
}
export const PRESET_OPTIONS = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
]
```

### 3. Extract Utility Functions

Move pure functions (no hooks, no component-specific logic) to `utils.ts`.

**Candidates for extraction:**
- Data formatters (dates, numbers, strings)
- Validation functions
- Data transformation functions
- Parsing/serialization functions

**Example:**
```typescript
// utils.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function parseCSV(csv: string): string[][] {
  return csv.split('\n').map(row => row.split(','))
}
```

### 4. Extract Business Logic Modules

Create focused modules for specific domains (e.g., parsing, storage, API calls).

**Example Structure:**
```
MyComponent/
├── index.ts          # Barrel exports
├── types.ts          # Type definitions
├── constants.ts      # Configuration
├── utils.ts          # Pure utility functions
├── parser.ts         # Domain-specific parsing logic
├── storage.ts        # LocalStorage/caching logic
└── api.ts            # API interaction functions
```

### 5. Create Custom Hooks

Extract stateful logic into custom hooks for reusability.

**Before:**
```typescript
function MyComponent() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    setLoading(true)
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])
  
  // 500 more lines...
}
```

**After:**
```typescript
// hooks/useDataFetch.ts
export function useDataFetch(url: string) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [url])
  
  return { data, loading, error }
}

// MyComponent.tsx
function MyComponent() {
  const { data, loading, error } = useDataFetch('/api/data')
  
  // rest of component logic...
}
```

### 6. Split into Sub-Components

Break large components into smaller, focused presentational components.

**Approach:**
- Identify logical UI sections
- Extract each section as its own component
- Pass data via props (not complex state)
- Keep each component under 200 lines

**Example:**
```typescript
// Before: One 1000-line component
function Dashboard() {
  return (
    <div>
      {/* 200 lines of header */}
      {/* 300 lines of sidebar */}
      {/* 500 lines of content */}
    </div>
  )
}

// After: Multiple focused components
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardSidebar />
      <DashboardContent />
    </div>
  )
}

function DashboardHeader() {
  // 50 lines
}

function DashboardSidebar() {
  // 100 lines
}

function DashboardContent() {
  // 150 lines
}
```

## Example: RSSFeed Component Refactoring

### Original Structure
```
RSSFeed.tsx (1736 lines, 44 hooks)
├── Types and interfaces (40 lines)
├── Constants (80 lines)  
├── Utility functions (100 lines)
├── Parsing logic (150 lines)
├── Storage/caching logic (80 lines)
├── Component logic (1286 lines)
```

### Refactored Structure
```
RSSFeed/
├── index.ts           # Barrel exports (6 lines)
├── types.ts           # Type definitions (40 lines)
├── constants.ts       # PRESET_FEEDS, CORS_PROXIES (85 lines)
├── utils.ts           # Utility functions (70 lines)
├── parser.ts          # RSS/Atom parsing (170 lines)
├── storage.ts         # Caching logic (115 lines)
RSSFeed.tsx            # Main component (1250 lines)
```

**Benefits:**
- ✅ 486 lines extracted into reusable modules
- ✅ Each module has single responsibility
- ✅ Easier to test individual functions
- ✅ Types can be reused by other components
- ✅ Constants can be configured centrally

## When to Refactor

**Refactor when a component:**
- Exceeds 400 lines of code
- Uses more than 15 React hooks
- Has multiple unrelated responsibilities
- Is difficult to understand or test
- Requires scrolling to understand flow

**DON'T refactor when:**
- Component is working well and rarely changes
- Refactoring would break existing functionality
- The component is naturally complex (e.g., game logic)
- Time is better spent on new features

## Best Practices

1. **Make incremental changes**: Refactor one piece at a time, test, commit
2. **Preserve functionality**: Use git diff to verify no behavior changes
3. **Run tests**: Build and lint after each change
4. **Document exports**: Use barrel files (`index.ts`) for clean imports
5. **Keep related code together**: Don't over-modularize

## Testing Refactored Code

After refactoring:
```bash
cd web
npm run build    # Verify TypeScript compilation
npm run lint     # Check code style
npm test         # Run unit tests (if available)
```

For UI components, manually verify:
1. Component renders correctly
2. User interactions work
3. No console errors
4. State management still functions

## Tools and Commands

```bash
# Count lines in a component
wc -l MyComponent.tsx

# Find all hooks in a file
grep -c "use[A-Z]" MyComponent.tsx

# Search for function definitions
grep -n "^function\|^const.*=.*=>" MyComponent.tsx
```

## Summary

Refactoring complex components improves:
- 📖 **Readability**: Smaller files are easier to understand
- 🧪 **Testability**: Pure functions can be tested in isolation
- ♻️ **Reusability**: Extracted modules can be used elsewhere
- 🐛 **Maintainability**: Bugs are easier to find and fix
- 🚀 **Performance**: Smaller components re-render less

The key is to **start small** and **refactor incrementally** rather than attempting a complete rewrite.
