import { describe, it, expect } from 'vitest'
import { YAMLDrillDown } from './YAMLDrillDown'

describe('YAMLDrillDown Component', () => {
  it('exports YAMLDrillDown component', () => {
    expect(YAMLDrillDown).toBeDefined()
    expect(typeof YAMLDrillDown).toBe('function')
  })
})
