/**
 * Agent Swarm Hooks - Data fetching for agent swarm dashboard
 */

import { useCallback } from 'react'
import { useCache, type RefreshCategory, type UseCacheResult } from '../lib/cache'
import { api } from '../lib/api'

async function fetchAPI<T>(endpoint: string): Promise<T> {
  try {
    const res = await api.get<T>(endpoint)
    return res.data
  } catch (error) {
    console.error(`fetchAPI error for ${endpoint}:`, error)
    throw error
  }
}

// ============================================================================
// Types
// ============================================================================

export interface AgentInfo {
  name: string
  namespace: string
  domain: string
  type: string
  runtime: string
  replicas: number
  status: string
  autonomy: number
  cluster: string
  createdAt: string
  updatedAt: string
  labels: Record<string, string>
  annotations: Record<string, string>
  podStatus: PodStatusInfo[]
  events: EventInfo[]
}

export interface PodStatusInfo {
  name: string
  phase: string
  ready: string
  restarts: number
  node: string
  age: string
  cluster: string
}

export interface EventInfo {
  type: string
  reason: string
  message: string
  age: string
  count: number
  firstSeen: string
  lastSeen: string
}

export interface SwarmSummary {
  totalAgents: number
  runningAgents: number
  failedAgents: number
  pendingAgents: number
  totalPods: number
  runningPods: number
  failedPods: number
  byDomain: Record<string, number>
  byType: Record<string, number>
  byRuntime: Record<string, number>
  byCluster: Record<string, number>
}

export interface WasmRuntimeInfo {
  name: string
  type: string
  version: string
  status: string
  agentCount: number
  podCount: number
  cluster: string
}

export interface FederationStatus {
  connected: boolean
  edgeCount: number
  regionCount: number
  cloudCount: number
  syncStatus: Record<string, string>
  lastSync: string
}

export interface AgentDeployRequest {
  name: string
  namespace: string
  domain: string
  type: string
  runtime: string
  replicas: number
  cluster: string
  labels: Record<string, string>
  config: Record<string, string>
}

export interface AgentScaleRequest {
  name: string
  namespace: string
  replicas: number
  cluster: string
}

// ============================================================================
// Demo Data
// ============================================================================

const getDemoSummary = (): SwarmSummary => ({
  totalAgents: 4,
  runningAgents: 3,
  failedAgents: 0,
  pendingAgents: 1,
  totalPods: 8,
  runningPods: 6,
  failedPods: 0,
  byDomain: {
    Mobility: 1,
    Throughput: 1,
    Integrity: 1,
    Coordination: 1,
  },
  byType: {
    'ran-agent': 2,
    'sparc-agent': 1,
    coordinator: 1,
  },
  byRuntime: {
    spin: 2,
    wasmedge: 1,
    'crun-wasm': 1,
  },
  byCluster: {
    'edge-ran-1': 2,
    'edge-ran-2': 1,
    'edge-ml': 1,
  },
})

const getDemoAgents = (): AgentInfo[] => [
  {
    name: 'mobility-agent',
    namespace: 'wasmai-system',
    domain: 'Mobility',
    type: 'ran-agent',
    runtime: 'spin',
    replicas: 3,
    status: 'Running',
    autonomy: 85,
    cluster: 'edge-ran-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    labels: {
      'app.kubernetes.io/name': 'mobility-agent',
      'agent.wasmai.io/domain': 'Mobility',
    },
    annotations: {},
    podStatus: [
      { name: 'mobility-agent-0', phase: 'Running', ready: '1/1', restarts: 0, node: 'edge-node-1', age: '7d', cluster: 'edge-ran-1' },
      { name: 'mobility-agent-1', phase: 'Running', ready: '1/1', restarts: 0, node: 'edge-node-2', age: '7d', cluster: 'edge-ran-1' },
      { name: 'mobility-agent-2', phase: 'Running', ready: '1/1', restarts: 1, node: 'edge-node-3', age: '7d', cluster: 'edge-ran-1' },
    ],
    events: [],
  },
  {
    name: 'throughput-agent',
    namespace: 'wasmai-system',
    domain: 'Throughput',
    type: 'ran-agent',
    runtime: 'wasmedge',
    replicas: 2,
    status: 'Running',
    autonomy: 70,
    cluster: 'edge-ran-2',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    labels: {
      'app.kubernetes.io/name': 'throughput-agent',
      'agent.wasmai.io/domain': 'Throughput',
    },
    annotations: {},
    podStatus: [
      { name: 'throughput-agent-0', phase: 'Running', ready: '1/1', restarts: 0, node: 'edge-node-4', age: '5d', cluster: 'edge-ran-2' },
      { name: 'throughput-agent-1', phase: 'Running', ready: '1/1', restarts: 0, node: 'edge-node-5', age: '5d', cluster: 'edge-ran-2' },
    ],
    events: [],
  },
  {
    name: 'sparc-agent',
    namespace: 'wasmai-system',
    domain: 'Integrity',
    type: 'sparc-agent',
    runtime: 'crun-wasm',
    replicas: 2,
    status: 'Running',
    autonomy: 90,
    cluster: 'edge-ml',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    labels: {
      'app.kubernetes.io/name': 'sparc-agent',
      'agent.wasmai.io/domain': 'Integrity',
    },
    annotations: {},
    podStatus: [
      { name: 'sparc-agent-0', phase: 'Running', ready: '1/1', restarts: 0, node: 'ml-node-1', age: '3d', cluster: 'edge-ml' },
      { name: 'sparc-agent-1', phase: 'Running', ready: '1/1', restarts: 0, node: 'ml-node-2', age: '3d', cluster: 'edge-ml' },
    ],
    events: [],
  },
  {
    name: 'coordinator-agent',
    namespace: 'wasmai-system',
    domain: 'Coordination',
    type: 'coordinator',
    runtime: 'spin',
    replicas: 1,
    status: 'Pending',
    autonomy: 50,
    cluster: 'edge-ran-1',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    labels: {
      'app.kubernetes.io/name': 'coordinator-agent',
      'agent.wasmai.io/domain': 'Coordination',
    },
    annotations: {},
    podStatus: [
      { name: 'coordinator-agent-0', phase: 'Pending', ready: '0/1', restarts: 0, node: '', age: '1h', cluster: 'edge-ran-1' },
    ],
    events: [],
  },
]

const getDemoRuntimes = (): WasmRuntimeInfo[] => [
  {
    name: 'spin',
    type: 'spin',
    version: '3.0.0',
    status: 'Ready',
    agentCount: 2,
    podCount: 4,
    cluster: 'edge-ran-1',
  },
  {
    name: 'wasmedge',
    type: 'wasmedge',
    version: '0.14.0',
    status: 'Ready',
    agentCount: 1,
    podCount: 2,
    cluster: 'edge-ran-2',
  },
  {
    name: 'crun-wasm',
    type: 'crun-wasm',
    version: '1.14.0',
    status: 'Ready',
    agentCount: 1,
    podCount: 2,
    cluster: 'edge-ml',
  },
]

const getDemoFederation = (): FederationStatus => ({
  connected: true,
  edgeCount: 2,
  regionCount: 1,
  cloudCount: 1,
  syncStatus: {
    'edge-ran-1': 'synced',
    'edge-ran-2': 'synced',
    'edge-ml': 'synced',
    'region-1': 'synced',
    'cloud-1': 'synced',
  },
  lastSync: new Date(Date.now() - 30 * 1000).toISOString(),
})

// ============================================================================
// Hooks
// ============================================================================

export function useAgentSwarmSummary(
  options?: { category?: RefreshCategory }
): UseCacheResult<SwarmSummary> & { summary: SwarmSummary } {
  const category = options?.category || 'agents'

  const result = useCache({
    key: 'agentswarm:summary',
    category,
    initialData: getDemoSummary(),
    demoData: getDemoSummary(),
    fetcher: async () => {
      return fetchAPI<SwarmSummary>('agentswarm/summary')
    },
  })

  return {
    summary: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    isDemoFallback: result.isDemoFallback,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
    clearAndRefetch: result.clearAndRefetch,
  }
}

export function useAgentList(
  filters?: {
    domain?: string
    type?: string
    runtime?: string
    status?: string
    cluster?: string
  },
  options?: { category?: RefreshCategory }
): UseCacheResult<AgentInfo[]> & { agents: AgentInfo[] } {
  const category = options?.category || 'agents'

  const params = new URLSearchParams()
  if (filters?.domain) params.append('domain', filters.domain)
  if (filters?.type) params.append('type', filters.type)
  if (filters?.runtime) params.append('runtime', filters.runtime)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.cluster) params.append('cluster', filters.cluster)

  const queryString = params.toString()
  const key = `agentswarm:agents${queryString ? `?${queryString}` : ''}`

  const result = useCache({
    key,
    category,
    initialData: getDemoAgents(),
    demoData: getDemoAgents(),
    fetcher: async () => {
      const endpoint = queryString ? `agentswarm/agents?${queryString}` : 'agentswarm/agents'
      return fetchAPI<AgentInfo[]>(endpoint)
    },
  })

  return {
    agents: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    isDemoFallback: result.isDemoFallback,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
    clearAndRefetch: result.clearAndRefetch,
  }
}

export function useAgentDetails(
  name: string,
  options?: { namespace?: string; cluster?: string; category?: RefreshCategory }
): UseCacheResult<AgentInfo | null> & { agent: AgentInfo | null } {
  const { namespace = 'wasmai-system', cluster = '', category = 'agents' } = options || {}

  const params = new URLSearchParams({ namespace })
  if (cluster) params.append('cluster', cluster)

  const result = useCache({
    key: `agentswarm:agent:${name}?${params.toString()}`,
    category,
    initialData: null as unknown as AgentInfo,
    demoData: getDemoAgents().find(a => a.name === name) || null,
    fetcher: async () => {
      const queryString = params.toString()
      return fetchAPI<AgentInfo>(`agentswarm/agents/${name}?${queryString}`)
    },
  })

  return {
    agent: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    isDemoFallback: result.isDemoFallback,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
    clearAndRefetch: result.clearAndRefetch,
  }
}

export function useWasmRuntime(
  options?: { category?: RefreshCategory }
): UseCacheResult<WasmRuntimeInfo[]> & { runtimes: WasmRuntimeInfo[] } {
  const category = options?.category || 'agents'

  const result = useCache({
    key: 'agentswarm:runtimes',
    category,
    initialData: getDemoRuntimes(),
    demoData: getDemoRuntimes(),
    fetcher: async () => {
      return fetchAPI<WasmRuntimeInfo[]>('agentswarm/runtime')
    },
  })

  return {
    runtimes: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    isDemoFallback: result.isDemoFallback,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
    clearAndRefetch: result.clearAndRefetch,
  }
}

export function useFederationStatus(
  options?: { category?: RefreshCategory }
): UseCacheResult<FederationStatus> & { federation: FederationStatus } {
  const category = options?.category || 'agents'

  const result = useCache({
    key: 'agentswarm:federation',
    category,
    initialData: getDemoFederation(),
    demoData: getDemoFederation(),
    fetcher: async () => {
      return fetchAPI<FederationStatus>('agentswarm/federation')
    },
  })

  return {
    federation: result.data,
    data: result.data,
    isLoading: result.isLoading,
    isRefreshing: result.isRefreshing,
    isDemoFallback: result.isDemoFallback,
    error: result.error,
    isFailed: result.isFailed,
    consecutiveFailures: result.consecutiveFailures,
    lastRefresh: result.lastRefresh,
    refetch: result.refetch,
    clearAndRefetch: result.clearAndRefetch,
  }
}
