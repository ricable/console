import { describe, it, expect } from 'vitest'
import { SyncDialog } from './SyncDialog'

describe('SyncDialog Component', () => {
  it('exports SyncDialog component', () => {
    expect(SyncDialog).toBeDefined()
    expect(typeof SyncDialog).toBe('function')
  })
})
