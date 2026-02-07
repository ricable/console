import { Bot, ChevronRight, Server } from 'lucide-react'
import { useKagentiAgents } from '../../../hooks/useMCP'
import { useCardLoadingState, useCardDemoState } from '../CardDataContext'
import { useCardData, commonComparators, CardSearchInput, CardControlsRow, CardPaginationFooter } from '../../../lib/cards'
import { Skeleton } from '../../ui/Skeleton'
import { useMemo } from 'react'

interface KagentiAgentFleetProps {
  config?: { cluster?: string }
}

// Demo data for offline/demo mode
function getDemoKagentiAgents() {
  return [
    {
      name: 'kagenti-agent-primary',
      namespace: 'kagenti-system',
      cluster: 'eks-prod-us-east-1',
      framework: 'langchain',
      status: 'Ready' as const,
      replicas: 3,
      readyReplicas: 3,
      image: 'kagenti/agent:v1.2.3',
      protocol: 'a2a',
      labels: { 'app': 'kagenti-agent', 'env': 'prod' },
      createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      age: '7d',
    },
    {
      name: 'kagenti-agent-inference',
      namespace: 'ml-inference',
      cluster: 'vllm-gpu-cluster',
      framework: 'vllm',
      status: 'Ready' as const,
      replicas: 2,
      readyReplicas: 2,
      image: 'kagenti/agent:v1.2.3',
      protocol: 'mcp',
      labels: { 'app': 'kagenti-agent', 'env': 'prod' },
      createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
      age: '3d',
    },
    {
      name: 'kagenti-agent-embeddings',
      namespace: 'kagenti-system',
      cluster: 'gke-staging',
      framework: 'sentence-transformers',
      status: 'Deploying' as const,
      replicas: 2,
      readyReplicas: 1,
      image: 'kagenti/agent:v1.2.2',
      protocol: 'a2a',
      labels: { 'app': 'kagenti-agent', 'env': 'staging' },
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      age: '2h',
    },
    {
      name: 'kagenti-agent-dev',
      namespace: 'development',
      cluster: 'gke-staging',
      framework: 'langchain',
      status: 'Deploying' as const,
      replicas: 1,
      readyReplicas: 0,
      image: 'kagenti/agent:v1.3.0-beta',
      protocol: 'mcp',
      labels: { 'app': 'kagenti-agent', 'env': 'dev' },
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      age: '30m',
    },
    {
      name: 'kagenti-agent-backup',
      namespace: 'kagenti-system',
      cluster: 'openshift-prod',
      framework: 'langchain',
      status: 'Failed' as const,
      replicas: 1,
      readyReplicas: 0,
      image: 'kagenti/agent:v1.1.0',
      protocol: 'a2a',
      labels: { 'app': 'kagenti-agent', 'env': 'prod' },
      createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
      age: '5d',
    },
  ]
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === 'Running' || status === 'Ready'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
      : status === 'Pending'
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
        : status === 'Failed'
          ? 'bg-red-500/15 text-red-400 border-red-500/20'
          : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${classes}`}>
      {status}
    </span>
  )
}

type SortField = 'name' | 'status' | 'framework' | 'cluster'

export function KagentiAgentFleet({ config }: KagentiAgentFleetProps) {
  const { shouldUseDemoData } = useCardDemoState({ requires: 'agent' })
  
  const {
    data: agents,
    isLoading,
    consecutiveFailures,
  } = useKagentiAgents({ cluster: config?.cluster })
  
  // Use demo data when in demo mode
  const liveAgents = agents
  const displayAgents = useMemo(() => {
    return shouldUseDemoData ? getDemoKagentiAgents() : liveAgents
  }, [shouldUseDemoData, liveAgents])

  const { showSkeleton, showEmptyState } = useCardLoadingState({
    isLoading: shouldUseDemoData ? false : isLoading,
    hasAnyData: shouldUseDemoData ? true : displayAgents.length > 0,
    isFailed: consecutiveFailures >= 3,
    consecutiveFailures,
  })

  const {
    items: paginatedItems,
    filters,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    needsPagination,
    itemsPerPage,
  } = useCardData(displayAgents, {
    filter: {
      searchFields: ['name', 'namespace', 'framework', 'cluster', 'status'],
      clusterField: 'cluster',
    },
    sort: {
      defaultField: 'status' as SortField,
      defaultDirection: 'asc',
      comparators: {
        name: commonComparators.string('name'),
        status: (a, b) => {
          const order: Record<string, number> = { Failed: 0, Pending: 1, Running: 2, Ready: 3 }
          return (order[a.status] ?? 99) - (order[b.status] ?? 99)
        },
        framework: commonComparators.string('framework'),
        cluster: commonComparators.string('cluster'),
      } as Record<SortField, (a: typeof agents[number], b: typeof agents[number]) => number>,
    },
    defaultLimit: 8,
  })

  if (showSkeleton) {
    return (
      <div className="space-y-2 p-1">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Bot className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <div className="text-sm font-medium text-muted-foreground">No Agents Deployed</div>
        <div className="text-xs text-muted-foreground/60 mt-1">Deploy kagenti agents to see them here</div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <CardControlsRow
        extra={
          <CardSearchInput value={filters.search} onChange={filters.setSearch} placeholder="Search agents..." />
        }
      />

      <div className="space-y-1">
        {paginatedItems.map(agent => (
          <div
            key={`${agent.cluster}-${agent.namespace}-${agent.name}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <Bot className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{agent.name}</div>
              <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <Server className="w-2.5 h-2.5" />
                {agent.cluster}
                {agent.framework && <span className="text-violet-400/60">/ {agent.framework}</span>}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground/50">
              {agent.readyReplicas}/{agent.replicas}
            </div>
            <StatusBadge status={agent.status} />
            <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-muted-foreground/50" />
          </div>
        ))}
      </div>

      <CardPaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={typeof itemsPerPage === 'number' ? itemsPerPage : totalItems}
        onPageChange={goToPage}
        needsPagination={needsPagination}
      />
    </div>
  )
}
