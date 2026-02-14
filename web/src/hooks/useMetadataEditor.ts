import { useState, useCallback } from 'react'

interface UseMetadataEditorOptions {
  initialMetadata?: Record<string, string>
  onSave?: (changes: Record<string, string | null>, newEntry: { key: string; value: string } | null) => Promise<void>
}

interface UseMetadataEditorReturn {
  // State
  isEditing: boolean
  pendingChanges: Record<string, string | null>
  newKey: string
  newValue: string
  isSaving: boolean
  error: string | null
  
  // Actions
  startEditing: () => void
  cancelEditing: () => void
  saveChanges: () => Promise<void>
  handleChange: (key: string, value: string) => void
  handleRemove: (key: string) => void
  undoChange: (key: string) => void
  setNewKey: (key: string) => void
  setNewValue: (value: string) => void
  hasChanges: () => boolean
}

/**
 * Custom hook for managing metadata (labels/annotations) editing state and operations.
 * Provides state management for editing, pending changes, and save/cancel operations.
 * 
 * @param options - Configuration options
 * @returns Editor state and actions
 */
export function useMetadataEditor(options: UseMetadataEditorOptions = {}): UseMetadataEditorReturn {
  const { onSave } = options

  const [isEditing, setIsEditing] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, string | null>>({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEditing = useCallback(() => {
    setIsEditing(true)
    setError(null)
  }, [])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setPendingChanges({})
    setNewKey('')
    setNewValue('')
    setError(null)
  }, [])

  const handleChange = useCallback((key: string, value: string) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleRemove = useCallback((key: string) => {
    setPendingChanges(prev => ({ ...prev, [key]: null }))
  }, [])

  const undoChange = useCallback((key: string) => {
    setPendingChanges(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }, [])

  const hasChanges = useCallback(() => {
    return Object.keys(pendingChanges).length > 0 || (newKey.trim() !== '' && newValue.trim() !== '')
  }, [pendingChanges, newKey, newValue])

  const saveChanges = useCallback(async () => {
    if (!onSave) return

    setIsSaving(true)
    setError(null)

    try {
      const newEntry = newKey.trim() && newValue.trim()
        ? { key: newKey.trim(), value: newValue.trim() }
        : null

      await onSave(pendingChanges, newEntry)

      // Reset state on success
      setIsEditing(false)
      setPendingChanges({})
      setNewKey('')
      setNewValue('')
    } catch (err) {
      setError(`Failed to save: ${err}`)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, pendingChanges, newKey, newValue])

  return {
    isEditing,
    pendingChanges,
    newKey,
    newValue,
    isSaving,
    error,
    startEditing,
    cancelEditing,
    saveChanges,
    handleChange,
    handleRemove,
    undoChange,
    setNewKey,
    setNewValue,
    hasChanges,
  }
}
