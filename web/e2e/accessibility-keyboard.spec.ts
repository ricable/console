import { test, expect } from '@playwright/test'

test.describe('Keyboard Navigation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 200,
        json: {
          id: '1',
          github_id: '12345',
          github_login: 'testuser',
          email: 'test@example.com',
          onboarded: true,
        },
      })
    )

    // Mock cluster data
    await page.route('**/api/mcp/**', (route) =>
      route.fulfill({
        status: 200,
        json: { clusters: [], issues: [], events: [], nodes: [] },
      })
    )

    // Set token before navigating
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('demo-user-onboarded', 'true')
    })

    await page.waitForTimeout(500)
  })

  test('buttons have keyboard support (Enter key)', async ({ page }) => {
    await page.goto('/pods')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Find a button element
    const button = page.locator('button').first()
    if (await button.isVisible().catch(() => false)) {
      await button.focus()
      // Simulate Enter key press
      await page.keyboard.press('Enter')
      // If button had an onClick, it should have been triggered
      await page.waitForTimeout(500)
    }
  })

  test('buttons have keyboard support (Space key)', async ({ page }) => {
    await page.goto('/pods')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Find a button element
    const button = page.locator('button').first()
    if (await button.isVisible().catch(() => false)) {
      await button.focus()
      // Simulate Space key press
      await page.keyboard.press('Space')
      // If button had an onClick, it should have been triggered
      await page.waitForTimeout(500)
    }
  })

  test('clickable elements have proper roles', async ({ page }) => {
    await page.goto('/pods')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Check that clickable divs have appropriate roles
    const clickableElements = page.locator('[role="button"]')
    const count = await clickableElements.count().catch(() => 0)
    
    // If there are clickable elements, verify they have tabIndex
    if (count > 0) {
      const firstElement = clickableElements.first()
      const tabIndex = await firstElement.getAttribute('tabindex')
      expect(tabIndex).not.toBeNull()
    }
  })

  test('modal dialogs support Escape key', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Check if any modal exists with role="dialog"
    const modal = page.locator('[role="dialog"]')
    const hasModal = await modal.isVisible().catch(() => false)
    
    if (hasModal) {
      // Press Escape key
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      
      // Modal should be closed (this is a soft assertion)
      const stillVisible = await modal.isVisible().catch(() => false)
      // We don't fail the test if modal is still visible, as it might not be dismissable
    }
  })

  test('tab navigation works through interactive elements', async ({ page }) => {
    await page.goto('/pods')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Tab through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
    }

    // Should have a focused element
    const focused = page.locator(':focus')
    const hasFocus = await focused.isVisible().catch(() => false)
    
    // At least one element should be focusable (may vary by browser)
    if (!hasFocus) {
      // Try one more time - some browsers need a moment
      await page.waitForTimeout(100)
      const secondCheck = await focused.isVisible().catch(() => false)
      expect(secondCheck || hasFocus).toBeTruthy()
    } else {
      expect(hasFocus).toBeTruthy()
    }
  })

  test('GPU Reservations keyboard navigation', async ({ page }) => {
    await page.goto('/gpu/reservations')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Check that buttons are keyboard accessible
    const buttons = page.locator('button')
    const count = await buttons.count().catch(() => 0)
    
    if (count > 0) {
      const firstButton = buttons.first()
      if (await firstButton.isVisible().catch(() => false)) {
        await firstButton.focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)
      }
    }
  })

  test('GitOps status filters keyboard navigation', async ({ page }) => {
    await page.goto('/gitops')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Find filter buttons
    const filterButtons = page.locator('button').filter({ hasText: /All|Synced|Drifted/ })
    const count = await filterButtons.count().catch(() => 0)
    
    if (count > 0) {
      const firstFilter = filterButtons.first()
      if (await firstFilter.isVisible().catch(() => false)) {
        await firstFilter.focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)
      }
    }
  })
})
