import { describe, it, expect } from 'vitest'
import { CustomDashboard } from './CustomDashboard'

describe('CustomDashboard Component', () => {
  it('exports CustomDashboard component', () => {
    expect(CustomDashboard).toBeDefined()
    expect(typeof CustomDashboard).toBe('function')
  })
})
