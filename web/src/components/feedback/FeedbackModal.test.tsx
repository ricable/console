import { describe, it, expect } from 'vitest'
import { FeedbackModal } from './FeedbackModal'

describe('FeedbackModal Component', () => {
  it('exports FeedbackModal component', () => {
    expect(FeedbackModal).toBeDefined()
    expect(typeof FeedbackModal).toBe('function')
  })
})
