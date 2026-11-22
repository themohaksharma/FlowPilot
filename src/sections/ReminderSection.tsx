import { useState } from 'react'
import { ArrowUpRight, Check, Copy, MessageCircle, Send } from 'lucide-react'
import Reveal from '../components/Reveal'

const messages = {
  Friendly: 'Hi Morgan, hope your week is going well! Just a quick note that $900 is still open on invoice #1048. Let me know if you need me to resend the details. Thanks so much!',
  Professional: 'Hello Morgan, I’m following up on invoice #1048, which has an outstanding balance of $900 and is now 12 days past due. Please let me know if you have any questions.',
  Firm: 'Hello Morgan, our records show $900 remains outstanding on invoice #1048, now 12 days past due. Please arrange payment or contact us to discuss the outstanding balance.',
}

export default function ReminderSection() {
  const [tone, setTone] = useState<keyof typeof messages>('Friendly')
  const [reviewed, setReviewed] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyDraft = async () => {
    try { await navigator.clipboard.writeText(messages[tone]); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
    catch { setCopied(false) }
  }
  return <section className="reminder-section" id="reminders">
    <div className="reminder-story"><Reveal><span className="eyebrow"><i/> THE FOLLOW-UP, WITH A HUMAN TOUCH</span><h2>Say it in a way<br/>that sounds like <em>you.</em></h2><p>A reminder draft gives you a place to start. Adjust the tone, make it your own, and choose what happens next.</p><div className="reminder-promises"><span><Check size={13}/> You choose the tone</span><span><Check size={13}/> You review every draft</span><span><Check size={13}/> Nothing sends itself</span></div><span className="reminder-footnote">A PRODUCT PREVIEW · NO MESSAGE IS SENT</span></Reveal></div>
    <Reveal className="reminder-composition"><div className="reminder-backnote"><span>FOLLOW-UP NOTE</span><b>One thoughtful nudge<br/>can clear the air.</b><i/></div><div className="reminder-card"><div className="reminder-card-top"><div><span className="tiny-index">PAYMENT FOLLOW-UP</span><h3>Ready for your review.</h3></div><span className={reviewed ? 'draft-status reviewed' : 'draft-status'}><i/>{reviewed ? 'REVIEWED' : 'DRAFT'}</span></div>
      <div className="overdue-customer"><span className="customer-monogram">ML</span><div><small>TO</small><b>Morgan Lee <span>·</span> Studio North</b><span>Invoice #1048</span></div><div className="amount-due"><small>OUTSTANDING</small><b>$900</b><span>12 days overdue</span></div></div>
      <div className="tone-label">CHOOSE A TONE <span>YOUR VOICE, YOUR CALL</span></div><div className="tone-buttons" role="group" aria-label="Reminder tone">{Object.keys(messages).map(item => <button key={item} className={tone === item ? 'tone-active' : ''} aria-pressed={tone === item} onClick={() => { setTone(item as keyof typeof messages); setReviewed(false) }}>{item}</button>)}</div>
      <div className="draft-message"><div className="draft-message-head"><MessageCircle size={12}/> SUGGESTED EMAIL DRAFT <span>EDITABLE</span></div><p>{messages[tone]}</p><div className="draft-signoff">Warmly,<br/><b>Your business</b></div></div>
      <div className="reminder-actions"><button className="copy-draft" onClick={copyDraft}><Copy size={12}/>{copied ? 'Copied draft' : 'Copy draft'}</button><button className="review-draft" aria-pressed={reviewed} onClick={() => setReviewed(!reviewed)}>{reviewed ? <><Check size={13}/> Ready for you</> : <>Mark reviewed <ArrowUpRight size={13}/></>}</button></div>
      <div className="human-check"><span><i/> HUMAN CHECKPOINT</span><small>Review the details before sharing anywhere.</small></div>
    </div><div className="reminder-composition-note"><Send size={11}/> Prepared with care. Shared only when you decide.</div></Reveal>
  </section>
}
