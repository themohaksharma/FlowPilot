import { expect, test } from '@playwright/test'

const testEmail = process.env.FLOWPILOT_TEST_EMAIL
const testPassword = process.env.FLOWPILOT_TEST_PASSWORD

// Playwright traces record form interactions; avoid retaining QA passwords.
test.use({ trace: 'off' })

test('authenticated invoice UI edits isolated invoices and downloads their PDF', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Run authenticated data workflow once against the dedicated test business')
  test.skip(!testEmail || !testPassword, 'Set FLOWPILOT_TEST_EMAIL and FLOWPILOT_TEST_PASSWORD for a verified, isolated Supabase test account')
  page.on('dialog', dialog => dialog.accept())
  const stamp = Date.now().toString()
  const customerName = `Invoice QA ${stamp}`
  const draftNumber = `QA-D-${stamp}`
  const unpaidNumber = `QA-U-${stamp}`
  const due = new Date(); due.setDate(due.getDate() + 14)
  const dueDate = `${due.getFullYear()}-${String(due.getMonth()+1).padStart(2,'0')}-${String(due.getDate()).padStart(2,'0')}`
  const createdNumbers: string[] = []
  let customerCreated = false
  try {
    await page.goto('/login')
    await page.getByLabel('Email address').fill(testEmail!)
    await page.locator('input[name="password"]').fill(testPassword!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/app')

    await page.goto('/app/customers')
    // WorkspaceLayout loads the business asynchronously. Do not submit while
    // FinancePages still has a null business profile (its handler returns early).
    const businessLabel = page.locator('.workspace-header .app-eyebrow')
    await expect(businessLabel).not.toBeEmpty()
    await expect(businessLabel).not.toHaveText('YOUR WORKSPACE')
    await page.getByRole('button', { name: /add customer/i }).click()
    await page.getByLabel('Customer name').fill(customerName)
    const customerInsert = page.waitForResponse(response =>
      response.url().includes('/rest/v1/customers') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /save record/i }).click()
    const insertResponse = await customerInsert
    expect(insertResponse.ok()).toBeTruthy()
    customerCreated = true
    const customerRow = page.locator('tbody tr').filter({ hasText: customerName })
    await expect(customerRow).toBeVisible()

    for (const [number, amount, status] of [[draftNumber, '250', 'draft'], [unpaidNumber, '300', 'unpaid']]) {
      await page.goto('/app/invoices')
      await page.getByRole('button', { name: /new invoice/i }).click()
      await page.getByLabel('Customer').selectOption({ label: customerName })
      await page.getByLabel('Invoice number').fill(number)
      await page.getByLabel('Due date').fill(dueDate)
      if (status === 'unpaid') await page.getByLabel('Status').selectOption('unpaid')
      await page.locator('.invoice-item-editor input').nth(0).fill('QA review service')
      await page.locator('.invoice-item-editor input').nth(2).fill(amount)
      await page.getByRole('button', { name: /save invoice/i }).click()
      await expect(page.getByText(number)).toBeVisible()
      createdNumbers.push(number)

      const row = page.locator('.invoice-list-row').filter({ hasText: number })
      await row.getByRole('button', { name: 'Edit invoice' }).click()
      await page.locator('.invoice-item-editor input').nth(2).fill(String(Number(amount) + 25))
      await page.getByRole('button', { name: /save invoice/i }).click()
      await expect(row).toContainText(String(Number(amount) + 25))

      if (number === draftNumber) {
        const downloadPromise = page.waitForEvent('download')
        await page.locator('.invoice-list-row').filter({ hasText: number }).getByRole('button', { name: 'Download invoice PDF' }).click()
        const download = await downloadPromise
        expect(download.suggestedFilename()).toBe(`${number}.pdf`)
        const filePath = await download.path()
        expect(filePath).toBeTruthy()
      }
    }
  } finally {
    for (const number of createdNumbers) {
      await page.goto('/app/invoices')
      const row = page.locator('.invoice-list-row').filter({ hasText: number })
      if (await row.count()) await row.getByRole('button', { name: 'Delete invoice' }).click()
    }
    if (customerCreated) {
      await page.goto('/app/customers')
      const businessLabel = page.locator('.workspace-header .app-eyebrow')
      await expect(businessLabel).not.toBeEmpty()
      await expect(businessLabel).not.toHaveText('YOUR WORKSPACE')
      const row = page.locator('tbody tr').filter({ hasText: customerName })
      if (await row.count()) await row.locator('.row-actions button').last().click()
    }
  }
})
