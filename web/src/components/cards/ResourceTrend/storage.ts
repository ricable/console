// Storage utilities for ResourceTrend component
import { ResourcePoint } from './types'
import { STORAGE_KEY, MAX_AGE_MS } from './constants'

// Load historical data from localStorage
export function loadSavedHistory(): ResourcePoint[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as { data: ResourcePoint[]; timestamp: number }
      // Check if data is not too old
      if (Date.now() - parsed.timestamp < MAX_AGE_MS) {
        return parsed.data
      }
    }
  } catch {
    // Ignore parse errors
  }
  return []
}

// Save historical data to localStorage
export function saveHistory(history: ResourcePoint[]): void {
  if (history.length === 0) return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data: history,
      timestamp: Date.now(),
    }))
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

// Check if a new data point should be added to history
export function shouldAddPoint(lastPoint: ResourcePoint | undefined, newPoint: ResourcePoint): boolean {
  if (!lastPoint) return true
  
  return (
    lastPoint.cpuCores !== newPoint.cpuCores ||
    lastPoint.memoryGB !== newPoint.memoryGB ||
    lastPoint.pods !== newPoint.pods ||
    lastPoint.nodes !== newPoint.nodes
  )
}
