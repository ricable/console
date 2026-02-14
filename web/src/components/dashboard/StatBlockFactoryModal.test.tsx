import { describe, it, expect } from 'vitest'
import { StatBlockFactoryModal } from './StatBlockFactoryModal'

describe('StatBlockFactoryModal Component', () => {
  it('exports StatBlockFactoryModal component', () => {
    expect(StatBlockFactoryModal).toBeDefined()
    expect(typeof StatBlockFactoryModal).toBe('function')
  })
})
