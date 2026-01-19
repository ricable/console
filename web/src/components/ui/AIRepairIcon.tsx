import { Wrench, Sparkles } from 'lucide-react'
import { cn } from '../../lib/cn'

interface AIRepairIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Combined Wrench + AI Sparkles icon for AI-assisted repair features.
 * Shows a wrench with sparkles to indicate AI-powered diagnostics.
 */
export function AIRepairIcon({ className, size = 'md' }: AIRepairIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }
  const sparkleSizeClasses = {
    sm: 'w-2 h-2 -top-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 -top-1 -right-1',
    lg: 'w-3 h-3 -top-1 -right-1',
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      <Wrench className={sizeClasses[size]} />
      <Sparkles className={cn('absolute text-purple-400 animate-pulse', sparkleSizeClasses[size])} />
    </div>
  )
}
