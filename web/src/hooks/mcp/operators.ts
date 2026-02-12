import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'
import { isDemoMode } from '../../lib/demoMode'
import { useDemoMode } from '../useDemoMode'
import { registerRefetch } from '../../lib/modeTransition'
import { clusterCacheRef, subscribeClusterCache } from './shared'
import type { Operator, OperatorSubscription } from './types'

// localStorage cache keys
const OPERATORS_CACHE_KEY = 'kubestellar-operators-cache'
const SUBSCRIPTIONS_CACHE_KEY = 'kubestellar-subscriptions-cache'

// Load operators from localStorage
function loadOperatorsCacheFromStorage(cacheKey: string): { data: Operator[], timestamp: number } | null {
  try {
    const stored = localStorage.getItem(OPERATORS_CACHE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.key === cacheKey && parsed.data && parsed.data.length > 0) {
        return { data: parsed.data, timestamp: parsed.timestamp || Date.now() }
      }
    }
  } catch { /* ignore */ }
  return null
}

function saveOperatorsCacheToStorage(data: Operator[], key: string) {
  try {
    if (data.length > 0 && !isDemoMode()) {
      localStorage.setItem(OPERATORS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now(), key }))
    }
  } catch { /* ignore */ }
}

// Load subscriptions from localStorage
function loadSubscriptionsCacheFromStorage(cacheKey: string): { data: OperatorSubscription[], timestamp: number } | null {
  try {
    const stored = localStorage.getItem(SUBSCRIPTIONS_CACHE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.key === cacheKey && parsed.data && parsed.data.length > 0) {
        return { data: parsed.data, timestamp: parsed.timestamp || Date.now() }
      }
    }
  } catch { /* ignore */ }
  return null
}

function saveSubscriptionsCacheToStorage(data: OperatorSubscription[], key: string) {
  try {
    if (data.length > 0 && !isDemoMode()) {
      localStorage.setItem(SUBSCRIPTIONS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now(), key }))
    }
  } catch { /* ignore */ }
}

// Per-cluster timeout — short enough so auto-refresh (30s) doesn't overlap
const OPERATOR_API_TIMEOUT = 15000

// Hook to get operators for a cluster (or all clusters if undefined)
export function useOperators(cluster?: string) {
  const cacheKey = `operators:${cluster || 'all'}`
  const cached = loadOperatorsCacheFromStorage(cacheKey)
  const { isDemoMode: demoMode } = useDemoMode()
  const initialMountRef = useRef(true)
  // Track whether we've ever completed a fetch with targets available
  // Prevents showing "No operators" before we've actually tried to fetch
  const hasCompletedFetchRef = useRef(!!cached)
  // AbortController ref — cancels in-flight HTTP requests on cleanup
  const abortRef = useRef<AbortController | null>(null)
  // Guard against overlapping fetches (auto-refresh fires while previous is pending)
  const fetchInProgressRef = useRef(false)

  const [operators, setOperators] = useState<Operator[]>(cached?.data || [])
  const [isLoading, setIsLoading] = useState(!cached)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(cached?.timestamp || null)
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  // Track cluster count to re-fetch when clusters become available
  const [clusterCount, setClusterCount] = useState(clusterCacheRef.clusters.length)
  // Version counter to force refetch
  const [fetchVersion, setFetchVersion] = useState(0)

  // Subscribe to cluster cache updates for "all clusters" mode
  useEffect(() => {
    return subscribeClusterCache((cache) => {
      setClusterCount(cache.clusters.length)
    })
  }, [])

  // Refetch when cluster, clusterCount, or fetchVersion changes
  useEffect(() => {
    // Skip if a fetch is already in progress (prevents auto-refresh overlap)
    if (fetchInProgressRef.current) return

    // Abort any lingering previous requests
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const doFetch = async () => {
      // If demo mode is enabled, use demo data directly
      if (isDemoMode()) {
        const clusters = cluster ? [cluster] : clusterCacheRef.clusters.map(c => c.name)
        const allOperators = clusters.flatMap(c => getDemoOperators(c))
        setOperators(allOperators)
        setError(null)
        setConsecutiveFailures(0)
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      fetchInProgressRef.current = true
      setIsRefreshing(true)

      // Progressive discovery: fetch per-cluster in parallel, update UI as each responds
      const targets = cluster
        ? [cluster]
        : clusterCacheRef.clusters.filter(c => c.reachable !== false).map(c => c.name)

      if (targets.length === 0) {
        // No clusters available yet — stay in loading state so skeleton shows
        // Only show empty state if we've previously completed a fetch with targets
        if (hasCompletedFetchRef.current) {
          setOperators([])
          setIsLoading(false)
        }
        setIsRefreshing(false)
        fetchInProgressRef.current = false
        return
      }

      const accumulated: Operator[] = []
      let anySucceeded = false

      const mapOperators = (ops: Array<Operator & { phase?: string }>, clusterName: string) =>
        ops.map(op => ({
          ...op,
          status: (op.status || op.phase || 'Unknown') as Operator['status'],
          cluster: op.cluster || clusterName,
        }))

      await Promise.allSettled(
        targets.map(async (clusterName) => {
          try {
            const { data } = await api.get<{ operators: Array<Operator & { phase?: string }> }>(
              `/api/gitops/operators?cluster=${encodeURIComponent(clusterName)}`,
              { timeout: OPERATOR_API_TIMEOUT },
            )
            anySucceeded = true
            const ops = mapOperators(data.operators || [], clusterName)
            if (ops.length > 0 && !controller.signal.aborted) {
              accumulated.push(...ops)
              // Progressive update — show data as each cluster responds
              setOperators([...accumulated])
              setIsLoading(false)
            }
          } catch {
            // Skip clusters where operator API is unavailable or request was aborted
          }
        }),
      )

      if (!controller.signal.aborted) {
        if (anySucceeded || hasCompletedFetchRef.current) {
          hasCompletedFetchRef.current = true
          setOperators([...accumulated])
          saveOperatorsCacheToStorage(accumulated, cacheKey)
          setError(null)
          setConsecutiveFailures(0)
          setLastRefresh(Date.now())
        } else {
          // All API calls failed — increment failures but still exit loading
          setConsecutiveFailures(prev => prev + 1)
          setError('Unable to fetch operators')
        }
      }
      // Always exit loading state after all promises settle
      setIsLoading(false)
      setIsRefreshing(false)
      fetchInProgressRef.current = false
    }

    doFetch()

    // Register for unified mode transition refetch
    const unregisterRefetch = registerRefetch(`operators:${cacheKey}`, () => {
      setFetchVersion(v => v + 1)
    })

    return () => {
      controller.abort()
      fetchInProgressRef.current = false
      unregisterRefetch()
    }
  }, [cluster, clusterCount, fetchVersion, cacheKey])

  const refetch = useCallback(() => {
    abortRef.current?.abort()
    fetchInProgressRef.current = false
    setFetchVersion(v => v + 1)
  }, [])

  // Re-fetch when demo mode changes (not on initial mount)
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false
      return
    }
    setFetchVersion(v => v + 1)
  }, [demoMode])

  return { operators, isLoading, isRefreshing, error, refetch, lastRefresh, consecutiveFailures, isFailed: consecutiveFailures >= 3 }
}

// Hook to get operator subscriptions for a cluster (or all clusters if undefined)
export function useOperatorSubscriptions(cluster?: string) {
  const cacheKey = `subscriptions:${cluster || 'all'}`
  const cached = loadSubscriptionsCacheFromStorage(cacheKey)
  const { isDemoMode: demoMode } = useDemoMode()
  const initialMountRef = useRef(true)
  const hasCompletedFetchRef = useRef(!!cached)
  const abortRef = useRef<AbortController | null>(null)
  const fetchInProgressRef = useRef(false)

  const [subscriptions, setSubscriptions] = useState<OperatorSubscription[]>(cached?.data || [])
  const [isLoading, setIsLoading] = useState(!cached)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(cached?.timestamp || null)
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  // Track cluster count to re-fetch when clusters become available
  const [clusterCount, setClusterCount] = useState(clusterCacheRef.clusters.length)
  // Version counter to force refetch
  const [fetchVersion, setFetchVersion] = useState(0)

  // Subscribe to cluster cache updates for "all clusters" mode
  useEffect(() => {
    return subscribeClusterCache((cache) => {
      setClusterCount(cache.clusters.length)
    })
  }, [])

  // Refetch when cluster, clusterCount, or fetchVersion changes
  useEffect(() => {
    if (fetchInProgressRef.current) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const doFetch = async () => {
      if (isDemoMode()) {
        const clusters = cluster ? [cluster] : clusterCacheRef.clusters.map(c => c.name)
        const allSubscriptions = clusters.flatMap(c => getDemoOperatorSubscriptions(c))
        setSubscriptions(allSubscriptions)
        setError(null)
        setConsecutiveFailures(0)
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      fetchInProgressRef.current = true
      setIsRefreshing(true)

      const targets = cluster
        ? [cluster]
        : clusterCacheRef.clusters.filter(c => c.reachable !== false).map(c => c.name)

      if (targets.length === 0) {
        if (hasCompletedFetchRef.current) {
          setSubscriptions([])
          setIsLoading(false)
        }
        setIsRefreshing(false)
        fetchInProgressRef.current = false
        return
      }

      const accumulated: OperatorSubscription[] = []
      let anySucceeded = false

      await Promise.allSettled(
        targets.map(async (clusterName) => {
          try {
            const { data } = await api.get<{ subscriptions: OperatorSubscription[] }>(
              `/api/gitops/operator-subscriptions?cluster=${encodeURIComponent(clusterName)}`,
              { timeout: OPERATOR_API_TIMEOUT },
            )
            anySucceeded = true
            const subs = (data.subscriptions || []).map(sub => ({ ...sub, cluster: clusterName }))
            if (subs.length > 0 && !controller.signal.aborted) {
              accumulated.push(...subs)
              setSubscriptions([...accumulated])
              setIsLoading(false)
            }
          } catch {
            // Skip clusters where operator subscription API is unavailable
          }
        }),
      )

      if (!controller.signal.aborted) {
        if (anySucceeded || hasCompletedFetchRef.current) {
          hasCompletedFetchRef.current = true
          setSubscriptions([...accumulated])
          saveSubscriptionsCacheToStorage(accumulated, cacheKey)
          setError(null)
          setConsecutiveFailures(0)
          setLastRefresh(Date.now())
        } else {
          setConsecutiveFailures(prev => prev + 1)
          setError('Unable to fetch operator subscriptions')
        }
      }
      setIsLoading(false)
      setIsRefreshing(false)
      fetchInProgressRef.current = false
    }

    doFetch()

    const unregisterRefetch = registerRefetch(`operator-subscriptions:${cacheKey}`, () => {
      setFetchVersion(v => v + 1)
    })

    return () => {
      controller.abort()
      fetchInProgressRef.current = false
      unregisterRefetch()
    }
  }, [cluster, clusterCount, fetchVersion, cacheKey])

  const refetch = useCallback(() => {
    abortRef.current?.abort()
    fetchInProgressRef.current = false
    setFetchVersion(v => v + 1)
  }, [])

  // Re-fetch when demo mode changes (not on initial mount)
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false
      return
    }
    setFetchVersion(v => v + 1)
  }, [demoMode])

  return { subscriptions, isLoading, isRefreshing, error, refetch, lastRefresh, consecutiveFailures, isFailed: consecutiveFailures >= 3 }
}

function getDemoOperators(cluster: string): Operator[] {
  // Generate cluster-specific demo data using hash of cluster name
  const hash = cluster.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const operatorCount = 3 + (hash % 5) // 3-7 operators per cluster

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

function getDemoOperatorSubscriptions(cluster: string): OperatorSubscription[] {
  // Generate cluster-specific demo data using hash of cluster name
  const hash = cluster.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const subCount = 2 + (hash % 4) // 2-5 subscriptions per cluster

  const baseSubscriptions: OperatorSubscription[] = [
    {
      name: 'prometheus-operator',
      namespace: 'monitoring',
      channel: 'stable',
      source: 'operatorhubio-catalog',
      installPlanApproval: 'Automatic',
      currentCSV: 'prometheusoperator.v0.65.1',
      cluster,
    },
    {
      name: 'cert-manager',
      namespace: 'cert-manager',
      channel: 'stable',
      source: 'operatorhubio-catalog',
      installPlanApproval: 'Manual',
      currentCSV: 'cert-manager.v1.12.0',
      pendingUpgrade: hash % 2 === 0 ? 'cert-manager.v1.13.0' : undefined,
      cluster,
    },
    {
      name: 'strimzi-kafka-operator',
      namespace: 'kafka',
      channel: 'stable',
      source: 'operatorhubio-catalog',
      installPlanApproval: hash % 3 === 0 ? 'Manual' : 'Automatic',
      currentCSV: 'strimzi-cluster-operator.v0.35.0',
      pendingUpgrade: hash % 4 === 0 ? 'strimzi-cluster-operator.v0.36.0' : undefined,
      cluster,
    },
    {
      name: 'argocd-operator',
      namespace: 'argocd',
      channel: 'alpha',
      source: 'operatorhubio-catalog',
      installPlanApproval: 'Manual',
      currentCSV: 'argocd-operator.v0.6.0',
      pendingUpgrade: hash % 5 === 0 ? 'argocd-operator.v0.7.0' : undefined,
      cluster,
    },
    {
      name: 'jaeger-operator',
      namespace: 'observability',
      channel: 'stable',
      source: 'operatorhubio-catalog',
      installPlanApproval: 'Automatic',
      currentCSV: 'jaeger-operator.v1.47.0',
      cluster,
    },
  ]

  return baseSubscriptions.slice(0, subCount)
}
