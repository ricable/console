import { HardDrive, Database, FolderArchive } from 'lucide-react'
import { useClusters } from '../../hooks/useMCP'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { Skeleton } from '../ui/Skeleton'

export function Storage() {
  const { clusters, isLoading } = useClusters()
  const {
    selectedClusters: globalSelectedClusters,
    isAllClustersSelected,
  } = useGlobalFilters()

  // Filter clusters based on global selection
  const filteredClusters = clusters.filter(c =>
    isAllClustersSelected || globalSelectedClusters.includes(c.name)
  )

  // Calculate storage stats from clusters
  const totalStorageGB = filteredClusters.reduce((sum, c) => sum + (c.storageGB || 0), 0)
  const totalPVCs = filteredClusters.reduce((sum, c) => sum + (c.pvcCount || 0), 0)
  const boundPVCs = filteredClusters.reduce((sum, c) => sum + (c.pvcBoundCount || 0), 0)

  if (isLoading) {
    return (
      <div className="pt-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Storage</h1>
          <p className="text-muted-foreground">Monitor storage resources across clusters</p>
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

  // Format storage size
  const formatStorage = (gb: number) => {
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`
    }
    return `${Math.round(gb)} GB`
  }

  return (
    <div className="pt-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Storage</h1>
        <p className="text-muted-foreground">Monitor storage resources across clusters</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground">Ephemeral Storage</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{formatStorage(totalStorageGB)}</div>
          <div className="text-xs text-muted-foreground">total allocatable</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-muted-foreground">PVCs</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{totalPVCs}</div>
          <div className="text-xs text-muted-foreground">persistent volume claims</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FolderArchive className="w-5 h-5 text-green-400" />
            <span className="text-sm text-muted-foreground">Bound</span>
          </div>
          <div className="text-3xl font-bold text-green-400">{boundPVCs}</div>
          <div className="text-xs text-muted-foreground">PVCs bound</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="text-3xl font-bold text-yellow-400">{totalPVCs - boundPVCs}</div>
          <div className="text-xs text-muted-foreground">PVCs pending</div>
        </div>
      </div>

      {/* Placeholder for future cards */}
      <div className="glass p-8 rounded-lg border-2 border-dashed border-border/50 text-center">
        <HardDrive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Storage Dashboard</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Add cards to monitor PersistentVolumes, StorageClasses, and storage utilization across your clusters.
        </p>
      </div>
    </div>
  )
}
