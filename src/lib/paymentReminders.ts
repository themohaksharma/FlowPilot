export type ReminderTone = 'friendly' | 'professional' | 'firm'

export function createPaymentReminder(input: { tone: ReminderTone; customerName: string; invoiceNumber: string; balance: number; dueAt: string; currency: string }) {
  const amount = new Intl.NumberFormat(undefined, { style: 'currency', currency: input.currency, maximumFractionDigits: 2 }).format(input.balance)
  const name = input.customerName || 'there'
  if (input.tone === 'friendly') return `Hi ${name},\n\nI hope you’re doing well. Just a friendly reminder that invoice ${input.invoiceNumber} for ${amount} is due on ${input.dueAt}. Please let me know if you have any questions.\n\nThank you!`
  if (input.tone === 'firm') return `Hello ${name},\n\nInvoice ${input.invoiceNumber} has an outstanding balance of ${amount} and was due ${input.dueAt}. Please arrange payment promptly or contact us to discuss the balance.\n\nRegards,`
  return `Hello ${name},\n\nThis is a reminder that invoice ${input.invoiceNumber} has an outstanding balance of ${amount}, due ${input.dueAt}. Please let us know when we can expect payment.\n\nThank you.`
}

export function delayReceiptProjection(normalValues: number[], points: number[], amount: number, dueDay: number, delayDays: number) {
  return normalValues.map((value, index) => value - amount * (Number(dueDay <= points[index]) - Number(dueDay + delayDays <= points[index])))
}
