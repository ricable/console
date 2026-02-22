import { useTranslation } from 'react-i18next'
import { Globe, Cloud, Server, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useFederationStatus } from '../../hooks/useAgentSwarm'
import { useCardLoadingState } from '../cards/CardDataContext'
import { CardWrapper } from '../cards/CardWrapper'

export function FederationStatusCard() {
  const { t } = useTranslation('cards')
  const { federation, isLoading, isRefreshing, isDemoFallback, isFailed, consecutiveFailures, refetch } =
    useFederationStatus()

  useCardLoadingState({
    isLoading,
    isRefreshing,
    isDemoData: isDemoFallback,
    hasAnyData: federation.connected,
    isFailed,
    consecutiveFailures,
  })

  const formatLastSync = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <CardWrapper
      title={t('Federation Status', { defaultMessage: 'Federation Status' })}
      className="federation-status-card"
      onRefresh={refetch}
    >
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <div className="flex items-center gap-3">
            <Globe className={`w-5 h-5 ${federation.connected ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm font-medium text-gray-200">Connection</span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            federation.connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {federation.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Cluster Counts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-center">
            <Server className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-200">{federation.edgeCount}</p>
            <p className="text-xs text-gray-400">Edge</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-center">
            <Cloud className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-200">{federation.regionCount}</p>
            <p className="text-xs text-gray-400">Region</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-center">
            <Globe className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-200">{federation.cloudCount}</p>
            <p className="text-xs text-gray-400">Cloud</p>
          </div>
        </div>

        {/* Sync Status */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sync Status</p>
          {Object.entries(federation.syncStatus).slice(0, 5).map(([cluster, status]) => (
            <div key={cluster} className="flex items-center justify-between p-2 rounded bg-gray-800/30">
              <span className="text-sm text-gray-300">{cluster}</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-400">{status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Last Sync */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <RefreshCw className="w-3 h-3" />
            <span>Last sync:</span>
          </div>
          <span className="text-xs text-gray-300">{formatLastSync(federation.lastSync)}</span>
        </div>
      </div>
    </CardWrapper>
  )
}
