import { useMemo, useState, useRef, useEffect } from 'react'
import { CheckCircle, AlertTriangle, WifiOff, AlertCircle, Server, Bell, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../../hooks/useAlerts'
import { useClusters } from '../../hooks/useMCP'
import { isClusterUnreachable } from '../clusters/utils'
import { cn } from '../../lib/cn'

interface DashboardHealthIndicatorProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
  /** Enable click-to-navigate behavior */
  interactive?: boolean
}

/**
 * Dashboard Health Indicator - Shows overall system health status
 * Displays cluster connectivity and active alerts count
 */
export function DashboardHealthIndicator({
  className,
  showLabel = true,
  size = 'sm',
  interactive = true,
}: DashboardHealthIndicatorProps) {
  const navigate = useNavigate()
  const { stats: alertStats } = useAlerts()
  const { deduplicatedClusters: clusters } = useClusters()
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close tooltip on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTooltip(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Navigate to relevant page based on health status
  const handleNavigate = (target: 'clusters' | 'alerts') => {
    setShowTooltip(false)
    if (target === 'clusters') {
      navigate('/clusters')
    } else {
      // Navigate to dashboard with alerts card scrolled into view
      navigate('/?scrollTo=alerts')
    }
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        className={cn(
          'inline-flex items-center gap-1.5 rounded border font-medium transition-all',
          health.colorClasses,
          padding,
          textSize,
          interactive && 'cursor-pointer hover:opacity-80',
          className
        )}
        onClick={() => interactive && setShowTooltip(!showTooltip)}
        onMouseEnter={() => interactive && setShowTooltip(true)}
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
      </button>

      {/* Detailed hover tooltip */}
      {showTooltip && interactive && (
        <div
          ref={tooltipRef}
          className="absolute top-full left-0 mt-2 z-50 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl animate-fade-in-up"
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Header */}
          <div className={cn('px-3 py-2 border-b border-slate-700 rounded-t-lg', health.colorClasses.replace('text-', 'bg-').split(' ')[1])}>
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{health.message}</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="p-3 space-y-2">
            {/* Clusters row */}
            <button
              onClick={() => handleNavigate('clusters')}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-700/50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Clusters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-medium',
                  health.metrics.unreachableClusters > 0 ? 'text-red-400' : 'text-green-400'
                )}>
                  {health.metrics.healthyClusters}/{health.metrics.totalClusters}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
            </button>

            {/* Critical alerts row */}
            {health.metrics.criticalAlerts > 0 && (
              <button
                onClick={() => handleNavigate('alerts')}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-700/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-slate-300">Critical Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-400">
                    {health.metrics.criticalAlerts}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
              </button>
            )}

            {/* Warning alerts row */}
            {health.metrics.warningAlerts > 0 && (
              <button
                onClick={() => handleNavigate('alerts')}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-700/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-slate-300">Warning Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-400">
                    {health.metrics.warningAlerts}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
              </button>
            )}

            {/* All healthy message */}
            {health.status === 'healthy' && (
              <div className="flex items-center gap-2 p-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>No issues detected</span>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-slate-700 text-[10px] text-slate-500">
            Click a row to navigate
          </div>
        </div>
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
