import { describe, it, expect } from 'vitest'
import { AlertRuleEditor } from './AlertRuleEditor'

describe('AlertRuleEditor Component', () => {
  it('exports AlertRuleEditor component', () => {
    expect(AlertRuleEditor).toBeDefined()
    expect(typeof AlertRuleEditor).toBe('function')
  })
})
