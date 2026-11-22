import { jsPDF } from 'jspdf'

export type InvoicePdfData = {
  businessName: string
  currency: string
  invoiceNumber: string
  issuedAt: string | null
  dueAt: string | null
  status: string
  customer: { name: string; email: string | null } | null
  items: { description: string; quantity: number; unitPrice: number; lineTotal: number }[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paid: number
  balance: number
  paymentInstructions: string
}

const amountText = (value: number, currency: string) => `${currency} ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function buildInvoicePdf(invoice: InvoicePdfData) {
  const doc = new jsPDF()
  let y = 20
  doc.setFont('helvetica', 'bold'); doc.setFontSize(21); doc.text(invoice.businessName || 'Business', 18, y)
  doc.setFontSize(17); doc.text('INVOICE', 192, y, { align: 'right' }); y += 13
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text('Invoice: ' + invoice.invoiceNumber, 18, y); doc.text('Status: ' + invoice.status.replace('_', ' '), 192, y, { align: 'right' }); y += 7
  doc.text('Issued: ' + (invoice.issuedAt || '—'), 18, y); doc.text('Due: ' + (invoice.dueAt || '—'), 192, y, { align: 'right' }); y += 12
  doc.setFont('helvetica', 'bold'); doc.text('Bill to', 18, y); y += 6
  doc.setFont('helvetica', 'normal'); doc.text(invoice.customer?.name || 'Customer', 18, y); y += 6
  if (invoice.customer?.email) { doc.text(invoice.customer.email, 18, y); y += 6 }
  y += 5; doc.setFont('helvetica', 'bold'); doc.text('Description', 18, y); doc.text('Qty', 140, y, { align: 'right' }); doc.text('Unit price', 170, y, { align: 'right' }); doc.text('Amount', 192, y, { align: 'right' }); y += 4; doc.line(18, y, 192, y); y += 7
  doc.setFont('helvetica', 'normal')
  for (const line of invoice.items) {
    const desc = doc.splitTextToSize(line.description, 105) as string[]
    if (y + Math.max(7, desc.length * 5) > 270) { doc.addPage(); y = 20 }
    doc.text(desc, 18, y); doc.text(String(line.quantity), 140, y, { align: 'right' }); doc.text(amountText(line.unitPrice, invoice.currency), 170, y, { align: 'right' }); doc.text(amountText(line.lineTotal, invoice.currency), 192, y, { align: 'right' })
    y += Math.max(7, desc.length * 5)
  }
  y += 4; if (y > 220) { doc.addPage(); y = 20 } doc.line(120, y, 192, y); y += 8
  for (const [label, value] of [['Subtotal', invoice.subtotal], ['Discount', -invoice.discount], ['Tax', invoice.tax], ['Total', invoice.total], ['Paid', invoice.paid], ['Balance due', invoice.balance]] as [string, number][]) {
    doc.text(label, 145, y); doc.text(amountText(value, invoice.currency), 192, y, { align: 'right' }); y += 7
  }
  y += 7
  const instructions = doc.splitTextToSize('Payment instructions: ' + (invoice.paymentInstructions || 'Contact the business for payment details.'), 174) as string[]
  if (y + instructions.length * 5 > 280) { doc.addPage(); y = 20 }
  doc.text(instructions, 18, y)
  return doc
}
