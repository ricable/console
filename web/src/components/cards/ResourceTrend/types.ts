// Types for ResourceTrend component

export interface ResourcePoint {
  time: string
  cpuCores: number
  memoryGB: number
  pods: number
  nodes: number
}

export type MetricView = 'all' | 'compute' | 'workloads'
export type TimeRange = '15m' | '1h' | '6h' | '24h'

export interface TimeRangeOption {
  value: TimeRange
  label: string
  points: number
}

export interface LineConfig {
  dataKey: string
  color: string
  name: string
}
