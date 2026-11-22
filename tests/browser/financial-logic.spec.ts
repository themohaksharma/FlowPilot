import { expect, test } from '@playwright/test'
import { createPaymentReminder, delayReceiptProjection } from '../../src/lib/paymentReminders'

test('reminder tones use invoice details and remain editable text', () => {
  const base = { customerName: 'Avery', invoiceNumber: 'INV-204', balance: 640, dueAt: '2026-12-05', currency: 'INR' }
  const friendly = createPaymentReminder({ ...base, tone: 'friendly' })
  const professional = createPaymentReminder({ ...base, tone: 'professional' })
  const firm = createPaymentReminder({ ...base, tone: 'firm' })
  for (const draft of [friendly, professional, firm]) expect(draft).toContain('INV-204')
  expect(friendly).toContain('friendly reminder')
  expect(professional).toContain('outstanding balance')
  expect(firm).toContain('Please arrange payment promptly')
  expect(firm).toContain('640')
})

test('15-day payment delay moves only the selected receipt inside the forecast window', () => {
  const normal = [1000, 1400, 1400, 1400]
  const points = [0, 15, 30, 45]
  expect(delayReceiptProjection(normal, points, 400, 15, 15)).toEqual([1000, 1000, 1400, 1400])
})
