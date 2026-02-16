import React from 'react'
import { cn } from '../../lib/cn'

/**
 * Common flex layout components to centralize repeated Tailwind patterns
 * These components standardize layouts used throughout the codebase.
 */

interface FlexProps {
  children: React.ReactNode
  className?: string
}

/**
 * FlexRow - Horizontal flex container with items centered vertically
 * Replaces: "flex items-center gap-*"
 *
 * @example
 * <FlexRow>
 *   <Icon />
 *   <span>Text</span>
 * </FlexRow>
 */
export function FlexRow({
  children,
  className,
}: FlexProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {children}
    </div>
  )
}

/**
 * FlexRowGap1 - Horizontal flex with items-center and gap-1
 * Most common pattern: "flex items-center gap-1"
 */
export function FlexRowGap1({ children, className }: FlexProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {children}
    </div>
  )
}

/**
 * FlexRowGap2 - Horizontal flex with items-center and gap-2
 * Most common pattern: "flex items-center gap-2"
 */
export function FlexRowGap2({ children, className }: FlexProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  )
}

/**
 * FlexRowGap3 - Horizontal flex with items-center and gap-3
 * Pattern: "flex items-center gap-3"
 */
export function FlexRowGap3({ children, className }: FlexProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {children}
    </div>
  )
}

/**
 * FlexRowStart - Horizontal flex with items aligned to start
 * Pattern: "flex items-start gap-*"
 */
export function FlexRowStart({
  children,
  className,
}: FlexProps) {
  return (
    <div className={cn('flex items-start', className)}>
      {children}
    </div>
  )
}

/**
 * FlexCol - Vertical flex container
 * Pattern: "flex flex-col gap-*"
 */
export function FlexCol({
  children,
  className,
}: FlexProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {children}
    </div>
  )
}

/**
 * FlexCenter - Flex container with items centered both horizontally and vertically
 * Pattern: "flex items-center justify-center"
 */
export function FlexCenter({ children, className }: FlexProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {children}
    </div>
  )
}

/**
 * FlexBetween - Flex container with items justified between (space-between)
 * Pattern: "flex items-center justify-between"
 */
export function FlexBetween({ children, className }: FlexProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

/**
 * Grid - Grid container with configurable columns
 * Patterns: "grid grid-cols-2", "grid grid-cols-3", "grid grid-cols-4"
 */
interface GridProps extends FlexProps {
  cols?: 1 | 2 | 3 | 4 | 12
}

export function Grid({ children, className, cols = 2 }: GridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    12: 'grid-cols-12',
  }[cols]

  return (
    <div className={cn('grid', colsClass, className)}>
      {children}
    </div>
  )
}

/**
 * Example usage:
 *
 * ```tsx
 * // Before:
 * <div className="flex items-center gap-2">
 *   <Icon />
 *   <span>Text</span>
 * </div>
 *
 * // After:
 * <FlexRowGap2>
 *   <Icon />
 *   <span>Text</span>
 * </FlexRowGap2>
 *
 * // Or with custom classes:
 * <FlexRowGap2 className="text-blue-500 font-bold">
 *   <Icon />
 *   <span>Text</span>
 * </FlexRowGap2>
 * ```
 */
