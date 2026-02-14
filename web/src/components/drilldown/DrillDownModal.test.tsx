import { describe, it, expect } from 'vitest'
import { DrillDownModal } from './DrillDownModal'

describe('DrillDownModal Component', () => {
  it('exports DrillDownModal component', () => {
    expect(DrillDownModal).toBeDefined()
    expect(typeof DrillDownModal).toBe('function')
  })
})
