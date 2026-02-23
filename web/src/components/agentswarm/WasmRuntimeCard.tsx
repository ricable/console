import { useTranslation } from 'react-i18next'
import { Zap, Cpu, Layers, CheckCircle2 } from 'lucide-react'
import { useWasmRuntime } from '../../hooks/useAgentSwarm'
import { useCardLoadingState } from '../cards/CardDataContext'
import { CardWrapper } from '../cards/CardWrapper'
import { Badge } from '../ui/Badge'

export function WasmRuntimeCard() {
  const { t } = useTranslation('cards')
  const { runtimes, isLoading, isDemoFallback, isFailed, consecutiveFailures, refetch } =
    useWasmRuntime()

  useCardLoadingState({
    isLoading,
    isDemoData: isDemoFallback,
    hasAnyData: runtimes.length > 0,
    isFailed,
    consecutiveFailures,
  })

  const getRuntimeIcon = (type: string) => {
    switch (type) {
      case 'spin':
        return <Zap className="w-5 h-5 text-orange-400" />
      case 'wasmedge':
        return <Cpu className="w-5 h-5 text-purple-400" />
      case 'crun-wasm':
        return <Layers className="w-5 h-5 text-blue-400" />
      default:
        return <Cpu className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <CardWrapper
      cardType="wasm-runtime"
      title={t('WASM Runtime', 'WASM Runtime Health')}
      onRefresh={refetch}
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          runtimes.map((runtime) => (
            <div
              key={runtime.name}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-700/50">
                  {getRuntimeIcon(runtime.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">{runtime.name}</p>
                  <p className="text-xs text-gray-400">
                    v{runtime.version} · {runtime.cluster}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <Badge variant="success">Ready</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {runtime.agentCount} agents · {runtime.podCount} pods
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </CardWrapper>
  )
}
