import { describe, it, expect } from 'vitest'
import { DashboardCards } from './DashboardCards'

describe('DashboardCards Component', () => {
  it('exports DashboardCards component', () => {
    expect(DashboardCards).toBeDefined()
    expect(typeof DashboardCards).toBe('function')
  })
})
