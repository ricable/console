import { describe, it, expect } from 'vitest'
import { AgentSelector } from './AgentSelector'

describe('AgentSelector Component', () => {
  it('exports AgentSelector component', () => {
    expect(AgentSelector).toBeDefined()
    expect(typeof AgentSelector).toBe('function')
  })
})
