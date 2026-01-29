// Constants for ResourceTrend component
import { TimeRangeOption, LineConfig } from './types'

export const STORAGE_KEY = 'resource-trend-history'
export const MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes - discard older data
export const MAX_HISTORY_POINTS = 20

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '15m', label: '15 min', points: 15 },
  { value: '1h', label: '1 hour', points: 20 },
  { value: '6h', label: '6 hours', points: 24 },
  { value: '24h', label: '24 hours', points: 24 },
]

export const COMPUTE_LINES: LineConfig[] = [
  { dataKey: 'cpuCores', color: '#3b82f6', name: 'CPU Cores' },
  { dataKey: 'memoryGB', color: '#22c55e', name: 'Memory (GB)' },
]

export const WORKLOAD_LINES: LineConfig[] = [
  { dataKey: 'pods', color: '#9333ea', name: 'Pods' },
  { dataKey: 'nodes', color: '#f59e0b', name: 'Nodes' },
]

// Default 'all' view shows CPU and Pods (matches original behavior)
export const ALL_LINES: LineConfig[] = [
  { dataKey: 'cpuCores', color: '#3b82f6', name: 'CPU' },
  { dataKey: 'pods', color: '#9333ea', name: 'Pods' },
]
