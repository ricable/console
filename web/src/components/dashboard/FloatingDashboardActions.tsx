import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Layout, RotateCcw, Download, Upload, Pencil } from 'lucide-react'
import { useMissions } from '../../hooks/useMissions'
import { useMobile } from '../../hooks/useMobile'
import { useDropdownNavigation } from '../../hooks/useDropdownNavigation'
import { ResetMode } from '../../hooks/useDashboardReset'
import { ResetDialog } from './ResetDialog'
import { SidebarCustomizer } from '../layout/SidebarCustomizer'

interface FloatingDashboardActionsProps {
  onAddCard: () => void
  onOpenTemplates: () => void
  /** Callback for reset with mode selection */
  onReset?: (mode: ResetMode) => number
  /** Legacy: callback to reset dashboard to default cards (replace mode only) */
  onResetToDefaults?: () => void
  /** Whether the dashboard has been customized from defaults */
  isCustomized?: boolean
  /** Export current dashboard as JSON file */
  onExport?: () => void
  /** Import a dashboard from JSON file */
  onImport?: (json: unknown) => void
}

/**
 * Floating "+" button that expands into a menu with Add Card, Templates, and Reset.
 * Shifts left when mission sidebar is open to avoid overlap.
 */
export function FloatingDashboardActions({
  onAddCard,
  onOpenTemplates,
  onReset,
  onResetToDefaults,
  isCustomized,
  onExport,
  onImport,
}: FloatingDashboardActionsProps) {
  const { t } = useTranslation()
  const { isSidebarOpen, isSidebarMinimized } = useMissions()
  const { isMobile } = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Desktop: shift button left based on mission sidebar state
  // Mobile: always bottom left
  const getPositionClasses = () => {
    if (isMobile) return 'left-4 bottom-4'
    // Desktop: right side, shifts when sidebar open
    if (!isSidebarOpen) return 'right-6 bottom-20'
    if (isSidebarMinimized) return 'right-[72px] bottom-20' // 48px + 24px margin
    return 'right-[536px] bottom-20' // 500px + 36px margin
  }
  const positionClasses = getPositionClasses()

  const handleReset = (mode: ResetMode) => {
    setIsResetDialogOpen(false)
    if (onReset) {
      onReset(mode)
    } else if (onResetToDefaults && mode === 'replace') {
      onResetToDefaults()
    }
  }

  const handleImportClick = () => {
    setIsOpen(false)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImport) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      onImport(json)
    } catch {
      // Invalid JSON — ignore
    }
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const showResetOption = isCustomized && (onReset || onResetToDefaults)

  // Build list of actions for keyboard navigation
  const actions = [
    { id: 'add', label: t('dashboard.actions.addCard'), icon: Plus, handler: onAddCard, enabled: true },
    { id: 'templates', label: t('dashboard.actions.templates'), icon: Layout, handler: onOpenTemplates, enabled: true },
    { id: 'customize', label: t('dashboard.actions.customize'), icon: Pencil, handler: () => setIsCustomizerOpen(true), enabled: true },
    { id: 'reset', label: t('dashboard.actions.reset'), icon: RotateCcw, handler: () => setIsResetDialogOpen(true), enabled: showResetOption },
    { id: 'export', label: t('dashboard.actions.export'), icon: Download, handler: onExport, enabled: !!onExport },
    { id: 'import', label: t('dashboard.actions.import'), icon: Upload, handler: handleImportClick, enabled: !!onImport },
  ].filter(a => a.enabled)

  // Keyboard navigation
  const { selectedIndex, handleKeyDown, getItemProps, selectedRef } = useDropdownNavigation({
    isOpen,
    itemCount: actions.length,
    onSelect: (index) => {
      setIsOpen(false)
      actions[index].handler?.()
    },
    onClose: () => setIsOpen(false),
    loop: true,
    enableHomeEnd: true,
  })

  const menuBtnClass = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-card/95 hover:bg-card border border-border rounded-md shadow-md backdrop-blur-sm transition-all hover:shadow-lg whitespace-nowrap"

  return (
    <>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div ref={menuRef} className={`fixed ${positionClasses} z-40 flex flex-col ${isMobile ? 'items-start' : 'items-end'} gap-1.5 transition-all duration-300`}>
        {/* Expanded menu items */}
        {isOpen && (
          <div 
            className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
            onKeyDown={handleKeyDown}
          >
            {actions.map((action, idx) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  {...getItemProps(idx)}
                  ref={selectedIndex === idx ? selectedRef as React.RefObject<HTMLButtonElement> : null}
                  onClick={() => { setIsOpen(false); action.handler?.() }}
                  className={`${menuBtnClass} ${selectedIndex === idx ? 'ring-1 ring-blue-500/50' : ''}`}
                  data-tour={action.id === 'add' ? 'add-card' : action.id === 'templates' ? 'templates' : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              )
            })}
          </div>
        )}

        {/* FAB toggle - smaller on mobile */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
            isMobile ? 'w-8 h-8' : 'w-10 h-10'
          } ${
            isOpen
              ? 'bg-card border border-border rotate-45'
              : 'bg-gradient-ks hover:scale-110 hover:shadow-xl'
          }`}
          title={isOpen ? t('dashboard.actions.closeMenu') : t('dashboard.actions.dashboardActions')}
        >
          <Plus className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-foreground`} />
        </button>
      </div>

      <ResetDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onReset={handleReset}
      />

      <SidebarCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </>
  )
}
