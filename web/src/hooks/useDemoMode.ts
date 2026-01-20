import { useState, useEffect, useCallback } from 'react'

const DEMO_MODE_KEY = 'kkc-demo-mode'

// Global state for demo mode to ensure consistency across components
let globalDemoMode = false
const listeners = new Set<(value: boolean) => void>()

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(DEMO_MODE_KEY)
  globalDemoMode = stored === 'true'
}

function notifyListeners() {
  listeners.forEach(listener => listener(globalDemoMode))
}

/**
 * Hook to manage demo mode state with localStorage persistence.
 * When demo mode is enabled, the app shows demo/mock data instead of
 * connecting to the real MCP agent.
 */
export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(globalDemoMode)

  useEffect(() => {
    // Subscribe to changes
    const handleChange = (value: boolean) => {
      setIsDemoMode(value)
    }
    listeners.add(handleChange)

    // Sync with current global state
    setIsDemoMode(globalDemoMode)

    return () => {
      listeners.delete(handleChange)
    }
  }, [])

  const toggleDemoMode = useCallback(() => {
    globalDemoMode = !globalDemoMode
    localStorage.setItem(DEMO_MODE_KEY, String(globalDemoMode))
    notifyListeners()
  }, [])

  const setDemoMode = useCallback((value: boolean) => {
    globalDemoMode = value
    localStorage.setItem(DEMO_MODE_KEY, String(value))
    notifyListeners()
  }, [])

  return {
    isDemoMode,
    toggleDemoMode,
    setDemoMode,
  }
}

/**
 * Get current demo mode state without subscribing to changes.
 * Useful for one-time checks in non-React code.
 */
export function getDemoMode(): boolean {
  return globalDemoMode
}
