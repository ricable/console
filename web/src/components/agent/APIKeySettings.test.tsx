import { describe, it, expect } from 'vitest'
import { APIKeySettings } from './APIKeySettings'

describe('APIKeySettings Component', () => {
  it('exports APIKeySettings component', () => {
    expect(APIKeySettings).toBeDefined()
    expect(typeof APIKeySettings).toBe('function')
  })
})
