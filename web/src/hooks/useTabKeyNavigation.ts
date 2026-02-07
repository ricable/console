import { useEffect, RefObject } from 'react'

/**
 * Hook to enable arrow key navigation in tab panels
 * 
 * @param tabCount - Number of tabs
 * @param activeIndex - Currently active tab index
 * @param onTabChange - Callback when tab changes
 * @param containerRef - Optional ref to the tab container
 * @param options - Configuration options
 */
export function useTabKeyNavigation({
  tabCount,
  activeIndex,
  onTabChange,
  containerRef,
  options = {},
}: {
  tabCount: number
  activeIndex: number
  onTabChange: (index: number) => void
  containerRef?: RefObject<HTMLElement>
  options?: {
    loop?: boolean // Whether to loop from last to first tab (default: true)
    homeEnd?: boolean // Whether to support Home/End keys (default: true)
  }
}) {
  const { loop = true, homeEnd = true } = options

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (tabCount === 0) return

      // Only handle if focus is on a tab element
      const target = e.target as HTMLElement
      if (target.getAttribute('role') !== 'tab' && !target.closest('[role="tab"]')) {
        return
      }

      let newIndex = activeIndex
      let handled = false

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          newIndex = activeIndex - 1
          if (newIndex < 0) {
            newIndex = loop ? tabCount - 1 : 0
          }
          handled = true
          break

        case 'ArrowRight':
          e.preventDefault()
          newIndex = activeIndex + 1
          if (newIndex >= tabCount) {
            newIndex = loop ? 0 : tabCount - 1
          }
          handled = true
          break

        case 'Home':
          if (homeEnd) {
            e.preventDefault()
            newIndex = 0
            handled = true
          }
          break

        case 'End':
          if (homeEnd) {
            e.preventDefault()
            newIndex = tabCount - 1
            handled = true
          }
          break
      }

      if (handled && newIndex !== activeIndex) {
        onTabChange(newIndex)
        
        // Focus the new tab
        const tabs = containerRef?.current?.querySelectorAll('[role="tab"]')
        if (tabs && tabs[newIndex]) {
          (tabs[newIndex] as HTMLElement).focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [tabCount, activeIndex, onTabChange, loop, homeEnd, containerRef])
}
