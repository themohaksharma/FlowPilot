import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import Logo from './Logo'

export default function Footer() {
  return <footer className="footer" id="about">
    <div className="footer-main"><div className="footer-brand"><Logo inverse/><p>{brand.promise}<br/>A little more room to think.</p></div>
      <div className="footer-group"><span>EXPLORE</span><a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#about">About FlowPilot</a></div>
      <div className="footer-group"><span>YOUR FLOW</span><Link to="/login">Sign in</Link><Link to="/signup">Get started <ArrowUpRight size={12}/></Link><Link to="/app">Workspace preview</Link></div>
    </div><div className="footer-base"><span>© 2026 {brand.name} · A working name</span><span>Less chaos. More control.</span></div>
  </footer>
}
