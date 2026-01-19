import { Globe, Network as NetworkIcon, Shield, Workflow } from 'lucide-react'
import { useServices } from '../../hooks/useMCP'
import { useGlobalFilters } from '../../hooks/useGlobalFilters'
import { Skeleton } from '../ui/Skeleton'

export function Network() {
  const { services, isLoading: servicesLoading } = useServices()
  const {
    selectedClusters: globalSelectedClusters,
    isAllClustersSelected,
  } = useGlobalFilters()

  const isLoading = servicesLoading

  // Filter services based on global cluster selection
  const filteredServices = services.filter(s =>
    isAllClustersSelected || (s.cluster && globalSelectedClusters.includes(s.cluster))
  )

  // Calculate service stats
  const loadBalancers = filteredServices.filter(s => s.type === 'LoadBalancer').length
  const nodePortServices = filteredServices.filter(s => s.type === 'NodePort').length
  const clusterIPServices = filteredServices.filter(s => s.type === 'ClusterIP').length

  if (isLoading) {
    return (
      <div className="pt-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Network</h1>
          <p className="text-muted-foreground">Monitor network resources across clusters</p>
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

  return (
    <div className="pt-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Network</h1>
        <p className="text-muted-foreground">Monitor network resources across clusters</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Workflow className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-muted-foreground">Services</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{filteredServices.length}</div>
          <div className="text-xs text-muted-foreground">total services</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-green-400" />
            <span className="text-sm text-muted-foreground">LoadBalancers</span>
          </div>
          <div className="text-3xl font-bold text-green-400">{loadBalancers}</div>
          <div className="text-xs text-muted-foreground">external access</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <NetworkIcon className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-muted-foreground">NodePort</span>
          </div>
          <div className="text-3xl font-bold text-yellow-400">{nodePortServices}</div>
          <div className="text-xs text-muted-foreground">node-level access</div>
        </div>
        <div className="glass p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground">ClusterIP</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">{clusterIPServices}</div>
          <div className="text-xs text-muted-foreground">internal only</div>
        </div>
      </div>

      {/* Placeholder for future cards */}
      <div className="glass p-8 rounded-lg border-2 border-dashed border-border/50 text-center">
        <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Network Dashboard</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Add cards to monitor Ingresses, NetworkPolicies, and service mesh configurations across your clusters.
        </p>
      </div>
    </div>
  )
}
