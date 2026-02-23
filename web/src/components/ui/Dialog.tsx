import { cn } from '../../lib/cn'
import type { ReactNode } from 'react'

interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }
interface DialogContentProps { className?: string; children: ReactNode }
interface DialogHeaderProps { className?: string; children: ReactNode }
interface DialogTitleProps { className?: string; children: ReactNode }
interface DialogFooterProps { className?: string; children: ReactNode }

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={() => onOpenChange(false)} />
      <div className="relative z-50">{children}</div>
    </div>
  )
}

export function DialogContent({ className, children }: DialogContentProps) {
  return (
    <div className={cn('relative rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-xl w-full max-w-lg', className)}>
      {children}
    </div>
  )
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return <h2 className={cn('text-lg font-semibold text-gray-100', className)}>{children}</h2>
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)}>{children}</div>
}
