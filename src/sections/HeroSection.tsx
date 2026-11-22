import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowUpRight, Check, CircleDollarSign, FileText, Sparkles } from 'lucide-react'
import gsap from 'gsap'
import Navigation from '../components/Navigation'
import MagneticLink from '../components/MagneticLink'

export default function HeroSection() {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.nav-shell', { y: -18, autoAlpha: 0, duration: .8 })
        .from('.hero-kicker', { y: 16, autoAlpha: 0, duration: .55 }, .25)
        .from('.hero-line > span', { yPercent: 110, rotate: 1.5, duration: .95, stagger: .13 }, .35)
        .from('.hero-deck, .hero-actions, .hero-scroll-cue', { y: 20, autoAlpha: 0, duration: .7, stagger: .12 }, .95)
        .from('.visual-window', { clipPath: 'inset(100% 0 0 0)', scale: 1.035, duration: 1.1 }, .5)
        .from('.float-receipt, .float-activity, .hero-stamp', { y: 25, rotate: 5, autoAlpha: 0, duration: .65, stagger: .13 }, 1.05)
      gsap.to('.hero-orbit', { y: -10, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      gsap.to('.hero-visual', { y: -16, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 1 } })
    }, root)
    return () => ctx.revert()
  }, [])

  return <section className="hero" ref={root}>
    <Navigation />
    <div className="hero-ambient" aria-hidden="true"><span className="hero-orbit orbit-left"/><span className="hero-orbit orbit-right"/><span className="hero-cross">✳</span></div>
    <div className="hero-layout">
      <div className="hero-copy">
        <div className="hero-kicker"><span className="kicker-line"/> YOUR BUSINESS, IN BETTER ORDER <span className="kicker-index">01 / 04</span></div>
        <h1 aria-label="Everything your business needs to flow."><span className="hero-line"><span>Everything your</span></span><span className="hero-line"><span><em>business</em> needs</span></span><span className="hero-line"><span>to <em className="hero-flow">flow.</em></span></span></h1>
        <p className="hero-deck">Invoices, collections, expenses and what’s next—<br className="desktop-break"/>all in one clear view of your business.</p>
        <div className="hero-actions"><MagneticLink href="/signup" className="button button-light">Get started <ArrowUpRight size={16}/></MagneticLink><a className="button-quiet" href="#product">Explore FlowPilot <ArrowDown size={14}/></a></div>
        <a className="hero-scroll-cue" href="#story"><span className="scroll-rail"><i/></span><span>SCROLL TO FIND YOUR FLOW</span></a>
      </div>
      <div className="hero-visual" aria-label="Illustrative FlowPilot financial workspace preview">
        <div className="visual-halo"/>
        <div className="visual-coordinate">A CLEARER PICTURE <b>·</b> DEMO DATA</div>
        <div className="visual-window">
          <div className="window-chrome"><div className="chrome-dots"><i/><i/><i/></div><span>FLOWPILOT / OVERVIEW</span><span className="chrome-menu">•••</span></div>
          <div className="window-layout">
            <aside className="visual-rail"><span className="rail-brand">f.</span><i className="rail-selected">◈</i><i>▤</i><i>⌁</i><i>◷</i><i>♧</i><i className="rail-bottom">◌</i></aside>
            <div className="visual-main">
              <div className="visual-greeting"><div><small>MONDAY, NOVEMBER 21</small><h2>Good morning, Jamie.</h2></div><span className="user-disc">J</span></div>
              <div className="balance-panel"><div className="balance-meta"><span>PROJECTED CASH · NEXT 30 DAYS</span><span className="balance-signal"><i/> LOOKING STEADY</span></div><div className="balance-amount">$24,680<span>.00</span><small>illustrative</small></div>
                <svg viewBox="0 0 560 115" className="hero-chart" preserveAspectRatio="none" aria-label="Illustrative projected cash flow chart"><defs><linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b3bea8" stopOpacity=".23"/><stop offset="1" stopColor="#b3bea8" stopOpacity="0"/></linearGradient></defs><path d="M0 92 C30 92 44 78 77 82 S121 58 155 67 S199 42 230 52 S268 40 301 45 S346 22 376 34 S419 19 447 25 S494 8 520 13 S543 7 560 5 V115 H0Z" fill="url(#heroFill)"/><path d="M0 92 C30 92 44 78 77 82 S121 58 155 67 S199 42 230 52 S268 40 301 45 S346 22 376 34 S419 19 447 25 S494 8 520 13 S543 7 560 5" fill="none" stroke="#b3bea8" strokeWidth="2"/></svg>
                <div className="chart-days"><span>NOW</span><span>7D</span><span>14D</span><span>21D</span><span>30D</span></div>
              </div>
              <div className="visual-summary"><div><span>COMING IN</span><b>+$8,240</b><small>4 expected payments</small></div><div><span>GOING OUT</span><b>−$3,180</b><small>3 upcoming bills</small></div><div className="summary-arrow"><ArrowUpRight size={15}/></div></div>
            </div>
          </div>
        </div>
        <div className="float-receipt"><span className="receipt-icon"><FileText size={15}/></span><div><small>INVOICE #1048</small><b>$1,240.00</b><em><Check size={10}/> Payment received</em></div><span className="receipt-check"><Check size={13}/></span></div>
        <div className="float-activity"><div className="activity-heading"><span className="activity-avatar">ML</span><div><small>PAYMENT ACTIVITY</small><b>Morgan Lee</b></div><span className="activity-online"/></div><div className="activity-detail"><span>Invoice #1048</span><b>+$900.00</b></div><div className="activity-line"><i/></div><small className="activity-caption">PARTIAL PAYMENT · JUST NOW</small></div>
        <div className="hero-stamp"><CircleDollarSign size={13}/><span>LESS CHASING.<br/><b>MORE CLARITY.</b></span><Sparkles size={13}/></div>
        <div className="visual-footnote">A working preview <span>·</span> illustrative financial data</div>
      </div>
    </div>
    <div className="hero-baseline"><span>LESS CHAOS. MORE CONTROL.</span><span className="baseline-center">A MORE HUMAN BACK OFFICE</span><span>FLOWPILOT <b>✳</b> 2026</span></div>
  </section>
}
