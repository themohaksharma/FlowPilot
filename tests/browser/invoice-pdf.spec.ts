import { expect, test } from '@playwright/test'
import { buildInvoicePdf } from '../../src/lib/invoicePdf'

const fixture = {
    businessName: 'QA Workspace', currency: 'INR', invoiceNumber: 'QA-INV-017', issuedAt: '2026-11-22', dueAt: '2026-12-05', status: 'partially_paid',
    customer: { name: 'QA Customer', email: 'customer@example.test' },
    items: [{ description: 'Design consultation', quantity: 2, unitPrice: 500, lineTotal: 1000 }],
    subtotal: 1000, discount: 50, tax: 90, total: 1040, paid: 400, balance: 640, paymentInstructions: 'Transfer to the business account.',
  }

test('invoice PDF contains saved invoice, customer, line and balance details', () => {
  const document = buildInvoicePdf(fixture)
  const bytes = document.output('arraybuffer') as ArrayBuffer
  const pdf = new TextDecoder().decode(bytes)
  expect(pdf.startsWith('%PDF-')).toBe(true)
  for (const value of ['QA Workspace', 'QA-INV-017', 'QA Customer', 'Design consultation', 'Balance due', 'INR 640.00', 'Transfer to the business account.']) {
    expect(pdf).toContain(value)
  }
})

test('invoice PDF downloads in a browser', async ({ page }) => {
  await page.goto('/')
  const downloadPromise = page.waitForEvent('download')
  await page.evaluate(async (data) => {
    const { buildInvoicePdf } = await import('/src/lib/invoicePdf.ts')
    buildInvoicePdf(data).save(`${data.invoiceNumber}.pdf`)
  }, fixture)
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('QA-INV-017.pdf')
  const path = await download.path()
  expect(path).toBeTruthy()
  const fs = await import('node:fs/promises')
  const bytes = await fs.readFile(path!)
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
})
