# Code Centralization Implementation

This PR addresses the Auto-QA findings from issue [Auto-QA] Code centralization opportunities found by creating reusable utilities that can be adopted incrementally.

## What This PR Does

### 1. Creates a Centralized `useModal` Hook

**Problem**: 941 instances of `const [isOpen, setIsOpen] = useState(false)` pattern

**Solution**: A standardized `useModal` hook that provides:
- Clear, descriptive API (`modal.open()`, `modal.close()`, `modal.toggle()`)
- Type safety with TypeScript
- Consistent pattern across the codebase

**Location**: `web/src/hooks/useModal.ts`

### 2. Creates Reusable Layout Components

**Problem**: 1200+ instances of repeated layout patterns like:
- `flex items-center gap-2` (518 instances)
- `flex items-center gap-1` (460 instances)
- `grid grid-cols-*` patterns

**Solution**: Reusable layout components:
- `FlexRowGap1`, `FlexRowGap2`, `FlexRowGap3` - Common flex patterns
- `FlexRow`, `FlexRowStart`, `FlexCol` - Generic flex containers
- `FlexCenter`, `FlexBetween` - Alignment utilities
- `Grid` - Configurable grid layout

**Location**: `web/src/lib/layout/`

### 3. Provides Comprehensive Documentation

**Documentation**: `web/docs/CENTRALIZATION_GUIDE.md`

Includes:
- Usage examples
- Migration guide
- Best practices
- Before/after comparisons

**Example Code**: `web/src/components/examples/MigrationExample.tsx`

Demonstrates:
- How to migrate from useState to useModal
- How to use layout components
- Real-world usage patterns

## Design Principles

### Non-Breaking Changes
- Zero changes to existing components
- No risk of regression
- Utilities can be adopted incrementally
- Existing code continues to work

### Minimal Scope
This PR focuses on **creating infrastructure**, not migrating existing code. Future PRs can:
- Gradually adopt these utilities
- Migrate high-touch components first
- Let organic adoption drive usage

### Why Not Migrate Everything Now?
1. **Risk**: Changing hundreds of files increases regression risk
2. **Review**: Smaller PRs are easier to review
3. **Adoption**: Let developers adopt naturally as they work on files
4. **Testing**: Each migration can be tested independently

## What's NOT Included

Per the Auto-QA findings, these are intentionally OUT OF SCOPE:
- ❌ Full migration of all cards to standardized hooks
- ❌ Migrating EventsTimeline, CardWrapper, KubeMan, etc.
- ❌ Complete dashboard grid standardization
- ❌ Refactoring all modal state patterns now

These can be addressed in future PRs as needed.

## Testing

✅ Build passes: `npm run build`
✅ Lint passes: `npm run lint` (new files have no issues)
✅ No changes to existing functionality
✅ TypeScript types are correct

## Migration Path

For developers who want to use these utilities:

### Using useModal

```tsx
// Before:
const [isOpen, setIsOpen] = useState(false)
<button onClick={() => setIsOpen(true)}>Open</button>

// After:
const modal = useModal()
<button onClick={modal.open}>Open</button>
```

### Using Layout Components

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

## Benefits

1. **Consistency**: Standardized patterns across the codebase
2. **Readability**: `modal.open()` is more descriptive than `setIsOpen(true)`
3. **Maintainability**: Change once, affects all uses
4. **Type Safety**: Full TypeScript support
5. **Less Code**: DRY principle reduces duplication

## Next Steps

Future PRs can:
1. Migrate frequently-modified components first
2. Update components during regular feature work
3. Focus on high-value migrations (components with 10+ instances)
4. Track adoption metrics

## Files Changed

- `web/src/hooks/useModal.ts` - New hook for modal state
- `web/src/lib/layout/FlexLayout.tsx` - New layout components
- `web/src/lib/layout/index.ts` - Exports
- `web/docs/CENTRALIZATION_GUIDE.md` - Comprehensive documentation
- `web/src/components/examples/MigrationExample.tsx` - Example code

## Related

- Addresses findings in Auto-QA issue
- Provides foundation for future refactoring
- Enables incremental adoption without breaking changes
