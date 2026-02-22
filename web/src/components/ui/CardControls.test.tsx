import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { CardControls } from './CardControls'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' },
]

describe('CardControls Component', () => {
  it('renders without crashing when no optional props are passed', () => {
    const { container } = render(<CardControls />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders sort controls when sortOptions are provided', () => {
    const onSortChange = vi.fn()
    const { container } = render(
      <CardControls sortOptions={SORT_OPTIONS} sortBy="name" onSortChange={onSortChange} />
    )
    const sortButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Sort:')
    )
    expect(sortButton).toBeTruthy()
  })

  it('renders limit controls when onLimitChange is provided', () => {
    const onLimitChange = vi.fn()
    const { container } = render(<CardControls onLimitChange={onLimitChange} limit={10} />)
    const limitButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Show:')
    )
    expect(limitButton).toBeTruthy()
  })

  it('selecting a sort option calls onSortChange callback', () => {
    const onSortChange = vi.fn()
    const { container } = render(
      <CardControls sortOptions={SORT_OPTIONS} sortBy="name" onSortChange={onSortChange} />
    )
    const sortButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Sort:')
    )
    expect(sortButton).toBeTruthy()
    fireEvent.click(sortButton!)
    const dateOption = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Date'
    )
    expect(dateOption).toBeTruthy()
    fireEvent.click(dateOption!)
    expect(onSortChange).toHaveBeenCalledWith('date')
  })

  it('selecting a limit option calls onLimitChange callback', () => {
    const onLimitChange = vi.fn()
    const { container } = render(<CardControls onLimitChange={onLimitChange} limit={5} />)
    const limitButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Show:')
    )
    expect(limitButton).toBeTruthy()
    fireEvent.click(limitButton!)
    const option20 = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === '20'
    )
    expect(option20).toBeTruthy()
    fireEvent.click(option20!)
    expect(onLimitChange).toHaveBeenCalledWith(20)
  })

  it('sort direction toggle changes from desc to asc on click', () => {
    const onSortDirectionChange = vi.fn()
    const { container } = render(
      <CardControls
        sortOptions={SORT_OPTIONS}
        sortBy="name"
        onSortChange={vi.fn()}
        sortDirection="desc"
        onSortDirectionChange={onSortDirectionChange}
      />
    )
    const directionButton = container.querySelector('button[title="Descending"]')
    expect(directionButton).toBeTruthy()
    fireEvent.click(directionButton!)
    expect(onSortDirectionChange).toHaveBeenCalledWith('asc')
  })

  it('sort direction toggle changes from asc to desc on click', () => {
    const onSortDirectionChange = vi.fn()
    const { container } = render(
      <CardControls
        sortOptions={SORT_OPTIONS}
        sortBy="name"
        onSortChange={vi.fn()}
        sortDirection="asc"
        onSortDirectionChange={onSortDirectionChange}
      />
    )
    const directionButton = container.querySelector('button[title="Ascending"]')
    expect(directionButton).toBeTruthy()
    fireEvent.click(directionButton!)
    expect(onSortDirectionChange).toHaveBeenCalledWith('desc')
  })

  it('does not render sort controls when showSort is false', () => {
    const onSortChange = vi.fn()
    const { container } = render(
      <CardControls
        sortOptions={SORT_OPTIONS}
        sortBy="name"
        onSortChange={onSortChange}
        showSort={false}
      />
    )
    const sortButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Sort:')
    )
    expect(sortButton).toBeUndefined()
  })

  it('does not render limit controls when showLimit is false', () => {
    const onLimitChange = vi.fn()
    const { container } = render(
      <CardControls onLimitChange={onLimitChange} limit={10} showLimit={false} />
    )
    const limitButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Show:')
    )
    expect(limitButton).toBeUndefined()
  })
})
