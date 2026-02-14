import { describe, it, expect } from 'vitest'
import { AddCardModal } from './AddCardModal'

describe('AddCardModal Component', () => {
  it('exports AddCardModal component', () => {
    expect(AddCardModal).toBeDefined()
    expect(typeof AddCardModal).toBe('function')
  })
})
