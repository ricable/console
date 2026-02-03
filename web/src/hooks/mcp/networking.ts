import { useCache, type RefreshCategory } from '../../lib/cache'
import { getDemoMode } from '../useDemoMode'
import { clusterCacheRef, LOCAL_AGENT_URL } from './shared'
import { kubectlProxy } from '../../lib/kubectlProxy'
import type { Service, Ingress, NetworkPolicy } from './types'

// ============================================================================
// useServices - with IndexedDB caching
// ============================================================================

export function useServices(cluster?: string, namespace?: string) {
  const key = `services:${cluster || 'all'}:${namespace || 'all'}`
  const isDemo = getDemoMode()

  const result = useCache({
    key,
    category: 'services' as RefreshCategory,
    // Only provide demo data as initialData in demo mode
    // Otherwise start empty so skeleton shows while loading
    initialData: isDemo ? getDemoServices() : [],
    fetcher: async () => {
      // In demo mode, return demo data
      if (getDemoMode()) {
        return getDemoServices().filter(s =>
          (!cluster || s.cluster === cluster) && (!namespace || s.namespace === namespace)
        )
      }

      // Try local agent HTTP endpoint first
      if (cluster && clusterCacheRef.clusters.length > 0) {
        try {
          const agentParams = new URLSearchParams()
          agentParams.append('cluster', cluster)
          if (namespace) agentParams.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/services?${agentParams}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const agentData = await response.json()
            return ((agentData.services || []) as Service[]).map(s => ({ ...s, cluster }))
          }
        } catch {
          // Fall through to kubectl proxy
        }
      }

      // Try kubectl proxy when cluster is specified
      if (cluster && clusterCacheRef.clusters.length > 0) {
        try {
          const clusterInfo = clusterCacheRef.clusters.find(c => c.name === cluster)
          const kubectlContext = clusterInfo?.context || cluster

          const svcPromise = kubectlProxy.getServices(kubectlContext, namespace)
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 15000)
          )
          const svcData = await Promise.race([svcPromise, timeoutPromise])

          if (svcData && svcData.length >= 0) {
            return svcData.map(s => ({
              name: s.name,
              namespace: s.namespace,
              cluster: cluster,
              type: s.type,
              clusterIP: s.clusterIP,
              ports: s.ports ? s.ports.split(', ') : [],
            })) as Service[]
          }
        } catch {
          // Fall through to REST API
        }
      }

      // Fall back to REST API
      const token = localStorage.getItem('token')
      if (!token || token === 'demo-token') {
        return getDemoServices().filter(s =>
          (!cluster || s.cluster === cluster) && (!namespace || s.namespace === namespace)
        )
      }

      const params = new URLSearchParams()
      if (cluster) params.append('cluster', cluster)
      if (namespace) params.append('namespace', namespace)
      const url = `/api/mcp/services?${params}`

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
      const data = await response.json() as { services: Service[] }
      return data.services || []
    },
  })

  return {
    services: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    lastUpdated: result.lastRefresh ? new Date(result.lastRefresh) : null,
    error: result.error,
    refetch: result.refetch,
    consecutiveFailures: result.consecutiveFailures,
    isFailed: result.isFailed,
    lastRefresh: result.lastRefresh ? new Date(result.lastRefresh) : null,
  }
}

// ============================================================================
// useIngresses - with IndexedDB caching
// ============================================================================

export function useIngresses(cluster?: string, namespace?: string) {
  const key = `ingresses:${cluster || 'all'}:${namespace || 'all'}`
  const isDemo = getDemoMode()

  const result = useCache({
    key,
    category: 'services' as RefreshCategory,
    initialData: isDemo ? getDemoIngresses() : [],
    fetcher: async () => {
      // In demo mode, return demo data
      if (getDemoMode()) {
        return getDemoIngresses().filter(i =>
          (!cluster || i.cluster === cluster) && (!namespace || i.namespace === namespace)
        )
      }

      // Try local agent first
      if (cluster && clusterCacheRef.clusters.length > 0) {
        try {
          const params = new URLSearchParams()
          params.append('cluster', cluster)
          if (namespace) params.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/ingresses?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return (data.ingresses || []) as Ingress[]
          }
        } catch {
          // Fall through to REST API
        }
      }

      // Fall back to REST API
      const token = localStorage.getItem('token')
      if (!token || token === 'demo-token') {
        return getDemoIngresses().filter(i =>
          (!cluster || i.cluster === cluster) && (!namespace || i.namespace === namespace)
        )
      }

      const params = new URLSearchParams()
      if (cluster) params.append('cluster', cluster)
      if (namespace) params.append('namespace', namespace)
      const url = `/api/mcp/ingresses?${params}`

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
      const data = await response.json() as { ingresses: Ingress[] }
      return data.ingresses || []
    },
  })

  return {
    ingresses: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

// ============================================================================
// useNetworkPolicies - with IndexedDB caching
// ============================================================================

export function useNetworkPolicies(cluster?: string, namespace?: string) {
  const key = `networkPolicies:${cluster || 'all'}:${namespace || 'all'}`
  const isDemo = getDemoMode()

  const result = useCache({
    key,
    category: 'services' as RefreshCategory,
    initialData: isDemo ? getDemoNetworkPolicies() : [],
    fetcher: async () => {
      // In demo mode, return demo data
      if (getDemoMode()) {
        return getDemoNetworkPolicies().filter(np =>
          (!cluster || np.cluster === cluster) && (!namespace || np.namespace === namespace)
        )
      }

      // Try local agent first
      if (cluster && clusterCacheRef.clusters.length > 0) {
        try {
          const params = new URLSearchParams()
          params.append('cluster', cluster)
          if (namespace) params.append('namespace', namespace)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          const response = await fetch(`${LOCAL_AGENT_URL}/networkpolicies?${params}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return (data.networkpolicies || []) as NetworkPolicy[]
          }
        } catch {
          // Fall through to REST API
        }
      }

      // Fall back to REST API
      const token = localStorage.getItem('token')
      if (!token || token === 'demo-token') {
        return getDemoNetworkPolicies().filter(np =>
          (!cluster || np.cluster === cluster) && (!namespace || np.namespace === namespace)
        )
      }

      const params = new URLSearchParams()
      if (cluster) params.append('cluster', cluster)
      if (namespace) params.append('namespace', namespace)
      const url = `/api/mcp/networkpolicies?${params}`

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
      const data = await response.json() as { networkpolicies: NetworkPolicy[] }
      return data.networkpolicies || []
    },
  })

  return {
    networkpolicies: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

// ============================================================================
// Demo Data
// ============================================================================

function getDemoServices(): Service[] {
  return [
    { name: 'kubernetes', namespace: 'default', cluster: 'prod-east', type: 'ClusterIP', clusterIP: '10.96.0.1', ports: ['443/TCP'], age: '45d' },
    { name: 'api-gateway', namespace: 'production', cluster: 'prod-east', type: 'LoadBalancer', clusterIP: '10.96.10.50', externalIP: '52.14.123.45', ports: ['80/TCP', '443/TCP'], age: '30d' },
    { name: 'frontend', namespace: 'web', cluster: 'prod-east', type: 'ClusterIP', clusterIP: '10.96.20.100', ports: ['3000/TCP'], age: '25d' },
    { name: 'postgres', namespace: 'data', cluster: 'prod-east', type: 'ClusterIP', clusterIP: '10.96.30.10', ports: ['5432/TCP'], age: '40d' },
    { name: 'redis', namespace: 'data', cluster: 'prod-east', type: 'ClusterIP', clusterIP: '10.96.30.20', ports: ['6379/TCP'], age: '40d' },
    { name: 'prometheus', namespace: 'monitoring', cluster: 'staging', type: 'ClusterIP', clusterIP: '10.96.40.10', ports: ['9090/TCP'], age: '20d' },
    { name: 'grafana', namespace: 'monitoring', cluster: 'staging', type: 'NodePort', clusterIP: '10.96.40.20', ports: ['3000:30300/TCP'], age: '20d' },
    { name: 'ml-inference', namespace: 'ml', cluster: 'vllm-d', type: 'LoadBalancer', clusterIP: '10.96.50.10', externalIP: '34.56.78.90', ports: ['8080/TCP'], age: '15d' },
  ]
}

function getDemoIngresses(): Ingress[] {
  return [
    { name: 'api-ingress', namespace: 'production', cluster: 'prod-east', hosts: ['api.kubestellar.io'], address: '52.14.123.45', class: 'nginx', age: '30d' },
    { name: 'frontend-ingress', namespace: 'web', cluster: 'prod-east', hosts: ['console.kubestellar.io'], address: '52.14.123.45', class: 'nginx', age: '25d' },
    { name: 'grafana-ingress', namespace: 'monitoring', cluster: 'staging', hosts: ['grafana.staging.local'], class: 'nginx', age: '20d' },
    { name: 'ml-api-ingress', namespace: 'ml', cluster: 'vllm-d', hosts: ['ml-api.kubestellar.io'], address: '34.56.78.90', class: 'nginx', age: '15d' },
    { name: 'prometheus-ingress', namespace: 'monitoring', cluster: 'staging', hosts: ['prometheus.staging.local'], class: 'nginx', age: '20d' },
  ]
}

function getDemoNetworkPolicies(): NetworkPolicy[] {
  return [
    { name: 'deny-all-ingress', namespace: 'production', cluster: 'prod-east', podSelector: '*', policyTypes: ['Ingress'], age: '30d' },
    { name: 'allow-api-gateway', namespace: 'production', cluster: 'prod-east', podSelector: 'app=api-gateway', policyTypes: ['Ingress'], age: '30d' },
    { name: 'allow-db-access', namespace: 'data', cluster: 'prod-east', podSelector: 'app=postgres', policyTypes: ['Ingress'], age: '40d' },
    { name: 'default-deny', namespace: 'ml', cluster: 'vllm-d', podSelector: '*', policyTypes: ['Ingress', 'Egress'], age: '15d' },
    { name: 'allow-inference', namespace: 'ml', cluster: 'vllm-d', podSelector: 'app=ml-inference', policyTypes: ['Ingress', 'Egress'], age: '15d' },
    { name: 'monitoring-access', namespace: 'monitoring', cluster: 'staging', podSelector: 'app=prometheus', policyTypes: ['Ingress'], age: '20d' },
  ]
}
