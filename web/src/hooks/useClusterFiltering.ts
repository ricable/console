import { useMemo, useState } from 'react'

type HealthFilter = 'all' | 'healthy' | 'unhealthy' | 'unreachable'
type SortField = 'name' | 'nodes' | 'pods' | 'health'

interface Cluster {
  name: string
  context?: string
  server?: string
  user?: string
  healthy?: boolean
  nodeCount?: number
  podCount?: number
}

interface UseClusterFilteringOptions<T extends Cluster> {
  clusters: T[]
  globalSelectedClusters?: string[]
  isAllClustersSelected?: boolean
  isClusterUnreachable?: (cluster: T) => boolean
  initialFilter?: HealthFilter
  initialSortBy?: SortField
  initialSortAsc?: boolean
}

interface UseClusterFilteringReturn<T extends Cluster> {
  // State
  filter: HealthFilter
  sortBy: SortField
  sortAsc: boolean
  customFilter: string
  
  // Actions
  setFilter: (filter: HealthFilter) => void
  setSortBy: (sortBy: SortField) => void
  setSortAsc: (sortAsc: boolean) => void
  setCustomFilter: (filter: string) => void
  
  // Derived data
  filteredClusters: T[]
  globalFilteredClusters: T[]
}

/**
 * Custom hook for managing cluster filtering, sorting, and searching.
 * Handles health-based filters, text search, global cluster selection, and multi-field sorting.
 * 
 * @param options - Configuration options including clusters and filter functions
 * @returns Filter state, actions, and filtered cluster lists
 */
export function useClusterFiltering<T extends Cluster>(
  options: UseClusterFilteringOptions<T>
): UseClusterFilteringReturn<T> {
  const {
    clusters,
    globalSelectedClusters = [],
    isAllClustersSelected = true,
    isClusterUnreachable = () => false,
    initialFilter = 'all',
    initialSortBy = 'name',
    initialSortAsc = true,
  } = options

  const [filter, setFilter] = useState<HealthFilter>(initialFilter)
  const [sortBy, setSortBy] = useState<SortField>(initialSortBy)
  const [sortAsc, setSortAsc] = useState(initialSortAsc)
  const [customFilter, setCustomFilter] = useState('')

  // Apply global cluster filter and text search (no health filter)
  const globalFilteredClusters = useMemo(() => {
    let result = clusters

    // Apply global cluster filter
    if (!isAllClustersSelected) {
      result = result.filter(c => globalSelectedClusters.includes(c.name))
    }

    // Apply custom text filter
    if (customFilter.trim()) {
      const query = customFilter.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.context?.toLowerCase().includes(query) ||
        c.server?.toLowerCase().includes(query) ||
        c.user?.toLowerCase().includes(query)
      )
    }

    return result
  }, [clusters, globalSelectedClusters, isAllClustersSelected, customFilter])

  // Apply all filters including health filter and sorting
  const filteredClusters = useMemo(() => {
    let result = globalFilteredClusters

    // Apply local health filter
    // Unreachable = no nodes (can't connect)
    // Healthy = has nodes and healthy flag is true
    // Unhealthy = has nodes but healthy flag is false
    if (filter === 'healthy') {
      result = result.filter(c => !isClusterUnreachable(c) && c.healthy)
    } else if (filter === 'unhealthy') {
      result = result.filter(c => !isClusterUnreachable(c) && !c.healthy)
    } else if (filter === 'unreachable') {
      result = result.filter(c => isClusterUnreachable(c))
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'nodes':
          cmp = (a.nodeCount || 0) - (b.nodeCount || 0)
          break
        case 'pods':
          cmp = (a.podCount || 0) - (b.podCount || 0)
          break
        case 'health':
          const aHealth = isClusterUnreachable(a) ? 0 : a.healthy ? 2 : 1
          const bHealth = isClusterUnreachable(b) ? 0 : b.healthy ? 2 : 1
          cmp = aHealth - bHealth
          break
      }
      return sortAsc ? cmp : -cmp
    })

    return result
  }, [globalFilteredClusters, filter, sortBy, sortAsc, isClusterUnreachable])

  return {
    filter,
    sortBy,
    sortAsc,
    customFilter,
    setFilter,
    setSortBy,
    setSortAsc,
    setCustomFilter,
    filteredClusters,
    globalFilteredClusters,
  }
}
