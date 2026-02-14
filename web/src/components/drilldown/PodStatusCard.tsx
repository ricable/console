import { AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/cn'

interface PodStatusCardProps {
  status?: string
  issues: string[]
  restarts?: number
}

// Helper to determine issue severity for styling
const getIssueSeverity = (issue: string): 'critical' | 'warning' | 'info' => {
  const lowerIssue = issue.toLowerCase()

  // Critical errors that prevent pod from working
  if (lowerIssue.includes('crashloopbackoff') ||
      lowerIssue.includes('oomkilled') ||
      lowerIssue.includes('oom') ||
      lowerIssue.includes('imagepullbackoff') ||
      lowerIssue.includes('errimagepull') ||
      lowerIssue.includes('failed') ||
      lowerIssue.includes('error') ||
      lowerIssue.includes('evicted')) {
    return 'critical'
  }
  
  // Warnings for transient states
  if (lowerIssue.includes('pending') || lowerIssue.includes('waiting')) {
    return 'warning'
  }
  
  // Info for other statuses (e.g., 'creating')
  // Note: 'running' should not typically appear as an issue
  return 'info'
}

/**
 * Displays pod status, issues, and restart count in a formatted card
 */
export function PodStatusCard({ status, issues, restarts }: PodStatusCardProps) {
  if (issues.length === 0 && (restarts === undefined || restarts === 0)) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Issue list - filter out status since it's shown elsewhere */}
      {issues.filter(issue => issue.toLowerCase() !== status?.toLowerCase()).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {issues
            .filter(issue => issue.toLowerCase() !== status?.toLowerCase())
            .map((issue, i) => {
              const severity = getIssueSeverity(issue)
              const bgColor = severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'

              return (
                <span key={i} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5', bgColor)}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {issue}
                </span>
              )
            })}
        </div>
      )}
    </div>
  )
}
