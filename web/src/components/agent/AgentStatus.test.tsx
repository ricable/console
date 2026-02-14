import { describe, it, expect } from 'vitest'
import { AgentStatus } from './AgentStatus'

describe('AgentStatus Components', () => {
  it('exports AgentStatus component', () => {
    expect(AgentStatus).toBeDefined()
    expect(typeof AgentStatus).toBe('function')
  })

  it('exports AgentInstallBanner component', () => {
    expect(AgentStatusModule.AgentInstallBanner).toBeDefined()
    expect(typeof AgentStatusModule.AgentInstallBanner).toBe('function')
  })
})
