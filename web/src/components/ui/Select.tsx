import { cn } from '../../lib/cn'
import type { ReactNode, SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void
  value?: string
}
export function Select({ children, onValueChange, value, onChange, className, ...props }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => { onChange?.(e); onValueChange?.(e.target.value) }}
      className={cn('flex h-9 w-full rounded border border-gray-600 bg-gray-800 px-3 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500', className)}
      {...props}
    >
      {children}
    </select>
  )
}

export function SelectTrigger({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex items-center', className)}>{children}</div>
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-gray-400 text-sm">{placeholder}</span>
}
export function SelectContent({ children }: { children: ReactNode }) {
  return <>{children}</>
}
export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return <option value={value}>{children}</option>
}
