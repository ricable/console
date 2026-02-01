/**
 * Utility functions for CardWrapper
 */

/** Minimum duration to show spin animation (ensures at least one full rotation) */
export const MIN_SPIN_DURATION = 500

/**
 * Format relative time (e.g., "2m ago", "1h ago")
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

/**
 * Pending swap interface
 */
export interface PendingSwap {
  newType: string
  newTitle?: string
  reason: string
  swapAt: Date
}
