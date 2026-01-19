import { WifiOff, HardDrive, Server, CheckCircle2, AlertTriangle, Cpu, MemoryStick, Layers, Zap, Box } from 'lucide-react'
import { formatStat, formatMemoryStat } from '../../../lib/formatStats'

export interface ClusterStats {
  total: number
  loading: number
  healthy: number
  unhealthy: number
  unreachable: number
  totalNodes: number
  totalCPUs: number
  totalMemoryGB: number
  totalStorageGB: number
  totalPods: number
  totalGPUs: number
  allocatedGPUs: number
  /** Whether there are any reachable clusters with resource data */
  hasResourceData?: boolean
}

interface StatsOverviewProps {
  stats: ClusterStats
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  // Resource data is available if we have reachable clusters with node data
  const hasData = stats.hasResourceData !== false

  return (
    <div className="grid grid-cols-5 lg:grid-cols-10 gap-3 mb-6">
      {/* Row 1: Cluster health stats - always show these counts */}
      <div className="glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-muted-foreground">Clusters</span>
        </div>
        <div className="text-3xl font-bold text-foreground">{formatStat(stats.total)}</div>
        <div className="text-xs text-muted-foreground">total</div>
      </div>
      <div className="glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm text-muted-foreground">Healthy</span>
        </div>
        <div className="text-3xl font-bold text-green-400">{formatStat(stats.healthy)}</div>
        <div className="text-xs text-muted-foreground">clusters</div>
      </div>
      <div className="glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <span className="text-sm text-muted-foreground">Unhealthy</span>
        </div>
        <div className="text-3xl font-bold text-orange-400">{formatStat(stats.unhealthy)}</div>
        <div className="text-xs text-muted-foreground">clusters</div>
      </div>
      <div className="glass p-4 rounded-lg" title="Unreachable - check network connection">
        <div className="flex items-center gap-2 mb-2">
          <WifiOff className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-muted-foreground">Unreachable</span>
        </div>
        <div className="text-3xl font-bold text-yellow-400">{formatStat(stats.unreachable)}</div>
        <div className="text-xs text-muted-foreground">clusters</div>
      </div>
      <div className="glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Box className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-muted-foreground">Nodes</span>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {hasData ? formatStat(stats.totalNodes) : '-'}
        </div>
        <div className="text-xs text-muted-foreground">total</div>
      </div>

      {/* Row 2: Resource metrics - show '-' if no data available */}
      <div className="glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-muted-foreground">CPUs</span>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {hasData ? formatStat(stats.totalCPUs) : '-'}
        </div>
        <div className="text-xs text-muted-foreground">cores</div>
      </div>
      <div className="glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MemoryStick className="w-5 h-5 text-green-400" />
          <span className="text-sm text-muted-foreground">Memory</span>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {formatMemoryStat(stats.totalMemoryGB, hasData)}
        </div>
        <div className="text-xs text-muted-foreground">allocatable</div>
      </div>
      <div className="glass p-4 rounded-lg" title="Ephemeral storage capacity">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-muted-foreground">Storage</span>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {formatMemoryStat(stats.totalStorageGB, hasData)}
        </div>
        <div className="text-xs text-muted-foreground">ephemeral</div>
      </div>
      <div className="glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-muted-foreground">GPUs</span>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {hasData ? formatStat(stats.totalGPUs) : '-'}
        </div>
        <div className="text-xs text-muted-foreground">
          {hasData && stats.allocatedGPUs > 0 ? `${formatStat(stats.allocatedGPUs)} allocated` : 'total'}
        </div>
      </div>
      <div className="glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-muted-foreground">Pods</span>
        </div>
        <div className="text-3xl font-bold text-foreground">
          {hasData ? formatStat(stats.totalPods) : '-'}
        </div>
        <div className="text-xs text-muted-foreground">running</div>
      </div>
    </div>
  )
}
