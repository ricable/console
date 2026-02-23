import { useTranslation } from 'react-i18next'
import { useAgentList } from '../../hooks/useAgentSwarm'
import { useCardLoadingState } from '../cards/CardDataContext'
import { CardWrapper } from '../cards/CardWrapper'
import { Skeleton } from '../ui/Skeleton'

export function AgentStatusCard() {
  const { t } = useTranslation('cards')
  const { agents, isLoading, isDemoFallback, isFailed, consecutiveFailures, refetch } =
    useAgentList()

  useCardLoadingState({
    isLoading,
    isDemoData: isDemoFallback,
    hasAnyData: agents.length > 0,
    isFailed,
    consecutiveFailures,
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-500'
      case 'failed':
      case 'error':
        return 'bg-red-500'
      case 'pending':
      case 'creating':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <CardWrapper
      cardType="agent-status"
      title={t('Agent Status', 'Agent Status')}
      onRefresh={refetch}
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          agents.slice(0, 5).map((agent) => (
            <div
              key={agent.name}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-200">{agent.name}</p>
                  <p className="text-xs text-gray-400">
                    {agent.domain} · {agent.cluster}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  agent.status === 'Running' ? 'bg-green-500/20 text-green-400' :
                  agent.status === 'Failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {agent.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">{agent.replicas} replicas</p>
              </div>
            </div>
          ))
        )}
        {agents.length > 5 && (
          <p className="text-xs text-gray-400 text-center">
            +{agents.length - 5} more agents
          </p>
        )}
      </div>
    </CardWrapper>
  )
}
