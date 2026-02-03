import { useCache, type RefreshCategory } from '../../lib/cache'
import { getDemoMode } from '../useDemoMode'
import { clusterCacheRef, LOCAL_AGENT_URL } from './shared'
import type { SecurityIssue, GitOpsDrift } from './types'

// ============================================================================
// useSecurityIssues - with IndexedDB caching
// ============================================================================

export function useSecurityIssues(cluster?: string, namespace?: string) {
  const key = `securityIssues:${cluster || 'all'}:${namespace || 'all'}`
  const isDemo = getDemoMode()

  const result = useCache({
    key,
    category: 'pods' as RefreshCategory,
    // Only provide demo data as initialData in demo mode
    // Otherwise start empty so skeleton shows while loading
    initialData: isDemo ? getDemoSecurityIssues() : [],
    fetcher: async () => {
      // In demo mode, return demo data
      if (getDemoMode()) {
        return getDemoSecurityIssues()
      }

      // Try local agent first
      if (clusterCacheRef.clusters.length > 0 && cluster) {
        try {
          const params = new URLSearchParams()
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          params.append('cluster', clusterInfo?.context || cluster)
          if (namespace) params.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/security-issues?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return ((data.issues || []) as SecurityIssue[]).map(i => ({
              ...i,
              cluster: cluster,
            }))
          }
        } catch {
          // Fall through to REST API
        }
      }

      // Fall back to REST API
      const token = localStorage.getItem('token')
      if (!token || token === 'demo-token') {
        return getDemoSecurityIssues()
      }

      const params = new URLSearchParams()
      if (cluster) params.append('cluster', cluster)
      if (namespace) params.append('namespace', namespace)
      const url = `/api/mcp/security-issues?${params}`

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      headers['Authorization'] = `Bearer ${token}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json() as { issues: SecurityIssue[] }
      return data.issues || []
    },
  })

  return {
    issues: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    lastUpdated: result.lastRefresh ? new Date(result.lastRefresh) : null,
    error: result.error,
    refetch: result.refetch,
    consecutiveFailures: result.consecutiveFailures,
    isFailed: result.isFailed,
    lastRefresh: result.lastRefresh ? new Date(result.lastRefresh) : null,
    isUsingDemoData: getDemoMode(),
  }
}

// ============================================================================
// useGitOpsDrifts - with IndexedDB caching
// ============================================================================

export function useGitOpsDrifts(cluster?: string, namespace?: string) {
  const key = `gitopsDrifts:${cluster || 'all'}:${namespace || 'all'}`
  const isDemo = getDemoMode()

  const result = useCache({
    key,
    category: 'gitops' as RefreshCategory,
    // Only provide demo data as initialData in demo mode
    initialData: isDemo ? getDemoGitOpsDrifts() : [],
    fetcher: async () => {
      // In demo mode, return demo data
      if (getDemoMode()) {
        return getDemoGitOpsDrifts()
      }

      // Try local agent first
      if (clusterCacheRef.clusters.length > 0 && cluster) {
        try {
          const params = new URLSearchParams()
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          params.append('cluster', clusterInfo?.context || cluster)
          if (namespace) params.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/gitops/drifts?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return ((data.drifts || []) as GitOpsDrift[]).map(d => ({
              ...d,
              cluster: cluster,
            }))
          }
        } catch {
          // Fall through to REST API
        }
      }

      // Fall back to REST API
      const token = localStorage.getItem('token')
      if (!token || token === 'demo-token') {
        return getDemoGitOpsDrifts()
      }

      const params = new URLSearchParams()
      if (cluster) params.append('cluster', cluster)
      if (namespace) params.append('namespace', namespace)
      const url = `/api/gitops/drifts?${params}`

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      headers['Authorization'] = `Bearer ${token}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json() as { drifts: GitOpsDrift[] }
      return data.drifts || []
    },
  })

  return {
    drifts: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    error: result.error,
    refetch: result.refetch,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh ? new Date(result.lastRefresh) : null,
  }
}

// ============================================================================
// Demo Data
// ============================================================================

// Demo data - cluster names must match getDemoClusters() in shared.ts
function getDemoGitOpsDrifts(): GitOpsDrift[] {
  return [
    {
      resource: 'api-gateway',
      namespace: 'production',
      cluster: 'eks-prod-us-east-1',
      kind: 'Deployment',
      driftType: 'modified',
      gitVersion: 'v2.4.0',
      details: 'Image tag changed from v2.4.0 to v2.4.1-hotfix',
      severity: 'medium',
    },
    {
      resource: 'config-secret',
      namespace: 'production',
      cluster: 'eks-prod-us-east-1',
      kind: 'Secret',
      driftType: 'modified',
      gitVersion: 'abc123',
      details: 'Secret data modified manually',
      severity: 'high',
    },
    {
      resource: 'debug-pod',
      namespace: 'default',
      cluster: 'gke-staging',
      kind: 'Pod',
      driftType: 'added',
      gitVersion: '-',
      details: 'Resource exists in cluster but not in Git',
      severity: 'low',
    },
  ]
}

// Demo data - cluster names must match getDemoClusters() in shared.ts
function getDemoSecurityIssues(): SecurityIssue[] {
  return [
    {
      name: 'api-server-7d8f9c6b5-x2k4m',
      namespace: 'production',
      cluster: 'eks-prod-us-east-1',
      issue: 'Privileged container',
      severity: 'high',
      details: 'Container running in privileged mode',
    },
    {
      name: 'worker-deployment',
      namespace: 'batch',
      cluster: 'vllm-gpu-cluster',
      issue: 'Running as root',
      severity: 'high',
      details: 'Container running as root user',
    },
    {
      name: 'nginx-ingress',
      namespace: 'ingress',
      cluster: 'eks-prod-us-east-1',
      issue: 'Host network enabled',
      severity: 'medium',
      details: 'Pod using host network namespace',
    },
    {
      name: 'monitoring-agent',
      namespace: 'monitoring',
      cluster: 'gke-staging',
      issue: 'Missing security context',
      severity: 'low',
      details: 'No security context defined',
    },
    {
      name: 'redis-cache',
      namespace: 'data',
      cluster: 'openshift-prod',
      issue: 'Capabilities not dropped',
      severity: 'medium',
      details: 'Container not dropping all capabilities',
    },
    {
      name: 'etcd-backup',
      namespace: 'kube-system',
      cluster: 'aks-dev-westeu',
      issue: 'Host path mount',
      severity: 'high',
      details: 'Container mounting host path /var/lib/etcd',
    },
  ]
}
