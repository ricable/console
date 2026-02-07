import { useEffect, useRef, RefObject } from 'react'

/**
 * Hook to enable arrow key navigation in dropdown menus and lists
 * 
 * @param isOpen - Whether the dropdown/menu is currently open
 * @param itemCount - Number of items in the list
 * @param onSelect - Callback when an item is selected (Enter/Space)
 * @param containerRef - Optional ref to the container element
 * @param options - Configuration options
 * @returns ref to attach to the container
 */
export function useArrowKeyNavigation({
  isOpen,
  itemCount,
  onSelect,
  containerRef,
  options = {},
}: {
  isOpen: boolean
  itemCount: number
  onSelect: (index: number) => void
  containerRef?: RefObject<HTMLElement>
  options?: {
    loop?: boolean // Whether to loop from last to first item (default: true)
    homeEnd?: boolean // Whether to support Home/End keys (default: true)
    initialIndex?: number // Starting index (default: -1, no selection)
  }
}) {
  const { loop = true, homeEnd = true, initialIndex = -1 } = options
  const internalRef = useRef<HTMLDivElement>(null)
  const currentIndexRef = useRef<number>(initialIndex)
  
  const ref = (containerRef || internalRef) as RefObject<HTMLDivElement>

  useEffect(() => {
    if (!isOpen) {
      currentIndexRef.current = initialIndex
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (itemCount === 0) return

      const items = ref.current?.querySelectorAll('[role="menuitem"], [role="option"], [data-menu-item]')
      if (!items || items.length === 0) return

      let handled = false

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          currentIndexRef.current = Math.min(currentIndexRef.current + 1, itemCount - 1)
          if (loop && currentIndexRef.current === itemCount - 1) {
            currentIndexRef.current = 0
          }
          handled = true
          break

        case 'ArrowUp':
          e.preventDefault()
          currentIndexRef.current = Math.max(currentIndexRef.current - 1, 0)
          if (loop && currentIndexRef.current === 0) {
            currentIndexRef.current = itemCount - 1
          }
          handled = true
          break

        case 'Home':
          if (homeEnd) {
            e.preventDefault()
            currentIndexRef.current = 0
            handled = true
          }
          break

        case 'End':
          if (homeEnd) {
            e.preventDefault()
            currentIndexRef.current = itemCount - 1
            handled = true
          }
          break

        case 'Enter':
        case ' ':
          if (currentIndexRef.current >= 0 && currentIndexRef.current < itemCount) {
            e.preventDefault()
            onSelect(currentIndexRef.current)
            handled = true
          }
          break
      }

      if (handled && currentIndexRef.current >= 0 && currentIndexRef.current < items.length) {
        const item = items[currentIndexRef.current] as HTMLElement
        item.focus()
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, itemCount, onSelect, loop, homeEnd, initialIndex, ref])

  return ref
}
