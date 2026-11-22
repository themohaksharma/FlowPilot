import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Reveal({ children, className = '', from = 'up', delay = 0 }: { children: ReactNode; className?: string; from?: 'up'|'left'|'right'; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const x = from === 'left' ? -32 : from === 'right' ? 32 : 0
    const y = from === 'up' ? 28 : 0
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { x, y, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: .9, delay, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 84%', once: true } })
    }, ref)
    return () => ctx.revert()
  }, [delay, from])
  return <div ref={ref} className={className}>{children}</div>
}
