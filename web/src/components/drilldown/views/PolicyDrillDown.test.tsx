import { describe, it, expect } from 'vitest'
import { PolicyDrillDown } from './PolicyDrillDown'

describe('PolicyDrillDown Component', () => {
  it('exports PolicyDrillDown component', () => {
    expect(PolicyDrillDown).toBeDefined()
    expect(typeof PolicyDrillDown).toBe('function')
  })
})
