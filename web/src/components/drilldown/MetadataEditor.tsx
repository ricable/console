import { useState } from 'react'
import { Pencil, ChevronUp, ChevronDown, X, Trash2, Plus, Save, Loader2, Copy, Check } from 'lucide-react'
import { cn } from '../../lib/cn'

interface MetadataEditorProps {
  title: string
  singularTitle?: string
  metadata: Record<string, string>
  isEditing: boolean
  pendingChanges: Record<string, string | null>
  newKey: string
  newValue: string
  isSaving: boolean
  error: string | null
  agentConnected: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onChange: (key: string, value: string) => void
  onRemove: (key: string) => void
  onUndo: (key: string) => void
  onNewKeyChange: (key: string) => void
  onNewValueChange: (value: string) => void
}

export function MetadataEditor({
  title,
  singularTitle,
  metadata,
  isEditing,
  pendingChanges,
  newKey,
  newValue,
  isSaving,
  error,
  agentConnected,
  onStartEdit,
  onCancelEdit,
  onSave,
  onChange,
  onRemove,
  onUndo,
  onNewKeyChange,
  onNewValueChange,
}: MetadataEditorProps) {
  const [showAll, setShowAll] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const entries = Object.entries(metadata)
  const displayedEntries = showAll ? entries : entries.slice(0, 10)

  const handleCopy = (fieldId: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">
          {title} ({entries.length})
        </h3>
        <div className="flex items-center gap-2">
          {entries.length > 10 && !isEditing && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              {showAll ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show all <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
          {agentConnected && !isEditing && (
            <button
              onClick={() => { onStartEdit(); setShowAll(true) }}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 font-medium"
            >
              <Pencil className="w-3 h-3" />
              Edit {title}
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          {/* Existing entries - editable */}
          <div className="space-y-2">
            {entries.map(([key, value]) => {
              const isRemoved = pendingChanges[key] === null
              const currentValue = pendingChanges[key] !== undefined && pendingChanges[key] !== null
                ? pendingChanges[key]
                : value
              const isModified = pendingChanges[key] !== undefined

              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border',
                    isRemoved ? 'bg-red-500/10 border-red-500/20 opacity-50' : 'bg-card/50 border-border'
                  )}
                >
                  <span className="text-xs text-primary font-mono flex-shrink-0">{key}</span>
                  <span className="text-muted-foreground">=</span>
                  {isRemoved ? (
                    <span className="text-xs text-red-400 line-through flex-1">{value}</span>
                  ) : (
                    <input
                      type="text"
                      value={currentValue || ''}
                      onChange={(e) => onChange(key, e.target.value)}
                      className="flex-1 text-xs font-mono bg-secondary/50 border border-border rounded px-2 py-1 text-foreground min-w-0"
                    />
                  )}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isModified && (
                      <button
                        onClick={() => onUndo(key)}
                        className="p-1 rounded hover:bg-secondary/50 text-yellow-400"
                        title="Undo change"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {!isRemoved && (
                      <button
                        onClick={() => onRemove(key)}
                        className="p-1 rounded hover:bg-red-500/20 text-red-400"
                        title={`Remove ${singularTitle || title.toLowerCase()}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add new entry */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <Plus className="w-4 h-4 text-green-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="key"
              value={newKey}
              onChange={(e) => onNewKeyChange(e.target.value)}
              className="w-32 text-xs font-mono bg-secondary/50 border border-border rounded px-2 py-1 text-foreground"
            />
            <span className="text-muted-foreground">=</span>
            <input
              type="text"
              placeholder="value"
              value={newValue}
              onChange={(e) => onNewValueChange(e.target.value)}
              className="flex-1 text-xs font-mono bg-secondary/50 border border-border rounded px-2 py-1 text-foreground min-w-0"
            />
          </div>

          {/* Save/Cancel buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm hover:bg-secondary/80 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-2">
          {displayedEntries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-border">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-primary font-mono">{key}</span>
                <span className="text-muted-foreground mx-1">=</span>
                <span className="text-xs text-foreground font-mono break-all">{value}</span>
              </div>
              <button
                onClick={() => handleCopy(`${title}-${key}`, `${key}=${value}`)}
                className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground flex-shrink-0 ml-2"
              >
                {copiedField === `${title}-${key}` ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          No {title.toLowerCase()} found
        </div>
      )}
    </div>
  )
}
