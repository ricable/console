import { describe, it, expect } from 'vitest'
import { FeatureRequestList } from './FeatureRequestList'

describe('FeatureRequestList Component', () => {
  it('exports FeatureRequestList component', () => {
    expect(FeatureRequestList).toBeDefined()
    expect(typeof FeatureRequestList).toBe('function')
  })
})
