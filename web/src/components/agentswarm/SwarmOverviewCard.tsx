import { useTranslation } from 'react-i18next'
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Boxes,
  Activity,
} from 'lucide-react'
import { useAgentSwarmSummary } from '../../hooks/useAgentSwarm'
import { useCardLoadingState } from '../cards/CardDataContext'
import { CardWrapper } from '../cards/CardWrapper'
import { StatsGrid } from '../ui/StatsGrid'

export function SwarmOverviewCard() {
  const { t } = useTranslation('cards')
  const { summary, isLoading, isRefreshing, isDemoFallback, isFailed, consecutiveFailures, refetch } =
    useAgentSwarmSummary()

  useCardLoadingState({
    isLoading,
    isRefreshing,
    isDemoData: isDemoFallback,
    hasAnyData: summary.totalAgents > 0,
    isFailed,
    consecutiveFailures,
  })

  const stats = [
    {
      label: 'Total Agents',
      value: summary.totalAgents,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      label: 'Running',
      value: summary.runningAgents,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      label: 'Failed',
      value: summary.failedAgents,
      icon: XCircle,
      color: 'text-red-500',
    },
    {
      label: 'Pending',
      value: summary.pendingAgents,
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      label: 'Total Pods',
      value: summary.totalPods,
      icon: Boxes,
      color: 'text-purple-500',
    },
    {
      label: 'Running Pods',
      value: summary.runningPods,
      icon: Activity,
      color: 'text-emerald-500',
    },
  ]

  return (
    <CardWrapper
      title={t('Agent Swarm Overview', { defaultMessage: 'Agent Swarm Overview' })}
      className="agent-swarm-overview"
      onRefresh={refetch}
    >
      <StatsGrid stats={stats} columns={3} />
    </CardWrapper>
  )
}
