# Component Refactoring Pattern

This document describes the pattern used to refactor complex components in this codebase.

## Problem

Auto-QA identified 76 components with high complexity (400+ lines, 10+ hooks) that could benefit from refactoring to improve maintainability.

## Solution Pattern

### 1. Identify Extractable Components

Look for:
- **Modal components** - Complete UI dialogs that can be extracted
- **Utility functions** - Pure functions that can move to utils modules
- **Duplicate code** - Components defined multiple times
- **Sub-components** - Logical sections that can become separate components

### 2. Extract Components

When extracting a component:

1. **Create a new file** in the same directory or a `components/` subdirectory
2. **Export the component** and its prop types
3. **Import dependencies** needed by the extracted component
4. **Remove from original file** and add import statement
5. **Verify build and lint** pass

### 3. Example: Clusters.tsx Refactoring

**Before:** 2057 lines, 49 hooks
**After:** 1317 lines (36% reduction)

**Changes Made:**

1. **Extracted ResourceDetailModal** (217 lines)
   - Created: `src/components/clusters/ResourceDetailModal.tsx`
   - Modal for displaying Kubernetes resource details
   - Includes tabs for describe, labels, and logs

2. **Removed duplicate formatMetadata** (24 lines)
   - Already existed in `utils.ts`
   - Updated imports to use existing version

3. **Removed duplicate NamespaceResources** (486 lines)
   - Already existed in `components/NamespaceResources.tsx`
   - Updated imports to use existing version

**Bundle Impact:**
- `Clusters.js`: 85.54 kB → 69.25 kB (19% reduction)

## Guidelines

### DO

✅ Extract complete, self-contained components
✅ Move utilities to shared utils modules
✅ Remove duplicate code
✅ Keep changes focused and testable
✅ Verify build and lint pass after changes
✅ Check for unused imports and clean them up

### DON'T

❌ Extract components with tight coupling to parent state
❌ Split components in ways that reduce readability
❌ Extract components that are only used once
❌ Make changes without verifying build succeeds

## Testing Strategy

1. **Build test**: `npm run build` - Must pass
2. **Lint test**: `npm run lint` - Check for new errors
3. **Bundle size**: Check for improvements in chunk sizes
4. **Functionality**: Manually test affected features if possible

## Future Work

The following components are candidates for similar refactoring:

- `CardWrapper.tsx` (1485 lines, 49 hooks)
- `GitHubActivity.tsx` (1187 lines, 27 hooks)
- `EPPRouting.tsx` (1177 lines, 15 hooks)
- `LLMdFlow.tsx` (1166 lines, 15 hooks)
- `ClusterGroups.tsx` (1131 lines)
- `HardwareHealthCard.tsx` (997 lines, 38 hooks)
- And 70+ other complex components

Apply the same pattern:
1. Identify extractable components
2. Extract to separate files
3. Remove duplicates
4. Verify functionality
