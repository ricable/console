/**
 * Utilities for localStorage with TTL (Time To Live) validation
 * 
 * Use these utilities to read from localStorage with staleness checks.
 * This prevents using stale cached data that may be outdated.
 */

// Maximum age for cleanup (7 days in milliseconds)
const CLEANUP_MAX_AGE_DAYS = 7
const CLEANUP_MAX_AGE_MS = CLEANUP_MAX_AGE_DAYS * 24 * 60 * 60 * 1000

export interface StorageWithTTL<T> {
  data: T
  timestamp: number
}

/**
 * Read from localStorage with TTL validation
 * @param key - localStorage key
 * @param maxAge - Maximum age in milliseconds before data is considered stale
 * @returns Parsed data if valid and not stale, null otherwise
 */
export function getWithTTL<T>(key: string, maxAge: number): T | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const parsed: StorageWithTTL<T> = JSON.parse(item)
    
    // Check if data has timestamp (new format)
    if (typeof parsed === 'object' && parsed !== null && 'timestamp' in parsed && 'data' in parsed) {
      const age = Date.now() - parsed.timestamp
      if (age > maxAge) {
        // Data is stale, remove it
        localStorage.removeItem(key)
        return null
      }
      return parsed.data
    }
    
    // Legacy format without timestamp - treat as stale
    return null
  } catch {
    return null
  }
}

/**
 * Save to localStorage with timestamp for TTL validation
 * @param key - localStorage key
 * @param data - Data to store
 */
export function setWithTTL<T>(key: string, data: T): void {
  try {
    const item: StorageWithTTL<T> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (e) {
    // Handle quota exceeded
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('[Storage] Quota exceeded, clearing old items')
      cleanupOldItems()
      try {
        const item: StorageWithTTL<T> = {
          data,
          timestamp: Date.now(),
        }
        localStorage.setItem(key, JSON.stringify(item))
      } catch (retryError) {
        console.error('[Storage] Failed to save even after cleanup:', retryError)
      }
    } else {
      // Log other storage errors (e.g., SecurityError when cookies disabled)
      console.error('[Storage] Failed to save to localStorage:', e)
    }
  }
}

/**
 * Clean up old items from localStorage
 * Removes items older than CLEANUP_MAX_AGE_DAYS
 */
function cleanupOldItems(): void {
  const now = Date.now()
  
  const keysToRemove: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    
    try {
      const item = localStorage.getItem(key)
      if (!item) continue
      
      const parsed = JSON.parse(item)
      if (typeof parsed === 'object' && parsed !== null && 'timestamp' in parsed) {
        const age = now - parsed.timestamp
        if (age > CLEANUP_MAX_AGE_MS) {
          keysToRemove.push(key)
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

/**
 * Migrate existing localStorage data to new format with TTL
 * @param key - localStorage key
 * @param data - Current data value
 */
export function migrateToTTL<T>(key: string, data: T): void {
  try {
    const item = localStorage.getItem(key)
    if (!item) return
    
    const parsed = JSON.parse(item)
    
    // Check if already in new format
    if (typeof parsed === 'object' && parsed !== null && 'timestamp' in parsed && 'data' in parsed) {
      return // Already migrated
    }
    
    // Migrate to new format
    setWithTTL(key, data)
  } catch {
    // If migration fails, just set with current data
    setWithTTL(key, data)
  }
}
