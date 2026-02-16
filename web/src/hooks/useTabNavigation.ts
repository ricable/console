import { useCallback } from 'react'

export interface TabNavigationOptions {
  /** Current active tab index */
  activeIndex: number
  /** Total number of tabs */
  tabCount: number
  /** Callback when tab should change */
  onChange: (index: number) => void
  /** Whether to loop navigation (wrap from last to first) */
  loop?: boolean
  /** Orientation of the tab list */
  orientation?: 'horizontal' | 'vertical'
}

export interface TabNavigationResult {
  /** Key down handler to attach to the tablist */
  handleKeyDown: (event: React.KeyboardEvent) => void
  /** Props to spread on each tab button */
  getTabProps: (index: number) => {
    role: 'tab'
    'aria-selected': boolean
    'aria-controls': string
    tabIndex: number
    id: string
    onKeyDown: (event: React.KeyboardEvent) => void
  }
  /** Props to spread on each tab panel */
  getTabPanelProps: (index: number) => {
    role: 'tabpanel'
    'aria-labelledby': string
    id: string
    hidden: boolean
    tabIndex: number
  }
  /** Props to spread on the tablist container */
  getTabListProps: () => {
    role: 'tablist'
    'aria-orientation': 'horizontal' | 'vertical'
  }
}

/**
 * Reusable hook for keyboard navigation in tab panels.
 * 
 * Follows WAI-ARIA authoring practices for tabs:
 * - Arrow keys navigate between tabs
 * - Home/End jump to first/last tab
 * - Tab key moves focus out of tab list
 * - Space/Enter activate the focused tab
 * 
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useState(0)
 * const { getTabListProps, getTabProps, getTabPanelProps } = useTabNavigation({
 *   activeIndex: activeTab,
 *   tabCount: 3,
 *   onChange: setActiveTab,
 * })
 * 
 * return (
 *   <div>
 *     <div {...getTabListProps()}>
 *       {tabs.map((tab, i) => (
 *         <button key={i} {...getTabProps(i)}>
 *           {tab.label}
 *         </button>
 *       ))}
 *     </div>
 *     {tabs.map((tab, i) => (
 *       <div key={i} {...getTabPanelProps(i)}>
 *         {tab.content}
 *       </div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useTabNavigation({
  activeIndex,
  tabCount,
  onChange,
  loop = true,
  orientation = 'horizontal',
}: TabNavigationOptions): TabNavigationResult {
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const isHorizontal = orientation === 'horizontal'
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

    switch (event.key) {
      case nextKey:
        event.preventDefault()
        onChange(loop && activeIndex >= tabCount - 1 ? 0 : Math.min(activeIndex + 1, tabCount - 1))
        break

      case prevKey:
        event.preventDefault()
        onChange(loop && activeIndex <= 0 ? tabCount - 1 : Math.max(activeIndex - 1, 0))
        break

      case 'Home':
        event.preventDefault()
        onChange(0)
        break

      case 'End':
        event.preventDefault()
        onChange(tabCount - 1)
        break
    }
  }, [activeIndex, tabCount, onChange, loop, orientation])

  const getTabProps = useCallback((index: number) => ({
    role: 'tab' as const,
    'aria-selected': index === activeIndex,
    'aria-controls': `tabpanel-${index}`,
    tabIndex: index === activeIndex ? 0 : -1,
    id: `tab-${index}`,
    onKeyDown: handleKeyDown,
  }), [activeIndex, handleKeyDown])

  const getTabPanelProps = useCallback((index: number) => ({
    role: 'tabpanel' as const,
    'aria-labelledby': `tab-${index}`,
    id: `tabpanel-${index}`,
    hidden: index !== activeIndex,
    tabIndex: 0,
  }), [activeIndex])

  const getTabListProps = useCallback(() => ({
    role: 'tablist' as const,
    'aria-orientation': orientation,
  }), [orientation])

  return {
    handleKeyDown,
    getTabProps,
    getTabPanelProps,
    getTabListProps,
  }
}
