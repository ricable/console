import { describe, it, expect } from 'vitest'
import { NotificationBadge } from './NotificationBadge'

describe('NotificationBadge Component', () => {
  it('exports NotificationBadge component', () => {
    expect(NotificationBadge).toBeDefined()
    expect(typeof NotificationBadge).toBe('function')
  })
})
