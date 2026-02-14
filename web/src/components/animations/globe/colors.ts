// KubeStellar theme colors - use CSS variables for consistency
// Cache colors after first read to avoid repeated getComputedStyle calls
let colorsCache: Record<string, string> | null = null

const getCSSVariable = (name: string, fallback: string): string => {
  if (typeof window === 'undefined') {
    return fallback
  }
  
  // Use cached values if available
  if (colorsCache && colorsCache[name]) {
    return colorsCache[name]
  }
  
  // Initialize cache on first access
  if (!colorsCache) {
    colorsCache = {}
  }
  
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const result = value || fallback
  colorsCache[name] = result
  return result
}

export const COLORS = {
  get primary() { return getCSSVariable('--globe-primary', '#1a90ff') },
  get secondary() { return getCSSVariable('--globe-secondary', '#6236FF') },
  get highlight() { return getCSSVariable('--globe-highlight', '#00C2FF') },
  get success() { return getCSSVariable('--globe-success', '#00E396') },
  get background() { return getCSSVariable('--globe-background', '#0a0f1c') },
  get accent1() { return getCSSVariable('--globe-accent1', '#FF5E84') },
  get accent2() { return getCSSVariable('--globe-accent2', '#FFD166') },
  get aiTraining() { return getCSSVariable('--globe-ai-training', '#B83FF7') },
  get aiInference() { return getCSSVariable('--globe-ai-inference', '#00D6E4') },
}
