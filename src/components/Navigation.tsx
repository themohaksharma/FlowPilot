import { ArrowUpRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const items = [['Product', '#product'], ['How it works', '#how-it-works'], ['About', '#about']]

export default function Navigation() {
  const [open, setOpen] = useState(false)
  return <header className="nav-shell">
    <div className="nav-bar"><Logo inverse />
      <button className="nav-mobile-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
      <nav className={open ? 'nav-main nav-main-open' : 'nav-main'} aria-label="Main navigation">
        <div className="nav-items">{items.map(([name, href]) => <a key={name} href={href} onClick={() => setOpen(false)}>{name}</a>)}</div>
        <div className="nav-utilities"><ThemeToggle/><Link to="/login" onClick={() => setOpen(false)}>Sign in</Link><Link className="nav-button" to="/signup" onClick={() => setOpen(false)}>Get started <ArrowUpRight size={13}/></Link></div>
      </nav>
    </div>
  </header>
}
