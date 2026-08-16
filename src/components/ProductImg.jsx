import { useState } from 'react'
import Ic from './Ic'

// Renders a real product photo; falls back to emoji if the image fails to load
export default function ProductImg({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  // real photo (/images/...) OR generated data-URI (gallery detail shots, blog, variants)
  const isImage = typeof src === 'string' && (src.startsWith('/images/') || src.startsWith('data:'))
  if (!isImage || failed) {
    if (!src) return <Ic e="📦" size={40} className={className} />
    return <span className={`img-emoji ${className}`}>{src}</span>
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
