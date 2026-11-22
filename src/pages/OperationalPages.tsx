import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Check, Clipboard, Download, FilePlus2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../auth/supabase'
import { createPaymentReminder, delayReceiptProjection, type ReminderTone } from '../lib/paymentReminders'

type Profile = { id: string; currency?: string; business_name?: string; opening_cash?: number | null }
type WorkspaceContext = { profile: Profile | null }
type Expense = { id: string; description: string; amount: number; spent_at: string; category: string; created_at: string }
type Bill = { id: string; description: string; amount: number; due_at: string; paid_at: string | null; created_at: string }
type Invoice = { id: string; invoice_number: string; customer_id: string | null; total: number; status: string; due_at: string | null }
type Payment = { invoice_id: string | null; amount: number; received_at: string; method?: string | null }
type Customer = { id: string; name: string; email: string | null }
type FollowUp = { id: string; invoice_id: string | null; body: string; channel: string; sent_at: string | null; created_at: string }
const categories = ['Advertising', 'Banking', 'Equipment', 'Meals', 'Office', 'Rent', 'Software', 'Travel', 'Utilities', 'Other']
const money = (amount: number, currency = 'INR') => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const plusDays = (value: string, days: number) => { const d = new Date(`${value}T12:00:00`); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const dayDiff = (from: string, to: string) => Math.floor((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000)
function downloadCsv(name: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows.map(row => row.map(value => {
    const text = String(value ?? '')
    const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}

export function ExpenseManagementPage() {
  const { profile } = useOutletContext<WorkspaceContext>()
  const [kind, setKind] = useState<'expense' | 'bill'>('expense')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<Expense | Bill | null>(null)
  const [refresh, setRefresh] = useState(0)

  const load = useCallback(async () => {
    if (!supabase || !profile?.id) { setLoading(false); return }
    setLoading(true); setError('')
    const [expenseResult, billResult] = await Promise.all([
      supabase.from('expenses').select('*').eq('business_id', profile.id).order('spent_at', { ascending: false }),
      supabase.from('business_bills').select('*').eq('business_id', profile.id).order('due_at', { ascending: true }),
    ])
    if (expenseResult.error || billResult.error) setError(expenseResult.error?.message || billResult.error?.message || 'Could not load financial records.')
    else { setExpenses((expenseResult.data || []) as Expense[]); setBills((billResult.data || []) as Bill[]) }
    setLoading(false)
  }, [profile?.id])
  useEffect(() => { void load() }, [load, refresh])

  const records = useMemo(() => kind === 'expense'
    ? expenses.filter(row => `${row.description} ${row.category}`.toLowerCase().includes(query.toLowerCase()))
    : bills.filter(row => (filter === 'all' || (filter === 'paid' ? Boolean(row.paid_at) : !row.paid_at)) && `${row.description} ${row.due_at}`.toLowerCase().includes(query.toLowerCase())), [bills, expenses, filter, kind, query])

  function openForm(row?: Expense | Bill) { setEditing(row || null); setShow(true); setError('') }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase || !profile?.id) return
    const form = new FormData(e.currentTarget), description = String(form.get('description')).trim(), amount = Number(form.get('amount'))
    if (!description || !Number.isFinite(amount) || amount <= 0) { setError('Enter a description and an amount greater than zero.'); return }
    setBusy(true); setError('')
    let message: string | undefined
    if (kind === 'expense') {
      const record = { description, amount, category: String(form.get('category')), spent_at: String(form.get('date')), business_id: profile.id }
      const result = editing ? await supabase.from('expenses').update(record).eq('business_id', profile.id).eq('id', editing.id) : await supabase.from('expenses').insert(record)
      message = result.error?.message
    } else {
      const record = { description, amount, due_at: String(form.get('date')), business_id: profile.id }
      const result = editing ? await supabase.from('business_bills').update(record).eq('business_id', profile.id).eq('id', editing.id) : await supabase.from('business_bills').insert(record)
      message = result.error?.message
    }
    setBusy(false)
    if (message) setError(message)
    else { setShow(false); setEditing(null); setRefresh(n => n + 1) }
  }
  async function setPaid(row: Bill) {
    if (!supabase || !profile?.id) return
    const { error: updateError } = await supabase.from('business_bills').update({ paid_at: row.paid_at ? null : today() }).eq('business_id', profile.id).eq('id', row.id)
    if (updateError) setError(updateError.message); else setRefresh(n => n + 1)
  }
  async function remove(row: Expense | Bill) {
    if (!supabase || !profile?.id || !confirm(`Delete “${row.description}”? This cannot be undone.`)) return
    const result = kind === 'expense' ? await supabase.from('expenses').delete().eq('business_id', profile.id).eq('id', row.id) : await supabase.from('business_bills').delete().eq('business_id', profile.id).eq('id', row.id)
    if (result.error) setError(result.error.message); else setRefresh(n => n + 1)
  }

  const expenseRows = [['Description', 'Category', 'Amount', 'Date'], ...expenses.map(row => [row.description, row.category, row.amount, row.spent_at])]
  const billRows = [['Description', 'Amount', 'Due date', 'Status', 'Paid date'], ...bills.map(row => [row.description, row.amount, row.due_at, row.paid_at ? 'Paid' : 'Unpaid', row.paid_at])]
  return <section className="coming-panel finance-module">
    <header className="finance-module-head"><div><span className="app-eyebrow">BUSINESS RECORDS · {profile?.business_name || 'YOUR BUSINESS'}</span><h2>Expenses &amp; bills</h2><p>Actual expenses and unpaid bills are tracked separately to avoid counting the same balance twice.</p></div><div className="finance-head-actions"><button className="workspace-secondary" onClick={() => downloadCsv(kind === 'expense' ? 'flowpilot-expenses.csv' : 'flowpilot-business-bills.csv', kind === 'expense' ? expenseRows : billRows)}><Download size={16}/> Export CSV</button><button className="workspace-primary" onClick={() => openForm()}><Plus size={16}/> Add {kind === 'expense' ? 'expense' : 'bill'}</button></div></header>
    <div className="finance-toolbar"><div className="finance-tabs" role="tablist" aria-label="Financial record type"><button role="tab" aria-selected={kind === 'expense'} onClick={() => { setKind('expense'); setFilter('all'); setShow(false) }}>Expenses <span>{expenses.length}</span></button><button role="tab" aria-selected={kind === 'bill'} onClick={() => { setKind('bill'); setFilter('all'); setShow(false) }}>Supplier bills <span>{bills.length}</span></button></div><label className="finance-search"><Search size={16}/><input aria-label="Search records" placeholder="Search records" value={query} onChange={e => setQuery(e.target.value)}/></label>{kind === 'bill' && <select aria-label="Filter bill status" value={filter} onChange={e => setFilter(e.target.value as typeof filter)}><option value="all">All statuses</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option></select>}</div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {loading ? <p role="status">Loading financial records…</p> : records.length === 0 ? <div className="module-empty"><span className="app-eyebrow">NO SAVED {kind === 'expense' ? 'EXPENSES' : 'BILLS'}</span><h3>{query ? 'No records match that search.' : kind === 'expense' ? 'Your expense history starts here.' : 'No supplier bills recorded.'}</h3><p>Only records saved to this business appear here.</p></div> : <div className="finance-record-list">{records.map(raw => {
      const row = raw as Expense & Bill
      const paid = kind === 'bill' && Boolean(row.paid_at)
      return <article className="finance-record" key={row.id}><div className="finance-record-icon">{kind === 'expense' ? <ArrowUpRight size={18}/> : <FilePlus2 size={18}/>}</div><div className="finance-record-copy"><b>{row.description}</b><span>{kind === 'expense' ? `${row.category} · Spent ${row.spent_at}` : `Due ${row.due_at}${row.paid_at ? ` · Paid ${row.paid_at}` : ''}`}</span></div><strong>{money(Number(row.amount), profile?.currency)}</strong>{kind === 'bill' && <span className={paid ? 'record-status is-paid' : 'record-status'}>{paid ? 'Paid' : 'Unpaid'}</span>}<div className="finance-record-actions">{kind === 'bill' && <button className="workspace-secondary" onClick={() => void setPaid(row)}>{paid ? 'Mark unpaid' : 'Mark paid'}</button>}<button aria-label={`Edit ${row.description}`} onClick={() => openForm(row)}><Pencil size={16}/></button><button aria-label={`Delete ${row.description}`} onClick={() => void remove(row)}><Trash2 size={16}/></button></div></article>
    })}</div>}
    {show && <div className="invoice-modal-backdrop"><form role="dialog" aria-modal="true" aria-labelledby="expense-form-title" className="invoice-edit-form finance-record-form" onSubmit={save}><header><div><span className="app-eyebrow">{editing ? 'EDIT RECORD' : 'NEW RECORD'}</span><h3 id="expense-form-title">{editing ? 'Update' : 'Add'} {kind === 'expense' ? 'expense' : 'business bill'}</h3></div><button type="button" onClick={() => setShow(false)} aria-label="Close">×</button></header><label>Description<input name="description" required maxLength={160} defaultValue={editing?.description}/></label>{kind === 'expense' && <label>Category<select name="category" defaultValue={(editing as Expense | null)?.category || 'Other'}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>}<label>Amount<input name="amount" type="number" min="0.01" step="0.01" required defaultValue={editing?.amount}/></label><label>{kind === 'expense' ? 'Expense date' : 'Due date'}<input name="date" type="date" required defaultValue={kind === 'expense' ? (editing as Expense | null)?.spent_at || today() : (editing as Bill | null)?.due_at || today()}/></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="workspace-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></form></div>}
  </section>
}

export function ReminderAssistantPage() {
  const { profile } = useOutletContext<WorkspaceContext>()
  const [invoices, setInvoices] = useState<Invoice[]>([]), [payments, setPayments] = useState<Payment[]>([]), [customers, setCustomers] = useState<Customer[]>([]), [history, setHistory] = useState<FollowUp[]>([])
  const [tone, setTone] = useState<ReminderTone>('professional'), [selected, setSelected] = useState(''), [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false), [payInvoiceId, setPayInvoiceId] = useState(''), [payAmount, setPayAmount] = useState(''), [payMethod, setPayMethod] = useState('Bank transfer')
  const load = useCallback(async () => {
    if (!supabase || !profile?.id) { setLoading(false); return }
    setLoading(true); setError('')
    const [ir, pr, cr, hr] = await Promise.all([
      supabase.from('invoices').select('id,invoice_number,customer_id,total,status,due_at').eq('business_id', profile.id).neq('status', 'draft'),
      supabase.from('payments').select('invoice_id,amount,received_at,method').eq('business_id', profile.id),
      supabase.from('customers').select('id,name,email').eq('business_id', profile.id),
      supabase.from('follow_ups').select('*').eq('business_id', profile.id).order('created_at', { ascending: false }).limit(50),
    ])
    const failure = ir.error || pr.error || cr.error || hr.error
    if (failure) setError(failure.message)
    else { setInvoices((ir.data || []) as Invoice[]); setPayments((pr.data || []) as Payment[]); setCustomers((cr.data || []) as Customer[]); setHistory((hr.data || []) as FollowUp[]) }
    setLoading(false)
  }, [profile?.id])
  useEffect(() => { void load() }, [load])
  const customerMap = useMemo(() => new Map(customers.map(customer => [customer.id, customer])), [customers])
  const paidByInvoice = useMemo(() => { const map = new Map<string, number>(); payments.forEach(payment => { if (payment.invoice_id) map.set(payment.invoice_id, (map.get(payment.invoice_id) || 0) + Number(payment.amount)) }); return map }, [payments])
  const needsFollowUp = useMemo(() => invoices.map(invoice => ({ ...invoice, balance: Math.max(0, Number(invoice.total) - (paidByInvoice.get(invoice.id) || 0)) })).filter(invoice => invoice.balance > 0 && invoice.due_at && invoice.due_at <= plusDays(today(), 7)).sort((a, b) => String(a.due_at).localeCompare(String(b.due_at))), [invoices, paidByInvoice])
  const payableInvoices = useMemo(() => invoices.map(invoice => ({ ...invoice, balance: Math.max(0, Number(invoice.total) - (paidByInvoice.get(invoice.id) || 0)) })).filter(invoice => invoice.status !== 'draft' && invoice.balance > 0), [invoices, paidByInvoice])
  const currentInvoice = needsFollowUp.find(invoice => invoice.id === selected) || needsFollowUp[0]
  const currentCustomer = customerMap.get(currentInvoice?.customer_id || '')
  useEffect(() => { if (!selected && currentInvoice) setSelected(currentInvoice.id) }, [selected, currentInvoice])
  useEffect(() => {
    if (!currentInvoice) { setDraft(''); return }
    setDraft(createPaymentReminder({ tone, customerName: currentCustomer?.name || '', invoiceNumber: currentInvoice.invoice_number, balance: currentInvoice.balance, dueAt: currentInvoice.due_at || 'soon', currency: profile?.currency || 'INR' }))
  }, [currentInvoice?.id, currentInvoice?.balance, currentCustomer?.name, profile?.currency, tone])
  async function copyDraft() { try { await navigator.clipboard.writeText(draft); setNotice('Reminder draft copied. FlowPilot did not send a message.') } catch { setError('Clipboard access was blocked. Select and copy the draft manually.') } }
  async function saveDraft(sent: boolean) {
    if (!supabase || !profile?.id || !currentInvoice || !draft.trim()) return
    setBusy(true); setError(''); setNotice('')
    const { error: insertError } = await supabase.from('follow_ups').insert({ business_id: profile.id, invoice_id: currentInvoice.id, channel: 'email', body: draft.trim(), sent_at: sent ? new Date().toISOString() : null })
    setBusy(false)
    if (insertError) setError(insertError.message)
    else { setNotice(sent ? 'Marked as sent. FlowPilot did not send an email or message.' : 'Reminder draft saved.'); await load() }
  }
  async function markHistorySent(item: FollowUp) {
    if (!supabase || !profile?.id) return
    const { error: updateError } = await supabase.from('follow_ups').update({ sent_at: new Date().toISOString() }).eq('business_id', profile.id).eq('id', item.id)
    if (updateError) setError(updateError.message); else { setNotice('Marked as sent by you. FlowPilot did not send a message.'); await load() }
  }
  async function recordPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase || !profile?.id || !payInvoiceId) return
    const amount = Number(payAmount)
    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter a payment amount greater than zero.'); return }
    setBusy(true); setError(''); setNotice('')
    const { error: paymentError } = await supabase.rpc('record_invoice_payment', { p_business_id: profile.id, p_invoice_id: payInvoiceId, p_amount: amount, p_method: payMethod })
    setBusy(false)
    if (paymentError) setError(paymentError.message)
    else { setPayAmount(''); setNotice('Payment recorded and allocated to the selected invoice.'); await load() }
  }
  return <section className="coming-panel finance-module"><header className="finance-module-head"><div><span className="app-eyebrow">COLLECTIONS · SAVED INVOICE BALANCES</span><h2>Payments &amp; follow-ups</h2><p>Record allocated payments and prepare editable reminders for invoices due soon. Messages are not sent externally.</p></div><button className="workspace-primary" onClick={()=>setShowPaymentForm(!showPaymentForm)}><Plus size={16}/>{showPaymentForm?'Close':'Record payment'}</button></header>{showPaymentForm&&<form className="record-payment-form" onSubmit={recordPayment}><label>Invoice<select required value={payInvoiceId} onChange={e=>setPayInvoiceId(e.target.value)}><option value="">Select an open invoice</option>{payableInvoices.map(invoice=><option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · {money(invoice.balance,profile?.currency)} outstanding</option>)}</select></label><label>Amount<input type="number" min="0.01" step="0.01" required value={payAmount} onChange={e=>setPayAmount(e.target.value)}/></label><label>Payment method<select value={payMethod} onChange={e=>setPayMethod(e.target.value)}>{['Bank transfer','Cash','Card','Other'].map(method=><option key={method}>{method}</option>)}</select></label><button className="workspace-primary" disabled={busy||!payableInvoices.length}>{busy?'Recording…':'Record payment'}</button>{!payableInvoices.length&&<small>No invoices have an outstanding balance.</small>}</form>}{error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status" className="form-success">{notice}</p>}{loading ? <p role="status">Loading invoices and reminder history…</p> : <div className="reminder-layout"><div className="reminder-queue"><h3>Needs attention <span>{needsFollowUp.length}</span></h3>{needsFollowUp.length ? needsFollowUp.map(invoice => { const customer = customerMap.get(invoice.customer_id || ''); const overdueDays = invoice.due_at && invoice.due_at < today() ? dayDiff(invoice.due_at, today()) : 0; return <button key={invoice.id} className={currentInvoice?.id === invoice.id ? 'reminder-queue-row selected' : 'reminder-queue-row'} onClick={() => setSelected(invoice.id)}><b>{customer?.name || 'Customer'}</b><span>{invoice.invoice_number} · {overdueDays ? `${overdueDays} days overdue` : `Due ${invoice.due_at}`}</span><strong>{money(invoice.balance, profile?.currency)}</strong></button> }) : <div className="module-empty"><h3>No invoices need a follow-up.</h3><p>Only open balances due within the next 7 days appear here.</p></div>}</div><div className="reminder-composer"><div className="reminder-selected"><span className="app-eyebrow">{currentInvoice ? currentInvoice.invoice_number : 'NO INVOICE SELECTED'}</span><b>{currentCustomer?.name || 'Choose an invoice from the queue'}</b>{currentInvoice && <small>Outstanding {money(currentInvoice.balance, profile?.currency)} · Due {currentInvoice.due_at}</small>}</div><label>Tone<select value={tone} onChange={e => setTone(e.target.value as typeof tone)}><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="firm">Firm</option></select></label><label className="reminder-draft-label">Editable reminder<textarea value={draft} onChange={e => setDraft(e.target.value)} disabled={!currentInvoice} rows={9}/></label><div className="finance-head-actions"><button className="workspace-secondary" disabled={!draft || !currentInvoice} onClick={() => void copyDraft()}><Clipboard size={16}/> Copy draft</button><button className="workspace-secondary" disabled={busy || !currentInvoice} onClick={() => void saveDraft(false)}>Save draft</button><button className="workspace-primary" disabled={busy || !currentInvoice} onClick={() => void saveDraft(true)}><Check size={16}/> Mark sent</button></div><small className="honesty-note">“Mark sent” only records your action. No email or WhatsApp integration is connected.</small></div></div>}
    <section className="reminder-history payment-history-panel"><div className="panel-heading"><div><span className="app-eyebrow">RECORDED PAYMENTS</span><h3>Recent payment activity</h3></div></div>{payments.length ? payments.slice(0,10).map((payment,index) => {const invoice=invoices.find(row=>row.id===payment.invoice_id);return <div className="detail-line" key={`${payment.invoice_id}-${payment.received_at}-${index}`}><span>{invoice?.invoice_number||'Unallocated payment'} · {new Date(payment.received_at).toLocaleString()} · {payment.method||'Method not recorded'}</span><b>{money(Number(payment.amount),profile?.currency)}</b></div>}) : <p className="activity-empty">No recorded payments yet.</p>}</section><section className="reminder-history"><div className="panel-heading"><div><span className="app-eyebrow">FOLLOW-UP HISTORY</span><h3>Recent reminders</h3></div></div>{history.length ? history.map(item => { const invoice = invoices.find(row => row.id === item.invoice_id); return <article className="reminder-history-row" key={item.id}><div><b>{invoice?.invoice_number || 'Invoice'}</b><span>{item.sent_at ? `Marked sent ${new Date(item.sent_at).toLocaleString()}` : `Draft saved ${new Date(item.created_at).toLocaleString()}`}</span><p>{item.body}</p></div><div><button className="workspace-secondary" onClick={() => { setSelected(item.invoice_id || ''); setDraft(item.body) }}>Edit draft</button>{!item.sent_at && <button className="workspace-primary" onClick={() => void markHistorySent(item)}>Mark sent</button>}</div></article> }) : <p className="activity-empty">Saved reminder drafts and sent markers will appear here.</p>}</section>
  </section>
}

type ForecastEvent = { day: number; amount: number; kind: 'in' | 'out'; label: string }
export function CashFlowPage() {
  const { profile } = useOutletContext<WorkspaceContext>()
  const [invoices, setInvoices] = useState<Invoice[]>([]), [payments, setPayments] = useState<Payment[]>([]), [expenses, setExpenses] = useState<{ amount: number; spent_at: string }[]>([]), [bills, setBills] = useState<Bill[]>([])
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30), [delay, setDelay] = useState(15), [selectedInvoice, setSelectedInvoice] = useState('')
  const [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { if (!profile?.id || !supabase) { setLoading(false); return } let active = true; setLoading(true); setError(''); void Promise.all([
    supabase.from('invoices').select('id,invoice_number,customer_id,total,status,due_at').eq('business_id', profile.id).neq('status', 'draft'),
    supabase.from('payments').select('invoice_id,amount,received_at').eq('business_id', profile.id),
    supabase.from('expenses').select('amount,spent_at').eq('business_id', profile.id),
    supabase.from('business_bills').select('*').eq('business_id', profile.id).is('paid_at', null),
  ]).then(([ir, pr, er, br]) => { if (!active) return; const failure = ir.error || pr.error || er.error || br.error; if (failure) setError(failure.message); else { setInvoices((ir.data || []) as Invoice[]); setPayments((pr.data || []) as Payment[]); setExpenses((er.data || []) as { amount: number; spent_at: string }[]); setBills((br.data || []) as Bill[]) } setLoading(false) }); return () => { active = false } }, [profile?.id])
  const paidByInvoice = useMemo(() => { const map = new Map<string, number>(); payments.forEach(payment => { if (payment.invoice_id) map.set(payment.invoice_id, (map.get(payment.invoice_id) || 0) + Number(payment.amount)) }); return map }, [payments])
  const openInvoices = useMemo(() => invoices.map(invoice => ({ ...invoice, balance: Math.max(0, Number(invoice.total) - (paidByInvoice.get(invoice.id) || 0)) })).filter(invoice => invoice.balance > 0 && invoice.due_at), [invoices, paidByInvoice])
  const dayZero = today()
  const currentBalance = Number(profile?.opening_cash || 0) + payments.filter(payment => payment.received_at.slice(0, 10) <= dayZero).reduce((sum, payment) => sum + Number(payment.amount), 0) - expenses.filter(expense => expense.spent_at < dayZero).reduce((sum, expense) => sum + Number(expense.amount), 0)
  const forecast = useMemo(() => {
    const events: ForecastEvent[] = []
    for (const invoice of openInvoices) { const dueDay = dayDiff(dayZero, invoice.due_at || dayZero); if (dueDay <= horizon) events.push({ day: Math.max(0, dueDay), amount: invoice.balance, kind: 'in', label: invoice.invoice_number }) }
    for (const expense of expenses) { const day = dayDiff(dayZero, expense.spent_at); if (day >= 0 && day <= horizon) events.push({ day, amount: Number(expense.amount), kind: 'out', label: 'Expense' }) }
    for (const bill of bills) { const dueDay = dayDiff(dayZero, bill.due_at); if (dueDay <= horizon) events.push({ day: Math.max(0, dueDay), amount: Number(bill.amount), kind: 'out', label: bill.description }) }
    const points = Array.from({ length: horizon / 15 + 1 }, (_, i) => Math.min(i * 15, horizon))
    const values = points.map(day => currentBalance + events.filter(event => event.day <= day).reduce((sum, event) => sum + (event.kind === 'in' ? event.amount : -event.amount), 0))
    return { events, points, values, ending: values.at(-1) || currentBalance }
  }, [bills, currentBalance, dayZero, expenses, horizon, openInvoices])
  const eligibleScenario = openInvoices.filter(invoice => invoice.due_at && dayDiff(dayZero, invoice.due_at) >= 0 && dayDiff(dayZero, invoice.due_at) <= 90).sort((a, b) => b.balance - a.balance)
  useEffect(() => { if (!eligibleScenario.some(invoice => invoice.id === selectedInvoice)) setSelectedInvoice(eligibleScenario[0]?.id || '') }, [eligibleScenario, selectedInvoice])
  const scenarioInvoice = eligibleScenario.find(invoice => invoice.id === selectedInvoice)
  const normalValues = forecast.points.map(day => currentBalance + forecast.events.filter(event => event.day <= day).reduce((sum, event) => sum + (event.kind === 'in' ? event.amount : -event.amount), 0))
  const scenarioValues = scenarioInvoice?.due_at ? delayReceiptProjection(normalValues, forecast.points, scenarioInvoice.balance, dayDiff(dayZero, scenarioInvoice.due_at), delay) : normalValues
  const maxVal = Math.max(1, ...forecast.values, ...scenarioValues), minVal = Math.min(0, ...forecast.values, ...scenarioValues), span = maxVal - minVal || 1
  const pathFor = (values: number[]) => values.map((value, i) => `${i ? 'L' : 'M'} ${30 + (i * 740) / Math.max(1, values.length - 1)} ${230 - ((value - minVal) / span) * 195}`).join(' ')
  const dueWithoutDate = invoices.filter(invoice => invoice.status !== 'draft' && !invoice.due_at && Math.max(0, Number(invoice.total) - (paidByInvoice.get(invoice.id) || 0)) > 0).length
  return <section className="coming-panel finance-module"><header className="finance-module-head"><div><span className="app-eyebrow">PROJECTED · DERIVED FROM YOUR RECORDS</span><h2>Cash-flow forecast</h2><p>Expected invoice balances enter on their due dates; saved future expenses and unpaid bills leave on their dates. Past-due invoices and bills are placed on day zero; invoices without due dates are excluded.</p></div><label className="horizon-select">Forecast window<select value={horizon} onChange={e => setHorizon(Number(e.target.value) as typeof horizon)}><option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option></select></label></header>{error && <p role="alert" className="form-error">{error}</p>}{loading ? <p role="status">Loading saved cash-flow data…</p> : <><div className="forecast-summary-cards"><article><span>Recorded starting cash</span><b>{profile?.opening_cash == null ? 'Not recorded' : money(currentBalance, profile?.currency)}</b><small>Opening balance + payments − expenses dated before today</small></article><article><span>Projected at {horizon} days</span><b>{money(forecast.ending, profile?.currency)}</b><small>Includes due-date invoice balances, future expenses and unpaid bills</small></article><article><span>Open receivables without due dates</span><b>{dueWithoutDate}</b><small>Not included until a due date is recorded</small></article></div><div className="forecast-chart-panel"><div className="forecast-chart-head"><div><span className="app-eyebrow">NORMAL FORECAST</span><h3>Expected cash position</h3></div><div className="forecast-legend"><span><i className="legend-in"/> Incoming</span><span><i className="legend-out"/> Outgoing</span></div></div>{forecast.events.length ? <svg className="forecast-chart" viewBox="0 0 800 260" role="img" aria-label={`Cash forecast for ${horizon} days from ${money(currentBalance, profile?.currency)} to ${money(forecast.ending, profile?.currency)}`}><line x1="30" x2="770" y1="230" y2="230"/><path d={pathFor(forecast.values)} fill="none" stroke="var(--app-accent)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>{forecast.values.map((value,i)=><g key={i}><circle cx={30+(i*740)/Math.max(1,forecast.values.length-1)} cy={230-((value-minVal)/span)*195} r="4"/><text x={30+(i*740)/Math.max(1,forecast.values.length-1)} y="252" textAnchor="middle">Day {forecast.points[i]}</text></g>)}</svg> : <div className="module-empty"><h3>Add due dates and bills to shape your forecast.</h3><p>The projection needs saved incoming or outgoing records.</p></div>}<div className="forecast-event-list">{forecast.events.length ? forecast.events.sort((a,b)=>a.day-b.day).slice(0,8).map((event,i)=><div key={`${event.label}-${i}`}><span className={event.kind==='in'?'event-kind-in':'event-kind-out'}>{event.kind==='in'?<ArrowDownLeft size={16}/>:<ArrowUpRight size={16}/>}</span><span><b>{event.label}</b><small>{event.day===0?'Today (including past due)':'In '+event.day+' days'} · {event.kind==='in'?'Expected receipt':'Scheduled outflow'}</small></span><strong>{event.kind==='in'?'+':'−'}{money(event.amount,profile?.currency)}</strong></div>) : <p className="activity-empty">No forecast events in this window.</p>}</div></div><section className="scenario-panel"><div><span className="app-eyebrow">WHAT-IF · ILLUSTRATIVE SCENARIO ON SAVED INVOICE DATA</span><h3>What if a customer pays late?</h3><p>Move one expected receipt later and compare the projected curve. This does not change the saved invoice or payment.</p></div>{eligibleScenario.length ? <><label>Invoice<select value={selectedInvoice} onChange={e=>setSelectedInvoice(e.target.value)}>{eligibleScenario.map(invoice=><option key={invoice.id} value={invoice.id}>{invoice.invoice_number} · {money(invoice.balance,profile?.currency)}</option>)}</select></label><label className="scenario-slider">Delay <output>{delay} days</output><input type="range" min="0" max="30" step="1" value={delay} onChange={e=>setDelay(Number(e.target.value))}/></label><div className="scenario-compare"><span>Normal at {horizon} days <b>{money(forecast.ending,profile?.currency)}</b></span><span>Adjusted <b>{money(scenarioValues.at(-1)||currentBalance,profile?.currency)}</b></span><strong>Difference <b>{money((scenarioValues.at(-1)||currentBalance)-forecast.ending,profile?.currency)}</b></strong></div><svg className="forecast-chart scenario-chart" viewBox="0 0 800 260" role="img" aria-label="Comparison of normal and delayed payment forecast"><path d={pathFor(forecast.values)} fill="none" stroke="var(--app-accent)" strokeWidth="4"/><path d={pathFor(scenarioValues)} fill="none" stroke="#d69ca2" strokeWidth="4" strokeDasharray="8 7"/></svg><p className="honesty-note">The change is computed as the selected invoice’s full outstanding balance arriving {delay} days later. Forecast timing is an assumption based on recorded due dates.</p></> : <div className="module-empty"><h3>No dated open invoice can be delayed yet.</h3><p>Add an invoice with a due date to run a scenario.</p></div>}</section></>}</section>
}

export function ReportsPage() {
  const { profile } = useOutletContext<WorkspaceContext>()
  const [invoices, setInvoices] = useState<Invoice[]>([]), [payments, setPayments] = useState<Payment[]>([]), [expenses, setExpenses] = useState<{ description: string; category: string; amount: number; spent_at: string }[]>([]), [bills, setBills] = useState<Bill[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => { if (!profile?.id || !supabase) { setLoading(false); return } let active = true; void Promise.all([
    supabase.from('invoices').select('id,invoice_number,customer_id,total,status,due_at').eq('business_id', profile.id),
    supabase.from('payments').select('*').eq('business_id', profile.id).order('received_at', { ascending: false }),
    supabase.from('expenses').select('description,category,amount,spent_at').eq('business_id', profile.id).order('spent_at', { ascending: false }),
    supabase.from('business_bills').select('*').eq('business_id', profile.id).order('due_at', { ascending: true }),
  ]).then(([ir, pr, er, br]) => { if (!active) return; const failure=ir.error||pr.error||er.error||br.error; if(failure)setError(failure.message);else{setInvoices((ir.data||[]) as Invoice[]);setPayments((pr.data||[]) as Payment[]);setExpenses((er.data||[]) as typeof expenses);setBills((br.data||[]) as Bill[])}setLoading(false) }); return () => { active = false } }, [profile?.id])
  const paidByInvoice = useMemo(() => { const map=new Map<string,number>();payments.forEach(p=>{if(p.invoice_id)map.set(p.invoice_id,(map.get(p.invoice_id)||0)+Number(p.amount))});return map },[payments])
  const receivables = invoices.filter(i=>i.status!=='draft').reduce((sum,i)=>sum+Math.max(0,Number(i.total)-(paidByInvoice.get(i.id)||0)),0)
  const overdue = invoices.filter(i=>i.status!=='draft'&&i.due_at&&i.due_at<today()).reduce((sum,i)=>sum+Math.max(0,Number(i.total)-(paidByInvoice.get(i.id)||0)),0)
  const revenue = payments.reduce((sum,p)=>sum+Number(p.amount),0), expenseTotal=expenses.reduce((sum,e)=>sum+Number(e.amount),0), unpaidBills=bills.filter(b=>!b.paid_at).reduce((sum,b)=>sum+Number(b.amount),0)
  const cashEnding = Number(profile?.opening_cash||0)+revenue-expenseTotal
  function exportReport() {
    const rows:(string|number|null|undefined)[][]=[['FlowPilot recorded financial report',`Business: ${profile?.business_name||'Business'}`,`Generated: ${today()}`],[],['Invoices'],['Invoice number','Status','Due date','Total','Paid','Outstanding'],...invoices.map(i=>[i.invoice_number,i.status,i.due_at,i.total,paidByInvoice.get(i.id)||0,Math.max(0,Number(i.total)-(paidByInvoice.get(i.id)||0))]),[],['Payments'],['Received at','Invoice ID','Amount','Method'],...payments.map(p=>[p.received_at,p.invoice_id,p.amount,'']),[],['Expenses'],['Description','Category','Amount','Date'],...expenses.map(e=>[e.description,e.category,e.amount,e.spent_at]),[],['Business bills'],['Description','Due date','Amount','Status','Paid date'],...bills.map(b=>[b.description,b.due_at,b.amount,b.paid_at?'Paid':'Unpaid',b.paid_at]),[],['Summary','Amount'],['Recorded payments',revenue],['Outstanding receivables',receivables],['Overdue receivables',overdue],['Recorded expenses',expenseTotal],['Unpaid bills',unpaidBills],['Cash estimate (opening + receipts - expenses)',cashEnding]]
    downloadCsv('flowpilot-financial-report.csv',rows)
  }
  return <section className="coming-panel finance-module"><header className="finance-module-head"><div><span className="app-eyebrow">BUSINESS REPORTING · RECORDED DATA</span><h2>Reports</h2><p>Summaries are based on saved records. Forecast balances are estimates, not guarantees.</p></div><button className="workspace-primary" onClick={exportReport} disabled={loading||Boolean(error)}><Download size={16}/> Export financial CSV</button></header>{error&&<p role="alert" className="form-error">{error}</p>}{loading?<p role="status">Loading reports…</p>:<><div className="report-metric-grid">{[['Payments received',money(revenue,profile?.currency)],['Outstanding receivables',money(receivables,profile?.currency)],['Overdue invoices',money(overdue,profile?.currency)],['Recorded expenses',money(expenseTotal,profile?.currency)],['Unpaid bills',money(unpaidBills,profile?.currency)],['Cash estimate',money(cashEnding,profile?.currency)]].map(([label,value])=><article key={label}><span>{label}</span><b>{value}</b></article>)}</div><div className="report-lists"><section><div className="panel-heading"><h3>Payments received</h3><span>{payments.length}</span></div>{payments.length?payments.slice(0,8).map((p,i)=><div className="detail-line" key={`${p.invoice_id}-${p.received_at}-${i}`}><span>{new Date(p.received_at).toLocaleDateString()} · {p.invoice_id?'Invoice payment':'Unallocated payment'}</span><b>{money(Number(p.amount),profile?.currency)}</b></div>):<p className="activity-empty">No recorded payments yet.</p>}</section><section><div className="panel-heading"><h3>Upcoming bills</h3><span>{bills.filter(b=>!b.paid_at).length}</span></div>{bills.filter(b=>!b.paid_at).slice(0,8).map(b=><div className="detail-line" key={b.id}><span>{b.description} · Due {b.due_at}</span><b>{money(Number(b.amount),profile?.currency)}</b></div>)}</section></div><p className="honesty-note">The cash estimate uses opening cash + all recorded payments − recorded expenses. Unpaid bills are shown separately and are not subtracted again.</p></>}</section>
}
