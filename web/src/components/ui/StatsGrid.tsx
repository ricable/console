import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface StatItem {
  label: string
  value: number | string
  icon: LucideIcon
  color?: string
}

interface StatsGridProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
}

const colClass = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }

export function StatsGrid({ stats, columns = 3, className }: StatsGridProps) {
  return (
    <div className={cn('grid gap-3', colClass[columns], className)}>
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="flex flex-col items-center p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <Icon className={cn('w-5 h-5 mb-1', stat.color ?? 'text-gray-400')} />
            <p className="text-lg font-bold text-gray-200">{stat.value}</p>
            <p className="text-xs text-gray-400 text-center">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}
