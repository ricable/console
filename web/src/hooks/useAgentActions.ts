/**
 * Agent Actions Hook - Actions for agent swarm management
 */

import { useState, useCallback } from 'react'
import type { AgentDeployRequest, AgentScaleRequest } from './useAgentSwarm'

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token')

// API fetch helper with support for custom method and body
async function fetchAgentSwarmAPI<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  options?: { method?: string; body?: string }
): Promise<T> {
  const token = getToken()
  if (!token) {
    throw new Error('No authentication token')
  }

  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
  }

  const url = `/api/agentswarm/${endpoint}?${searchParams}`
  const response = await fetch(url, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options?.body,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// Types
// ============================================================================

export interface AgentActionResult {
  success: boolean
  message: string
  error?: string
}

// ============================================================================
// Hook
// ============================================================================

export function useAgentActions() {
  const [isDeploying, setIsDeploying] = useState(false)
  const [isScaling, setIsScaling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  const deployAgent = useCallback(async (request: AgentDeployRequest): Promise<AgentActionResult> => {
    setIsDeploying(true)
    try {
      const response = await fetchAgentSwarmAPI<{ message: string }>('deploy', undefined, {
        method: 'POST',
        body: JSON.stringify(request),
      })
      return { success: true, message: response.message }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deploy agent'
      return { success: false, message, error: message }
    } finally {
      setIsDeploying(false)
    }
  }, [])

  const scaleAgent = useCallback(async (request: AgentScaleRequest): Promise<AgentActionResult> => {
    setIsScaling(true)
    try {
      const response = await fetchAgentSwarmAPI<{ message: string }>('scale', undefined, {
        method: 'POST',
        body: JSON.stringify(request),
      })
      return { success: true, message: response.message }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scale agent'
      return { success: false, message, error: message }
    } finally {
      setIsScaling(false)
    }
  }, [])

  const deleteAgent = useCallback(async (
    name: string,
    options?: { namespace?: string; cluster?: string }
  ): Promise<AgentActionResult> => {
    setIsDeleting(true)
    try {
      const params = new URLSearchParams()
      if (options?.namespace) params.append('namespace', options.namespace)
      if (options?.cluster) params.append('cluster', options.cluster)

      const queryString = params.toString()
      const endpoint = queryString
        ? `agents/${name}?${queryString}`
        : `agents/${name}`

      const response = await fetchAgentSwarmAPI<{ message: string }>(endpoint, undefined, {
        method: 'DELETE',
      })
      return { success: true, message: response.message }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete agent'
      return { success: false, message, error: message }
    } finally {
      setIsDeleting(false)
    }
  }, [])

  const restartAgent = useCallback(async (
    name: string,
    options?: { namespace?: string; cluster?: string }
  ): Promise<AgentActionResult> => {
    setIsRestarting(true)
    try {
      const params = new URLSearchParams()
      if (options?.namespace) params.append('namespace', options.namespace)
      if (options?.cluster) params.append('cluster', options.cluster)

      const queryString = params.toString()
      const endpoint = queryString
        ? `restart/${name}?${queryString}`
        : `restart/${name}`

      const response = await fetchAgentSwarmAPI<{ message: string }>(endpoint, undefined, {
        method: 'POST',
      })
      return { success: true, message: response.message }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restart agent'
      return { success: false, message, error: message }
    } finally {
      setIsRestarting(false)
    }
  }, [])

  return {
    // State
    isDeploying,
    isScaling,
    isDeleting,
    isRestarting,
    isLoading: isDeploying || isScaling || isDeleting || isRestarting,

    // Actions
    deployAgent,
    scaleAgent,
    deleteAgent,
    restartAgent,
  }
}

// ============================================================================
// Helper function for direct API calls (non-hook)
// ============================================================================

export async function deployAgentDirect(request: AgentDeployRequest): Promise<AgentActionResult> {
  try {
    const response = await fetchAgentSwarmAPI<{ message: string }>('deploy', undefined, {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return { success: true, message: response.message }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deploy agent'
    return { success: false, message, error: message }
  }
}

export async function scaleAgentDirect(request: AgentScaleRequest): Promise<AgentActionResult> {
  try {
    const response = await fetchAgentSwarmAPI<{ message: string }>('scale', undefined, {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return { success: true, message: response.message }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scale agent'
    return { success: false, message, error: message }
  }
}

export async function deleteAgentDirect(
  name: string,
  options?: { namespace?: string; cluster?: string }
): Promise<AgentActionResult> {
  try {
    const params = new URLSearchParams()
    if (options?.namespace) params.append('namespace', options.namespace)
    if (options?.cluster) params.append('cluster', options.cluster)

    const queryString = params.toString()
    const endpoint = queryString
      ? `agents/${name}?${queryString}`
      : `agents/${name}`

    const response = await fetchAgentSwarmAPI<{ message: string }>(endpoint, undefined, {
      method: 'DELETE',
    })
    return { success: true, message: response.message }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete agent'
    return { success: false, message, error: message }
  }
}

export async function restartAgentDirect(
  name: string,
  options?: { namespace?: string; cluster?: string }
): Promise<AgentActionResult> {
  try {
    const params = new URLSearchParams()
    if (options?.namespace) params.append('namespace', options.namespace)
    if (options?.cluster) params.append('cluster', options.cluster)

    const queryString = params.toString()
    const endpoint = queryString
      ? `restart/${name}?${queryString}`
      : `restart/${name}`

    const response = await fetchAgentSwarmAPI<{ message: string }>(endpoint, undefined, {
      method: 'POST',
    })
    return { success: true, message: response.message }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to restart agent'
    return { success: false, message, error: message }
  }
}
