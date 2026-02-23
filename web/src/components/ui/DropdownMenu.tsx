import { cn } from '../../lib/cn'
import type { ReactNode } from 'react'

export function DropdownMenu({ children }: { children: ReactNode }) {
  return <div className="relative inline-block">{children}</div>
}

export function DropdownMenuTrigger({ children }: { asChild?: boolean; children: ReactNode }) {
  return <>{children}</>
}

export function DropdownMenuContent({ className, align = 'end', children }: { className?: string; align?: 'start' | 'end'; children: ReactNode }) {
  return (
    <div className={cn(
      'absolute z-50 mt-1 min-w-[10rem] rounded border border-gray-700 bg-gray-900 shadow-lg',
      align === 'end' ? 'right-0' : 'left-0',
      className
    )}>
      {children}
    </div>
  )
}

export function DropdownMenuItem({ className, onClick, children }: { className?: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors', className)}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 border-t border-gray-700', className)} />
}
