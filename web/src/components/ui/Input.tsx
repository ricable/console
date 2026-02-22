import { cn } from '../../lib/cn'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
