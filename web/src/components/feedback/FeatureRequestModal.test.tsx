import { describe, it, expect } from 'vitest'
import { FeatureRequestModal } from './FeatureRequestModal'

describe('FeatureRequestModal Component', () => {
  it('exports FeatureRequestModal component', () => {
    expect(FeatureRequestModal).toBeDefined()
    expect(typeof FeatureRequestModal).toBe('function')
  })
})
