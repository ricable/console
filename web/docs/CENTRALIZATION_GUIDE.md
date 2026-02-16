# Code Centralization Utilities

This document describes the shared utilities created to centralize common patterns and reduce code duplication across the KubeStellar Console codebase.

## Table of Contents

- [useModal Hook](#usemodal-hook)
- [Layout Components](#layout-components)
- [Migration Guide](#migration-guide)

## useModal Hook

**Location**: `src/hooks/useModal.ts`

A centralized hook for managing modal/dropdown open/close state, replacing the common pattern:

```tsx
const [isOpen, setIsOpen] = useState(false)
```

### Usage

#### Basic Example

```tsx
import { useModal } from '../hooks/useModal'

function MyComponent() {
  const { isOpen, open, close, toggle } = useModal()

  return (
    <>
      <button onClick={open}>Open Modal</button>
      {isOpen && (
        <Modal onClose={close}>
          <h2>Modal Content</h2>
          <button onClick={close}>Close</button>
        </Modal>
      )}
    </>
  )
}
```

#### Multiple Modals

```tsx
import { useModal } from '../hooks/useModal'

function Dashboard() {
  const addCard = useModal()
  const configure = useModal()
  const templates = useModal()

  return (
    <>
      <button onClick={addCard.open}>Add Card</button>
      <button onClick={configure.open}>Configure</button>
      <button onClick={templates.open}>Templates</button>
      
      {addCard.isOpen && <AddCardModal onClose={addCard.close} />}
      {configure.isOpen && <ConfigModal onClose={configure.close} />}
      {templates.isOpen && <TemplatesModal onClose={templates.close} />}
    </>
  )
}
```

#### With Default Open State

```tsx
const { isOpen, close, toggle } = useModal(true) // Opens by default
```

### API

```typescript
function useModal(defaultOpen?: boolean): {
  isOpen: boolean        // Current open/close state
  open: () => void       // Open the modal
  close: () => void      // Close the modal
  toggle: () => void     // Toggle the state
  setIsOpen: (value: boolean | ((prev: boolean) => boolean)) => void  // Direct setter
}
```

### Benefits

- **Consistency**: Standardizes modal state management across the codebase
- **Readability**: `addCard.open()` is more descriptive than `setIsAddCardOpen(true)`
- **Maintainability**: Single source of truth for modal state logic
- **Type Safety**: Proper TypeScript types included

## Layout Components

**Location**: `src/lib/layout/`

Reusable layout components that centralize repeated Tailwind CSS patterns.

### Available Components

#### FlexRowGap2

The most common pattern in the codebase: `flex items-center gap-2`

```tsx
import { FlexRowGap2 } from '../../lib/layout'

// Before:
<div className="flex items-center gap-2">
  <Icon />
  <span>Label</span>
</div>

// After:
<FlexRowGap2>
  <Icon />
  <span>Label</span>
</FlexRowGap2>

// With additional classes:
<FlexRowGap2 className="text-blue-500 font-bold">
  <Icon />
  <span>Label</span>
</FlexRowGap2>
```

#### FlexRowGap1

Pattern: `flex items-center gap-1`

```tsx
import { FlexRowGap1 } from '../../lib/layout'

<FlexRowGap1>
  <Badge />
  <StatusDot />
</FlexRowGap1>
```

#### FlexRowGap3

Pattern: `flex items-center gap-3`

```tsx
import { FlexRowGap3 } from '../../lib/layout'

<FlexRowGap3>
  <Button />
  <Button />
</FlexRowGap3>
```

#### FlexRow

Generic horizontal flex with centered items (no gap by default)

```tsx
import { FlexRow } from '../../lib/layout'

<FlexRow className="gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</FlexRow>
```

#### FlexRowStart

Horizontal flex with items aligned to start: `flex items-start gap-*`

```tsx
import { FlexRowStart } from '../../lib/layout'

<FlexRowStart className="gap-2">
  <Icon className="mt-1" />
  <div>Multi-line text content...</div>
</FlexRowStart>
```

#### FlexCol

Vertical flex container: `flex flex-col gap-*`

```tsx
import { FlexCol } from '../../lib/layout'

<FlexCol className="gap-4">
  <div>Section 1</div>
  <div>Section 2</div>
</FlexCol>
```

#### FlexCenter

Flex with items centered both horizontally and vertically

```tsx
import { FlexCenter } from '../../lib/layout'

<FlexCenter className="h-32">
  <Spinner />
</FlexCenter>
```

#### FlexBetween

Flex with `justify-between`: `flex items-center justify-between`

```tsx
import { FlexBetween } from '../../lib/layout'

<FlexBetween>
  <span>Label</span>
  <Button>Action</Button>
</FlexBetween>
```

#### Grid

Grid container with configurable columns

```tsx
import { Grid } from '../../lib/layout'

// 2 columns (default)
<Grid>
  <Card />
  <Card />
</Grid>

// 3 columns
<Grid cols={3}>
  <Card />
  <Card />
  <Card />
</Grid>

// 4 columns
<Grid cols={4}>
  <Card />
  <Card />
  <Card />
  <Card />
</Grid>

// With additional classes
<Grid cols={2} className="gap-4 p-4">
  <Card />
  <Card />
</Grid>
```

### Component Props

All layout components accept:

- `children: React.ReactNode` - Child elements
- `className?: string` - Additional CSS classes (merged with default classes)

All components render as `div` elements by default.

## Migration Guide

### Migrating from Manual Classes

#### Step 1: Import the Component

```tsx
import { FlexRowGap2 } from '../../lib/layout'
```

#### Step 2: Replace the div

```tsx
// Before:
<div className="flex items-center gap-2">
  <Icon />
  <span>Text</span>
</div>

// After:
<FlexRowGap2>
  <Icon />
  <span>Text</span>
</FlexRowGap2>
```

#### Step 3: Preserve Additional Classes

```tsx
// Before:
<div className="flex items-center gap-2 text-blue-500 font-bold">
  <Icon />
  <span>Text</span>
</div>

// After:
<FlexRowGap2 className="text-blue-500 font-bold">
  <Icon />
  <span>Text</span>
</FlexRowGap2>
```

### Migrating from useState to useModal

#### Step 1: Import useModal

```tsx
import { useModal } from '../hooks/useModal'
```

#### Step 2: Replace useState

```tsx
// Before:
const [isAddCardOpen, setIsAddCardOpen] = useState(false)
const [isConfigureOpen, setIsConfigureOpen] = useState(false)

// After:
const addCard = useModal()
const configure = useModal()
```

#### Step 3: Update References

```tsx
// Before:
<button onClick={() => setIsAddCardOpen(true)}>Add Card</button>
{isAddCardOpen && <Modal onClose={() => setIsAddCardOpen(false)} />}

// After:
<button onClick={addCard.open}>Add Card</button>
{addCard.isOpen && <Modal onClose={addCard.close} />}
```

## Best Practices

### When to Use These Utilities

✅ **DO use them for**:
- New components
- Components being refactored
- Frequently modified components
- Components with multiple similar patterns

❌ **DON'T rush to migrate**:
- Stable, working components that rarely change
- Components with complex custom layouts
- When the abstraction doesn't improve readability

### Naming Conventions

For multiple modals, use descriptive names:

```tsx
// Good:
const addCard = useModal()
const editCard = useModal()
const deleteConfirm = useModal()

// Avoid:
const modal1 = useModal()
const modal2 = useModal()
```

### Combining with Other Utilities

These utilities work well with existing patterns:

```tsx
import { FlexRowGap2 } from '../../lib/layout'
import { useModal } from '../hooks/useModal'
import { cn } from '../../lib/cn'

function MyCard() {
  const settings = useModal()
  
  return (
    <FlexRowGap2 className={cn('p-4', settings.isOpen && 'bg-gray-100')}>
      <Icon />
      <span>Content</span>
      <button onClick={settings.open}>Settings</button>
    </FlexRowGap2>
  )
}
```

## Testing

Both utilities are compatible with existing testing patterns:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { useModal } from '../hooks/useModal'

function TestComponent() {
  const modal = useModal()
  return (
    <>
      <button onClick={modal.open}>Open</button>
      {modal.isOpen && <div>Modal Content</div>}
    </>
  )
}

test('modal opens and closes', () => {
  render(<TestComponent />)
  
  expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
  
  fireEvent.click(screen.getByText('Open'))
  expect(screen.getByText('Modal Content')).toBeInTheDocument()
})
```

## Future Enhancements

Potential additions based on usage patterns:

- Dashboard grid layout component
- Card control bar component  
- Standardized spacing utilities
- Responsive layout helpers

## Contributing

When adding new centralized utilities:

1. Identify patterns repeated 10+ times in the codebase
2. Create a focused, reusable abstraction
3. Document with examples
4. Add to this guide
5. Migrate 2-3 components as examples
6. Let adoption happen organically

## Questions?

See the original Auto-QA issue for context: [Auto-QA] Code centralization opportunities found
