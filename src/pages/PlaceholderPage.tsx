import { ArrowLeft, ArrowUpRight, Compass, Sparkles, Waves } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { brand } from '../config/brand'

const views = {
  login: { label: 'WELCOME BACK', headline: <>A familiar place<br/>is <em>on its way.</em></>, body: 'Sign in will be available when the FlowPilot workspace is ready.', icon: <Compass size={17}/>, meta: 'Preview experience · No account needed' },
  signup: { label: 'MAKE ROOM TO FLOW', headline: <>A calmer way<br/>to <em>move forward.</em></>, body: 'Guided setup is planned for Phase 2. The public product preview is ready to explore now.', icon: <Sparkles size={17}/>, meta: 'Setup experience · In development' },
  app: { label: 'THE WORKSPACE', headline: <>The moving parts<br/>are finding <em>their place.</em></>, body: 'The FlowPilot business workspace is being developed for Phase 2, beginning with customers, invoices, payment tracking and a clearer view ahead.', icon: <Waves size={17}/>, meta: 'Internal workspace · Phase 2' },
  'not-found': { label: 'A SMALL DETOUR', headline: <>This page is<br/><em>out of flow.</em></>, body: 'That address doesn’t lead anywhere just yet. Let’s return to the homepage.', icon: <Compass size={17}/>, meta: 'Page not found' },
}

export default function PlaceholderPage({ kind }: { kind: keyof typeof views }) {
  const view = views[kind]
  useEffect(() => { document.title = `${kind === 'app' ? 'Workspace preview' : kind === 'not-found' ? 'Page not found' : kind === 'login' ? 'Sign in' : 'Get started'} · ${brand.name}` }, [kind])
  return <main className="placeholder-page"><header className="placeholder-nav"><Logo inverse/><div className="placeholder-nav-actions"><span>LESS CHAOS <i>·</i> MORE CONTROL</span><ThemeToggle compact/></div></header><div className="placeholder-motif"><i className="placeholder-ring ring-one"/><i className="placeholder-ring ring-two"/><span className="placeholder-big-mark">f<span>.</span></span><b>✳</b></div><section className="placeholder-copy"><span className="eyebrow eyebrow-on-dark">{view.label}</span><h1>{view.headline}</h1><p>{view.body}</p><div className="placeholder-status">{view.icon}<span>{view.meta}</span></div><Link to="/" className="placeholder-home"><ArrowLeft size={14}/> Back to the homepage <ArrowUpRight size={13}/></Link></section><div className="placeholder-base"><span>{brand.name} · A working name</span><span>01 / 01</span></div></main>
}
