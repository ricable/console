// Utility functions for ResourceTrend component
import { MetricView, LineConfig } from './types'
import { COMPUTE_LINES, WORKLOAD_LINES, ALL_LINES } from './constants'

// Get chart lines based on current view
export function getChartLines(view: MetricView): LineConfig[] {
  switch (view) {
    case 'compute':
      return COMPUTE_LINES
    case 'workloads':
      return WORKLOAD_LINES
    case 'all':
    default:
      return ALL_LINES
  }
}

// Format time for display
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
