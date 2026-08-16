import { useState, useEffect } from 'react'
import Ic from './Ic'

// Renders a real product photo; falls back to emoji if the image fails to load
export default function ProductImg({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  // reset error state when the source changes (e.g. switching products in a modal)
  useEffect(() => { setFailed(false) }, [src])
  // real photo: local (/images/...), server upload (/uploads/...),
  // external URL (http/https) or generated data-URI
  const isImage = typeof src === 'string' && (
    src.startsWith('/images/') || src.startsWith('/uploads/') ||
    src.startsWith('data:') || /^https?:\/\//i.test(src)
  )
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
