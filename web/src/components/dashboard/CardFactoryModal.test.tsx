import { describe, it, expect } from 'vitest'
import { CardFactoryModal } from './CardFactoryModal'

describe('CardFactoryModal Component', () => {
  it('exports CardFactoryModal component', () => {
    expect(CardFactoryModal).toBeDefined()
    expect(typeof CardFactoryModal).toBe('function')
  })
})
