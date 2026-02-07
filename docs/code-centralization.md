# Code Centralization Guide

This document provides guidance on using centralized patterns to reduce code duplication and improve maintainability.

## Modal State Management

### useModal Hook

The `useModal` hook provides a standardized way to manage modal open/close state.

#### Basic Usage

```tsx
import { useModal } from '../../hooks/useModal'

function MyComponent() {
  const modal = useModal()
  
  return (
    <>
      <button onClick={modal.open}>Open Modal</button>
      <Modal isOpen={modal.isOpen} onClose={modal.close}>
        {/* Modal content */}
      </Modal>
    </>
  )
}
```

#### API

- `modal.isOpen` - Boolean indicating if modal is open
- `modal.open()` - Opens the modal
- `modal.close()` - Closes the modal  
- `modal.toggle()` - Toggles modal state
- `modal.setIsOpen(boolean)` - Direct setter (use sparingly)

### useModals Hook

For components with multiple modals, use the `useModals` hook:

```tsx
import { useModals } from '../../hooks/useModal'

function MyComponent() {
  const modals = useModals(['add', 'edit', 'delete'])
  
  return (
    <>
      <button onClick={() => modals.openModal('add')}>Add</button>
      <button onClick={() => modals.openModal('edit')}>Edit</button>
      
      <AddModal 
        isOpen={modals.isModalOpen('add')} 
        onClose={() => modals.closeModal('add')} 
      />
      <EditModal 
        isOpen={modals.isModalOpen('edit')} 
        onClose={() => modals.closeModal('edit')} 
      />
    </>
  )
}
```

#### API

- `modals.openModal(name)` - Opens a specific modal
- `modals.closeModal(name?)` - Closes a specific modal (or all if no name)
- `modals.isModalOpen(name)` - Checks if a modal is open
- `modals.toggleModal(name)` - Toggles a specific modal

### Migration Guide

**Before:**
```tsx
const [isOpen, setIsOpen] = useState(false)
const [isEditOpen, setIsEditOpen] = useState(false)

<button onClick={() => setIsOpen(true)}>Open</button>
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
```

**After:**
```tsx
const modals = useModals(['add', 'edit'])

<button onClick={() => modals.openModal('add')}>Open</button>
<Modal isOpen={modals.isModalOpen('add')} onClose={() => modals.closeModal('add')}>
```

### Components Migrated

- ✅ FloatingDashboardActions
- ✅ DashboardCards
- ✅ CustomDashboard
- ✅ AgentSelector
- ✅ NotificationBadge
- ✅ FeatureRequestButton

### Recommended Migrations

The following components still use manual modal state and should be migrated when touched:

- Dashboard.tsx (3 modals)
- Various card configuration modals
- Settings panels and dialogs

## Future Improvements

### Layout Utility Components (TODO)

The codebase has 1000+ instances of repeated Tailwind layout patterns:
- `flex items-center gap-2` (485 instances)
- `flex items-center gap-1` (426 instances)
- `flex gap-2` (51 instances)

**Recommendation:** Create reusable layout components:

```tsx
// components/ui/Flex.tsx
export function FlexRow({ gap = 2, align = 'center', children, className, ...props }) {
  return (
    <div 
      className={cn('flex items-center', `gap-${gap}`, className)} 
      {...props}
    >
      {children}
    </div>
  )
}

// Usage
<FlexRow gap={2}>
  <Icon />
  <Text />
</FlexRow>
```

### Card Hook Standardization (TODO)

The following cards don't use standardized hooks and should be migrated:
- KubeChess.tsx (14 hooks)
- ContainerTetris.tsx (12 hooks)
- ClusterLocations.tsx (13 hooks)
- NamespaceMonitor.tsx (10 hooks)
- ClusterGroups.tsx (24 hooks)
- NodeInvaders.tsx (17 hooks)
- SudokuGame.tsx (12 hooks)
- LLMdStackMonitor.tsx (20 hooks)
- ClusterHealthMonitor.tsx (3 hooks)
- KubeCraft.tsx (8 hooks)

**Recommendation:** Migrate to `useCardData` and `useCardDemoState` hooks from `lib/cards/cardHooks.ts` when updating these cards.

## Benefits

- **Reduced duplication** - Modal state logic is centralized
- **Consistency** - All modals use the same API
- **Maintainability** - Changes to modal behavior happen in one place
- **Type safety** - TypeScript ensures correct usage
- **Testing** - Easier to test modal interactions

## Best Practices

1. **Use useModal for single modals** - Simpler and more concise
2. **Use useModals for multiple modals** - Manages state machine correctly
3. **Name modals descriptively** - Use names like 'add', 'edit', 'delete', not 'modal1'
4. **Close modals explicitly** - Don't rely on clicking outside or escape only
5. **Test modal interactions** - Ensure open/close works in all scenarios
