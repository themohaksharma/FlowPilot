import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import Reveal from '../components/Reveal'

export default function FinalSection() {
  return <section className="final-section" id="about">
    <div className="final-ring final-ring-outer"/><div className="final-ring final-ring-inner"/><div className="final-asterisk">✳</div>
    <Reveal className="final-content"><span className="eyebrow eyebrow-on-dark"><i/> {brand.promise.toUpperCase()}</span><h2>Your business,<br/><em>finally in flow.</em></h2><p>Get a clearer view of what’s moving, what’s due, and what comes next.</p><Link to="/signup" className="button button-sage">Get started <ArrowUpRight size={15}/></Link><a className="final-backtop" href="#top">BACK TO THE TOP <ArrowDown size={12}/></a></Reveal>
    <div className="final-label"><span>FLOWPILOT · A WORKING NAME</span><span>LESS CHAOS / MORE CONTROL</span></div>
  </section>
}
