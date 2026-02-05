import { useMemo } from 'react'
import { CheckCircle, AlertTriangle, WifiOff, AlertCircle } from 'lucide-react'
import { useAlerts } from '../../hooks/useAlerts'
import { useClusters } from '../../hooks/useMCP'
import { isClusterUnreachable } from '../clusters/utils'
import { cn } from '../../lib/cn'

interface DashboardHealthIndicatorProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

/**
 * Dashboard Health Indicator - Shows overall system health status
 * Displays cluster connectivity and active alerts count
 */
export function DashboardHealthIndicator({
  className,
  showLabel = true,
  size = 'sm',
}: DashboardHealthIndicatorProps) {
  const { stats: alertStats } = useAlerts()
  const { deduplicatedClusters: clusters } = useClusters()

  // Calculate health metrics
  const health = useMemo(() => {
    const unreachableClusters = clusters.filter(c => isClusterUnreachable(c)).length
    const totalClusters = clusters.length
    const healthyClusters = clusters.filter(c => !isClusterUnreachable(c) && c.healthy).length
    const criticalAlerts = alertStats.critical
    const warningAlerts = alertStats.warning

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'critical' | 'offline' = 'healthy'
    let message = 'All systems operational'
    let icon = CheckCircle
    let colorClasses = 'text-green-400 bg-green-500/10 border-green-500/30'

    if (totalClusters === 0) {
      status = 'offline'
      message = 'No clusters configured'
      icon = WifiOff
      colorClasses = 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    } else if (unreachableClusters === totalClusters) {
      status = 'offline'
      message = `All ${totalClusters} clusters offline`
      icon = WifiOff
      colorClasses = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    } else if (criticalAlerts > 0 || unreachableClusters > 0) {
      status = 'critical'
      const issues = []
      if (criticalAlerts > 0) issues.push(`${criticalAlerts} critical alerts`)
      if (unreachableClusters > 0) issues.push(`${unreachableClusters} clusters offline`)
      message = issues.join(', ')
      icon = AlertCircle
      colorClasses = 'text-red-400 bg-red-500/10 border-red-500/30'
    } else if (warningAlerts > 0) {
      status = 'degraded'
      message = `${warningAlerts} warning alerts`
      icon = AlertTriangle
      colorClasses = 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    }

    return {
      status,
      message,
      icon,
      colorClasses,
      metrics: {
        healthyClusters,
        totalClusters,
        unreachableClusters,
        criticalAlerts,
        warningAlerts,
      },
    }
  }, [clusters, alertStats])

  const Icon = health.icon
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'

  // Build detailed tooltip
  const tooltip = [
    health.message,
    `Clusters: ${health.metrics.healthyClusters}/${health.metrics.totalClusters} healthy`,
    health.metrics.criticalAlerts > 0 && `Critical alerts: ${health.metrics.criticalAlerts}`,
    health.metrics.warningAlerts > 0 && `Warning alerts: ${health.metrics.warningAlerts}`,
  ].filter(Boolean).join('\n')

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded border font-medium',
        health.colorClasses,
        padding,
        textSize,
        className
      )}
      title={tooltip}
    >
      <Icon className={iconSize} />
      {showLabel && (
        <span className="whitespace-nowrap">
          {health.status === 'healthy' && 'Healthy'}
          {health.status === 'degraded' && 'Degraded'}
          {health.status === 'critical' && 'Critical'}
          {health.status === 'offline' && 'Offline'}
        </span>
      )}
      {(health.metrics.criticalAlerts > 0 || health.metrics.warningAlerts > 0) && showLabel && (
        <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-background/50">
          {health.metrics.criticalAlerts + health.metrics.warningAlerts}
        </span>
      )}
    </div>
  )
}

/**
 * Compact dot indicator for space-constrained areas
 */
export function DashboardHealthDot({
  className,
}: {
  className?: string
}) {
  const { stats: alertStats } = useAlerts()
  const { deduplicatedClusters: clusters } = useClusters()

  const status = useMemo(() => {
    const unreachableClusters = clusters.filter(c => isClusterUnreachable(c)).length
    const criticalAlerts = alertStats.critical

    if (clusters.length === 0 || unreachableClusters === clusters.length) {
      return 'offline'
    } else if (criticalAlerts > 0 || unreachableClusters > 0) {
      return 'critical'
    } else if (alertStats.warning > 0) {
      return 'degraded'
    }
    return 'healthy'
  }, [clusters, alertStats])

  const colorMap = {
    healthy: 'bg-green-500',
    degraded: 'bg-orange-500',
    critical: 'bg-red-500',
    offline: 'bg-gray-500',
  }

  return (
    <span
      className={cn('w-2 h-2 rounded-full', colorMap[status], className)}
      title={`System status: ${status}`}
    />
  )
}
