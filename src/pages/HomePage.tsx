import { useEffect } from 'react'
import Footer from '../components/Footer'
import { brand } from '../config/brand'
import HeroSection from '../sections/HeroSection'
import ProblemSection from '../sections/ProblemSection'
import ProductSection from '../sections/ProductSection'
import InvoiceJourney from '../sections/InvoiceJourney'
import CashFlowSection from '../sections/CashFlowSection'
import ReminderSection from '../sections/ReminderSection'
import FinalSection from '../sections/FinalSection'

export default function HomePage() {
  useEffect(() => { document.title = `${brand.name} — ${brand.tagline}` }, [])
  return <><main id="top"><HeroSection/><ProblemSection/><ProductSection/><InvoiceJourney/><CashFlowSection/><ReminderSection/><FinalSection/></main><Footer/></>
}
