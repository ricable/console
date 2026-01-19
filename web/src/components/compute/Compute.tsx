import { Cpu, MemoryStick, Server, Layers } from 'lucide-react'
import { useClusters } from '../../hooks/useMCP'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { Skeleton } from '../ui/Skeleton'

export function Compute() {
  const { clusters, isLoading } = useClusters()
  const {
    selectedClusters: globalSelectedClusters,
    isAllClustersSelected,
  } = useGlobalFilters()

  // Filter clusters based on global selection
  const filteredClusters = clusters.filter(c =>
    isAllClustersSelected || globalSelectedClusters.includes(c.name)
  )

  // Calculate compute stats from clusters
  const totalCPUs = filteredClusters.reduce((sum, c) => sum + (c.cpuCores || 0), 0)
  const totalMemoryGB = filteredClusters.reduce((sum, c) => sum + (c.memoryGB || 0), 0)
  const totalNodes = filteredClusters.reduce((sum, c) => sum + (c.nodeCount || 0), 0)
  const totalPods = filteredClusters.reduce((sum, c) => sum + (c.podCount || 0), 0)

  if (isLoading) {
    return (
      <div className="pt-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Compute</h1>
          <p className="text-muted-foreground">Monitor compute resources across clusters</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass p-4 rounded-lg">
              <Skeleton variant="text" width={60} height={36} className="mb-1" />
              <Skeleton variant="text" width={100} height={16} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Format memory size
  const formatMemory = (gb: number) => {
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`
    }
    return `${Math.round(gb)} GB`
  }

  return (
    <div className="pt-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Compute</h1>
        <p className="text-muted-foreground">Monitor compute resources across clusters</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-muted-foreground">CPU</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{totalCPUs}</div>
          <div className="text-xs text-muted-foreground">cores allocatable</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="w-5 h-5 text-green-400" />
            <span className="text-sm text-muted-foreground">Memory</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{formatMemory(totalMemoryGB)}</div>
          <div className="text-xs text-muted-foreground">allocatable</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-muted-foreground">Nodes</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{totalNodes}</div>
          <div className="text-xs text-muted-foreground">total nodes</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground">Pods</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{totalPods}</div>
          <div className="text-xs text-muted-foreground">running pods</div>
        </div>
      </div>

      {/* Placeholder for future cards */}
      <div className="glass p-8 rounded-lg border-2 border-dashed border-border/50 text-center">
        <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Compute Dashboard</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Add cards to monitor CPU and memory utilization, node health, and resource quotas across your clusters.
        </p>
      </div>
    </div>
  )
}
