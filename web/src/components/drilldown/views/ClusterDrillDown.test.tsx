import { describe, it, expect } from 'vitest'
import { ClusterDrillDown } from './ClusterDrillDown'

describe('ClusterDrillDown Component', () => {
  it('exports ClusterDrillDown component', () => {
    expect(ClusterDrillDown).toBeDefined()
    expect(typeof ClusterDrillDown).toBe('function')
  })
})
