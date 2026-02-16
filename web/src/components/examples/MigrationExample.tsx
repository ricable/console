/**
 * Example Migration Component
 * 
 * This file demonstrates how to use the new centralized utilities:
 * - useModal hook for modal state management
 * - Layout components for common flex/grid patterns
 * 
 * BEFORE migration:
 * - Manual useState for modal state
 * - Repetitive "flex items-center gap-*" classes
 * 
 * AFTER migration:
 * - useModal hook with descriptive names
 * - Reusable layout components
 */

import { useState } from 'react'
import { useModal } from '../../hooks/useModal'
import { FlexRowGap2, FlexRowGap1, FlexBetween, Grid } from '../../lib/layout'

// ============================================================================
// BEFORE: Manual modal state management
// ============================================================================

export function OldModalExample() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  return (
    <div>
      {/* Manual open/close handlers */}
      <button onClick={() => setIsSettingsOpen(true)}>Settings</button>
      <button onClick={() => setIsDeleteConfirmOpen(true)}>Delete</button>

      {/* Manual close in modals */}
      {isSettingsOpen && (
        <div>
          <h2>Settings Modal</h2>
          <button onClick={() => setIsSettingsOpen(false)}>Close</button>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div>
          <h2>Confirm Delete</h2>
          <button onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// AFTER: Using useModal hook
// ============================================================================

export function NewModalExample() {
  // Descriptive names, clean API
  const settings = useModal()
  const deleteConfirm = useModal()

  return (
    <div>
      {/* Simple, readable open handlers */}
      <button onClick={settings.open}>Settings</button>
      <button onClick={deleteConfirm.open}>Delete</button>

      {/* Simple close handlers */}
      {settings.isOpen && (
        <div>
          <h2>Settings Modal</h2>
          <button onClick={settings.close}>Close</button>
        </div>
      )}

      {deleteConfirm.isOpen && (
        <div>
          <h2>Confirm Delete</h2>
          <button onClick={deleteConfirm.close}>Cancel</button>
          <button onClick={deleteConfirm.close}>Confirm</button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BEFORE: Repetitive layout classes
// ============================================================================

export function OldLayoutExample() {
  return (
    <div>
      {/* Repeated pattern: flex items-center gap-2 */}
      <div className="flex items-center gap-2">
        <span>🚀</span>
        <span>Deploy</span>
      </div>

      {/* Repeated pattern: flex items-center gap-1 */}
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span>Healthy</span>
      </div>

      {/* Repeated pattern: flex items-center justify-between */}
      <div className="flex items-center justify-between">
        <span>Total Resources</span>
        <span>42</span>
      </div>

      {/* Repeated pattern: grid grid-cols-3 */}
      <div className="grid grid-cols-3 gap-4">
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
      </div>
    </div>
  )
}

// ============================================================================
// AFTER: Using layout components
// ============================================================================

export function NewLayoutExample() {
  return (
    <div>
      {/* Reusable component */}
      <FlexRowGap2>
        <span>🚀</span>
        <span>Deploy</span>
      </FlexRowGap2>

      {/* Reusable component */}
      <FlexRowGap1>
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span>Healthy</span>
      </FlexRowGap1>

      {/* Reusable component */}
      <FlexBetween>
        <span>Total Resources</span>
        <span>42</span>
      </FlexBetween>

      {/* Reusable component with props */}
      <Grid cols={3} className="gap-4">
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
      </Grid>
    </div>
  )
}

// ============================================================================
// COMBINED EXAMPLE: Real-world usage
// ============================================================================

export function RealWorldExample() {
  const addItem = useModal()
  const editItem = useModal()

  return (
    <div className="p-4 space-y-4">
      {/* Header with actions */}
      <FlexBetween>
        <h2 className="text-xl font-bold">My Resources</h2>
        <FlexRowGap2>
          <button
            onClick={addItem.open}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Add
          </button>
          <button
            onClick={editItem.open}
            className="px-3 py-1 bg-gray-500 text-white rounded"
          >
            Edit
          </button>
        </FlexRowGap2>
      </FlexBetween>

      {/* Item list */}
      <Grid cols={2} className="gap-4">
        <div className="border rounded p-4">
          <FlexRowGap2>
            <span>📦</span>
            <span>Item 1</span>
          </FlexRowGap2>
          <FlexRowGap1 className="mt-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Active</span>
          </FlexRowGap1>
        </div>

        <div className="border rounded p-4">
          <FlexRowGap2>
            <span>📦</span>
            <span>Item 2</span>
          </FlexRowGap2>
          <FlexRowGap1 className="mt-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-600">Pending</span>
          </FlexRowGap1>
        </div>
      </Grid>

      {/* Add modal */}
      {addItem.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Item</h3>
            <input
              type="text"
              placeholder="Item name"
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <FlexRowGap2 className="justify-end">
              <button
                onClick={addItem.close}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addItem.close}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Add
              </button>
            </FlexRowGap2>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editItem.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Item</h3>
            <input
              type="text"
              placeholder="Item name"
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <FlexRowGap2 className="justify-end">
              <button
                onClick={editItem.close}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={editItem.close}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Save
              </button>
            </FlexRowGap2>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Benefits of the migration:
 * 
 * 1. Readability:
 *    - `addItem.open` is more descriptive than `setIsAddItemOpen(true)`
 *    - Layout components make intent clear
 * 
 * 2. Consistency:
 *    - Standardized patterns across the codebase
 *    - Easier code reviews
 * 
 * 3. Maintainability:
 *    - Change layout once, affects all uses
 *    - Easier to update modal logic globally
 * 
 * 4. Type Safety:
 *    - Full TypeScript support
 *    - IDE autocomplete
 * 
 * 5. Less Code:
 *    - Fewer lines of repetitive code
 *    - DRY principle
 */
