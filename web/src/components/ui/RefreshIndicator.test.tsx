import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { RefreshIndicator, RefreshButton, RefreshSpinner } from './RefreshIndicator'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('RefreshIndicator Component', () => {
  it('exports RefreshIndicator component', () => {
    expect(RefreshIndicator).toBeDefined()
    expect(typeof RefreshIndicator).toBe('function')
  })

  it('renders idle state with clock icon when not refreshing', () => {
    const { container } = render(<RefreshIndicator isRefreshing={false} />)
    expect(container.querySelector('span[role="status"]')).toBeTruthy()
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders updating state with spinning icon when isRefreshing is true', () => {
    const { container, getByText } = render(<RefreshIndicator isRefreshing />)
    const status = container.querySelector('span[role="status"]')
    expect(status).toBeTruthy()
    expect(status?.getAttribute('aria-label')).toBe('Updating data')
    expect(getByText('Updating')).toBeTruthy()
  })

  it('has proper aria-label when not yet updated', () => {
    const { container } = render(<RefreshIndicator isRefreshing={false} />)
    const status = container.querySelector('span[role="status"]')
    expect(status?.getAttribute('aria-label')).toBe('Not yet updated')
  })

  it('has proper aria-label when lastUpdated is provided', () => {
    const lastUpdated = new Date('2024-01-01T12:00:00Z')
    const { container } = render(
      <RefreshIndicator isRefreshing={false} lastUpdated={lastUpdated} />
    )
    const status = container.querySelector('span[role="status"]')
    expect(status?.getAttribute('aria-label')).toContain('Last updated')
  })

  it('shows pending text when showLabel is true and no lastUpdated', () => {
    const { getByText } = render(<RefreshIndicator isRefreshing={false} showLabel />)
    expect(getByText('pending')).toBeTruthy()
  })

  it('does not show label when showLabel is false', () => {
    const { container } = render(
      <RefreshIndicator isRefreshing={false} showLabel={false} />
    )
    expect(container.textContent).toBe('')
  })
})

describe('RefreshButton Component', () => {
  it('renders a refresh button', () => {
    const { container } = render(<RefreshButton isRefreshing={false} />)
    const button = container.querySelector('button')
    expect(button).toBeTruthy()
  })

  it('has proper aria-label for accessibility', () => {
    const { container } = render(<RefreshButton isRefreshing={false} />)
    const button = container.querySelector('button')
    expect(button?.getAttribute('aria-label')).toBeTruthy()
  })

  it('calls onRefresh callback when clicked', () => {
    const onRefresh = vi.fn()
    const { container } = render(
      <RefreshButton isRefreshing={false} onRefresh={onRefresh} />
    )
    const button = container.querySelector('button')!
    fireEvent.click(button)
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('button is disabled while refreshing', () => {
    const { container } = render(<RefreshButton isRefreshing />)
    const button = container.querySelector('button')
    expect(button).toBeDisabled()
  })

  it('button is disabled when disabled prop is set', () => {
    const { container } = render(<RefreshButton isRefreshing={false} disabled />)
    const button = container.querySelector('button')
    expect(button).toBeDisabled()
  })

  it('displays last-refreshed timestamp in tooltip when provided', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:02:30Z'))
    const lastRefresh = new Date('2024-01-01T12:01:00Z') // 1.5 min ago
    const { container } = render(
      <RefreshButton isRefreshing={false} lastRefresh={lastRefresh} />
    )
    const button = container.querySelector('button')
    expect(button?.getAttribute('title')).toContain('1m ago')
    vi.useRealTimers()
  })

  it('shows failure indicator when isFailed is true', () => {
    const { container } = render(
      <RefreshButton isRefreshing={false} isFailed consecutiveFailures={3} />
    )
    const alert = container.querySelector('[role="alert"]')
    expect(alert).toBeTruthy()
  })
})

describe('RefreshSpinner Component', () => {
  it('returns null when isRefreshing is false', () => {
    const { container } = render(<RefreshSpinner isRefreshing={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders spinning icon when isRefreshing is true', () => {
    const { container } = render(<RefreshSpinner isRefreshing />)
    const icon = container.querySelector('svg')
    expect(icon).toBeTruthy()
    expect(icon?.getAttribute('class')).toContain('animate-spin-min')
  })
})
