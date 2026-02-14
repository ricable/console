import { describe, it, expect } from 'vitest'
import { GitOps } from './GitOps'

describe('GitOps Component', () => {
  it('exports GitOps component', () => {
    expect(GitOps).toBeDefined()
    expect(typeof GitOps).toBe('function')
  })
})
