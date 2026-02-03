/**
 * Unified Data Hooks using the new caching layer
 *
 * These hooks provide a cleaner interface to fetch Kubernetes data with:
 * - Automatic caching with configurable refresh rates
 * - Stale-while-revalidate pattern
 * - Failure tracking
 * - localStorage persistence
 *
 * Migration guide:
 * - Replace `usePods()` with `useCachedPods()`
 * - Replace `useEvents()` with `useCachedEvents()`
 * - etc.
 *
 * The hooks maintain the same return interface for easy migration.
 */

import { useCache, type RefreshCategory } from '../lib/cache'
import { isBackendUnavailable } from '../lib/api'
import { kubectlProxy } from '../lib/kubectlProxy'
import { isDemoModeForced, getDemoMode } from './useDemoMode'
import { clusterCacheRef } from './mcp/shared'
import type {
  PodInfo,
  PodIssue,
  ClusterEvent,
  DeploymentIssue,
  Deployment,
  Service,
  PVC,
  GPUNode,
  Operator,
  OperatorSubscription,
  HelmRelease,
} from './useMCP'
import type { AlertStats } from '../types/alerts'
import { useAlertsContext } from '../contexts/AlertsContext'
import type { ProwJob, ProwStatus } from './useProw'
import type { LLMdServer, LLMdStatus, LLMdModel } from './useLLMd'

// ============================================================================
// API Fetchers
// ============================================================================

const getToken = () => localStorage.getItem('token')

const LOCAL_AGENT_URL = 'http://127.0.0.1:8585'

const isDemoMode = () => {
  // Netlify deployments are always demo mode — no local agent or backend
  if (isDemoModeForced) return true
  // If we have cluster data from the agent, we have a real data source
  if (clusterCacheRef.clusters.length > 0) return false
  const token = getToken()
  if (!token || token === 'demo-token') return true
  return isBackendUnavailable()
}

async function fetchAPI<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const token = getToken()
  if (!token || isDemoMode()) {
    throw new Error('Demo mode or no token')
  }

  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
  }

  const url = `/api/mcp/${endpoint}?${searchParams}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

// Fetch list of available clusters (filtered to short names only)
async function fetchClusters(): Promise<string[]> {
  const data = await fetchAPI<{ clusters: Array<{ name: string; reachable?: boolean }> }>('clusters')
  return (data.clusters || [])
    .filter(c => c.reachable !== false && !c.name.includes('/'))
    .map(c => c.name)
}

// Fetch data from all clusters in parallel and merge results
// Throws if ALL cluster fetches fail (so callers can fall back to agent)
async function fetchFromAllClusters<T>(
  endpoint: string,
  resultKey: string,
  params?: Record<string, string | number | undefined>,
  addClusterField = true
): Promise<T[]> {
  const clusters = await fetchClusters()

  // Fetch from each cluster in parallel
  const results = await Promise.allSettled(
    clusters.map(async (cluster) => {
      const data = await fetchAPI<Record<string, T[]>>(endpoint, { ...params, cluster })
      const items = data[resultKey] || []
      if (addClusterField) {
        return items.map(item => ({ ...item, cluster }))
      }
      return items
    })
  )

  // Merge successful results
  const allItems: T[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value)
    }
  }

  // If every cluster fetch failed, throw so callers can try agent fallback
  if (allItems.length === 0 && results.length > 0 && results.every(r => r.status === 'rejected')) {
    throw new Error('All cluster fetches failed')
  }

  return allItems
}

// ============================================================================
// Agent-based fetchers (used when backend is unavailable but agent is connected)
// ============================================================================

/** Get reachable cluster names from the shared cluster cache (deduplicated) */
function getAgentClusters(): Array<{ name: string; context?: string }> {
  // No local agent in demo mode — return empty to skip all agent requests
  if (isDemoModeForced || getDemoMode()) return []
  // Skip long context-path names (contain '/') — these are duplicates of short-named aliases
  // e.g. "default/api-fmaas-vllm-d-...:6443/..." duplicates "vllm-d"
  return clusterCacheRef.clusters
    .filter(c => c.reachable !== false && !c.name.includes('/'))
    .map(c => ({ name: c.name, context: c.context }))
}

/** Fetch pods from all clusters via agent HTTP endpoint */
async function fetchPodsViaAgent(namespace?: string, limit = 100): Promise<PodInfo[]> {
  const clusters = getAgentClusters()
  if (clusters.length === 0) return []

  const results = await Promise.allSettled(
    clusters.map(async ({ name, context }) => {
      const params = new URLSearchParams()
      params.append('cluster', context || name)
      if (namespace) params.append('namespace', namespace)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(`${LOCAL_AGENT_URL}/pods?${params}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`Agent returned ${response.status}`)
      const data = await response.json()
      // Always use the short name — agent echoes back context path as cluster
      return ((data.pods || []) as PodInfo[]).map(p => ({
        ...p,
        cluster: name,
      }))
    })
  )

  const items: PodInfo[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value)
  }
  return items
    .sort((a, b) => (b.restarts || 0) - (a.restarts || 0))
    .slice(0, limit)
}

/** Fetch pod issues from all clusters via agent kubectl proxy */
async function fetchPodIssuesViaAgent(namespace?: string): Promise<PodIssue[]> {
  const clusters = getAgentClusters()
  if (clusters.length === 0) return []

  const results = await Promise.allSettled(
    clusters.map(async ({ name, context }) => {
      const ctx = context || name
      const issues = await kubectlProxy.getPodIssues(ctx, namespace)
      // Always use the short name — kubectlProxy returns context path as cluster
      return issues.map(i => ({ ...i, cluster: name }))
    })
  )

  const items: PodIssue[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value)
  }
  return items
}

/** Fetch deployments from all clusters via agent HTTP endpoint */
async function fetchDeploymentsViaAgent(namespace?: string): Promise<Deployment[]> {
  const clusters = getAgentClusters()
  if (clusters.length === 0) return []

  const results = await Promise.allSettled(
    clusters.map(async ({ name, context }) => {
      const params = new URLSearchParams()
      params.append('cluster', context || name)
      if (namespace) params.append('namespace', namespace)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(`${LOCAL_AGENT_URL}/deployments?${params}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`Agent returned ${response.status}`)
      const data = await response.json()
      // Always use the short name — agent echoes back context path as cluster
      return ((data.deployments || []) as Deployment[]).map(d => ({
        ...d,
        cluster: name,
      }))
    })
  )

  const items: Deployment[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value)
  }
  return items
}

// ============================================================================
// Demo Data (fallbacks)
// ============================================================================

const getDemoPods = (): PodInfo[] => [
  { name: 'frontend-7d8f9c4b5-x2km4', namespace: 'production', status: 'Running', ready: '1/1', restarts: 0, age: '2d', cpuRequestMillis: 500, memoryRequestBytes: 536870912, cpuUsageMillis: 320, memoryUsageBytes: 412516352, metricsAvailable: true },
  { name: 'backend-api-6c8d7f5e4-j3ln9', namespace: 'production', status: 'Running', ready: '2/2', restarts: 1, age: '5d', cpuRequestMillis: 1000, memoryRequestBytes: 1073741824, cpuUsageMillis: 850, memoryUsageBytes: 892871680, metricsAvailable: true },
  { name: 'ml-worker-8f9a6b7c3-k4lm2', namespace: 'ml-workloads', status: 'Running', ready: '1/1', restarts: 0, age: '1d', cpuRequestMillis: 4000, memoryRequestBytes: 8589934592, gpuRequest: 2, cpuUsageMillis: 3200, memoryUsageBytes: 7516192768, metricsAvailable: true },
  { name: 'inference-server-5d4c3b2a1-n7op9', namespace: 'ml-workloads', status: 'Running', ready: '1/1', restarts: 2, age: '3d', cpuRequestMillis: 2000, memoryRequestBytes: 4294967296, gpuRequest: 1, cpuUsageMillis: 1850, memoryUsageBytes: 3865470566, metricsAvailable: true },
  { name: 'cache-redis-6e5d4c3b2-q8rs1', namespace: 'production', status: 'Running', ready: '1/1', restarts: 0, age: '7d', cpuRequestMillis: 250, memoryRequestBytes: 268435456, cpuUsageMillis: 45, memoryUsageBytes: 134217728, metricsAvailable: true },
]

// Demo events - cluster names must match getDemoClusters() in shared.ts
// Timestamps spread across 24 hours for chart visualization
const getDemoEvents = (): ClusterEvent[] => {
  const now = Date.now()
  const hour = 3600000 // 1 hour in ms
  return [
    // Recent events (last hour)
    { type: 'Warning', reason: 'FailedScheduling', message: 'No nodes available to schedule pod', object: 'pod/api-server-7d8f9c6b5-x2k4m', namespace: 'production', cluster: 'eks-prod-us-east-1', count: 3, firstSeen: new Date(now - 300000).toISOString(), lastSeen: new Date(now - 60000).toISOString() },
    { type: 'Warning', reason: 'BackOff', message: 'Back-off restarting failed container', object: 'pod/worker-5c6d7e8f9-n3p2q', namespace: 'batch', cluster: 'vllm-gpu-cluster', count: 8, firstSeen: new Date(now - 1800000).toISOString(), lastSeen: new Date(now - 120000).toISOString() },
    { type: 'Normal', reason: 'Scheduled', message: 'Successfully assigned pod to node-1', object: 'pod/frontend-8e9f0a1b2-def34', namespace: 'web', cluster: 'aks-dev-westeu', count: 1, firstSeen: new Date(now - 180000).toISOString(), lastSeen: new Date(now - 180000).toISOString() },
    { type: 'Normal', reason: 'Pulled', message: 'Container image pulled successfully', object: 'pod/nginx-ingress-abc123', namespace: 'ingress', cluster: 'eks-prod-us-east-1', count: 1, firstSeen: new Date(now - 240000).toISOString(), lastSeen: new Date(now - 240000).toISOString() },
    { type: 'Warning', reason: 'Unhealthy', message: 'Liveness probe failed: connection refused', object: 'pod/metrics-collector-2b4c6-j8k9l', namespace: 'monitoring', cluster: 'openshift-prod', count: 5, firstSeen: new Date(now - 900000).toISOString(), lastSeen: new Date(now - 30000).toISOString() },
    // Events spread across 24 hours for chart
    { type: 'Normal', reason: 'ScalingReplicaSet', message: 'Scaled up replica set web-frontend to 3', object: 'deployment/web-frontend', namespace: 'production', cluster: 'eks-prod-us-east-1', count: 1, firstSeen: new Date(now - hour).toISOString(), lastSeen: new Date(now - hour).toISOString() },
    { type: 'Warning', reason: 'FailedMount', message: 'Unable to mount volumes for pod', object: 'pod/cache-redis-0', namespace: 'data', cluster: 'gke-staging', count: 2, firstSeen: new Date(now - 2 * hour).toISOString(), lastSeen: new Date(now - 2 * hour).toISOString() },
    { type: 'Normal', reason: 'Started', message: 'Started container web-server', object: 'pod/frontend-8e9f0a1b2-def34', namespace: 'web', cluster: 'openshift-prod', count: 1, firstSeen: new Date(now - 3 * hour).toISOString(), lastSeen: new Date(now - 3 * hour).toISOString() },
    { type: 'Warning', reason: 'FailedCreate', message: 'Error creating: pods exceeded quota', object: 'statefulset/gpu-scheduler', namespace: 'ml-ops', cluster: 'vllm-gpu-cluster', count: 1, firstSeen: new Date(now - 4 * hour).toISOString(), lastSeen: new Date(now - 4 * hour).toISOString() },
    { type: 'Normal', reason: 'SuccessfulCreate', message: 'Created pod: model-server-v2-abc123', object: 'replicaset/model-server-v2', namespace: 'ml-workloads', cluster: 'vllm-gpu-cluster', count: 1, firstSeen: new Date(now - 5 * hour).toISOString(), lastSeen: new Date(now - 5 * hour).toISOString() },
    { type: 'Normal', reason: 'Scheduled', message: 'Pod scheduled successfully', object: 'pod/batch-worker-1', namespace: 'batch', cluster: 'eks-prod-us-east-1', count: 1, firstSeen: new Date(now - 6 * hour).toISOString(), lastSeen: new Date(now - 6 * hour).toISOString() },
    { type: 'Warning', reason: 'NodeNotReady', message: 'Node condition Ready is Unknown', object: 'node/worker-3', namespace: '', cluster: 'alibaba-ack-shanghai', count: 3, firstSeen: new Date(now - 8 * hour).toISOString(), lastSeen: new Date(now - 7 * hour).toISOString() },
    { type: 'Normal', reason: 'Pulled', message: 'Image pulled: nginx:1.21', object: 'pod/web-nginx-5d4c3', namespace: 'web', cluster: 'gke-staging', count: 2, firstSeen: new Date(now - 10 * hour).toISOString(), lastSeen: new Date(now - 9 * hour).toISOString() },
    { type: 'Warning', reason: 'BackOff', message: 'Back-off pulling image', object: 'pod/broken-app-xyz', namespace: 'staging', cluster: 'aks-dev-westeu', count: 5, firstSeen: new Date(now - 12 * hour).toISOString(), lastSeen: new Date(now - 11 * hour).toISOString() },
    { type: 'Normal', reason: 'Created', message: 'Created container api', object: 'pod/api-service-7f8d', namespace: 'production', cluster: 'openshift-prod', count: 1, firstSeen: new Date(now - 14 * hour).toISOString(), lastSeen: new Date(now - 14 * hour).toISOString() },
    { type: 'Normal', reason: 'Started', message: 'Started container api', object: 'pod/api-service-7f8d', namespace: 'production', cluster: 'openshift-prod', count: 1, firstSeen: new Date(now - 14 * hour + 1000).toISOString(), lastSeen: new Date(now - 14 * hour + 1000).toISOString() },
    { type: 'Warning', reason: 'FailedScheduling', message: 'Insufficient cpu', object: 'pod/heavy-compute-abc', namespace: 'compute', cluster: 'vllm-gpu-cluster', count: 2, firstSeen: new Date(now - 16 * hour).toISOString(), lastSeen: new Date(now - 15 * hour).toISOString() },
    { type: 'Normal', reason: 'ScalingReplicaSet', message: 'Scaled down replica set', object: 'deployment/batch-processor', namespace: 'batch', cluster: 'eks-prod-us-east-1', count: 1, firstSeen: new Date(now - 18 * hour).toISOString(), lastSeen: new Date(now - 18 * hour).toISOString() },
    { type: 'Normal', reason: 'Scheduled', message: 'Successfully assigned pod', object: 'pod/cron-job-xyz', namespace: 'jobs', cluster: 'gke-staging', count: 1, firstSeen: new Date(now - 20 * hour).toISOString(), lastSeen: new Date(now - 20 * hour).toISOString() },
    { type: 'Warning', reason: 'Unhealthy', message: 'Readiness probe failed', object: 'pod/db-replica-2', namespace: 'data', cluster: 'openshift-prod', count: 4, firstSeen: new Date(now - 22 * hour).toISOString(), lastSeen: new Date(now - 21 * hour).toISOString() },
  ]
}

// Demo pod issues - cluster names must match getDemoClusters() in shared.ts
const getDemoPodIssues = (): PodIssue[] => [
  { name: 'api-server-7d8f9c6b5-x2k4m', namespace: 'production', cluster: 'eks-prod-us-east-1', status: 'CrashLoopBackOff', issues: ['Container restarting', 'OOMKilled'], restarts: 15 },
  { name: 'worker-5c6d7e8f9-n3p2q', namespace: 'batch', cluster: 'vllm-gpu-cluster', status: 'ImagePullBackOff', issues: ['Failed to pull image'], restarts: 0 },
  { name: 'cache-redis-0', namespace: 'data', cluster: 'gke-staging', status: 'Pending', issues: ['Insufficient memory'], restarts: 0 },
  { name: 'metrics-collector-2b4c6-j8k9l', namespace: 'monitoring', cluster: 'openshift-prod', status: 'CrashLoopBackOff', issues: ['Exit code 137'], restarts: 8 },
  { name: 'gpu-scheduler-0', namespace: 'ml-ops', cluster: 'vllm-gpu-cluster', status: 'Pending', issues: ['Insufficient nvidia.com/gpu'], restarts: 0 },
]

const getDemoDeploymentIssues = (): DeploymentIssue[] => [
  { name: 'web-frontend', namespace: 'production', replicas: 3, readyReplicas: 2, reason: 'ReplicaFailure' },
]

// Demo deployments - cluster names must match getDemoClusters() in shared.ts
const getDemoDeployments = (): Deployment[] => [
  { name: 'web-frontend', namespace: 'production', cluster: 'eks-prod-us-east-1', status: 'running', replicas: 3, readyReplicas: 3, updatedReplicas: 3, availableReplicas: 3, progress: 100 },
  { name: 'api-gateway', namespace: 'production', cluster: 'eks-prod-us-east-1', status: 'running', replicas: 2, readyReplicas: 2, updatedReplicas: 2, availableReplicas: 2, progress: 100 },
  { name: 'auth-service', namespace: 'production', cluster: 'eks-prod-us-east-1', status: 'running', replicas: 2, readyReplicas: 2, updatedReplicas: 2, availableReplicas: 2, progress: 100 },
  { name: 'payment-processor', namespace: 'production', cluster: 'openshift-prod', status: 'running', replicas: 3, readyReplicas: 3, updatedReplicas: 3, availableReplicas: 3, progress: 100 },
  { name: 'notification-service', namespace: 'production', cluster: 'openshift-prod', status: 'running', replicas: 2, readyReplicas: 2, updatedReplicas: 2, availableReplicas: 2, progress: 100 },
  { name: 'search-engine', namespace: 'data', cluster: 'eks-prod-us-east-1', status: 'running', replicas: 4, readyReplicas: 4, updatedReplicas: 4, availableReplicas: 4, progress: 100 },
  { name: 'cache-layer', namespace: 'data', cluster: 'eks-prod-us-east-1', status: 'running', replicas: 3, readyReplicas: 3, updatedReplicas: 3, availableReplicas: 3, progress: 100 },
  { name: 'ml-inference', namespace: 'ml-workloads', cluster: 'vllm-gpu-cluster', status: 'running', replicas: 2, readyReplicas: 2, updatedReplicas: 2, availableReplicas: 2, progress: 100 },
  { name: 'model-server', namespace: 'ml-workloads', cluster: 'vllm-gpu-cluster', status: 'deploying', replicas: 3, readyReplicas: 1, updatedReplicas: 3, availableReplicas: 1, progress: 33 },
  { name: 'staging-api', namespace: 'staging', cluster: 'gke-staging', status: 'running', replicas: 1, readyReplicas: 1, updatedReplicas: 1, availableReplicas: 1, progress: 100 },
  { name: 'staging-worker', namespace: 'staging', cluster: 'gke-staging', status: 'failed', replicas: 2, readyReplicas: 0, updatedReplicas: 2, availableReplicas: 0, progress: 0 },
  { name: 'metrics-collector', namespace: 'monitoring', cluster: 'eks-prod-us-east-1', status: 'running', replicas: 1, readyReplicas: 1, updatedReplicas: 1, availableReplicas: 1, progress: 100 },
]

const getDemoServices = (): Service[] => [
  { name: 'web-service', namespace: 'production', type: 'LoadBalancer', clusterIP: '10.0.0.1', ports: ['80/TCP'] },
]

const getDemoProwJobs = (): ProwJob[] => [
  { id: '1', name: 'pull-kubernetes-e2e', type: 'presubmit', state: 'success', cluster: 'prow', startTime: new Date(Date.now() - 10 * 60000).toISOString(), duration: '45m', pr: 12345 },
  { id: '2', name: 'pull-kubernetes-unit', type: 'presubmit', state: 'success', cluster: 'prow', startTime: new Date(Date.now() - 15 * 60000).toISOString(), duration: '12m', pr: 12346 },
  { id: '3', name: 'ci-kubernetes-e2e-gce', type: 'periodic', state: 'failure', cluster: 'prow', startTime: new Date(Date.now() - 30 * 60000).toISOString(), duration: '1h 23m' },
]

// Demo LLM-d servers - cluster names must match getDemoClusters() in shared.ts
const getDemoLLMdServers = (): LLMdServer[] => [
  { id: '1', name: 'vllm-llama-3', namespace: 'llm-d', cluster: 'vllm-gpu-cluster', model: 'llama-3-70b', type: 'vllm', componentType: 'model', status: 'running', replicas: 2, readyReplicas: 2, gpu: 'NVIDIA', gpuCount: 4 },
  { id: '2', name: 'tgi-granite', namespace: 'llm-d', cluster: 'vllm-gpu-cluster', model: 'granite-13b', type: 'tgi', componentType: 'model', status: 'running', replicas: 1, readyReplicas: 1, gpu: 'NVIDIA', gpuCount: 2 },
]

// Demo LLM-d models - cluster names must match getDemoClusters() in shared.ts
const getDemoLLMdModels = (): LLMdModel[] => [
  { id: '1', name: 'llama-3-70b', namespace: 'llm-d', cluster: 'vllm-gpu-cluster', instances: 2, status: 'loaded' },
  { id: '2', name: 'granite-13b', namespace: 'llm-d', cluster: 'vllm-gpu-cluster', instances: 1, status: 'loaded' },
]

// ============================================================================
// Cached Data Hooks
// ============================================================================

interface CachedHookResult<T> {
  data: T
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  isFailed: boolean
  consecutiveFailures: number
  lastRefresh: number | null
  refetch: () => Promise<void>
}

/**
 * Hook for fetching pods with caching
 * When no cluster is specified, fetches from all available clusters
 */
export function useCachedPods(
  cluster?: string,
  namespace?: string,
  options?: { limit?: number; category?: RefreshCategory }
): CachedHookResult<PodInfo[]> & { pods: PodInfo[] } {
  const { limit = 100, category = 'pods' } = options || {}
  const key = `pods:${cluster || 'all'}:${namespace || 'all'}:${limit}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    // Only provide demo data as initialData in demo mode - otherwise skeleton shows
    initialData: isDemo ? getDemoPods() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (getDemoMode()) {
        return getDemoPods()
      }

      // Try agent first (fast, no backend needed)
      if (clusterCacheRef.clusters.length > 0) {
        if (cluster) {
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          const params = new URLSearchParams()
          params.append('cluster', clusterInfo?.context || cluster)
          if (namespace) params.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/pods?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            const pods = ((data.pods || []) as PodInfo[]).map(p => ({
              ...p,
              cluster: cluster,
            }))
            return pods
              .sort((a, b) => (b.restarts || 0) - (a.restarts || 0))
              .slice(0, limit)
          }
        }
        return fetchPodsViaAgent(namespace, limit)
      }

      // Fall back to REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        let pods: PodInfo[]
        if (cluster) {
          const data = await fetchAPI<{ pods: PodInfo[] }>('pods', { cluster, namespace })
          pods = (data.pods || []).map(p => ({ ...p, cluster }))
        } else {
          pods = await fetchFromAllClusters<PodInfo>('pods', 'pods', { namespace })
        }
        return pods
          .sort((a, b) => (b.restarts || 0) - (a.restarts || 0))
          .slice(0, limit)
      }

      return getDemoPods()
    },
  })

  return {
    pods: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

/**
 * Hook for fetching events with caching
 */
export function useCachedEvents(
  cluster?: string,
  namespace?: string,
  options?: { limit?: number; category?: RefreshCategory }
): CachedHookResult<ClusterEvent[]> & { events: ClusterEvent[] } {
  const { limit = 20, category = 'realtime' } = options || {}
  const key = `events:${cluster || 'all'}:${namespace || 'all'}:${limit}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoEvents() : [],
    enabled: true,
    persist: !isDemo, // Don't persist demo data
    fetcher: async () => {
      // In demo mode, return fresh demo data with current timestamps
      if (getDemoMode()) {
        return getDemoEvents()
      }
      const data = await fetchAPI<{ events: ClusterEvent[] }>('events', { cluster, namespace, limit })
      return data.events || []
    },
  })

  return {
    events: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

/**
 * Hook for fetching pod issues with caching
 * When no cluster is specified, fetches from all available clusters
 */
export function useCachedPodIssues(
  cluster?: string,
  namespace?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<PodIssue[]> & { issues: PodIssue[] } {
  const { category = 'pods' } = options || {}
  const key = `podIssues:${cluster || 'all'}:${namespace || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoPodIssues() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        return getDemoPodIssues()
      }

      let issues: PodIssue[]

      // Try agent first (fast, no backend needed)
      if (clusterCacheRef.clusters.length > 0) {
        if (cluster) {
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          const ctx = clusterInfo?.context || cluster
          issues = await kubectlProxy.getPodIssues(ctx, namespace)
          // Always use the short name passed in, not the context path from kubectlProxy
          issues = issues.map(i => ({ ...i, cluster: cluster }))
        } else {
          issues = await fetchPodIssuesViaAgent(namespace)
        }
        return issues.sort((a, b) => (b.restarts || 0) - (a.restarts || 0))
      }

      // Fall back to REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        if (cluster) {
          const data = await fetchAPI<{ issues: PodIssue[] }>('pod-issues', { cluster, namespace })
          issues = (data.issues || []).map(i => ({ ...i, cluster }))
        } else {
          issues = await fetchFromAllClusters<PodIssue>('pod-issues', 'issues', { namespace })
        }
        return issues.sort((a, b) => (b.restarts || 0) - (a.restarts || 0))
      }

      return getDemoPodIssues()
    },
  })

  return {
    issues: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

/**
 * Hook for fetching deployment issues with caching
 */
export function useCachedDeploymentIssues(
  cluster?: string,
  namespace?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<DeploymentIssue[]> & { issues: DeploymentIssue[] } {
  const { category = 'deployments' } = options || {}
  const key = `deploymentIssues:${cluster || 'all'}:${namespace || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoDeploymentIssues() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        return getDemoDeploymentIssues()
      }

      // Try agent first — derive deployment issues from deployment data
      if (clusterCacheRef.clusters.length > 0) {
        const deployments = cluster
          ? await (async () => {
              const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
              const params = new URLSearchParams()
              params.append('cluster', clusterInfo?.context || cluster)
              if (namespace) params.append('namespace', namespace)
              const ctrl = new AbortController()
              const tid = setTimeout(() => ctrl.abort(), 15000)
              const res = await fetch(`${LOCAL_AGENT_URL}/deployments?${params}`, {
                signal: ctrl.signal, headers: { Accept: 'application/json' },
              })
              clearTimeout(tid)
              if (!res.ok) return []
              const data = await res.json()
              return ((data.deployments || []) as Deployment[]).map(d => ({ ...d, cluster: cluster }))
            })()
          : await fetchDeploymentsViaAgent(namespace)

        // Derive issues: deployments where readyReplicas < replicas
        return deployments
          .filter(d => (d.readyReplicas ?? 0) < (d.replicas ?? 1))
          .map(d => ({
            name: d.name,
            namespace: d.namespace || 'default',
            cluster: d.cluster,
            replicas: d.replicas ?? 1,
            readyReplicas: d.readyReplicas ?? 0,
            reason: d.status === 'failed' ? 'DeploymentFailed' : 'ReplicaFailure',
          }))
      }

      // Fall back to REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        const data = await fetchAPI<{ issues: DeploymentIssue[] }>('deployment-issues', { cluster, namespace })
        return data.issues || []
      }

      return getDemoDeploymentIssues()
    },
  })

  return {
    issues: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

/**
 * Hook for fetching deployments with caching
 */
export function useCachedDeployments(
  cluster?: string,
  namespace?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<Deployment[]> & { deployments: Deployment[] } {
  const { category = 'deployments' } = options || {}
  const key = `deployments:${cluster || 'all'}:${namespace || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoDeployments() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        return getDemoDeployments()
      }

      // Try agent first (fast, no backend needed)
      if (clusterCacheRef.clusters.length > 0) {
        if (cluster) {
          const params = new URLSearchParams()
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          params.append('cluster', clusterInfo?.context || cluster)
          if (namespace) params.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/deployments?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return ((data.deployments || []) as Deployment[]).map(d => ({
              ...d,
              cluster: cluster,
            }))
          }
        }
        return fetchDeploymentsViaAgent(namespace)
      }

      // Fall back to REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        if (cluster) {
          const data = await fetchAPI<{ deployments: Deployment[] }>('deployments', { cluster, namespace })
          const deployments = data.deployments || []
          return deployments.map(d => ({ ...d, cluster: d.cluster || cluster }))
        }
        return await fetchFromAllClusters<Deployment>('deployments', 'deployments', { namespace })
      }

      return getDemoDeployments()
    },
  })

  return {
    deployments: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

/** Fetch services from all clusters via agent HTTP endpoint */
async function fetchServicesViaAgent(namespace?: string): Promise<Service[]> {
  const clusters = getAgentClusters()
  if (clusters.length === 0) return []

  const results = await Promise.allSettled(
    clusters.map(async ({ name, context }) => {
      const params = new URLSearchParams()
      params.append('cluster', context || name)
      if (namespace) params.append('namespace', namespace)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(`${LOCAL_AGENT_URL}/services?${params}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`Agent returned ${response.status}`)
      const data = await response.json()
      return ((data.services || []) as Service[]).map(s => ({
        ...s,
        cluster: name,
      }))
    })
  )

  const items: Service[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value)
  }
  return items
}

/**
 * Hook for fetching services with caching
 */
export function useCachedServices(
  cluster?: string,
  namespace?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<Service[]> & { services: Service[] } {
  const { category = 'services' } = options || {}
  const key = `services:${cluster || 'all'}:${namespace || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoServices() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        return getDemoServices()
      }

      // Try agent first (fast, no backend needed)
      if (clusterCacheRef.clusters.length > 0) {
        if (cluster) {
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          const params = new URLSearchParams()
          params.append('cluster', clusterInfo?.context || cluster)
          if (namespace) params.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/services?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return ((data.services || []) as Service[]).map(s => ({
              ...s,
              cluster: cluster,
            }))
          }
        }
        return fetchServicesViaAgent(namespace)
      }

      // Fall back to REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        const data = await fetchAPI<{ services: Service[] }>('services', { cluster, namespace })
        return data.services || []
      }

      return getDemoServices()
    },
  })

  return {
    services: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

// ============================================================================
// Prow Cached Hooks (uses kubectlProxy)
// ============================================================================

interface ProwJobResource {
  metadata: {
    name: string
    creationTimestamp: string
    labels?: {
      'prow.k8s.io/job'?: string
      'prow.k8s.io/type'?: string
      'prow.k8s.io/build-id'?: string
    }
  }
  spec: {
    job?: string
    type?: string
    cluster?: string
    refs?: {
      pulls?: Array<{ number: number }>
    }
  }
  status: {
    state?: string
    startTime?: string
    completionTime?: string
    pendingTime?: string
    url?: string
    build_id?: string
  }
}

function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const diffMs = end.getTime() - start.getTime()

  if (diffMs < 0) return '-'

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

async function fetchProwJobs(prowCluster: string, namespace: string): Promise<ProwJob[]> {
  const response = await kubectlProxy.exec(
    ['get', 'prowjobs', '-n', namespace, '-o', 'json', '--sort-by=.metadata.creationTimestamp'],
    { context: prowCluster, timeout: 30000 }
  )

  if (response.exitCode !== 0) {
    throw new Error(response.error || 'Failed to get ProwJobs')
  }

  const data = JSON.parse(response.output)
  return (data.items || [])
    .reverse()
    .slice(0, 100)
    .map((pj: ProwJobResource) => {
      const jobName = pj.metadata.labels?.['prow.k8s.io/job'] || pj.spec.job || pj.metadata.name
      const jobType = (pj.metadata.labels?.['prow.k8s.io/type'] || pj.spec.type || 'unknown') as ProwJob['type']
      const state = (pj.status.state || 'unknown') as ProwJob['state']
      const startTime = pj.status.startTime || pj.status.pendingTime || pj.metadata.creationTimestamp
      const completionTime = pj.status.completionTime

      return {
        id: pj.metadata.name,
        name: jobName,
        type: jobType,
        state,
        cluster: prowCluster,
        startTime,
        completionTime,
        duration: state === 'pending' || state === 'triggered' ? '-' : formatDuration(startTime, completionTime),
        pr: pj.spec.refs?.pulls?.[0]?.number,
        url: pj.status.url,
        buildId: pj.status.build_id || pj.metadata.labels?.['prow.k8s.io/build-id'],
      }
    })
}

function computeProwStatus(jobs: ProwJob[], consecutiveFailures: number): ProwStatus {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentJobs = jobs.filter(j => new Date(j.startTime) > oneHourAgo)

  const pendingJobs = jobs.filter(j => j.state === 'pending' || j.state === 'triggered').length
  const runningJobs = jobs.filter(j => j.state === 'running').length
  const successJobs = recentJobs.filter(j => j.state === 'success').length
  const failedJobs = recentJobs.filter(j => j.state === 'failure' || j.state === 'error').length
  const completedJobs = successJobs + failedJobs
  const successRate = completedJobs > 0 ? (successJobs / completedJobs) * 100 : 100

  return {
    healthy: consecutiveFailures < 3,
    pendingJobs,
    runningJobs,
    successJobs,
    failedJobs,
    prowJobsLastHour: recentJobs.length,
    successRate: Math.round(successRate * 10) / 10,
  }
}

/**
 * Hook for fetching ProwJobs with caching
 */
export function useCachedProwJobs(
  prowCluster = 'prow',
  namespace = 'prow'
): CachedHookResult<ProwJob[]> & { jobs: ProwJob[]; status: ProwStatus; formatTimeAgo: typeof formatTimeAgo } {
  const key = `prowjobs:${prowCluster}:${namespace}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category: 'gitops',
    initialData: isDemo ? getDemoProwJobs() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        return getDemoProwJobs()
      }
      return fetchProwJobs(prowCluster, namespace)
    },
  })

  const status = computeProwStatus(result.data, result.consecutiveFailures)

  return {
    jobs: result.data,
    data: result.data,
    status,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
    formatTimeAgo,
  }
}

// ============================================================================
// LLM-d Cached Hooks (uses kubectlProxy)
// ============================================================================

interface DeploymentResource {
  metadata: {
    name: string
    namespace: string
    labels?: Record<string, string>
  }
  spec: {
    replicas?: number
    template?: {
      metadata?: {
        labels?: Record<string, string>
      }
      spec?: {
        containers?: Array<{
          resources?: {
            limits?: Record<string, string>
          }
        }>
      }
    }
  }
  status: {
    replicas?: number
    readyReplicas?: number
  }
}

interface HPAResource {
  metadata: { name: string; namespace: string }
  spec: { scaleTargetRef: { kind: string; name: string } }
}

interface VariantAutoscalingResource {
  metadata: { name: string; namespace: string }
  spec: { targetRef?: { kind?: string; name?: string } }
}

interface InferencePoolResource {
  metadata: { name: string; namespace: string }
  spec: { selector?: { matchLabels?: Record<string, string> } }
  status?: { parents?: Array<{ conditions?: Array<{ type: string; status: string }> }> }
}

function detectServerType(name: string, labels?: Record<string, string>): LLMdServer['type'] {
  const nameLower = name.toLowerCase()
  if (labels?.['app.kubernetes.io/name'] === 'tgi' || nameLower.includes('tgi')) return 'tgi'
  if (labels?.['app.kubernetes.io/name'] === 'triton' || nameLower.includes('triton')) return 'triton'
  if (labels?.['llmd.org/inferenceServing'] === 'true' || nameLower.includes('llm-d')) return 'llm-d'
  if (nameLower.includes('vllm')) return 'vllm'
  return 'unknown'
}

function detectComponentType(name: string, labels?: Record<string, string>): LLMdServer['componentType'] {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('-epp') || nameLower.endsWith('epp')) return 'epp'
  if (nameLower.includes('gateway') || nameLower.includes('ingress')) return 'gateway'
  if (nameLower === 'prometheus' || nameLower.includes('prometheus-')) return 'prometheus'
  if (labels?.['llmd.org/inferenceServing'] === 'true' ||
      labels?.['llmd.org/model'] ||
      nameLower.includes('vllm') || nameLower.includes('tgi') || nameLower.includes('triton') ||
      nameLower.includes('llama') || nameLower.includes('granite') || nameLower.includes('qwen') ||
      nameLower.includes('mistral') || nameLower.includes('mixtral')) {
    return 'model'
  }
  return 'other'
}

function detectGatewayType(name: string): LLMdServer['gatewayType'] {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('istio')) return 'istio'
  if (nameLower.includes('kgateway') || nameLower.includes('envoy')) return 'kgateway'
  return 'envoy'
}

function getLLMdServerStatus(replicas: number, readyReplicas: number): LLMdServer['status'] {
  if (replicas === 0) return 'stopped'
  if (readyReplicas === replicas) return 'running'
  if (readyReplicas > 0) return 'scaling'
  return 'error'
}

function extractGPUInfo(deployment: DeploymentResource): { gpu?: string; gpuCount?: number } {
  const limits = deployment.spec.template?.spec?.containers?.[0]?.resources?.limits || {}
  const gpuKeys = Object.keys(limits).filter(k => k.includes('nvidia.com/gpu') || k.includes('amd.com/gpu') || k.includes('gpu'))
  if (gpuKeys.length > 0) {
    const gpuKey = gpuKeys[0]
    const gpuCount = parseInt(limits[gpuKey] || '0', 10)
    const gpuType = gpuKey.includes('nvidia') ? 'NVIDIA' : gpuKey.includes('amd') ? 'AMD' : 'GPU'
    return { gpu: gpuType, gpuCount }
  }
  return {}
}

async function fetchLLMdServers(clusters: string[]): Promise<LLMdServer[]> {
  const allServers: LLMdServer[] = []
  const keyNamespaces = ['b2', 'e2e-helm', 'e2e-solution', 'e2e-pd', 'effi', 'effi2', 'guygir',
    'llm-d', 'aibrix-system', 'hc4ai-operator', 'hc4ai-operator-dev', 'e2e-solution-platform-eval', 'inference-router-test']

  for (const cluster of clusters) {
    try {
      const allDeployments: DeploymentResource[] = []
      for (const ns of keyNamespaces) {
        try {
          const resp = await kubectlProxy.exec(['get', 'deployments', '-n', ns, '-o', 'json'], { context: cluster, timeout: 10000 })
          if (resp.exitCode === 0 && resp.output) {
            allDeployments.push(...(JSON.parse(resp.output).items || []))
          }
        } catch { /* namespace not found */ }
      }
      if (allDeployments.length === 0) continue

      const autoscalerMap = new Map<string, 'hpa' | 'va' | 'both'>()
      try {
        const hpaResp = await kubectlProxy.exec(['get', 'hpa', '-A', '-o', 'json'], { context: cluster, timeout: 10000 })
        if (hpaResp.exitCode === 0) {
          for (const hpa of (JSON.parse(hpaResp.output).items || []) as HPAResource[]) {
            if (hpa.spec.scaleTargetRef.kind === 'Deployment') {
              autoscalerMap.set(`${hpa.metadata.namespace}/${hpa.spec.scaleTargetRef.name}`, 'hpa')
            }
          }
        }
      } catch { /* ignore */ }

      try {
        const vaResp = await kubectlProxy.exec(['get', 'variantautoscalings', '-A', '-o', 'json'], { context: cluster, timeout: 10000 })
        if (vaResp.exitCode === 0) {
          for (const va of (JSON.parse(vaResp.output).items || []) as VariantAutoscalingResource[]) {
            if (va.spec.targetRef?.name) {
              const key = `${va.metadata.namespace}/${va.spec.targetRef.name}`
              autoscalerMap.set(key, autoscalerMap.has(key) ? 'both' : 'va')
            }
          }
        }
      } catch { /* ignore */ }

      const llmdDeployments = allDeployments.filter(d => {
        const name = d.metadata.name.toLowerCase()
        const labels = d.spec.template?.metadata?.labels || {}
        const ns = d.metadata.namespace.toLowerCase()
        const isLlmdNs = ns.includes('llm-d') || ns.includes('e2e') || ns.includes('vllm') || ns === 'b2'
        return name.includes('vllm') || name.includes('llm-d') || name.includes('tgi') || name.includes('triton') ||
          name.includes('llama') || name.includes('granite') || name.includes('qwen') || name.includes('mistral') || name.includes('mixtral') ||
          labels['llmd.org/inferenceServing'] === 'true' || labels['llmd.org/model'] ||
          labels['app.kubernetes.io/name'] === 'vllm' || labels['app.kubernetes.io/name'] === 'tgi' ||
          name.includes('-epp') || name.endsWith('epp') ||
          (isLlmdNs && (name.includes('gateway') || name.includes('ingress') || name === 'prometheus'))
      })

      const nsGateway = new Map<string, { status: 'running' | 'stopped'; type: LLMdServer['gatewayType'] }>()
      const nsPrometheus = new Map<string, 'running' | 'stopped'>()

      for (const dep of llmdDeployments) {
        const name = dep.metadata.name.toLowerCase()
        const status = getLLMdServerStatus(dep.spec.replicas || 0, dep.status.readyReplicas || 0)
        if (name.includes('gateway') || name.includes('ingress')) {
          nsGateway.set(dep.metadata.namespace, { status: status === 'running' ? 'running' : 'stopped', type: detectGatewayType(dep.metadata.name) })
        }
        if (name === 'prometheus') {
          nsPrometheus.set(dep.metadata.namespace, status === 'running' ? 'running' : 'stopped')
        }
      }

      for (const dep of llmdDeployments) {
        const labels = dep.spec.template?.metadata?.labels || {}
        const model = labels['llmd.org/model'] || labels['app.kubernetes.io/model'] || dep.metadata.name
        const gpuInfo = extractGPUInfo(dep)
        const autoscalerType = autoscalerMap.get(`${dep.metadata.namespace}/${dep.metadata.name}`)
        const gw = nsGateway.get(dep.metadata.namespace)
        const prom = nsPrometheus.get(dep.metadata.namespace)

        allServers.push({
          id: `${cluster}-${dep.metadata.namespace}-${dep.metadata.name}`,
          name: dep.metadata.name,
          namespace: dep.metadata.namespace,
          cluster,
          model,
          type: detectServerType(dep.metadata.name, labels),
          componentType: detectComponentType(dep.metadata.name, labels),
          status: getLLMdServerStatus(dep.spec.replicas || 0, dep.status.readyReplicas || 0),
          replicas: dep.spec.replicas || 0,
          readyReplicas: dep.status.readyReplicas || 0,
          hasAutoscaler: !!autoscalerType,
          autoscalerType,
          gatewayStatus: gw?.status,
          gatewayType: gw?.type,
          prometheusStatus: prom,
          ...gpuInfo,
        })
      }
    } catch (err) {
      console.error(`Error fetching from cluster ${cluster}:`, err)
    }
  }
  return allServers
}

function computeLLMdStatus(servers: LLMdServer[], consecutiveFailures: number): LLMdStatus {
  return {
    healthy: consecutiveFailures < 3,
    totalServers: servers.length,
    runningServers: servers.filter(s => s.status === 'running').length,
    stoppedServers: servers.filter(s => s.status === 'stopped').length,
    totalModels: new Set(servers.map(s => s.model)).size,
    loadedModels: new Set(servers.filter(s => s.status === 'running').map(s => s.model)).size,
  }
}

/**
 * Hook for fetching LLM-d servers with caching
 */
export function useCachedLLMdServers(
  clusters: string[] = ['vllm-d', 'platform-eval']
): CachedHookResult<LLMdServer[]> & { servers: LLMdServer[]; status: LLMdStatus } {
  const key = `llmd-servers:${clusters.join(',')}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category: 'gitops',
    initialData: isDemo ? getDemoLLMdServers() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        return getDemoLLMdServers()
      }
      return fetchLLMdServers(clusters)
    },
  })

  const status = computeLLMdStatus(result.data, result.consecutiveFailures)

  return {
    servers: result.data,
    data: result.data,
    status,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

async function fetchLLMdModels(clusters: string[]): Promise<LLMdModel[]> {
  const allModels: LLMdModel[] = []
  for (const cluster of clusters) {
    try {
      const response = await kubectlProxy.exec(['get', 'inferencepools', '-A', '-o', 'json'], { context: cluster, timeout: 30000 })
      if (response.exitCode !== 0) continue
      for (const pool of (JSON.parse(response.output).items || []) as InferencePoolResource[]) {
        const modelName = pool.spec.selector?.matchLabels?.['llmd.org/model'] || pool.metadata.name
        const hasAccepted = pool.status?.parents?.some(p => p.conditions?.some(c => c.type === 'Accepted' && c.status === 'True'))
        allModels.push({
          id: `${cluster}-${pool.metadata.namespace}-${pool.metadata.name}`,
          name: modelName,
          namespace: pool.metadata.namespace,
          cluster,
          instances: 1,
          status: hasAccepted ? 'loaded' : 'stopped',
        })
      }
    } catch (err) {
      console.error(`Error fetching InferencePools from cluster ${cluster}:`, err)
    }
  }
  return allModels
}

/**
 * Hook for fetching LLM-d models with caching
 */
export function useCachedLLMdModels(
  clusters: string[] = ['vllm-d', 'platform-eval']
): CachedHookResult<LLMdModel[]> & { models: LLMdModel[] } {
  const key = `llmd-models:${clusters.join(',')}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category: 'gitops',
    initialData: isDemo ? getDemoLLMdModels() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        return getDemoLLMdModels()
      }
      return fetchLLMdModels(clusters)
    },
  })

  return {
    models: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

// ============================================================================
// PVC Cached Hook
// ============================================================================

// Demo PVCs - cluster names must match getDemoClusters() in shared.ts
const getDemoPVCs = (): PVC[] => [
  { name: 'postgres-data', namespace: 'data', cluster: 'eks-prod-us-east-1', status: 'Bound', storageClass: 'gp3', capacity: '100Gi', accessModes: ['ReadWriteOnce'], volumeName: 'pvc-abc123', age: '40d' },
  { name: 'redis-data', namespace: 'data', cluster: 'eks-prod-us-east-1', status: 'Bound', storageClass: 'gp3', capacity: '20Gi', accessModes: ['ReadWriteOnce'], volumeName: 'pvc-def456', age: '40d' },
  { name: 'prometheus-data', namespace: 'monitoring', cluster: 'gke-staging', status: 'Bound', storageClass: 'standard', capacity: '50Gi', accessModes: ['ReadWriteOnce'], volumeName: 'pvc-ghi789', age: '20d' },
  { name: 'grafana-data', namespace: 'monitoring', cluster: 'gke-staging', status: 'Bound', storageClass: 'standard', capacity: '10Gi', accessModes: ['ReadWriteOnce'], volumeName: 'pvc-jkl012', age: '20d' },
  { name: 'model-cache', namespace: 'ml', cluster: 'vllm-gpu-cluster', status: 'Bound', storageClass: 'fast-ssd', capacity: '500Gi', accessModes: ['ReadWriteMany'], volumeName: 'pvc-mno345', age: '15d' },
  { name: 'training-data', namespace: 'ml', cluster: 'vllm-gpu-cluster', status: 'Pending', storageClass: 'fast-ssd', capacity: '1Ti', accessModes: ['ReadWriteMany'], age: '1d' },
  { name: 'logs-archive', namespace: 'logging', cluster: 'eks-prod-us-east-1', status: 'Bound', storageClass: 'cold-storage', capacity: '200Gi', accessModes: ['ReadWriteOnce'], volumeName: 'pvc-pqr678', age: '60d' },
]

/**
 * Hook for fetching PVCs with caching
 */
export function useCachedPVCs(
  cluster?: string,
  namespace?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<PVC[]> & { pvcs: PVC[] } {
  const { category = 'services' } = options || {}
  const key = `pvcs:${cluster || 'all'}:${namespace || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoPVCs() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        return getDemoPVCs().filter(p =>
          (!cluster || p.cluster === cluster) && (!namespace || p.namespace === namespace)
        )
      }

      // Try agent first (fast, no backend needed)
      if (clusterCacheRef.clusters.length > 0 && cluster) {
        try {
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          const params = new URLSearchParams()
          params.append('cluster', clusterInfo?.context || cluster)
          if (namespace) params.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/pvcs?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return ((data.pvcs || []) as PVC[]).map(p => ({
              ...p,
              cluster: cluster,
            }))
          }
        } catch {
          // Fall through to kubectl proxy
        }

        // Try kubectl proxy
        try {
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          const pvcData = await kubectlProxy.getPVCs(clusterInfo?.context || cluster, namespace)
          return pvcData.map(p => ({
            name: p.name,
            namespace: p.namespace,
            cluster: cluster,
            status: p.status,
            capacity: p.capacity,
            storageClass: p.storageClass,
          })) as PVC[]
        } catch {
          // Fall through to REST API
        }
      }

      // Fall back to REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        const data = await fetchAPI<{ pvcs: PVC[] }>('pvcs', { cluster, namespace })
        return data.pvcs || []
      }

      return getDemoPVCs().filter(p =>
        (!cluster || p.cluster === cluster) && (!namespace || p.namespace === namespace)
      )
    },
  })

  return {
    pvcs: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

// ============================================================================
// Helm Releases Cached Hook
// ============================================================================

// Demo Helm releases - cluster names must match getDemoClusters() in shared.ts
const getDemoHelmReleases = (): HelmRelease[] => [
  { name: 'prometheus', namespace: 'monitoring', revision: '3', updated: new Date(Date.now() - 86400000).toISOString(), status: 'deployed', chart: 'prometheus-25.8.0', app_version: '2.47.0', cluster: 'eks-prod-us-east-1' },
  { name: 'grafana', namespace: 'monitoring', revision: '2', updated: new Date(Date.now() - 172800000).toISOString(), status: 'deployed', chart: 'grafana-7.0.8', app_version: '10.2.0', cluster: 'eks-prod-us-east-1' },
  { name: 'nginx-ingress', namespace: 'ingress', revision: '5', updated: new Date(Date.now() - 3600000).toISOString(), status: 'deployed', chart: 'ingress-nginx-4.8.3', app_version: '1.9.4', cluster: 'eks-prod-us-east-1' },
  { name: 'cert-manager', namespace: 'cert-manager', revision: '1', updated: new Date(Date.now() - 604800000).toISOString(), status: 'deployed', chart: 'cert-manager-1.13.2', app_version: '1.13.2', cluster: 'openshift-prod' },
  { name: 'redis', namespace: 'data', revision: '2', updated: new Date(Date.now() - 259200000).toISOString(), status: 'deployed', chart: 'redis-18.4.0', app_version: '7.2.3', cluster: 'gke-staging' },
  { name: 'postgresql', namespace: 'data', revision: '4', updated: new Date(Date.now() - 432000000).toISOString(), status: 'deployed', chart: 'postgresql-13.2.24', app_version: '16.1.0', cluster: 'gke-staging' },
  { name: 'api-gateway', namespace: 'production', revision: '8', updated: new Date(Date.now() - 7200000).toISOString(), status: 'deployed', chart: 'api-gateway-2.1.0', app_version: '2.1.0', cluster: 'eks-prod-us-east-1' },
  { name: 'ml-pipeline', namespace: 'ml', revision: '1', updated: new Date(Date.now() - 1800000).toISOString(), status: 'pending', chart: 'kubeflow-1.8.0', app_version: '1.8.0', cluster: 'vllm-gpu-cluster' },
  { name: 'broken-app', namespace: 'testing', revision: '3', updated: new Date(Date.now() - 600000).toISOString(), status: 'failed', chart: 'custom-app-0.1.0', app_version: '0.1.0', cluster: 'gke-staging' },
  { name: 'loki', namespace: 'monitoring', revision: '2', updated: new Date(Date.now() - 518400000).toISOString(), status: 'deployed', chart: 'loki-5.38.0', app_version: '2.9.2', cluster: 'openshift-prod' },
]

/**
 * Hook for fetching Helm releases with caching
 */
export function useCachedHelmReleases(
  cluster?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<HelmRelease[]> & { releases: HelmRelease[] } {
  const { category = 'gitops' } = options || {}
  const key = `helmReleases:${cluster || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoHelmReleases() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        const releases = getDemoHelmReleases()
        return cluster ? releases.filter(r => r.cluster === cluster) : releases
      }

      // Fall back to REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        const params = new URLSearchParams()
        if (cluster) params.append('cluster', cluster)
        const url = `/api/gitops/helm-releases?${params}`

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        headers['Authorization'] = `Bearer ${token}`

        const response = await fetch(url, { method: 'GET', headers })
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json() as { releases: HelmRelease[] }
        return data.releases || []
      }

      const releases = getDemoHelmReleases()
      return cluster ? releases.filter(r => r.cluster === cluster) : releases
    },
  })

  return {
    releases: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

// ============================================================================
// Operators Cached Hook
// ============================================================================

// Demo operators - cluster names must match getDemoClusters() in shared.ts
function getDemoOperatorsData(cluster: string): Operator[] {
  const hash = cluster.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const operatorCount = 3 + (hash % 5)

  const baseOperators: Operator[] = [
    { name: 'prometheus-operator', namespace: 'monitoring', version: 'v0.65.1', status: 'Succeeded', cluster },
    { name: 'cert-manager', namespace: 'cert-manager', version: 'v1.12.0', status: 'Succeeded', upgradeAvailable: 'v1.13.0', cluster },
    { name: 'elasticsearch-operator', namespace: 'elastic-system', version: 'v2.8.0', status: hash % 3 === 0 ? 'Failed' : 'Succeeded', cluster },
    { name: 'strimzi-kafka-operator', namespace: 'kafka', version: 'v0.35.0', status: hash % 4 === 0 ? 'Installing' : 'Succeeded', cluster },
    { name: 'argocd-operator', namespace: 'argocd', version: 'v0.6.0', status: hash % 5 === 0 ? 'Failed' : 'Succeeded', cluster },
    { name: 'jaeger-operator', namespace: 'observability', version: 'v1.47.0', status: 'Succeeded', cluster },
    { name: 'kiali-operator', namespace: 'istio-system', version: 'v1.72.0', status: hash % 2 === 0 ? 'Upgrading' : 'Succeeded', upgradeAvailable: hash % 2 === 0 ? 'v1.73.0' : undefined, cluster },
  ]

  return baseOperators.slice(0, operatorCount)
}

function getDemoOperatorSubscriptionsData(cluster: string): OperatorSubscription[] {
  const hash = cluster.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const subCount = 2 + (hash % 4)

  const baseSubscriptions: OperatorSubscription[] = [
    { name: 'prometheus-operator', namespace: 'monitoring', channel: 'stable', source: 'operatorhubio-catalog', installPlanApproval: 'Automatic', currentCSV: 'prometheusoperator.v0.65.1', cluster },
    { name: 'cert-manager', namespace: 'cert-manager', channel: 'stable', source: 'operatorhubio-catalog', installPlanApproval: 'Manual', currentCSV: 'cert-manager.v1.12.0', pendingUpgrade: hash % 2 === 0 ? 'cert-manager.v1.13.0' : undefined, cluster },
    { name: 'strimzi-kafka-operator', namespace: 'kafka', channel: 'stable', source: 'operatorhubio-catalog', installPlanApproval: hash % 3 === 0 ? 'Manual' : 'Automatic', currentCSV: 'strimzi-cluster-operator.v0.35.0', pendingUpgrade: hash % 4 === 0 ? 'strimzi-cluster-operator.v0.36.0' : undefined, cluster },
    { name: 'argocd-operator', namespace: 'argocd', channel: 'alpha', source: 'operatorhubio-catalog', installPlanApproval: 'Manual', currentCSV: 'argocd-operator.v0.6.0', pendingUpgrade: hash % 5 === 0 ? 'argocd-operator.v0.7.0' : undefined, cluster },
    { name: 'jaeger-operator', namespace: 'observability', channel: 'stable', source: 'operatorhubio-catalog', installPlanApproval: 'Automatic', currentCSV: 'jaeger-operator.v1.47.0', cluster },
  ]

  return baseSubscriptions.slice(0, subCount)
}

const getDemoAllOperators = (): Operator[] => {
  const clusterNames = ['eks-prod-us-east-1', 'gke-staging', 'openshift-prod', 'vllm-gpu-cluster']
  return clusterNames.flatMap(c => getDemoOperatorsData(c))
}

const getDemoAllOperatorSubscriptions = (): OperatorSubscription[] => {
  const clusterNames = ['eks-prod-us-east-1', 'gke-staging', 'openshift-prod', 'vllm-gpu-cluster']
  return clusterNames.flatMap(c => getDemoOperatorSubscriptionsData(c))
}

/**
 * Hook for fetching operators with caching
 */
export function useCachedOperators(
  cluster?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<Operator[]> & { operators: Operator[] } {
  const { category = 'gitops' } = options || {}
  const key = `operators:${cluster || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoAllOperators() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        if (cluster) {
          return getDemoOperatorsData(cluster)
        }
        return getDemoAllOperators()
      }

      // Try REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        if (cluster) {
          const data = await fetchAPI<{ operators: Operator[] }>('operators', { cluster })
          return (data.operators || []).map(op => ({ ...op, cluster }))
        }

        // Fetch from all clusters
        const clusters = clusterCacheRef.clusters.filter(c => c.reachable !== false && !c.name.includes('/'))
        if (clusters.length === 0) return getDemoAllOperators()

        const allOperators: Operator[] = []
        for (const c of clusters) {
          try {
            const data = await fetchAPI<{ operators: Operator[] }>('operators', { cluster: c.name })
            allOperators.push(...(data.operators || []).map(op => ({ ...op, cluster: c.name })))
          } catch {
            // Skip clusters where operator API is unavailable
          }
        }
        return allOperators.length > 0 ? allOperators : getDemoAllOperators()
      }

      return cluster ? getDemoOperatorsData(cluster) : getDemoAllOperators()
    },
  })

  return {
    operators: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

/**
 * Hook for fetching operator subscriptions with caching
 */
export function useCachedOperatorSubscriptions(
  cluster?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<OperatorSubscription[]> & { subscriptions: OperatorSubscription[] } {
  const { category = 'gitops' } = options || {}
  const key = `operatorSubscriptions:${cluster || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoAllOperatorSubscriptions() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        if (cluster) {
          return getDemoOperatorSubscriptionsData(cluster)
        }
        return getDemoAllOperatorSubscriptions()
      }

      // Try REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        if (cluster) {
          const data = await fetchAPI<{ subscriptions: OperatorSubscription[] }>('operator-subscriptions', { cluster })
          return (data.subscriptions || []).map(sub => ({ ...sub, cluster }))
        }

        // Fetch from all clusters
        const clusters = clusterCacheRef.clusters.filter(c => c.reachable !== false && !c.name.includes('/'))
        if (clusters.length === 0) return getDemoAllOperatorSubscriptions()

        const allSubscriptions: OperatorSubscription[] = []
        for (const c of clusters) {
          try {
            const data = await fetchAPI<{ subscriptions: OperatorSubscription[] }>('operator-subscriptions', { cluster: c.name })
            allSubscriptions.push(...(data.subscriptions || []).map(sub => ({ ...sub, cluster: c.name })))
          } catch {
            // Skip clusters where operator subscription API is unavailable
          }
        }
        return allSubscriptions.length > 0 ? allSubscriptions : getDemoAllOperatorSubscriptions()
      }

      return cluster ? getDemoOperatorSubscriptionsData(cluster) : getDemoAllOperatorSubscriptions()
    },
  })

  return {
    subscriptions: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

// ============================================================================
// GPU Nodes Cached Hook
// ============================================================================

// Demo GPU nodes - cluster names must match getDemoClusters() in shared.ts
const getDemoGPUNodesData = (): GPUNode[] => [
  // vllm-gpu-cluster - Large GPU cluster for AI/ML workloads
  { name: 'gpu-node-1', cluster: 'vllm-gpu-cluster', gpuType: 'NVIDIA A100', gpuCount: 8, gpuAllocated: 6 },
  { name: 'gpu-node-2', cluster: 'vllm-gpu-cluster', gpuType: 'NVIDIA A100', gpuCount: 8, gpuAllocated: 8 },
  { name: 'gpu-node-3', cluster: 'vllm-gpu-cluster', gpuType: 'NVIDIA A100', gpuCount: 8, gpuAllocated: 4 },
  { name: 'gpu-node-4', cluster: 'vllm-gpu-cluster', gpuType: 'NVIDIA H100', gpuCount: 8, gpuAllocated: 7 },
  // EKS - Production ML inference
  { name: 'eks-gpu-1', cluster: 'eks-prod-us-east-1', gpuType: 'NVIDIA A10G', gpuCount: 4, gpuAllocated: 3 },
  { name: 'eks-gpu-2', cluster: 'eks-prod-us-east-1', gpuType: 'NVIDIA A10G', gpuCount: 4, gpuAllocated: 4 },
  // GKE - Training workloads
  { name: 'gke-gpu-pool-1', cluster: 'gke-staging', gpuType: 'NVIDIA T4', gpuCount: 2, gpuAllocated: 1 },
  { name: 'gke-gpu-pool-2', cluster: 'gke-staging', gpuType: 'NVIDIA T4', gpuCount: 2, gpuAllocated: 2 },
  // AKS - Dev/test GPUs
  { name: 'aks-gpu-node', cluster: 'aks-dev-westeu', gpuType: 'NVIDIA V100', gpuCount: 2, gpuAllocated: 1 },
  // OpenShift - Enterprise ML
  { name: 'ocp-gpu-worker-1', cluster: 'openshift-prod', gpuType: 'NVIDIA A100', gpuCount: 4, gpuAllocated: 4 },
  { name: 'ocp-gpu-worker-2', cluster: 'openshift-prod', gpuType: 'NVIDIA A100', gpuCount: 4, gpuAllocated: 2 },
]

/**
 * Hook for fetching GPU nodes with caching
 */
export function useCachedGPUNodes(
  cluster?: string,
  options?: { category?: RefreshCategory }
): CachedHookResult<GPUNode[]> & { nodes: GPUNode[] } {
  const { category = 'pods' } = options || {}
  const key = `gpuNodes:${cluster || 'all'}`

  const isDemo = getDemoMode()
  const result = useCache({
    key,
    category,
    initialData: isDemo ? getDemoGPUNodesData() : [],
    enabled: true,
    fetcher: async () => {
      // If demo mode is explicitly enabled, return demo data immediately
      if (isDemo) {
        const nodes = getDemoGPUNodesData()
        return cluster ? nodes.filter(n => n.cluster === cluster) : nodes
      }

      // Try agent first (fast, no backend needed)
      if (clusterCacheRef.clusters.length > 0) {
        try {
          const params = new URLSearchParams()
          if (cluster) params.append('cluster', cluster)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)
          const response = await fetch(`${LOCAL_AGENT_URL}/gpu-nodes?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            const nodes = (data.nodes || []) as GPUNode[]
            if (nodes.length > 0) {
              return cluster ? nodes.filter(n => n.cluster === cluster) : nodes
            }
          }
        } catch {
          // Fall through to REST API
        }
      }

      // Fall back to REST API
      const token = getToken()
      const hasRealToken = token && token !== 'demo-token'
      if (hasRealToken && !isBackendUnavailable()) {
        const params = new URLSearchParams()
        if (cluster) params.append('cluster', cluster)
        const data = await fetchAPI<{ nodes: GPUNode[] }>('gpu-nodes', { cluster })
        return data.nodes || []
      }

      const nodes = getDemoGPUNodesData()
      return cluster ? nodes.filter(n => n.cluster === cluster) : nodes
    },
  })

  return {
    nodes: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
  }
}

// ============================================================================
// Alerts Cached Hook (wraps context for consistency)
// ============================================================================

/**
 * Hook for accessing alerts with context-based state
 * Note: Alerts use context provider for real-time updates, so this hook
 * wraps the context to provide a consistent interface with other cached hooks.
 */
export function useCachedAlerts(): CachedHookResult<AlertStats> & { stats: AlertStats } {
  const { stats } = useAlertsContext()

  // Default stats when no data available
  const defaultStats: AlertStats = {
    total: 0,
    firing: 0,
    resolved: 0,
    acknowledged: 0,
    critical: 0,
    warning: 0,
    info: 0,
  }

  const effectiveStats = stats || defaultStats

  return {
    stats: effectiveStats,
    data: effectiveStats,
    isLoading: false,
    isRefreshing: false,
    error: null,
    isFailed: false,
    consecutiveFailures: 0,
    lastRefresh: Date.now(),
    refetch: async () => {
      // Context handles its own refresh
    },
  }
}
