// Storage and caching utilities for RSS feeds
import { FeedConfig, FeedItem } from './types'
import { FEEDS_KEY, CACHE_KEY_PREFIX, CACHE_TTL_MS } from './constants'
import { hashUrl } from './utils'

// Load saved feeds from localStorage
export function loadSavedFeeds(): FeedConfig[] {
  try {
    const saved = localStorage.getItem(FEEDS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (e) {
    console.error('Failed to load saved feeds:', e)
  }
  return []
}

// Save feeds to localStorage
export function saveFeeds(feeds: FeedConfig[]) {
  try {
    localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds))
  } catch (e) {
    console.error('Failed to save feeds:', e)
  }
}

// Get cached feed data
export function getCachedFeed(
  url: string,
  ignoreExpiry = false
): { items: FeedItem[]; timestamp: number; isStale: boolean } | null {
  try {
    const cacheKey = CACHE_KEY_PREFIX + hashUrl(url)
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null

    const parsed = JSON.parse(cached)
    const now = Date.now()
    const age = now - parsed.timestamp
    const isStale = age > CACHE_TTL_MS

    // Parse dates from cached items
    const items = parsed.items.map((item: any) => ({
      ...item,
      pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
    }))

    if (ignoreExpiry || !isStale) {
      return { items, timestamp: parsed.timestamp, isStale }
    }
    return null
  } catch (e) {
    console.error('Failed to get cached feed:', e)
    return null
  }
}

// Cache feed data
export function cacheFeed(url: string, items: FeedItem[]) {
  try {
    const cacheKey = CACHE_KEY_PREFIX + hashUrl(url)
    const data = {
      items,
      timestamp: Date.now(),
    }
    localStorage.setItem(cacheKey, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to cache feed:', e)
    // Clean up old cache entries if storage is full
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      cleanOldCache()
    }
  }
}

// Clean up old cache entries
function cleanOldCache() {
  try {
    const keys = Object.keys(localStorage)
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX))

    // Sort by timestamp and remove oldest entries
    const entries = cacheKeys
      .map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          return { key, timestamp: data.timestamp || 0 }
        } catch {
          return { key, timestamp: 0 }
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25)
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key)
    }
  } catch (e) {
    console.error('Failed to clean old cache:', e)
  }
}
