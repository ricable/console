import { useState, useMemo, useCallback } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Bot,
  Server,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react'
import { useAlerts } from '../../hooks/useAlerts'
import { useGlobalFilters, type SeverityLevel } from '../../hooks/useGlobalFilters'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useMissions } from '../../hooks/useMissions'
import { getSeverityIcon } from '../../types/alerts'
import type { Alert, AlertSeverity, AlertStats } from '../../types/alerts'
import { CardControls } from '../ui/CardControls'
import { Pagination } from '../ui/Pagination'
import { useCardData, CardClusterFilter, CardSearchInput, CardAIActions } from '../../lib/cards'
import { useCardLoadingState, useCardDemoState } from './CardDataContext'

// Demo data for offline/demo mode
function getDemoAlerts(): { activeAlerts: Alert[]; acknowledgedAlerts: Alert[]; stats: AlertStats } {
  const now = new Date()
  const activeAlerts: Alert[] = [
    {
      id: 'demo-alert-1',
      ruleId: 'rule-gpu-critical',
      ruleName: 'GPU Usage Critical',
      severity: 'critical',
      status: 'firing',
      message: 'GPU allocation has exceeded 90% on vllm-gpu-cluster for 5 minutes',
      details: { gpuUsage: 95, threshold: 90 },
      cluster: 'vllm-gpu-cluster',
      namespace: 'ml-workloads',
      resource: 'gpu-node-001',
      resourceKind: 'Node',
      firedAt: new Date(now.getTime() - 15 * 60000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-alert-2',
      ruleId: 'rule-pod-crash',
      ruleName: 'Pod CrashLooping',
      severity: 'warning',
      status: 'firing',
      message: 'Pod api-server-7d8f9c6b5-x2k4m is in CrashLoopBackOff state',
      details: { restartCount: 5 },
      cluster: 'eks-prod-us-east-1',
      namespace: 'production',
      resource: 'api-server-7d8f9c6b5-x2k4m',
      resourceKind: 'Pod',
      firedAt: new Date(now.getTime() - 45 * 60000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-alert-3',
      ruleId: 'rule-memory-pressure',
      ruleName: 'Memory Pressure',
      severity: 'warning',
      status: 'firing',
      message: 'Node memory usage is above 85% on worker-node-03',
      details: { memoryUsage: 88, threshold: 85 },
      cluster: 'gke-staging',
      namespace: undefined,
      resource: 'worker-node-03',
      resourceKind: 'Node',
      firedAt: new Date(now.getTime() - 120 * 60000).toISOString(),
      isDemo: true,
    },
    {
      id: 'demo-alert-4',
      ruleId: 'rule-disk-space',
      ruleName: 'Disk Space Low',
      severity: 'info',
      status: 'firing',
      message: 'Available disk space is below 20% on storage-node-02',
      details: { diskUsage: 82, threshold: 80 },
      cluster: 'openshift-prod',
      namespace: undefined,
      resource: 'storage-node-02',
      resourceKind: 'Node',
      firedAt: new Date(now.getTime() - 240 * 60000).toISOString(),
      isDemo: true,
    },
  ]

  const acknowledgedAlerts: Alert[] = [
    {
      id: 'demo-alert-ack-1',
      ruleId: 'rule-node-ready',
      ruleName: 'Node Not Ready',
      severity: 'critical',
      status: 'firing',
      message: 'Node compute-node-05 is not ready',
      details: {},
      cluster: 'eks-prod-us-east-1',
      namespace: undefined,
      resource: 'compute-node-05',
      resourceKind: 'Node',
      firedAt: new Date(now.getTime() - 360 * 60000).toISOString(),
      acknowledgedAt: new Date(now.getTime() - 300 * 60000).toISOString(),
      acknowledgedBy: 'demo-user',
      isDemo: true,
    },
  ]

  const stats: AlertStats = {
    total: activeAlerts.length + acknowledgedAlerts.length,
    firing: activeAlerts.length,
    resolved: 0,
    critical: activeAlerts.filter(a => a.severity === 'critical').length,
    warning: activeAlerts.filter(a => a.severity === 'warning').length,
    info: activeAlerts.filter(a => a.severity === 'info').length,
    acknowledged: acknowledgedAlerts.length,
  }

  return { activeAlerts, acknowledgedAlerts, stats }
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

type SortField = 'severity' | 'time'

export function ActiveAlerts() {
  const { shouldUseDemoData } = useCardDemoState({ requires: 'agent' })
  
  // Get alerts from hook or demo data
  const { activeAlerts: liveActiveAlerts, acknowledgedAlerts: liveAcknowledgedAlerts, stats: liveStats, acknowledgeAlert, runAIDiagnosis } = useAlerts()
  const demoData = useMemo(() => getDemoAlerts(), [])
  
  const activeAlerts = shouldUseDemoData ? demoData.activeAlerts : liveActiveAlerts
  const acknowledgedAlerts = shouldUseDemoData ? demoData.acknowledgedAlerts : liveAcknowledgedAlerts
  const stats = shouldUseDemoData ? demoData.stats : liveStats
  
  const { selectedSeverities, isAllSeveritiesSelected, customFilter } = useGlobalFilters()

  // Report state to CardWrapper for refresh animation
  useCardLoadingState({
    isLoading: false,
    hasAnyData: true,
  })
  const { open } = useDrillDown()
  const { missions, setActiveMission, openSidebar } = useMissions()

  const [showAcknowledged, setShowAcknowledged] = useState(false)

  // Combine active and acknowledged alerts when toggle is on
  const allAlertsToShow = useMemo(() => {
    if (showAcknowledged) {
      return [...activeAlerts, ...acknowledgedAlerts]
    }
    return activeAlerts
  }, [activeAlerts, acknowledgedAlerts, showAcknowledged])

  // Map AlertSeverity to global SeverityLevel for filtering
  const mapAlertSeverityToGlobal = (alertSeverity: AlertSeverity): SeverityLevel[] => {
    switch (alertSeverity) {
      case 'critical': return ['critical']
      case 'warning': return ['warning']
      case 'info': return ['info']
      default: return ['info']
    }
  }

  // Pre-filter by severity and global custom filter (these are outside useCardData)
  const severityFilteredAlerts = useMemo(() => {
    let result = allAlertsToShow

    // Apply global severity filter
    if (!isAllSeveritiesSelected) {
      result = result.filter(a => {
        const mappedSeverities = mapAlertSeverityToGlobal(a.severity)
        return mappedSeverities.some(s => selectedSeverities.includes(s))
      })
    }

    // Apply global custom text filter
    if (customFilter.trim()) {
      const query = customFilter.toLowerCase()
      result = result.filter(a =>
        a.ruleName.toLowerCase().includes(query) ||
        a.message.toLowerCase().includes(query) ||
        (a.cluster?.toLowerCase() || '').includes(query)
      )
    }

    return result
  }, [allAlertsToShow, selectedSeverities, isAllSeveritiesSelected, customFilter])

  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }

  // Use shared card data hook for filtering, sorting, and pagination
  const {
    items: displayedAlerts,
    totalItems,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    needsPagination,
    setItemsPerPage,
    filters: {
      search: localSearch,
      setSearch: setLocalSearch,
      localClusterFilter,
      toggleClusterFilter,
      clearClusterFilter,
      availableClusters: availableClustersForFilter,
      showClusterFilter,
      setShowClusterFilter,
      clusterFilterRef,
    },
    sorting: {
      sortBy,
      setSortBy,
    },
  } = useCardData<Alert, SortField>(severityFilteredAlerts, {
    filter: {
      searchFields: ['ruleName', 'message', 'cluster'],
      clusterField: 'cluster',
      storageKey: 'active-alerts',
    },
    sort: {
      defaultField: 'severity',
      defaultDirection: 'asc',
      comparators: {
        severity: (a, b) => {
          const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
          if (severityDiff !== 0) return severityDiff
          return new Date(b.firedAt).getTime() - new Date(a.firedAt).getTime()
        },
        time: (a, b) => new Date(b.firedAt).getTime() - new Date(a.firedAt).getTime(),
      },
    },
    defaultLimit: 5,
  })

  const handleAlertClick = (alert: Alert) => {
    if (alert.cluster) {
      open({
        type: 'cluster',
        title: alert.cluster,
        data: { name: alert.cluster, alert },
      })
    }
  }

  const handleAIDiagnose = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation()
    runAIDiagnosis(alertId)
  }

  const handleAcknowledge = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation()
    acknowledgeAlert(alertId)
  }

  // Check if a mission exists for an alert
  const getMissionForAlert = useCallback((alert: Alert) => {
    if (!alert.aiDiagnosis?.missionId) return null
    return missions.find(m => m.id === alert.aiDiagnosis?.missionId) || null
  }, [missions])

  // Open mission sidebar for an alert
  const handleOpenMission = (e: React.MouseEvent, alert: Alert) => {
    e.stopPropagation()
    const mission = getMissionForAlert(alert)
    if (mission) {
      setActiveMission(mission.id)
      openSidebar()
    }
  }

  // Severity indicator badge
  const SeverityBadge = ({ severity }: { severity: AlertSeverity }) => {
    const colors: Record<AlertSeverity, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    }

    return (
      <span
        className={`px-1.5 py-0.5 text-xs rounded border ${colors[severity]}`}
      >
        {severity}
      </span>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          {stats.firing > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              {stats.firing} firing
            </span>
          )}
          {localClusterFilter.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
              <Server className="w-3 h-3" />
              {localClusterFilter.length}/{availableClustersForFilter.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 1. Ack'd toggle */}
          <button
            onClick={() => setShowAcknowledged(!showAcknowledged)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition-colors ${
              showAcknowledged
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
            title={showAcknowledged ? 'Hide acknowledged alerts' : 'Show acknowledged alerts'}
          >
            {showAcknowledged ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Ack'd</span>
            {acknowledgedAlerts.length > 0 && (
              <span className="ml-0.5 px-1 py-0 text-[10px] rounded-full bg-green-500/30">
                {acknowledgedAlerts.length}
              </span>
            )}
          </button>
          {/* 2. Cluster Filter */}
          <CardClusterFilter
            availableClusters={availableClustersForFilter}
            selectedClusters={localClusterFilter}
            onToggle={toggleClusterFilter}
            onClear={clearClusterFilter}
            isOpen={showClusterFilter}
            setIsOpen={setShowClusterFilter}
            containerRef={clusterFilterRef}
            minClusters={1}
          />
          {/* 3. CardControls */}
          <CardControls
            limit={itemsPerPage}
            onLimitChange={setItemsPerPage}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={[
              { value: 'severity', label: 'Severity' },
              { value: 'time', label: 'Time' },
            ]}
          />
          {/* 4. RefreshButton */}
        </div>
      </div>

      {/* Local Search */}
      <CardSearchInput
        value={localSearch}
        onChange={setLocalSearch}
        placeholder="Search alerts..."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-400">Critical</span>
          </div>
          <span className="text-lg font-bold text-foreground">{stats.critical}</span>
        </div>
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-orange-400">Warning</span>
          </div>
          <span className="text-lg font-bold text-foreground">{stats.warning}</span>
        </div>
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">Ack'd</span>
          </div>
          <span className="text-lg font-bold text-foreground">{stats.acknowledged}</span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {displayedAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
            <span>No active alerts</span>
            <span className="text-xs">All systems operational</span>
          </div>
        ) : (
          displayedAlerts.map((alert: Alert) => (
            <div
              key={alert.id}
              onClick={() => handleAlertClick(alert)}
              className="p-2 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {alert.ruleName}
                    </span>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {alert.cluster && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        {alert.cluster}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(alert.firedAt)}
                    </span>
                    {getMissionForAlert(alert) && (
                      <span className="text-xs text-purple-400 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        AI
                      </span>
                    )}
                    {alert.acknowledgedAt && (
                      <span className="text-xs text-green-400">Acknowledged</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                {!alert.acknowledgedAt && (
                  <button
                    onClick={e => handleAcknowledge(e, alert.id)}
                    className="px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {(() => {
                  const mission = getMissionForAlert(alert)
                  if (mission) {
                    return (
                      <button
                        onClick={e => handleOpenMission(e, alert)}
                        className="px-2 py-1 text-xs rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Diagnosis
                      </button>
                    )
                  } else {
                    return (
                      <CardAIActions
                        resource={{ kind: 'Alert', name: alert.ruleName, cluster: alert.cluster, status: alert.severity }}
                        issues={[{ name: alert.ruleName, message: alert.message }]}
                        showRepair={false}
                        onDiagnose={e => handleAIDiagnose(e, alert.id)}
                      />
                    )
                  }
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {needsPagination && itemsPerPage !== 'unlimited' && (
        <div className="pt-2 border-t border-border/50 mt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={typeof itemsPerPage === 'number' ? itemsPerPage : 5}
            onPageChange={goToPage}
            showItemsPerPage={false}
          />
        </div>
      )}
    </div>
  )
}
