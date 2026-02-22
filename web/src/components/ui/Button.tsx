import { cn } from '../../lib/cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary'
type Size = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  default: 'bg-purple-600 text-white hover:bg-purple-700',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-600 text-gray-300 hover:bg-gray-800',
  ghost: 'text-gray-300 hover:bg-gray-800',
  secondary: 'bg-gray-700 text-gray-200 hover:bg-gray-600',
}
const sizes: Record<Size, string> = {
  default: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
}

export function Button({ variant = 'default', size = 'default', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
