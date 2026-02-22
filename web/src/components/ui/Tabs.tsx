import { cn } from '../../lib/cn'
import { createContext, useContext, type ReactNode } from 'react'

const TabsCtx = createContext<{ value: string; onValueChange: (v: string) => void }>({ value: '', onValueChange: () => {} })

export function Tabs({ value, onValueChange, className, children }: { value: string; onValueChange: (v: string) => void; className?: string; children: ReactNode }) {
  return <TabsCtx.Provider value={{ value, onValueChange }}><div className={className}>{children}</div></TabsCtx.Provider>
}
export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex gap-1 rounded border border-gray-700 p-1', className)}>{children}</div>
}
export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const ctx = useContext(TabsCtx)
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:text-gray-200',
        className
      )}
    >
      {children}
    </button>
  )
}
export function TabsContent({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const ctx = useContext(TabsCtx)
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}
