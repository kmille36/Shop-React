import Ic from './Ic'

// Renders a string, converting any embedded emoji into real Lucide icons inline.
// e.g. Emj("🛒 Giỏ hàng (2)") -> [<Ic ShoppingBag/>] " Giỏ hàng (2)"
export default function Emj({ children, size = 16, className = '' }) {
  if (typeof children !== 'string') return <>{children}</>
  const parts = children.split(/([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{24C2}\u{203C}\u{2049}\u{2122}\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{FE0F}]+)/u)
  return (
    <span className={`emj ${className}`}>
      {parts.map((p, i) => {
        if (p === '' || p === undefined) return null
        // skip lone variation-selector / ZWJ (no base emoji)
        if (/^[\u{FE0F}\u{200D}]+$/u.test(p)) return null
        const isEmoji = /^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{24C2}\u{203C}\u{2049}\u{2122}\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{FE0F}]+$/u.test(p)
        return isEmoji ? <Ic key={i} e={p} size={size} /> : <span key={i}>{p}</span>
      })}
    </span>
  )
}
