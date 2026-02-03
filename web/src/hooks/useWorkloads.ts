import { useCallback } from 'react'
import { useCache } from '../lib/cache'
import { getDemoMode } from './useDemoMode'
import { clusterCacheRef } from './mcp/shared'

// Types
export interface Workload {
  name: string
  namespace: string
  type: 'Deployment' | 'StatefulSet' | 'DaemonSet'
  cluster?: string
  targetClusters?: string[]
  replicas: number
  readyReplicas: number
  status: 'Running' | 'Degraded' | 'Failed' | 'Pending'
  image: string
  labels?: Record<string, string>
  deployments?: Array<{
    cluster: string
    status: string
    replicas: number
    readyReplicas: number
    lastUpdated: string
  }>
  createdAt: string
}

export interface ClusterCapability {
  cluster: string
  nodeCount: number
  cpuCapacity: string
  memCapacity: string
  gpuType?: string
  gpuCount?: number
  available: boolean
}

export interface DeployRequest {
  workloadName: string
  namespace: string
  sourceCluster: string
  targetClusters: string[]
  replicas?: number
}

export interface DeployResult {
  success: boolean
  cluster: string
  message: string
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

const AGENT_URL = 'http://127.0.0.1:8585'

// Demo workloads for demo mode
const DEMO_WORKLOADS: Workload[] = [
  { name: 'nginx-ingress', namespace: 'ingress-system', type: 'Deployment', status: 'Running', replicas: 3, readyReplicas: 3, image: 'nginx/nginx-ingress:3.4.0', cluster: 'eks-prod-us-east-1', targetClusters: ['eks-prod-us-east-1'], createdAt: new Date().toISOString() },
  { name: 'api-gateway', namespace: 'production', type: 'Deployment', status: 'Running', replicas: 2, readyReplicas: 2, image: 'company/api-gateway:v2.5.1', cluster: 'eks-prod-us-east-1', targetClusters: ['eks-prod-us-east-1'], createdAt: new Date().toISOString() },
  { name: 'postgres-primary', namespace: 'databases', type: 'StatefulSet', status: 'Running', replicas: 1, readyReplicas: 1, image: 'postgres:15.4', cluster: 'gke-staging', targetClusters: ['gke-staging'], createdAt: new Date().toISOString() },
  { name: 'ml-worker', namespace: 'ml-workloads', type: 'Deployment', status: 'Degraded', replicas: 4, readyReplicas: 2, image: 'company/ml-worker:latest', cluster: 'vllm-gpu-cluster', targetClusters: ['vllm-gpu-cluster'], createdAt: new Date().toISOString() },
]

/** Fetch workloads from the local agent */
async function fetchWorkloadsViaAgent(opts?: {
  cluster?: string
  namespace?: string
}): Promise<Workload[]> {
  const clusters = clusterCacheRef.clusters
    .filter(c => c.reachable !== false && !c.name.includes('/'))
  if (clusters.length === 0) return []

  const targets = opts?.cluster
    ? clusters.filter(c => c.name === opts.cluster)
    : clusters

  const results = await Promise.allSettled(
    targets.map(async ({ name, context }) => {
      const params = new URLSearchParams()
      params.append('cluster', context || name)
      if (opts?.namespace) params.append('namespace', opts.namespace)

      const ctrl = new AbortController()
      const tid = setTimeout(() => ctrl.abort(), 15000)
      const res = await fetch(`${AGENT_URL}/deployments?${params}`, {
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(tid)

      if (!res.ok) throw new Error(`Agent ${res.status}`)
      const data = await res.json()
      return ((data.deployments || []) as Array<Record<string, unknown>>).map(d => {
        const st = String(d.status || 'running')
        let ws: Workload['status'] = 'Running'
        if (st === 'failed') ws = 'Failed'
        else if (st === 'deploying') ws = 'Pending'
        else if (Number(d.readyReplicas || 0) < Number(d.replicas || 1)) ws = 'Degraded'
        return {
          name: String(d.name || ''),
          namespace: String(d.namespace || 'default'),
          type: 'Deployment' as const,
          cluster: name,
          targetClusters: [name],
          replicas: Number(d.replicas || 1),
          readyReplicas: Number(d.readyReplicas || 0),
          status: ws,
          image: String(d.image || ''),
          createdAt: new Date().toISOString(),
        }
      })
    })
  )

  const items: Workload[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value)
  }
  return items
}

// Fetch all workloads across clusters with caching.
// Pass enabled=false to skip fetching (returns cached/demo data with isLoading=false).
export function useWorkloads(options?: {
  cluster?: string
  namespace?: string
  type?: string
}, enabled = true) {
  const key = `workloads:${options?.cluster || 'all'}:${options?.namespace || 'all'}:${options?.type || 'all'}`

  const result = useCache({
    key,
    category: 'deployments',
    initialData: DEMO_WORKLOADS,
    enabled,
    fetcher: async () => {
      // In demo mode, return demo data
      if (getDemoMode()) {
        return DEMO_WORKLOADS
      }

      // Try agent first (fast, no backend needed)
      if (clusterCacheRef.clusters.length > 0) {
        const agentData = await fetchWorkloadsViaAgent(options)
        if (agentData.length > 0) {
          return agentData
        }
      }

      // Fall back to REST API
      try {
        const params = new URLSearchParams()
        if (options?.cluster) params.set('cluster', options.cluster)
        if (options?.namespace) params.set('namespace', options.namespace)
        if (options?.type) params.set('type', options.type)

        const queryString = params.toString()
        const url = `/api/workloads${queryString ? `?${queryString}` : ''}`

        const res = await fetch(url, { headers: authHeaders() })
        if (!res.ok) {
          throw new Error(`Failed to fetch workloads: ${res.statusText}`)
        }
        const data = await res.json()
        return (data.items || data) as Workload[]
      } catch {
        // If both agent and REST fail, return demo data
        return DEMO_WORKLOADS
      }
    },
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error ? new Error(result.error) : null,
    refetch: result.refetch,
  }
}

// Fetch cluster capabilities
export function useClusterCapabilities() {
  const result = useCache({
    key: 'cluster-capabilities',
    category: 'clusters',
    initialData: [] as ClusterCapability[],
    fetcher: async () => {
      const res = await fetch('/api/workloads/capabilities', { headers: authHeaders() })
      if (!res.ok) {
        throw new Error(`Failed to fetch capabilities: ${res.statusText}`)
      }
      return await res.json() as ClusterCapability[]
    },
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error ? new Error(result.error) : null,
    refetch: result.refetch,
  }
}

// Deploy workload to clusters
export function useDeployWorkload() {
  const mutate = useCallback(async (
    request: DeployRequest,
    options?: {
      onSuccess?: (data: DeployResult[]) => void
      onError?: (error: Error) => void
    }
  ) => {
    try {
      const res = await fetch('/api/workloads/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(request),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to deploy workload')
      }
      const result = await res.json()
      options?.onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      options?.onError?.(error)
      throw error
    }
  }, [])

  return { mutate, isLoading: false, error: null }
}

// Scale workload
export function useScaleWorkload() {
  const mutate = useCallback(async (
    request: {
      workloadName: string
      namespace: string
      targetClusters?: string[]
      replicas: number
    },
    options?: {
      onSuccess?: (data: DeployResult[]) => void
      onError?: (error: Error) => void
    }
  ) => {
    try {
      const res = await fetch('/api/workloads/scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(request),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to scale workload')
      }
      const result = await res.json()
      options?.onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      options?.onError?.(error)
      throw error
    }
  }, [])

  return { mutate, isLoading: false, error: null }
}

// Delete workload
export function useDeleteWorkload() {
  const mutate = useCallback(async (
    params: {
      cluster: string
      namespace: string
      name: string
    },
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => {
    try {
      const res = await fetch(`/api/workloads/${params.cluster}/${params.namespace}/${params.name}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete workload')
      }
      options?.onSuccess?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      options?.onError?.(error)
      throw error
    }
  }, [])

  return { mutate, isLoading: false, error: null }
}
