import { useState, useEffect } from 'react'
import { X, Box, Layers, Server, Network, Briefcase, Activity, Lock, Settings, FileText, Info, Terminal, Wrench } from 'lucide-react'
import { usePodLogs } from '../../hooks/useMCP'
import { useMissions } from '../../hooks/useMissions'

export interface ResourceDetailModalProps {
  resource: {
    kind: 'Pod' | 'Deployment' | 'Node' | 'Service' | 'Job' | 'HPA' | 'ConfigMap' | 'Secret'
    name: string
    namespace?: string
    cluster: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    data?: Record<string, unknown>
  }
  onClose: () => void
}

export function ResourceDetailModal({ resource, onClose }: ResourceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'describe' | 'labels' | 'logs'>('describe')
  const { startMission } = useMissions()

  const handleRepairPod = () => {
    const issues = resource.data?.issues as string[] | undefined
    const status = resource.data?.status as string | undefined
    const restarts = resource.data?.restarts as number | undefined

    startMission({
      title: `Repair ${resource.name}`,
      description: `Troubleshoot and repair pod issues`,
      type: 'troubleshoot',
      cluster: resource.cluster,
      initialPrompt: `I need help troubleshooting and repairing a Kubernetes pod that is having issues.

**Pod Details:**
- Name: ${resource.name}
- Namespace: ${resource.namespace || 'default'}
- Cluster: ${resource.cluster}
- Status: ${status || 'Unknown'}
- Restarts: ${restarts || 0}
${issues && issues.length > 0 ? `- Issues: ${issues.join(', ')}` : ''}

Please help me:
1. Diagnose what's causing this pod to fail
2. Check the pod events and logs for error messages
3. Identify the root cause
4. Suggest and implement a fix
5. Verify the pod is running correctly after the fix

Start by running diagnostic commands to understand what's happening.`,
      context: {
        podName: resource.name,
        namespace: resource.namespace,
        cluster: resource.cluster,
        status,
        restarts,
        issues,
      },
    })
    onClose()
  }

  // Fetch logs for pods
  const { logs, isLoading: logsLoading, error: logsError, refetch: refetchLogs } = usePodLogs(
    resource.cluster,
    resource.namespace || '',
    resource.kind === 'Pod' ? resource.name : '',
    undefined,
    200
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const getKindColors = () => {
    switch (resource.kind) {
      case 'Pod': return 'bg-blue-500/20 text-blue-400'
      case 'Deployment': return 'bg-purple-500/20 text-purple-400'
      case 'Node': return 'bg-cyan-500/20 text-cyan-400'
      case 'Service': return 'bg-cyan-500/20 text-cyan-400'
      case 'Job': return 'bg-amber-500/20 text-amber-400'
      case 'HPA': return 'bg-violet-500/20 text-violet-400'
      case 'ConfigMap': return 'bg-orange-500/20 text-orange-400'
      case 'Secret': return 'bg-pink-500/20 text-pink-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getKindIcon = () => {
    switch (resource.kind) {
      case 'Pod': return <Box className="w-4 h-4" />
      case 'Deployment': return <Layers className="w-4 h-4" />
      case 'Node': return <Server className="w-4 h-4" />
      case 'Service': return <Network className="w-4 h-4" />
      case 'Job': return <Briefcase className="w-4 h-4" />
      case 'HPA': return <Activity className="w-4 h-4" />
      case 'ConfigMap': return <Settings className="w-4 h-4" />
      case 'Secret': return <Lock className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass p-6 rounded-lg w-[700px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${getKindColors()}`}>
              {getKindIcon()}
              {resource.kind}
            </span>
            <span className="font-medium text-foreground">{resource.name}</span>
            {resource.namespace && <span className="text-muted-foreground text-sm">({resource.namespace})</span>}
          </div>
          <div className="flex items-center gap-2">
            {resource.kind === 'Pod' && Array.isArray(resource.data?.issues) && resource.data.issues.length > 0 && (
              <button
                onClick={handleRepairPod}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                title="Launch AI repair mission"
              >
                <Wrench className="w-4 h-4" />
                Repair Pod
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('describe')}
            className={`px-3 py-1.5 rounded-t text-sm flex items-center gap-1.5 ${activeTab === 'describe' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <FileText className="w-4 h-4" />Describe
          </button>
          <button
            onClick={() => setActiveTab('labels')}
            className={`px-3 py-1.5 rounded-t text-sm flex items-center gap-1.5 ${activeTab === 'labels' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Info className="w-4 h-4" />Labels & Annotations
          </button>
          {resource.kind === 'Pod' && (
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-t text-sm flex items-center gap-1.5 ${activeTab === 'logs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Terminal className="w-4 h-4" />Logs
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'describe' && (
            <div className="bg-secondary/50 rounded p-4 font-mono text-xs overflow-auto max-h-[400px]">
              <div className="text-muted-foreground mb-2"># kubectl describe {resource.kind.toLowerCase()} {resource.name} {resource.namespace ? `-n ${resource.namespace}` : ''}</div>
              <div className="space-y-1">
                <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{resource.name}</span></div>
                {resource.namespace && <div><span className="text-muted-foreground">Namespace:</span> <span className="text-foreground">{resource.namespace}</span></div>}
                <div><span className="text-muted-foreground">Cluster:</span> <span className="text-foreground">{resource.cluster}</span></div>
                {resource.data && Object.entries(resource.data).map(([k, v]) => (
                  <div key={k}><span className="text-muted-foreground">{k}:</span> <span className="text-foreground">{String(v)}</span></div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'labels' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Labels ({resource.labels ? Object.keys(resource.labels).length : 0})</h4>
                <div className="flex flex-wrap gap-2">
                  {resource.labels && Object.entries(resource.labels).map(([k, v]) => (
                    <span key={k} className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono">
                      {k}={v}
                    </span>
                  ))}
                  {(!resource.labels || Object.keys(resource.labels).length === 0) && (
                    <span className="text-xs text-muted-foreground">No labels</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Annotations ({resource.annotations ? Object.keys(resource.annotations).length : 0})</h4>
                <div className="space-y-2">
                  {resource.annotations && Object.entries(resource.annotations).map(([k, v]) => (
                    <div key={k} className="text-xs font-mono bg-secondary/50 rounded p-2">
                      <div className="text-purple-400 break-all">{k}</div>
                      <div className="text-foreground mt-1 break-all">{v}</div>
                    </div>
                  ))}
                  {(!resource.annotations || Object.keys(resource.annotations).length === 0) && (
                    <span className="text-xs text-muted-foreground">No annotations</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && resource.kind === 'Pod' && (
            <div className="bg-secondary/50 rounded p-4 font-mono text-xs overflow-auto max-h-[400px]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-muted-foreground"># kubectl logs {resource.name} -n {resource.namespace}</div>
                <button
                  onClick={() => refetchLogs()}
                  disabled={logsLoading}
                  className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50"
                >
                  {logsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {logsLoading && <div className="text-muted-foreground">Loading logs...</div>}
              {logsError && <div className="text-red-400">{logsError}</div>}
              {!logsLoading && !logsError && !logs && (
                <div className="text-muted-foreground">No logs available</div>
              )}
              {!logsLoading && logs && (
                <pre className="whitespace-pre-wrap break-all text-foreground">{logs}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
