import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Terminal, Settings, FileText, Activity } from 'lucide-react'
import { useAgentDetails } from '../../hooks/useAgentSwarm'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog'
import { Skeleton } from '../ui/Skeleton'

interface AgentDetailModalProps {
  agentName: string | null
  isOpen: boolean
  onClose: () => void
}

export function AgentDetailModal({ agentName, isOpen, onClose }: AgentDetailModalProps) {
  const { t } = useTranslation('cards')
  const [activeTab, setActiveTab] = useState('overview')

  const { agent, isLoading } = useAgentDetails(agentName || '', {
    namespace: 'wasmai-system',
  })

  if (!agentName) return null

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-100">
            Agent Details: {agentName}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : agent ? (
          <div className="space-y-4">
            {/* Header Info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-lg font-semibold text-gray-100">{agent.name}</p>
                  <p className="text-sm text-gray-400">
                    {agent.namespace} · {agent.cluster}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(agent.status)} className="text-sm">
                {agent.status}
              </Badge>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="config"
                  className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Config
                </TabsTrigger>
                <TabsTrigger
                  value="pods"
                  className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Pods ({agent.podStatus?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="data-[state=active]:bg-gray-700 data-[state=active]:text-gray-100"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Events ({agent.events?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                    <p className="text-xs text-gray-400 mb-1">Domain</p>
                    <p className="text-sm font-medium text-gray-200">{agent.domain}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                    <p className="text-xs text-gray-400 mb-1">Type</p>
                    <p className="text-sm font-medium text-gray-200">{agent.type}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                    <p className="text-xs text-gray-400 mb-1">Runtime</p>
                    <p className="text-sm font-medium text-gray-200">{agent.runtime}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                    <p className="text-xs text-gray-400 mb-1">Replicas</p>
                    <p className="text-sm font-medium text-gray-200">{agent.replicas}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30 col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Autonomy Level</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${agent.autonomy}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-200">{agent.autonomy}%</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Config Tab */}
              <TabsContent value="config" className="space-y-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Labels</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(agent.labels || {}).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                    {Object.keys(agent.labels || {}).length === 0 && (
                      <p className="text-sm text-gray-500">No labels</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Annotations</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(agent.annotations || {}).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                    {Object.keys(agent.annotations || {}).length === 0 && (
                      <p className="text-sm text-gray-500">No annotations</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Pods Tab */}
              <TabsContent value="pods" className="mt-4">
                <div className="space-y-2">
                  {(agent.podStatus || []).map((pod) => (
                    <div
                      key={pod.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-200">{pod.name}</p>
                        <p className="text-xs text-gray-400">
                          {pod.node} · {pod.age}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            pod.phase === 'Running'
                              ? 'success'
                              : pod.phase === 'Failed'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {pod.phase}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          Ready: {pod.ready} · Restarts: {pod.restarts}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!agent.podStatus || agent.podStatus.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No pods found</p>
                  )}
                </div>
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="mt-4">
                <div className="space-y-2">
                  {(agent.events || []).map((event, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        event.type === 'Warning'
                          ? 'bg-red-900/10 border-red-800/30'
                          : 'bg-gray-800/30 border-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={event.type === 'Warning' ? 'destructive' : 'secondary'}
                        >
                          {event.type}
                        </Badge>
                        <span className="text-xs text-gray-400">{event.age}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-200 mt-1">{event.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">{event.message}</p>
                    </div>
                  ))}
                  {(!agent.events || agent.events.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No events found</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">Agent not found</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
