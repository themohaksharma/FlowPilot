import { useEffect, useRef } from 'react'
import { CalendarDays, CircleHelp, FileWarning, ReceiptText } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Reveal from '../components/Reveal'

gsap.registerPlugin(ScrollTrigger)

export default function ProblemSection() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 68%', end: 'bottom 48%', scrub: 1 } })
      tl.to('.debris-invoice', { x: 100, y: 70, rotate: 0, scale: .9, ease: 'power2.inOut' }, 0)
        .to('.debris-cost', { x: -130, y: 65, rotate: 0, scale: .9, ease: 'power2.inOut' }, 0)
        .to('.debris-payment', { x: 90, y: -68, rotate: 0, scale: .9, ease: 'power2.inOut' }, 0)
        .to('.debris-cash', { x: -118, y: -62, rotate: 0, scale: .9, ease: 'power2.inOut' }, 0)
        .to('.problem-rings', { scale: 1.2, opacity: .75 }, 0)
    }, ref)
    return () => ctx.revert()
  }, [])

  return <section className="problem-scene" ref={ref} id="story">
    <div className="problem-copy"><Reveal><span className="eyebrow eyebrow-on-dark"><i/> A FAMILIAR KIND OF FRIDAY</span><h2>It’s not the business<br/>that feels <em>messy.</em></h2><p>It’s the invoice in one place, the payment in another, the receipt you meant to file—and the quiet question of what’s coming next.</p></Reveal></div>
    <div className="problem-canvas" aria-label="Scattered illustrative finance tasks">
      <div className="problem-rings"/>
      <span className="problem-centerword">the in-between</span>
      <div className="debris debris-invoice"><span className="debris-symbol warm"><FileWarning size={15}/></span><div><small>DRAFT · NOT SENT</small><b>Invoice for Morgan</b><em>Still in drafts</em></div><span className="debris-corner">01</span></div>
      <div className="debris debris-cost"><span className="debris-symbol sage"><ReceiptText size={15}/></span><div><small>EXPENSE NOTE</small><b>Studio supplies</b><em>Which card was this?</em></div><span className="debris-corner">02</span></div>
      <div className="debris debris-payment"><span className="debris-symbol copper">↗</span><div><small>PAYMENT STATUS</small><b>Invoice #1048</b><em>Did it come through?</em></div><span className="debris-corner">03</span></div>
      <div className="debris debris-cash"><span className="debris-symbol stone"><CalendarDays size={15}/></span><div><small>UP AHEAD</small><b>Rent due next week</b><em><CircleHelp size={10}/> Cash position unclear</em></div><span className="debris-corner">04</span></div>
      <span className="problem-side-note">FOUR LITTLE QUESTIONS<br/>TAKING UP A LOT OF SPACE</span>
    </div>
    <div className="problem-foot"><span>THE MONEY IS MOVING.</span><p>It’s the <em>picture</em> that’s missing.</p><span>02 — FIND THE THROUGH LINE</span></div>
  </section>
}
