import { Users } from 'lucide-react'
import { useActiveUsers } from '../../../hooks/useActiveUsers'
import { useDemoMode } from '../../../hooks/useDemoMode'
import { cn } from '../../../lib/cn'

/**
 * Active user count indicator for navbar.
 * Shows real-time count of active users connected to the console.
 * - In demo mode: shows total connections (sessions)
 * - In OAuth mode: shows unique active users
 * - Uses WebSocket in backend mode for real-time updates
 * - Uses HTTP heartbeat in Netlify/serverless mode
 */
export function ActiveUserCount() {
  const { viewerCount, isLoading, hasError } = useActiveUsers()
  const { isDemoMode } = useDemoMode()

  // Don't render while loading initially
  if (isLoading && viewerCount === 0) {
    return null
  }

  // Show error state with fallback
  if (hasError) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border"
        title="Unable to fetch active user count"
      >
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">—</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
        "bg-secondary/50 border border-border",
        "hover:bg-secondary/70"
      )}
      title={isDemoMode ? 'Active viewers (demo mode)' : 'Active users'}
    >
      <Users className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-foreground">
        {viewerCount}
      </span>
      <span className="text-xs text-muted-foreground hidden lg:inline">
        {viewerCount === 1 ? 'viewer' : 'viewers'}
      </span>
    </div>
  )
}
