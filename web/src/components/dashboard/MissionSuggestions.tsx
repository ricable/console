import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, Clock, X, ChevronDown, Zap, AlertTriangle, Shield, Server, Scale, Activity, Wrench, Stethoscope } from 'lucide-react'
import { useMissionSuggestions, MissionSuggestion, MissionType } from '../../hooks/useMissionSuggestions'
import { useSnoozedMissions, formatTimeRemaining } from '../../hooks/useSnoozedMissions'
import { useMissions } from '../../hooks/useMissions'
import { useLocalAgent } from '../../hooks/useLocalAgent'
import { useDemoMode } from '../../hooks/useDemoMode'
import { Skeleton } from '../ui/Skeleton'
import { useArrowKeyNavigation } from '../../hooks/useArrowKeyNavigation'

const MISSION_ICONS: Record<MissionType, typeof Zap> = {
  scale: Scale,
  limits: Activity,
  restart: Zap,
  unavailable: AlertTriangle,
  security: Shield,
  health: Server,
  resource: Activity,
}

const PRIORITY_STYLES = {
  critical: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500/30',
  },
  high: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    badge: 'bg-orange-500/30',
  },
  medium: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/30',
  },
  low: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/30',
  },
}

export function MissionSuggestions() {
  const navigate = useNavigate()
  const { suggestions, hasSuggestions, stats } = useMissionSuggestions()
  // Subscribe to snoozedMissions to trigger re-render when snooze state changes
  const { snoozeMission, dismissMission, getSnoozeRemaining, snoozedMissions } = useSnoozedMissions()
  const { startMission } = useMissions()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check agent status for offline skeleton display
  const { status: agentStatus } = useLocalAgent()
  const { isDemoMode } = useDemoMode()
  const isAgentOffline = agentStatus === 'disconnected'
  const forceSkeletonForOffline = !isDemoMode && isAgentOffline

  // Force dependency on snoozedMissions for reactivity
  void snoozedMissions

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!expandedId) return

    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside the dropdown content
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExpandedId(null)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedId(null)
      }
    }

    // Use setTimeout to avoid closing immediately when clicking to open
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [expandedId])

  const handleAction = useCallback((e: React.MouseEvent, suggestion: MissionSuggestion) => {
    e.stopPropagation()
    e.preventDefault()

    // Close dropdown and dismiss the suggestion permanently
    setExpandedId(null)
    setProcessingId(null)
    dismissMission(suggestion.id) // Permanently remove tile after starting action

    // Execute action after dropdown closes
    setTimeout(() => {
      if (suggestion.action.type === 'navigate') {
        navigate(suggestion.action.target)
      } else if (suggestion.action.type === 'ai') {
        startMission({
          title: suggestion.title,
          description: suggestion.description,
          type: suggestion.type === 'security' ? 'analyze' : 'troubleshoot',
          initialPrompt: suggestion.action.target,
          context: suggestion.context,
        })
      }
    }, 0)
  }, [navigate, startMission, dismissMission])

  const handleRepair = useCallback((e: React.MouseEvent, suggestion: MissionSuggestion) => {
    e.stopPropagation()
    e.preventDefault()

    // Close dropdown and dismiss the suggestion permanently
    setExpandedId(null)
    setProcessingId(null)
    dismissMission(suggestion.id) // Permanently remove tile after starting repair

    // Start mission after dropdown closes
    setTimeout(() => {
      startMission({
        title: `Repair: ${suggestion.title}`,
        description: `Auto-repair: ${suggestion.description}`,
        type: 'repair',
        initialPrompt: `Automatically fix the following issue: ${suggestion.action.target}. Apply safe remediation steps.`,
        context: suggestion.context,
      })
    }, 0)
  }, [startMission, dismissMission])

  const handleSnooze = useCallback((e: React.MouseEvent, suggestion: MissionSuggestion) => {
    e.stopPropagation()
    snoozeMission(suggestion)
    setExpandedId(null)
  }, [snoozeMission])

  const handleDismiss = useCallback((e: React.MouseEvent, suggestion: MissionSuggestion) => {
    e.stopPropagation()
    dismissMission(suggestion.id)
    setExpandedId(null)
  }, [dismissMission])

  // Menu items for keyboard navigation
  const dropdownItems = useMemo(() => [
    { action: handleAction, label: 'Diagnose' },
    { action: handleRepair, label: 'Repair' },
    { action: handleSnooze, label: 'Snooze' },
    { action: handleDismiss, label: 'Dismiss' },
  ], [handleAction, handleRepair, handleSnooze, handleDismiss])

  // Arrow key navigation for dropdown
  useArrowKeyNavigation({
    isOpen: expandedId !== null,
    itemCount: dropdownItems.length,
    onSelect: (index) => {
      const suggestion = suggestions.find(s => s.id === expandedId)
      if (suggestion) {
        const item = dropdownItems[index]
        const syntheticEvent = { stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent
        item.action(syntheticEvent, suggestion)
      }
    },
    containerRef: dropdownRef,
  })

  // Show skeleton when agent is offline and demo mode is OFF
  if (forceSkeletonForOffline) {
    return (
      <div data-tour="mission-suggestions" className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
            <Lightbulb className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium">Actions:</span>
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={120} height={26} className="rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!hasSuggestions) return null

  return (
    <div data-tour="mission-suggestions" className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
          <Lightbulb className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium">Actions:</span>
        </div>

        {/* Inline suggestion chips */}
        {suggestions.slice(0, 6).map((suggestion) => {
          const Icon = MISSION_ICONS[suggestion.type]
          const style = PRIORITY_STYLES[suggestion.priority]
          const isExpanded = expandedId === suggestion.id
          const isProcessing = processingId === suggestion.id
          const snoozeRemaining = getSnoozeRemaining(suggestion.id)

          return (
            <div key={suggestion.id} className="relative">
              {/* Compact chip */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:scale-105 ${style.border} ${style.bg} ${style.text}`}
              >
                <Icon className="w-3 h-3" />
                <span className="max-w-[150px] truncate">{suggestion.title}</span>
                {suggestion.priority === 'critical' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                {isProcessing && <div className="spinner w-3 h-3" />}
                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded dropdown */}
              {isExpanded && (
                <div
                  ref={dropdownRef}
                  className={`absolute top-full left-0 mt-1 z-50 w-72 rounded-lg border ${style.border} ${style.bg} backdrop-blur-sm shadow-xl`}
                >
                  <div className="p-3">
                    {/* Description */}
                    <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>

                    {/* Context details */}
                    {suggestion.context.details && suggestion.context.details.length > 0 && (
                      <div className="text-xs text-muted-foreground mb-3 max-h-20 overflow-y-auto">
                        <ul className="ml-3 list-disc space-y-0.5">
                          {suggestion.context.details.slice(0, 3).map((detail, idx) => (
                            <li key={idx} className="truncate">{detail}</li>
                          ))}
                          {suggestion.context.details.length > 3 && (
                            <li className="text-muted-foreground/70">
                              +{suggestion.context.details.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {snoozeRemaining && snoozeRemaining > 0 && (
                      <div className="text-xs text-purple-400 mb-2">
                        Snoozed for {formatTimeRemaining(snoozeRemaining)}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={(e) => handleAction(e, suggestion)}
                        disabled={isProcessing}
                        role="menuitem"
                        tabIndex={0}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary ${
                          suggestion.priority === 'critical'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : suggestion.priority === 'high'
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                        } disabled:opacity-50`}
                      >
                        <Stethoscope className="w-3 h-3" />
                        {suggestion.action.label}
                      </button>
                      <button
                        onClick={(e) => handleRepair(e, suggestion)}
                        disabled={isProcessing}
                        role="menuitem"
                        tabIndex={0}
                        className="px-2 py-1.5 rounded text-xs font-medium bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary"
                        title="AI Repair - automatically fix this issue"
                      >
                        <Wrench className="w-3 h-3" />
                        Repair
                      </button>
                      <button
                        onClick={(e) => handleSnooze(e, suggestion)}
                        role="menuitem"
                        tabIndex={0}
                        className="px-2 py-1.5 rounded text-xs font-medium bg-secondary/50 hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                        title="Snooze for 24 hours"
                      >
                        <Clock className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDismiss(e, suggestion)}
                        role="menuitem"
                        tabIndex={0}
                        className="px-2 py-1.5 rounded text-xs font-medium bg-secondary/50 hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Stats badges */}
        {stats.critical > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]">
            {stats.critical} critical
          </span>
        )}
        {stats.high > 0 && stats.critical === 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px]">
            {stats.high} high
          </span>
        )}

        {suggestions.length > 6 && (
          <span className="text-[10px] text-muted-foreground">
            +{suggestions.length - 6} more
          </span>
        )}
      </div>
    </div>
  )
}
