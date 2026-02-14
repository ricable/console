import { describe, it, expect } from 'vitest'
import { AlertDetail } from './AlertDetail'

describe('AlertDetail Component', () => {
  it('exports AlertDetail component', () => {
    expect(AlertDetail).toBeDefined()
    expect(typeof AlertDetail).toBe('function')
  })
})
