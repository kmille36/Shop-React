import { useState } from 'react'
import Ic from './Ic'

// Renders a real product photo; falls back to emoji if the image fails to load
export default function ProductImg({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  const isImage = typeof src === 'string' && src.startsWith('/images/')
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
