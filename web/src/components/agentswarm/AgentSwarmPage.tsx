import { useState, useCallback } from 'react'
import { useAgentSwarmSummary, useAgentList } from '../../hooks/useAgentSwarm'
import type { StatBlockValue } from '../ui/StatsOverview'
import { DashboardPage } from '../../lib/dashboards/DashboardPage'
import { useTranslation } from 'react-i18next'
import { AgentSwarmTable } from './AgentSwarmTable'
import { AgentDetailModal } from './AgentDetailModal'
import { QuickActions } from './QuickActions'

const AGENT_SWARM_CARDS_KEY = 'kubestellar-agentswarm-cards'

const DEFAULT_AGENT_SWARM_CARDS = [
  { type: 'SwarmOverviewCard' },
  { type: 'AgentStatusCard' },
  { type: 'WasmRuntimeCard' },
  { type: 'FederationStatusCard' },
]

export function AgentSwarmPage() {
  const { t } = useTranslation('common')
  const { summary, isLoading: summaryLoading, refetch: summaryRefetch } = useAgentSwarmSummary()
  const { refetch: agentsRefetch } = useAgentList()
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const hasData = summary.totalAgents > 0
  const isDemoData = !hasData && !summaryLoading

  const handleRefresh = useCallback(() => {
    summaryRefetch()
    agentsRefetch()
  }, [summaryRefetch, agentsRefetch])

  const handleAgentSelect = useCallback((agent: any) => {
    setSelectedAgent(agent)
    setDetailModalOpen(true)
  }, [])

  const handleScale = useCallback((agent: any) => {
    console.log('Scale agent:', agent.name)
    // TODO: Open scale modal
  }, [])

  const handleRestart = useCallback((agent: any) => {
    console.log('Restart agent:', agent.name)
    // TODO: Open restart modal
  }, [])

  const handleDelete = useCallback((agent: any) => {
    console.log('Delete agent:', agent.name)
    // TODO: Open delete confirmation
  }, [])

  const getDashboardStatValue = useCallback((blockId: string): StatBlockValue => {
    if (!summary) return { value: '-' }
    switch (blockId) {
      case 'total-agents':
        return { value: summary.totalAgents, sublabel: 'Total Agents', isClickable: false, isDemo: isDemoData }
      case 'running-agents':
        return { value: summary.runningAgents, sublabel: 'Running', isClickable: false, isDemo: isDemoData }
      case 'failed-agents':
        return { value: summary.failedAgents, sublabel: 'Failed', isClickable: false, isDemo: isDemoData }
      case 'total-pods':
        return { value: summary.totalPods, sublabel: 'Total Pods', isClickable: false, isDemo: isDemoData }
      default:
        return { value: '-' }
    }
  }, [summary, isDemoData])

  return (
    <DashboardPage
      title={t('agentSwarm.title', 'Agent Swarm')}
      subtitle={t('agentSwarm.subtitle', 'Manage WASM agents across edge clusters')}
      icon="Bot"
      storageKey={AGENT_SWARM_CARDS_KEY}
      defaultCards={DEFAULT_AGENT_SWARM_CARDS}
      statsType="ai-agents"
      getStatValue={getDashboardStatValue}
      onRefresh={handleRefresh}
      isLoading={summaryLoading}
      isRefreshing={false}
      lastUpdated={null}
      hasData={hasData}
      isDemoData={isDemoData}
      emptyState={{
        title: t('agentSwarm.emptyTitle', 'No Agents Found'),
        description: t('agentSwarm.emptyDesc', 'Deploy your first WASM agent to get started'),
      }}
    >
      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions selectedAgents={[]} onRefresh={handleRefresh} />
      </div>

      {/* Agent Table */}
      <AgentSwarmTable
        onAgentSelect={handleAgentSelect}
        onScale={handleScale}
        onRestart={handleRestart}
        onDelete={handleDelete}
      />

      {/* Detail Modal */}
      <AgentDetailModal
        agentName={selectedAgent?.name || null}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />
    </DashboardPage>
  )
}

export default AgentSwarmPage
