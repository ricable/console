import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, AlertCircle } from 'lucide-react'
import { useActiveUsers } from '../../../hooks/useActiveUsers'
import { getDemoMode } from '../../../hooks/useDemoMode'
import { cn } from '../../../lib/cn'

export function ActiveUsersWidget() {
  const { t } = useTranslation()
  const { viewerCount, isLoading, hasError, refetch } = useActiveUsers()
  const [showDetails, setShowDetails] = useState(false)
  const [countAnimating, setCountAnimating] = useState(false)
  const previousCountRef = useRef<number>(viewerCount)
  const widgetRef = useRef<HTMLDivElement>(null)
  const isDemoMode = getDemoMode()

  // Animate icon when user count increases
  useEffect(() => {
    const increase = viewerCount - previousCountRef.current
    // Trigger animation if count increased by 1 or more
    if (increase > 0) {
      setCountAnimating(true)
      const timer = setTimeout(() => setCountAnimating(false), 1000)
      previousCountRef.current = viewerCount
      return () => clearTimeout(timer)
    }
    // Always update ref even if count didn't increase
    previousCountRef.current = viewerCount
  }, [viewerCount])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setShowDetails(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle Escape key to close dropdown
  useEffect(() => {
    if (!showDetails) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDetails(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showDetails])

  return (
    <div className="relative" ref={widgetRef}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
          hasError
            ? 'bg-red-500/10 text-red-400'
            : isDemoMode
            ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
            : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
        title={isDemoMode ? t('activeUsers.demoMode') : t('activeUsers.title')}
      >
        <Users 
          className={cn(
            "w-4 h-4 transition-transform",
            countAnimating && "animate-pulse text-blue-400 scale-110"
          )} 
        />
        <span className="text-xs font-medium hidden sm:inline">
          {isLoading ? '...' : viewerCount}
        </span>
      </button>

      {/* Details dropdown */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('activeUsers.heading')}
            </h4>
            {hasError && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>

          {hasError ? (
            <div className="space-y-3">
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                {t('activeUsers.error')}
              </div>
              <button
                onClick={() => {
                  refetch()
                  setShowDetails(false)
                }}
                className="w-full text-xs text-red-400 hover:text-red-300 text-center py-2 hover:bg-secondary rounded transition-colors"
              >
                {t('activeUsers.retry')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active users count */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {isDemoMode ? t('activeUsers.demoUsers') : t('activeUsers.activeViewers')}
                </span>
                <span className="text-2xl font-bold text-foreground font-mono">
                  {isLoading ? '...' : viewerCount}
                </span>
              </div>

              {/* Demo mode indicator */}
              {isDemoMode && (
                <div className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded p-2">
                  {t('activeUsers.demoModeNote')}
                </div>
              )}

              {/* Info text */}
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                {isDemoMode
                  ? t('activeUsers.demoDescription')
                  : t('activeUsers.description')
                }
              </div>

              {/* Real-time indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>{t('activeUsers.realTimeUpdates')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
