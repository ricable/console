import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Scale,
  RefreshCw,
  Trash2,
  Eye,
} from 'lucide-react'
import { useAgentList } from '../../hooks/useAgentSwarm'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import { Skeleton } from '../ui/Skeleton'

type SortField = 'name' | 'domain' | 'type' | 'runtime' | 'replicas' | 'status' | 'autonomy'
type SortDirection = 'asc' | 'desc'

interface AgentSwarmTableProps {
  onAgentSelect?: (agent: any) => void
  onScale?: (agent: any) => void
  onRestart?: (agent: any) => void
  onDelete?: (agent: any) => void
}

export function AgentSwarmTable({
  onAgentSelect,
  onScale,
  onRestart,
  onDelete,
}: AgentSwarmTableProps) {
  const { t } = useTranslation('cards')
  const { agents, isLoading, refetch } = useAgentList()

  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterDomain, setFilterDomain] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    )
  }

  const filteredAndSortedAgents = useMemo(() => {
    let result = [...agents]

    // Filter
    if (filterDomain) {
      result = result.filter((a) => a.domain === filterDomain)
    }
    if (filterStatus) {
      result = result.filter((a) => a.status === filterStatus)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'domain':
          comparison = a.domain.localeCompare(b.domain)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'runtime':
          comparison = a.runtime.localeCompare(b.runtime)
          break
        case 'replicas':
          comparison = a.replicas - b.replicas
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'autonomy':
          comparison = a.autonomy - b.autonomy
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [agents, sortField, sortDirection, filterDomain, filterStatus])

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'success'
      case 'failed':
      case 'error':
        return 'destructive'
      case 'pending':
      case 'creating':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'domain', label: 'Domain', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'runtime', label: 'Runtime', sortable: true },
    { key: 'replicas', label: 'Replicas', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'autonomy', label: 'Autonomy', sortable: true },
    { key: 'cluster', label: 'Cluster', sortable: false },
    { key: 'actions', label: '', sortable: false },
  ]

  const domains = [...new Set(agents.map((a) => a.domain))]
  const statuses = [...new Set(agents.map((a) => a.status))]

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/50 overflow-hidden">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Domain:</span>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:text-gray-200' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key as SortField)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && getSortIcon(col.key as SortField)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredAndSortedAgents.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  No agents found
                </td>
              </tr>
            ) : (
              filteredAndSortedAgents.map((agent) => (
                <tr key={agent.name} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-200">{agent.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{agent.domain}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{agent.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <Badge variant="outline">{agent.runtime}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{agent.replicas}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(agent.status)}>{agent.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${agent.autonomy}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{agent.autonomy}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{agent.cluster}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem
                          onClick={() => onAgentSelect?.(agent)}
                          className="text-gray-200 focus:bg-gray-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onScale?.(agent)}
                          className="text-gray-200 focus:bg-gray-700"
                        >
                          <Scale className="w-4 h-4 mr-2" />
                          Scale
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRestart?.(agent)}
                          className="text-gray-200 focus:bg-gray-700"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Restart
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(agent)}
                          className="text-red-400 focus:bg-gray-700 focus:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
