import { Search } from 'lucide-react'
import { cn } from '../../lib/cn'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterSectionProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterValue: string
  onFilterChange: (value: string) => void
  filterOptions: FilterOption[]
  sortValue?: string
  onSortChange?: (value: string) => void
  sortOptions?: FilterOption[]
  sortAscending?: boolean
  onSortDirectionChange?: (ascending: boolean) => void
  className?: string
}

/**
 * Reusable filter section with search, filter dropdown, and sort controls
 */
export function FilterSection({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterValue,
  onFilterChange,
  filterOptions,
  sortValue,
  onSortChange,
  sortOptions,
  sortAscending = true,
  onSortDirectionChange,
  className,
}: FilterSectionProps) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Filter Dropdown */}
      <select
        value={filterValue}
        onChange={(e) => onFilterChange(e.target.value)}
        className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {filterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.count !== undefined && ` (${option.count})`}
          </option>
        ))}
      </select>

      {/* Sort Controls */}
      {sortOptions && onSortChange && (
        <>
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {onSortDirectionChange && (
            <button
              onClick={() => onSortDirectionChange(!sortAscending)}
              className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary transition-colors"
              title={sortAscending ? 'Sort descending' : 'Sort ascending'}
            >
              <svg
                className={cn('w-4 h-4 text-foreground transition-transform', !sortAscending && 'rotate-180')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  )
}
