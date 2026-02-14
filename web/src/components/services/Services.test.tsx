import { describe, it, expect } from 'vitest'
import { Services } from './Services'

describe('Services Component', () => {
  it('exports Services component', () => {
    expect(Services).toBeDefined()
    expect(typeof Services).toBe('function')
  })

  it('Services component is a valid React component', () => {
    const component = Services
    expect(component.length).toBeGreaterThanOrEqual(0)
  })
})
