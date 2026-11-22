import { useEffect, useRef } from 'react'
import { ArrowDownRight, ArrowUpRight, Check, Clock3, FileText, MoreHorizontal, Wallet } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Reveal from '../components/Reveal'

gsap.registerPlugin(ScrollTrigger)

export default function ProductSection() {
  const composition = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = composition.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 78%', once: true } })
      tl.fromTo('.product-surface', { y: 70, rotate: -3, autoAlpha: 0, clipPath: 'inset(0 0 100% 0)' }, { y: 0, rotate: -1, autoAlpha: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.15, ease: 'power3.out' })
        .from('.product-metrics > div', { y: 18, autoAlpha: 0, stagger: .12, duration: .65, ease: 'power2.out' }, .45)
        .from('.invoice-row', { x: -15, autoAlpha: 0, stagger: .1, duration: .5, ease: 'power2.out' }, .8)
        .from('.product-annotation', { x: 20, autoAlpha: 0, duration: .6, ease: 'power2.out' }, .7)
    }, composition)
    return () => context.revert()
  }, [])

  return <section className="product-section" id="product">
    <div className="product-heading"><Reveal><span className="eyebrow"><i/> ONE VIEW, CONNECTED</span><h2>Bring the moving parts<br/>into the <em>same frame.</em></h2></Reveal><Reveal from="right"><p>Customers, invoices, payments and upcoming costs—finally sitting beside one another.</p></Reveal></div>
    <div className="product-composition" ref={composition}>
      <div className="product-surface">
        <div className="product-surface-head"><div className="surface-brand">f.</div><div className="surface-title"><small>YOUR BUSINESS / OVERVIEW</small><h3>A more complete picture.</h3></div><span className="surface-date">NOV 21 <MoreHorizontal size={17}/></span></div>
        <div className="product-metrics"><div className="metric-primary"><small>OUTSTANDING</small><strong>$8,460<span>.00</span></strong><span className="metric-direction"><ArrowDownRight size={12}/> Across 6 open invoices</span><div className="metric-rule"><i/></div><span className="metric-note">Illustrative data · demo workspace</span></div><div className="metric-secondary"><small>COLLECTED THIS MONTH</small><strong>$12,840</strong><span className="metric-direction positive"><ArrowUpRight size={12}/> 4 payments received</span></div><div className="metric-secondary"><small>UPCOMING BILLS</small><strong>$3,180</strong><span className="metric-direction">3 due in the next 14 days</span></div></div>
        <div className="product-lower"><div className="customer-table"><div className="surface-section-head"><span>RECENT INVOICES</span><span>VIEW ALL <ArrowUpRight size={10}/></span></div><div className="table-head"><span>CUSTOMER</span><span>INVOICE</span><span>STATUS</span><span>AMOUNT</span></div><div className="invoice-row"><span><i className="person-dot person-olive">ML</i><b>Morgan Lee</b></span><span>#1048</span><span className="row-status status-partial"><i/>Partially paid</span><b>$900</b></div><div className="invoice-row"><span><i className="person-dot person-sand">AR</i><b>Alex Rivera</b></span><span>#1047</span><span className="row-status status-paid"><Check size={10}/>Paid</span><b>$1,250</b></div><div className="invoice-row"><span><i className="person-dot person-blue">SC</i><b>Sam Chen</b></span><span>#1046</span><span className="row-status status-pending"><Clock3 size={10}/>Pending</span><b>$680</b></div></div>
          <div className="product-activity"><div className="surface-section-head"><span>RECENT ACTIVITY</span><span>THIS WEEK</span></div><div className="activity-entry"><i className="activity-icon green"><Check size={12}/></i><div><b>Payment received</b><small>Morgan Lee · Invoice #1048</small></div><strong>+$900</strong></div><div className="activity-entry"><i className="activity-icon bronze"><FileText size={12}/></i><div><b>Invoice sent</b><small>Alex Rivera · Invoice #1047</small></div><strong>$1,250</strong></div><div className="activity-entry"><i className="activity-icon neutral"><Wallet size={12}/></i><div><b>Expense recorded</b><small>Studio supplies</small></div><strong>−$186</strong></div></div>
        </div>
      </div>
      <div className="product-annotation"><span className="annotation-line"/><span>Details that speak<br/><em>to one another.</em></span></div>
      <div className="product-orbit-label">FLOWPILOT <i>✳</i> IN CONTEXT</div>
    </div>
    <div className="product-caption" id="how-it-works"><span>LESS RECONCILING. MORE UNDERSTANDING.</span><p>A connected view helps you spot what needs your attention, and what can wait.</p><span>DEMO DATA · NOT A LIVE WORKSPACE</span></div>
  </section>
}
