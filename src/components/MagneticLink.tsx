import { useRef, type MouseEvent, type ReactNode } from 'react'

export default function MagneticLink({ children, href, className }: { children: ReactNode; href: string; className: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const move = (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 800) return
    const box = event.currentTarget.getBoundingClientRect()
    const dx = (event.clientX - box.left - box.width / 2) * .08
    const dy = (event.clientY - box.top - box.height / 2) * .12
    event.currentTarget.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
  }
  const reset = () => { if (ref.current) ref.current.style.transform = '' }
  return <a ref={ref} href={href} className={className} onMouseMove={move} onMouseLeave={reset}>{children}</a>
}
