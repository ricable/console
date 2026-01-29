// Utility functions for RSS Feed component

// Strip HTML tags from description
export function stripHTML(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

// Decode HTML entities
export function decodeHTMLEntities(text: string): string {
  const tmp = document.createElement('textarea')
  tmp.innerHTML = text
  return tmp.value
}

// Normalize Reddit URLs to use www.reddit.com instead of old.reddit.com
export function normalizeRedditLink(url: string): string {
  return url.replace(/old\.reddit\.com/g, 'www.reddit.com')
}

// Validate thumbnail URL
export function isValidThumbnail(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  // Filter out common placeholders and invalid URLs
  const invalidPatterns = [
    'self.', // Reddit self posts
    'default.', // Default thumbnails
    'nsfw.', // NSFW placeholder
    'spoiler.', // Spoiler placeholder
    'image.', // Some generic placeholders
    'httpss://', // Malformed URLs (double 's')
  ]
  if (invalidPatterns.some(pattern => url.includes(pattern))) return false
  // Must be a valid http/https URL
  if (!url.match(/^https?:\/\//i)) return false
  return true
}

// Format time ago (e.g. "2h ago")
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// Generate hash for URL (for cache keys)
export function hashUrl(url: string): string {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}
