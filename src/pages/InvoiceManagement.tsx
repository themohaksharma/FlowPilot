import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Download, Eye, FilePlus2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../auth/supabase'
import { buildInvoicePdf } from '../lib/invoicePdf'

type Customer = { id: string; name: string; email: string | null }
type Item = { id?: string; description: string; quantity: number; unit_price: number; line_total?: number; position?: number }
type Payment = { id: string; amount: number; received_at: string; method: string | null }
type Invoice = { id: string; business_id: string; customer_id: string | null; invoice_number: string; total: number; status: string; issued_at: string | null; due_at: string | null; tax_amount: number; discount_amount: number; payment_instructions: string; customer: Customer | null; items: Item[]; payments: Payment[]; paid: number; balance: number; derivedStatus: string }
type Ctx = { profile: { id: string; business_name?: string; business_type?: string; currency?: string } | null }
const dateToday = () => new Date().toISOString().slice(0, 10)
const money = (n: number, c = 'INR') => new Intl.NumberFormat(undefined, { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(n)
function status(i: { status: string; due_at: string | null; total: number }, paid: number) {
  if (i.status === 'draft') return 'draft'
  if (paid >= Number(i.total)) return 'paid'
  if (paid > 0) return 'partially_paid'
  if (i.due_at && i.due_at < dateToday()) return 'overdue'
  return 'unpaid'
}
type Draft = { customer_id: string; invoice_number: string; issued_at: string; due_at: string; discount: string; tax: string; instructions: string; status: string }

export default function InvoiceManagement() {
  const { profile } = useOutletContext<Ctx>()
  const [list, setList] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('due_at')
  const [selected, setSelected] = useState<string | null>(null)
  const [editor, setEditor] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [draft, setDraft] = useState<Draft>({ customer_id: '', invoice_number: '', issued_at: dateToday(), due_at: '', discount: '0', tax: '0', instructions: '', status: 'draft' })

  const load = useCallback(async () => {
    if (!supabase || !profile?.id) return
    setLoading(true); setError('')
    const [ir, cr, pr, li] = await Promise.all([
      supabase.from('invoices').select('*').eq('business_id', profile.id),
      supabase.from('customers').select('id,name,email').eq('business_id', profile.id).order('name'),
      supabase.from('payments').select('*').eq('business_id', profile.id).order('received_at', { ascending: false }),
      supabase.from('invoice_items').select('*').eq('business_id', profile.id).order('position'),
    ])
    const err = ir.error || cr.error || pr.error || li.error
    if (err) setError(err.message)
    else {
      const pMap = new Map<string, Payment[]>()
      for (const p of (pr.data || []) as Payment[]) pMap.set((p as Payment & { invoice_id: string }).invoice_id, [...(pMap.get((p as Payment & { invoice_id: string }).invoice_id) || []), p])
      const cMap = new Map((cr.data || []).map(c => [c.id, c as Customer]))
      const itemRows = li.data || []
      setCustomers((cr.data || []) as Customer[])
      setList((ir.data || []).map(raw => {
        const i = raw as Omit<Invoice, 'customer' | 'items' | 'payments' | 'paid' | 'balance' | 'derivedStatus'>
        const ps = pMap.get(i.id) || []
        const paid = ps.reduce((n, p) => n + Number(p.amount), 0)
        const its = itemRows.filter(x => x.invoice_id === i.id) as Item[]
        return { ...i, customer: cMap.get(i.customer_id || '') || null, items: its, payments: ps, paid, balance: Math.max(0, Number(i.total) - paid), derivedStatus: status(i, paid) }
      }))
    }
    setLoading(false)
  }, [profile?.id])
  useEffect(() => { void load() }, [load])

  function create() {
    setEditing(null); setEditor(true); setItems([{ description: '', quantity: 1, unit_price: 0 }])
    setDraft({ customer_id: '', invoice_number: 'INV-' + Date.now().toString().slice(-6), issued_at: dateToday(), due_at: '', discount: '0', tax: '0', instructions: '', status: 'draft' })
    setError('')
  }
  function edit(i: Invoice) {
    setEditing(i); setSelected(i.id); setEditor(true)
    setItems(i.items.length ? i.items.map(x => ({ ...x })) : [{ description: '', quantity: 1, unit_price: 0 }])
    setDraft({ customer_id: i.customer_id || '', invoice_number: i.invoice_number, issued_at: i.issued_at || dateToday(), due_at: i.due_at || '', discount: String(i.discount_amount), tax: String(i.tax_amount), instructions: i.payment_instructions || '', status: i.status })
    setError('')
  }
  const subtotal = items.reduce((s, x) => s + Math.round(Number(x.quantity) * Number(x.unit_price) * 100) / 100, 0)
  const total = Math.round((subtotal - Number(draft.discount || 0) + Number(draft.tax || 0)) * 100) / 100
  async function save(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !profile?.id) return
    if (items.length === 0 || items.some(x => !x.description.trim() || Number(x.quantity) <= 0 || Number(x.unit_price) < 0)) { setError('Add valid descriptions, quantities and prices for every line.'); return }
    if (editing && total < editing.paid) { setError('Invoice total cannot be less than the amount already paid.'); return }
    setSaving(true); setError('')
    const { error: e1 } = await supabase.rpc('save_invoice', {
      p_business_id: profile.id, p_invoice_id: editing?.id || null, p_customer_id: draft.customer_id,
      p_invoice_number: draft.invoice_number, p_issued_at: draft.issued_at || null, p_due_at: draft.due_at,
      p_discount: Number(draft.discount), p_tax: Number(draft.tax), p_total: total,
      p_payment_instructions: draft.instructions, p_status: draft.status,
      p_items: items.map((x, position) => ({ description: x.description, quantity: Number(x.quantity), unit_price: Number(x.unit_price), position })),
    })
    setSaving(false)
    if (e1) setError(e1.message); else { setEditor(false); setEditing(null); await load() }
  }
  async function remove(i: Invoice) {
    if (!supabase || !profile?.id || !confirm('Delete this invoice? Invoice payment history is never deleted.')) return
    const { error: e } = await supabase.rpc('delete_unpaid_invoice', { p_business_id: profile.id, p_invoice_id: i.id })
    if (e) setError(e.message); else { setSelected(null); await load() }
  }
  function pdf(i: Invoice) {
    const doc = buildInvoicePdf({
      businessName: profile?.business_name || 'Business', currency: profile?.currency || 'INR',
      invoiceNumber: i.invoice_number, issuedAt: i.issued_at, dueAt: i.due_at, status: i.derivedStatus,
      customer: i.customer, items: i.items.map(line => ({ description: line.description, quantity: Number(line.quantity), unitPrice: Number(line.unit_price), lineTotal: Number(line.line_total ?? Number(line.quantity) * Number(line.unit_price)) })),
      subtotal: subtotalFor(i), discount: Number(i.discount_amount), tax: Number(i.tax_amount), total: Number(i.total), paid: i.paid, balance: i.balance,
      paymentInstructions: i.payment_instructions,
    })
    doc.save(i.invoice_number + '.pdf')
  }
  const rows = list.filter(i => (filter === 'all' || i.derivedStatus === filter) && (i.invoice_number + ' ' + (i.customer?.name || '')).toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'total' ? Number(b.total) - Number(a.total) : sort === 'invoice_number' ? a.invoice_number.localeCompare(b.invoice_number, undefined, { numeric: true }) : String(a.due_at || '').localeCompare(String(b.due_at || '')))
  return <section className="coming-panel invoice-management">
    <header className="invoice-module-head"><div><span className="app-eyebrow">BUSINESS RECORDS · {profile?.business_name || 'YOUR BUSINESS'}</span><h2>Invoices</h2><p>Balances and statuses reflect saved payment allocations.</p></div><button className="workspace-primary" onClick={create}><FilePlus2 size={16}/> New invoice</button></header>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="invoice-filters"><input aria-label="Search invoices" placeholder="Search invoice or customer" value={search} onChange={e => setSearch(e.target.value)}/><select aria-label="Filter status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option>{['draft','unpaid','partially_paid','paid','overdue'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}</select><select aria-label="Sort invoices" value={sort} onChange={e => setSort(e.target.value)}><option value="due_at">Due date</option><option value="invoice_number">Invoice number</option><option value="total">Total</option></select></div>
    {loading ? <p role="status">Loading invoices…</p> : rows.length === 0 ? <div className="module-empty"><span className="app-eyebrow">NO MATCHING INVOICES</span><h3>{search || filter !== 'all' ? 'No matches. Adjust filters.' : 'Create your first invoice.'}</h3></div> : <div className="invoice-list">{rows.map(i => <article className="invoice-list-row" key={i.id}><div className="invoice-row-main"><button aria-expanded={selected === i.id} aria-controls={`invoice-detail-${i.id}`} onClick={() => setSelected(selected === i.id ? null : i.id)}><b>{i.invoice_number}</b><small>{i.customer?.name || 'Customer'} · Due {i.due_at || '—'}</small></button><span className={'invoice-status status-' + i.derivedStatus}>{i.derivedStatus.replace('_',' ')}</span><span><small>Outstanding</small><b>{money(i.balance, profile?.currency)}</b></span></div><div className="invoice-actions"><button onClick={() => setSelected(selected === i.id ? null : i.id)} aria-label="View invoice"><Eye size={16}/></button><button onClick={() => edit(i)} aria-label="Edit invoice"><Pencil size={16}/></button><button onClick={() => pdf(i)} aria-label="Download invoice PDF"><Download size={16}/></button><button onClick={() => remove(i)} aria-label="Delete invoice"><Trash2 size={16}/></button></div>{selected === i.id && <div id={`invoice-detail-${i.id}`} className="invoice-details"><div><b>{i.customer?.name || '—'}</b><span>{i.customer?.email || 'No email recorded'}</span><span>Issued {i.issued_at || '—'} · Due {i.due_at || '—'}</span></div><h4>Items</h4>{i.items.map((x,n) => <div className="detail-line" key={x.id || n}><span>{x.description} · {x.quantity} × {money(Number(x.unit_price),profile?.currency)}</span><b>{money(Number(x.line_total ?? x.quantity*x.unit_price),profile?.currency)}</b></div>)}<div className="detail-totals"><span>Subtotal</span><b>{money(subtotalFor(i),profile?.currency)}</b><span>Discount</span><b>−{money(Number(i.discount_amount),profile?.currency)}</b><span>Tax</span><b>{money(Number(i.tax_amount),profile?.currency)}</b><strong>Total</strong><strong>{money(Number(i.total),profile?.currency)}</strong><strong>Paid</strong><strong>{money(i.paid,profile?.currency)}</strong><strong>Balance due</strong><strong>{money(i.balance,profile?.currency)}</strong></div><h4>Payment history</h4>{i.payments.length ? i.payments.map(p => <div className="detail-line" key={p.id}><span>{new Date(p.received_at).toLocaleString()} · {p.method || 'Payment allocation'}</span><b>{money(Number(p.amount),profile?.currency)}</b></div>) : <p>No payments recorded.</p>}<button className="workspace-secondary" onClick={() => pdf(i)}>Download invoice PDF</button></div>}</article>)}</div>}
    {editor && <div className="invoice-modal-backdrop"><form role="dialog" aria-modal="true" aria-labelledby="invoice-editor-title" className="invoice-edit-form" onSubmit={save}><header><div><span className="app-eyebrow">{editing ? 'EDIT INVOICE' : 'NEW INVOICE'}</span><h3 id="invoice-editor-title">{editing?.invoice_number || 'Invoice details'}</h3></div><button type="button" onClick={() => setEditor(false)} aria-label="Close"><X/></button></header><label>Customer<select required value={draft.customer_id} onChange={e => setDraft({...draft,customer_id:e.target.value})}><option value="">Choose customer</option>{customers.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Invoice number<input required value={draft.invoice_number} onChange={e => setDraft({...draft,invoice_number:e.target.value})}/></label><div className="date-fields"><label>Issue date<input type="date" value={draft.issued_at} onChange={e => setDraft({...draft,issued_at:e.target.value})}/></label><label>Due date<input required type="date" value={draft.due_at} onChange={e => setDraft({...draft,due_at:e.target.value})}/></label></div>{!editing && <label>Status<select value={draft.status} onChange={e => setDraft({...draft,status:e.target.value})}><option value="draft">Draft</option><option value="unpaid">Unpaid</option></select></label>}<h4>Line items</h4>{items.map((x,n) => <div className="invoice-item-editor" key={n}><input placeholder="Description" value={x.description} onChange={e => setItems(items.map((v,j) => j===n ? {...v,description:e.target.value}:v))}/><input aria-label="Quantity" type="number" min="0.001" step="0.001" value={x.quantity} onChange={e => setItems(items.map((v,j) => j===n ? {...v,quantity:Number(e.target.value)}:v))}/><input aria-label="Unit price" type="number" min="0" step="0.01" value={x.unit_price} onChange={e => setItems(items.map((v,j) => j===n ? {...v,unit_price:Number(e.target.value)}:v))}/><b>{money(Number(x.quantity)*Number(x.unit_price),profile?.currency)}</b><button type="button" onClick={() => setItems(items.filter((_,j) => j!==n))}>×</button></div>)}<button className="workspace-secondary" type="button" onClick={() => setItems([...items,{description:'',quantity:1,unit_price:0}])}><Plus size={15}/> Add item</button><div className="date-fields"><label>Discount<input type="number" min="0" step="0.01" value={draft.discount} onChange={e => setDraft({...draft,discount:e.target.value})}/></label><label>Tax<input type="number" min="0" step="0.01" value={draft.tax} onChange={e => setDraft({...draft,tax:e.target.value})}/></label></div><label>Payment instructions<textarea value={draft.instructions} onChange={e => setDraft({...draft,instructions:e.target.value})}/></label><div className="invoice-edit-total"><span>Total</span><b>{money(total,profile?.currency)}</b>{editing && <small>Paid {money(editing.paid,profile?.currency)} · Remaining after save {money(total-editing.paid,profile?.currency)}</small>}</div><button className="workspace-primary" disabled={saving || customers.length===0}>{saving?'Saving…':'Save invoice'}</button>{customers.length===0 && <p>Add a customer before creating an invoice.</p>}</form></div>}
  </section>
}
function subtotalFor(i: Invoice) { return i.items.reduce((s,x) => s + Number(x.line_total ?? x.quantity*x.unit_price),0) }
