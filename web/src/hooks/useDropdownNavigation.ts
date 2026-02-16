import { useState, useEffect, useCallback, useRef } from 'react'

export interface DropdownNavigationOptions {
  /** Whether the dropdown is currently open */
  isOpen: boolean
  /** Number of items in the dropdown */
  itemCount: number
  /** Callback when an item is selected */
  onSelect: (index: number) => void
  /** Callback when dropdown should close */
  onClose: () => void
  /** Whether to loop navigation (wrap from last to first) */
  loop?: boolean
  /** Whether to enable Home/End keys */
  enableHomeEnd?: boolean
  /** Initial selected index */
  initialIndex?: number
}

export interface DropdownNavigationResult {
  /** Currently selected index */
  selectedIndex: number
  /** Set the selected index manually */
  setSelectedIndex: (index: number | ((prev: number) => number)) => void
  /** Key down handler to attach to the dropdown container */
  handleKeyDown: (event: React.KeyboardEvent) => void
  /** Get props for item - returns data attributes and optional ref */
  getItemProps: (index: number) => {
    'data-selected': boolean
    'data-index': number
  }
  /** Ref for currently selected item (for auto-scrolling) */
  selectedRef: React.RefObject<HTMLElement>
}

/**
 * Reusable hook for keyboard navigation in dropdown menus.
 * 
 * Provides:
 * - Arrow Up/Down navigation
 * - Enter/Space to select
 * - Escape to close
 * - Optional Home/End keys
 * - Auto-scroll to selected item
 * 
 * @example
 * ```tsx
 * const { selectedIndex, handleKeyDown, getItemProps } = useDropdownNavigation({
 *   isOpen,
 *   itemCount: items.length,
 *   onSelect: (index) => handleSelect(items[index]),
 *   onClose: () => setIsOpen(false),
 *   loop: true,
 *   enableHomeEnd: true,
 * })
 * 
 * return (
 *   <div onKeyDown={handleKeyDown}>
 *     {items.map((item, index) => (
 *       <div 
 *         key={index} 
 *         {...getItemProps(index)}
 *         ref={selectedIndex === index ? selectedRef : null}
 *       >
 *         {item.label}
 *       </div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useDropdownNavigation({
  isOpen,
  itemCount,
  onSelect,
  onClose,
  loop = true,
  enableHomeEnd = true,
  initialIndex = 0,
}: DropdownNavigationOptions): DropdownNavigationResult {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const selectedRef = useRef<HTMLElement>(null)

  // Reset selection when dropdown opens/closes or item count changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  useEffect(() => {
    if (selectedIndex >= itemCount && itemCount > 0) {
      setSelectedIndex(Math.max(0, itemCount - 1))
    }
  }, [itemCount, selectedIndex])

  // Auto-scroll selected item into view
  useEffect(() => {
    if (isOpen && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [isOpen, selectedIndex])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen || itemCount === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => {
          const next = prev + 1
          if (next >= itemCount) {
            return loop ? 0 : itemCount - 1
          }
          return next
        })
        break

      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => {
          const next = prev - 1
          if (next < 0) {
            return loop ? itemCount - 1 : 0
          }
          return next
        })
        break

      case 'Home':
        if (enableHomeEnd) {
          event.preventDefault()
          setSelectedIndex(0)
        }
        break

      case 'End':
        if (enableHomeEnd) {
          event.preventDefault()
          setSelectedIndex(Math.max(0, itemCount - 1))
        }
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect(selectedIndex)
        break

      case 'Escape':
        event.preventDefault()
        onClose()
        break
    }
  }, [isOpen, itemCount, selectedIndex, onSelect, onClose, loop, enableHomeEnd])

  const getItemProps = useCallback((index: number) => {
    return {
      'data-selected': index === selectedIndex,
      'data-index': index,
    }
  }, [selectedIndex])

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    getItemProps,
    selectedRef,
  }
}
