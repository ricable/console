import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalAgent } from './useLocalAgent'
import { isDemoMode } from '../lib/demoMode'

const LOCAL_AGENT_URL = 'http://127.0.0.1:8585'

export interface LocalClusterTool {
  name: 'kind' | 'k3d' | 'minikube'
  installed: boolean
  version?: string
  path?: string
}

export interface LocalCluster {
  name: string
  tool: string
  status: 'running' | 'stopped' | 'unknown'
}

export interface CreateClusterResult {
  status: 'creating' | 'error'
  message: string
}

// Demo data for when in demo mode or agent is not connected
const DEMO_TOOLS: LocalClusterTool[] = [
  { name: 'kind', installed: true, version: '0.24.0', path: '/usr/local/bin/kind' },
  { name: 'k3d', installed: true, version: '5.7.0', path: '/usr/local/bin/k3d' },
  { name: 'minikube', installed: true, version: '1.34.0', path: '/usr/local/bin/minikube' },
]

const DEMO_CLUSTERS: LocalCluster[] = [
  { name: 'kind-dev', tool: 'kind', status: 'running' },
  { name: 'k3d-staging', tool: 'k3d', status: 'running' },
  { name: 'minikube-local', tool: 'minikube', status: 'stopped' },
]

export function useLocalClusterTools() {
  const { isConnected } = useLocalAgent()
  const inDemoMode = isDemoMode()
  const isMountedRef = useRef(true)
  const [tools, setTools] = useState<LocalClusterTool[]>([])
  const [clusters, setClusters] = useState<LocalCluster[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null) // cluster name being deleted

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fetch detected tools
  const fetchTools = useCallback(async () => {
    // In demo mode, show demo data
    if (inDemoMode) {
      setTools(DEMO_TOOLS)
      setError(null)
      return
    }

    if (!isConnected) {
      setTools([])
      return
    }

    try {
      const response = await fetch(`${LOCAL_AGENT_URL}/local-cluster-tools`)
      if (response.ok) {
        const data = await response.json()
        setTools(data.tools || [])
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch local cluster tools:', err)
      setError('Failed to fetch cluster tools')
    }
  }, [isConnected, inDemoMode])

  // Fetch existing clusters
  const fetchClusters = useCallback(async () => {
    // In demo mode, show demo data
    if (inDemoMode) {
      setIsLoading(true)
      // Simulate loading delay for realism
      setTimeout(() => {
        if (isMountedRef.current) {
          setClusters(DEMO_CLUSTERS)
          setError(null)
          setIsLoading(false)
        }
      }, 300)
      return
    }

    if (!isConnected) {
      setClusters([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${LOCAL_AGENT_URL}/local-clusters`)
      if (response.ok) {
        const data = await response.json()
        if (isMountedRef.current) {
          setClusters(data.clusters || [])
          setError(null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch local clusters:', err)
      if (isMountedRef.current) {
        setError('Failed to fetch clusters')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [isConnected, inDemoMode])

  // Create a new cluster
  const createCluster = useCallback(async (tool: string, name: string): Promise<CreateClusterResult> => {
    // In demo mode, simulate cluster creation
    if (inDemoMode) {
      setIsCreating(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (isMountedRef.current) {
        setIsCreating(false)
      }
      return { status: 'creating', message: `Demo: Creating ${tool} cluster "${name}"` }
    }

    if (!isConnected) {
      return { status: 'error', message: 'Agent not connected' }
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch(`${LOCAL_AGENT_URL}/local-clusters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, name }),
      })

      if (response.ok) {
        const data = await response.json()
        return { status: 'creating', message: data.message }
      } else {
        const text = await response.text()
        return { status: 'error', message: text }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create cluster'
      if (isMountedRef.current) {
        setError(message)
      }
      return { status: 'error', message }
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false)
      }
    }
  }, [isConnected, inDemoMode])

  // Delete a cluster
  const deleteCluster = useCallback(async (tool: string, name: string): Promise<boolean> => {
    // In demo mode, simulate cluster deletion
    if (inDemoMode) {
      setIsDeleting(name)
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (isMountedRef.current) {
        setIsDeleting(null)
      }
      return true
    }

    if (!isConnected) {
      return false
    }

    setIsDeleting(name)
    setError(null)

    try {
      const response = await fetch(`${LOCAL_AGENT_URL}/local-clusters?tool=${tool}&name=${name}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh clusters list after deletion starts
        setTimeout(() => fetchClusters(), 2000)
        return true
      } else {
        const text = await response.text()
        if (isMountedRef.current) {
          setError(text)
        }
        return false
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete cluster'
      if (isMountedRef.current) {
        setError(message)
      }
      return false
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(null)
      }
    }
  }, [isConnected, inDemoMode, fetchClusters])

  // Refresh all data
  const refresh = useCallback(() => {
    fetchTools()
    fetchClusters()
  }, [fetchTools, fetchClusters])

  // Initial fetch when connected or in demo mode
  useEffect(() => {
    if (isConnected || inDemoMode) {
      fetchTools()
      fetchClusters()
    } else {
      setTools([])
      setClusters([])
    }
  }, [isConnected, inDemoMode, fetchTools, fetchClusters])

  // Get only installed tools
  const installedTools = tools.filter(t => t.installed)

  return {
    tools,
    installedTools,
    clusters,
    isLoading,
    isCreating,
    isDeleting,
    error,
    isConnected,
    createCluster,
    deleteCluster,
    refresh,
  }
}
