import { useState } from 'react'
import {
  Plus,
  Scale,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { useAgentActions } from '../../hooks/useAgentActions'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'

interface QuickActionsProps {
  selectedAgents: any[]
  onRefresh: () => void
}

export function QuickActions({ selectedAgents, onRefresh }: QuickActionsProps) {
  const { deployAgent, scaleAgent, deleteAgent, restartAgent, isLoading } = useAgentActions()

  const [showDeployModal, setShowDeployModal] = useState(false)
  const [showScaleModal, setShowScaleModal] = useState(false)
  const [deployForm, setDeployForm] = useState({
    name: '',
    namespace: 'wasmai-system',
    domain: 'Mobility',
    type: 'ran-agent',
    runtime: 'spin',
    replicas: 1,
    cluster: '',
  })
  const [scaleForm, setScaleForm] = useState({
    replicas: 1,
  })

  const handleDeploy = async () => {
    const result = await deployAgent({
      ...deployForm,
      labels: {},
      config: {},
    })
    if (result.success) {
      setShowDeployModal(false)
      setDeployForm({
        name: '',
        namespace: 'wasmai-system',
        domain: 'Mobility',
        type: 'ran-agent',
        runtime: 'spin',
        replicas: 1,
        cluster: '',
      })
      onRefresh()
    }
  }

  const handleScale = async () => {
    for (const agent of selectedAgents) {
      await scaleAgent({
        name: agent.name,
        namespace: agent.namespace,
        replicas: scaleForm.replicas,
        cluster: agent.cluster,
      })
    }
    setShowScaleModal(false)
    setScaleForm({ replicas: 1 })
    onRefresh()
  }

  const handleRestart = async () => {
    for (const agent of selectedAgents) {
      await restartAgent(agent.name, {
        namespace: agent.namespace,
        cluster: agent.cluster,
      })
    }
    onRefresh()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedAgents.length} agent(s)?`)) return
    for (const agent of selectedAgents) {
      await deleteAgent(agent.name, {
        namespace: agent.namespace,
        cluster: agent.cluster,
      })
    }
    onRefresh()
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowDeployModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Deploy Agent
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedAgents.length === 0}
          onClick={() => setShowScaleModal(true)}
        >
          <Scale className="w-4 h-4 mr-2" />
          Scale
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedAgents.length === 0}
          onClick={handleRestart}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Restart
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedAgents.length === 0}
          onClick={handleDelete}
        >
          <Zap className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Deploy Modal */}
      <Dialog open={showDeployModal} onOpenChange={setShowDeployModal}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Deploy New Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Agent Name</Label>
              <Input
                value={deployForm.name}
                onChange={(e) => setDeployForm({ ...deployForm, name: e.target.value })}
                placeholder="my-agent"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div>
              <Label className="text-gray-300">Domain</Label>
              <Select
                value={deployForm.domain}
                onValueChange={(v) => setDeployForm({ ...deployForm, domain: v })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="Mobility" className="text-gray-200">Mobility</SelectItem>
                  <SelectItem value="Throughput" className="text-gray-200">Throughput</SelectItem>
                  <SelectItem value="Integrity" className="text-gray-200">Integrity</SelectItem>
                  <SelectItem value="Coordination" className="text-gray-200">Coordination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Type</Label>
              <Select
                value={deployForm.type}
                onValueChange={(v) => setDeployForm({ ...deployForm, type: v })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="ran-agent" className="text-gray-200">RAN Agent</SelectItem>
                  <SelectItem value="sparc-agent" className="text-gray-200">SPARC Agent</SelectItem>
                  <SelectItem value="coordinator" className="text-gray-200">Coordinator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Runtime</Label>
              <Select
                value={deployForm.runtime}
                onValueChange={(v) => setDeployForm({ ...deployForm, runtime: v })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="spin" className="text-gray-200">Spin</SelectItem>
                  <SelectItem value="wasmedge" className="text-gray-200">WASMEdge</SelectItem>
                  <SelectItem value="crun-wasm" className="text-gray-200">crun-wasm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Replicas</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={deployForm.replicas}
                onChange={(e) => setDeployForm({ ...deployForm, replicas: parseInt(e.target.value) || 1 })}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeployModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeploy} disabled={isLoading || !deployForm.name}>
              Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scale Modal */}
      <Dialog open={showScaleModal} onOpenChange={setShowScaleModal}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              Scale {selectedAgents.length} Agent(s)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Replicas</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={scaleForm.replicas}
                onChange={(e) => setScaleForm({ replicas: parseInt(e.target.value) || 1 })}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScaleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleScale} disabled={isLoading}>
              Scale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
