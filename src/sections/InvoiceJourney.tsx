import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Check, Clock3, FileText, ShieldCheck } from 'lucide-react'
import Reveal from '../components/Reveal'

const states = ['Pending', 'Partially paid', 'Paid'] as const
type InvoiceState = typeof states[number]

export default function InvoiceJourney() {
  const [state, setState] = useState<InvoiceState>('Pending')
  const received = state === 'Paid' ? 1800 : state === 'Partially paid' ? 900 : 0
  const due = 1800 - received
  const progress = received / 1800 * 100
  return <section className="invoice-section" id="invoice-journey">
    <div className="invoice-intro"><Reveal><span className="eyebrow"><i/> AN INVOICE, IN CONTEXT</span><h2>From “sent” to<br/><em>settled.</em></h2></Reveal><Reveal from="right"><p>A payment can happen in pieces. The status and remaining balance keep pace, so you know where things stand.</p></Reveal></div>
    <div className="invoice-stage">
      <div className="invoice-controls"><span className="tiny-index">01 — PAYMENT JOURNEY</span><h3>One invoice.<br/>A clearer picture.</h3><p>Choose a state to see the details update.</p><div className="state-switcher" role="group" aria-label="Choose invoice payment state">{states.map((item, index) => <button key={item} className={state === item ? 'state-current' : ''} aria-pressed={state === item} onClick={() => setState(item)}><span>0{index + 1}</span>{item}{state === item && <ArrowUpRight size={13}/>}</button>)}</div><small className="data-flag">ILLUSTRATIVE INVOICE PREVIEW</small></div>
      <Reveal className="invoice-sheet"><div className="sheet-corner">FLOWPILOT <span>·</span> DEMO</div><div className="sheet-top"><div className="sheet-mark">f.</div><div className="sheet-label">INVOICE <b>#1048</b></div></div><div className="sheet-divider"/><div className="sheet-parties"><div><small>PREPARED FOR</small><b>Morgan Lee</b><span>Studio North</span></div><div><small>ISSUED BY</small><b>Your business</b><span>hello@yourbusiness.com</span></div></div><div className="sheet-description"><span>Brand identity project</span><span>$1,800.00</span></div><div className="sheet-description muted"><span>Issued Nov 07 · Due Nov 21</span><span>NET 14</span></div><div className="sheet-divider"/><div className="sheet-total"><span>{due > 0 ? 'REMAINING BALANCE' : 'BALANCE SETTLED'}</span><strong>${due.toLocaleString()}{due === 0 ? '.00' : '.00'}</strong></div><div className="payment-progress"><div className="progress-label"><span>PAYMENT RECEIVED</span><b>${received.toLocaleString()}.00 <i>OF $1,800.00</i></b></div><div className="progress-track"><span style={{ width: `${progress}%` }}/></div><div className="progress-caption"><span>{state === 'Paid' ? 'Paid in full' : state === 'Partially paid' ? 'Partial payment · Nov 15' : 'Awaiting payment'}</span><span>{progress}%</span></div></div><div className={`invoice-status-chip chip-${state.toLowerCase().replace(' ', '-')}`}>{state === 'Paid' ? <Check size={12}/> : <Clock3 size={12}/>} {state === 'Pending' ? 'Awaiting payment' : state}</div></Reveal>
      <div className="payment-receipt"><div className="receipt-topline"><span>{received > 0 ? <ArrowDownLeft size={12}/> : <Clock3 size={12}/>}</span><small>{received > 0 ? 'PAYMENT ACTIVITY' : 'NEXT EXPECTED STEP'}</small></div><strong>{received > 0 ? `$${received.toLocaleString()}.00` : '$1,800.00'}</strong><span>{received > 0 ? 'Received · Morgan Lee' : 'Due from Morgan Lee'}</span><div className="receipt-rule"><i style={{ width: `${progress}%` }}/></div><div className="receipt-foot"><span>{state === 'Paid' ? 'COMPLETE' : state === 'Partially paid' ? '$900 REMAINING' : 'DUE NOV 21'}</span><ShieldCheck size={13}/></div></div>
    </div>
    <div className="invoice-bottomline"><span>AN INVOICE IS A STORY, NOT A STATIC DOCUMENT.</span><div><FileText size={13}/><i/> Payment<i/> Balance<i/> Status</div><span>02 / FOLLOW THE FLOW</span></div>
  </section>
}
