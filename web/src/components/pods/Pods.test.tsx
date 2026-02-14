import { describe, it, expect } from 'vitest'
import { Pods } from './Pods'

describe('Pods Component', () => {
  it('exports Pods component', () => {
    expect(Pods).toBeDefined()
    expect(typeof Pods).toBe('function')
  })
})
