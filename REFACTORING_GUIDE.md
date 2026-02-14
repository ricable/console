# Reusable Component Refactoring

This document describes the new reusable hooks and components created to address high-complexity component issues.

## Overview

Three new reusable pieces have been created to help reduce complexity in large components:

1. **useMetadataEditor** - Hook for managing metadata (labels/annotations) editing
2. **useClusterFiltering** - Hook for cluster filtering and sorting
3. **MetadataEditor** - Complete UI component for editing labels/annotations

## useMetadataEditor Hook

**Location:** `web/src/hooks/useMetadataEditor.ts`

**Purpose:** Manages all state and logic for editing metadata (labels or annotations), including pending changes, new entries, and save/cancel operations.

### Usage Example

```tsx
import { useMetadataEditor } from '../../hooks/useMetadataEditor'

function MyComponent() {
  const [labels, setLabels] = useState<Record<string, string>>({})
  
  const labelEditor = useMetadataEditor({
    onSave: async (changes, newEntry) => {
      // Build kubectl command with changes
      const labelArgs = ['label', 'pod', podName, '-n', namespace, '--overwrite']
      
      // Add new entry if provided
      if (newEntry) {
        labelArgs.push(`${newEntry.key}=${newEntry.value}`)
      }
      
      // Apply pending changes
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) {
          labelArgs.push(`${key}-`)  // Remove
        } else {
          labelArgs.push(`${key}=${value}`)  // Update
        }
      }
      
      // Execute command
      await runKubectl(labelArgs)
      
      // Update local state
      setLabels(prev => {
        const updated = { ...prev }
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) {
            delete updated[key]
          } else {
            updated[key] = value
          }
        }
        if (newEntry) {
          updated[newEntry.key] = newEntry.value
        }
        return updated
      })
    }
  })
  
  return (
    <div>
      {/* Use labelEditor state and actions */}
      <button onClick={labelEditor.startEditing}>Edit Labels</button>
      {labelEditor.isEditing && (
        <div>
          {/* Edit UI */}
          <button onClick={labelEditor.saveChanges}>Save</button>
          <button onClick={labelEditor.cancelEditing}>Cancel</button>
        </div>
      )}
    </div>
  )
}
```

### Replaces

In PodDrillDown.tsx, this hook can replace 12+ state variables:
- `editingLabels`, `pendingLabelChanges`, `newLabelKey`, `newLabelValue`
- `labelSaving`, `labelError`
- `editingAnnotations`, `pendingAnnotationChanges`, `newAnnotationKey`, `newAnnotationValue`
- `annotationSaving`, `annotationError`

## useClusterFiltering Hook

**Location:** `web/src/hooks/useClusterFiltering.ts`

**Purpose:** Manages cluster filtering (health, text search, global selection) and sorting.

### Usage Example

```tsx
import { useClusterFiltering } from '../../hooks/useClusterFiltering'
import { isClusterUnreachable } from './utils'

function ClustersPage() {
  const { clusters } = useClusters()
  const { selectedClusters, isAllClustersSelected } = useGlobalFilters()
  
  const filtering = useClusterFiltering({
    clusters,
    globalSelectedClusters: selectedClusters,
    isAllClustersSelected,
    isClusterUnreachable,
    initialFilter: 'all',
    initialSortBy: 'name',
    initialSortAsc: true,
  })
  
  return (
    <div>
      <input
        type="text"
        value={filtering.customFilter}
        onChange={(e) => filtering.setCustomFilter(e.target.value)}
        placeholder="Search clusters..."
      />
      
      <select value={filtering.filter} onChange={(e) => filtering.setFilter(e.target.value)}>
        <option value="all">All Clusters</option>
        <option value="healthy">Healthy</option>
        <option value="unhealthy">Unhealthy</option>
        <option value="unreachable">Unreachable</option>
      </select>
      
      <select value={filtering.sortBy} onChange={(e) => filtering.setSortBy(e.target.value)}>
        <option value="name">Name</option>
        <option value="nodes">Nodes</option>
        <option value="pods">Pods</option>
        <option value="health">Health</option>
      </select>
      
      {filtering.filteredClusters.map(cluster => (
        <ClusterCard key={cluster.name} cluster={cluster} />
      ))}
    </div>
  )
}
```

### Replaces

In Clusters.tsx, this hook can replace:
- `filter`, `sortBy`, `sortAsc`, `customFilter` state variables
- `filteredClusters` and `globalFilteredClusters` useMemo computations
- Complex filtering and sorting logic

## MetadataEditor Component

**Location:** `web/src/components/drilldown/MetadataEditor.tsx`

**Purpose:** Complete, reusable UI for displaying and editing labels or annotations.

### Usage Example

```tsx
import { MetadataEditor } from '../drilldown/MetadataEditor'
import { useMetadataEditor } from '../../hooks/useMetadataEditor'

function MyComponent() {
  const [labels, setLabels] = useState<Record<string, string>>({})
  
  const labelEditor = useMetadataEditor({
    initialMetadata: labels,
    onSave: async (changes, newEntry) => {
      // Your save logic here
      await saveLabels(changes, newEntry)
    }
  })
  
  return (
    <MetadataEditor
      title="Labels"
      metadata={labels}
      isEditing={labelEditor.isEditing}
      pendingChanges={labelEditor.pendingChanges}
      newKey={labelEditor.newKey}
      newValue={labelEditor.newValue}
      isSaving={labelEditor.isSaving}
      error={labelEditor.error}
      agentConnected={agentConnected}
      onStartEdit={labelEditor.startEditing}
      onCancelEdit={labelEditor.cancelEditing}
      onSave={labelEditor.saveChanges}
      onChange={labelEditor.handleChange}
      onRemove={labelEditor.handleRemove}
      onUndo={labelEditor.undoChange}
      onNewKeyChange={labelEditor.setNewKey}
      onNewValueChange={labelEditor.setNewValue}
    />
  )
}
```

### Replaces

In PodDrillDown.tsx, this component can replace 150+ lines of JSX for:
- Labels section (lines ~1386-1552)
- Annotations section (lines ~1556-1732)

## Benefits

1. **Reduced Duplication** - The same logic is used in multiple places (labels and annotations in PodDrillDown)
2. **Easier Testing** - Hooks and components can be tested independently
3. **Better Maintainability** - Changes to metadata editing only need to be made once
4. **Smaller Files** - Can reduce PodDrillDown.tsx by 200+ lines
5. **Reusability** - Other components can use these same patterns

## Integration Strategy

To integrate these into existing components:

1. **Gradual Migration** - Start with one component at a time
2. **Feature Parity** - Ensure exact same functionality before switching
3. **Testing** - Test thoroughly after each integration
4. **Backward Compatible** - Keep old code commented out initially

## Future Opportunities

Other components that could benefit from similar refactoring:

1. **NamespaceManager** - Could use similar filtering hook
2. **Other drilldown views** - Could use MetadataEditor
3. **Any component with complex filtering** - Could use useClusterFiltering pattern
4. **Any component editing K8s metadata** - Could use useMetadataEditor
