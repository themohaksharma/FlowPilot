import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { brand } from '../config/brand'

export default function Logo({ inverse = false }: { inverse?: boolean }) {
  return <Link to="/" className={`wordmark ${inverse ? 'wordmark-inverse' : ''}`} aria-label={`${brand.name} home`}>
    <span className="wordmark-icon" aria-hidden="true"><i/><i/><i/></span>{brand.name}<ArrowUpRight size={12} />
  </Link>
}
