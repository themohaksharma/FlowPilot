import { expect, test } from '@playwright/test'

test('homepage presents all product story scenes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Everything your business needs to flow/ })).toBeVisible()
  const refreshed = await page.reload()
  expect(refreshed?.status()).toBe(200)
  for (const selector of ['.product-heading h2', '.invoice-intro h2', '#cash-flow', '#reminders']) {
    const section = page.locator(selector)
    await section.scrollIntoViewIfNeeded()
    await expect(section).toBeVisible()
  }
})

test('invoice state changes update the amount and progress', async ({ page }) => {
  await page.goto('/#invoice-journey')
  await page.locator('.state-switcher button').nth(1).click()
  await expect(page.locator('.sheet-total strong')).toHaveText('$900.00')
  await expect(page.locator('.progress-caption span').nth(1)).toHaveText('50%')
  await page.locator('.state-switcher button').nth(2).click()
  await expect(page.locator('.sheet-total strong')).toHaveText('$0.00')
  await expect(page.locator('.invoice-status-chip')).toContainText('Paid')
})

test('reminder tone changes its draft copy', async ({ page }) => {
  await page.goto('/#reminders')
  await page.locator('.reminder-card').scrollIntoViewIfNeeded()
  const draft = page.locator('.draft-message p')
  await expect(draft).toContainText('hope your week is going well')
  await page.getByRole('button', { name: 'Firm', exact: true }).click()
  await expect(draft).toContainText('Please arrange payment')
  await page.getByRole('button', { name: 'Professional', exact: true }).click()
  await expect(draft).toContainText('I’m following up on invoice #1048')
})

test('payment delay recalculates the forecast deterministically', async ({ page }) => {
  await page.goto('/#cash-flow')
  await expect(page.locator('.forecast-summary strong')).toContainText('$20,590')
  const delay = page.locator('#delay-range')
  await delay.scrollIntoViewIfNeeded()
  await delay.fill('15')
  await expect(page.locator('.scenario-control output')).toHaveText('15 days later')
  await expect(page.locator('.forecast-summary strong')).toContainText('$20,590')
  await expect(page.locator('.low-balance b')).toHaveText('$13,100')
  await expect(page.locator('#scenario-description')).toContainText('crossed')
  await delay.fill('30')
  await expect(page.locator('.scenario-control output')).toHaveText('30 days later')
  await expect(page.locator('.forecast-summary strong')).toContainText('$14,390')
})

test('auth routes resolve and private workspace routes redirect signed-out visitors', async ({ page }) => {
  for (const route of ['/login', '/signup']) {
    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const refreshed = await page.reload()
    expect(refreshed?.status()).toBe(200)
    await expect(page.getByRole('link', { name: /FlowPilot/ }).first()).toHaveAttribute('href', '/')
  }
  for (const route of ['/app', '/app/invoices', '/app/expenses', '/app/payments', '/app/cashflow', '/app/reports']) {
    await page.goto(route)
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(route)}`))
    const refreshed = await page.reload()
    expect(refreshed?.status()).toBe(200)
  }
})

test('mobile navigation opens and mobile layout has no horizontal overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile-only viewport check')
  await page.goto('/')
  const menu = page.getByRole('button', { name: 'Open navigation' })
  await menu.click()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: 'Product' }).click()
  await expect(page).toHaveURL(/#product$/)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('page emits no browser runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.waitForTimeout(900)
  expect(errors).toEqual([])
})

test('reduced-motion preference keeps the full story visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('.product-heading h2').scrollIntoViewIfNeeded()
  await expect(page.locator('.product-heading h2')).toBeVisible()
  await page.locator('#cash-flow').scrollIntoViewIfNeeded()
  await expect(page.locator('.scenario-control')).toBeVisible()
})

test('theme toggle changes palette and persists the selected theme', async ({ page }) => {
  await page.goto('/')
  if (await page.getByRole('button', { name: 'Open navigation' }).isVisible()) {
    await page.getByRole('button', { name: 'Open navigation' }).click()
  }
  const toggle = page.getByRole('button', { name: 'Switch to dark theme' })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('flowpilot-theme'))).toBe('dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  if (await page.getByRole('button', { name: 'Open navigation' }).isVisible()) {
    await page.getByRole('button', { name: 'Open navigation' }).click()
  }
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('system theme is used when no visitor preference is saved', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('flowpilot-theme'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('tablet and mobile invoice controls remain readable and within the viewport', async ({ page, isMobile, browserName }) => {
  test.skip(browserName !== 'chromium' || (!isMobile && page.viewportSize()!.width < 760), 'Responsive layout check')
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 820, height: 1180 })
  await page.goto('/#invoice-journey')
  await expect(page.locator('.state-switcher')).toBeVisible()
  await page.getByRole('button', { name: /Partially paid/ }).click()
  await expect(page.locator('.sheet-total strong')).toHaveText('$900.00')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})
