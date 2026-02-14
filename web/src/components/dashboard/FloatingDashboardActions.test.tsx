import { describe, it, expect } from 'vitest'
import { FloatingDashboardActions } from './FloatingDashboardActions'

describe('FloatingDashboardActions Component', () => {
  it('exports FloatingDashboardActions component', () => {
    expect(FloatingDashboardActions).toBeDefined()
    expect(typeof FloatingDashboardActions).toBe('function')
  })
})
