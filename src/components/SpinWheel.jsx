import { useState, useRef, useEffect } from 'react'
import { useLang } from '../utils/i18n'
import { useToast } from '../context/ToastContext'
import Ic from './Ic'

// Prizes: (label, coupon code or null)
const PRIZES = [
  { label: 'GIẢM 10%', code: 'GIAM10', color: '#6c5ce7' },
  { label: 'FREESHIP', code: 'FREESHIP', color: '#00cec9' },
  { label: 'GIẢM 50K', code: 'SAVE50', color: '#fd79a8' },
  { label: 'CHƠI LẠI', code: null, color: '#fdcb6e' },
  { label: 'GIẢM 20%', code: 'VIP20', color: '#e17055' },
  { label: 'FREESHIP', code: 'FREESHIP', color: '#0984e3' },
  { label: 'GIẢM 10%', code: 'GIAM10', color: '#6c5ce7' },
  { label: 'CHƠI LẠI', code: null, color: '#fdcb6e' },
]
const N = PRIZES.length
const SEG = 360 / N

export default function SpinWheel({ onDismiss }) {
  const { t } = useLang()
  const { toast } = useToast()
  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const done = useRef(false)

  useEffect(() => {
    // show once per day
    const last = localStorage.getItem('shop_spin_date')
    if (last === new Date().toDateString()) onDismiss()
  }, [])

  const spin = () => {
    if (spinning || done.current) return
    done.current = true
    localStorage.setItem('shop_spin_date', new Date().toDateString())
    const idx = Math.floor(Math.random() * N)
    const target = 360 * 6 + (360 - (idx * SEG + SEG / 2)) // pointer at top
    setSpinning(true)
    setRot(target)
    setTimeout(() => {
      setSpinning(false)
      setResult(PRIZES[idx])
    }, 4200)
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    toast(`Đã sao chép mã ${code} — dán vào giỏ hàng để dùng!`)
  }

  return (
    <div className="modal-overlay spin-overlay" onClick={onDismiss}>
      <div className="glass modal spin-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn modal-close" onClick={onDismiss}><Ic e="✕" size={18} /></button>
        <h2 className="spin-title"><Ic e="🎡" size={22} /> {t('spin.title')}</h2>
        <p className="spin-desc">{t('spin.desc')}</p>
        <div className="wheel-wrap">
          <div className="wheel-pointer" />
          <div className="wheel" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? 'transform 4.2s cubic-bezier(.15,.9,.25,1)' : 'none' }}>
            {PRIZES.map((p, i) => (
              <div key={i} className="wheel-seg" style={{
                background: p.color,
                transform: `rotate(${i * SEG}deg)`,
              }}>
                <span className="wheel-seg-label" style={{ transform: `rotate(${-i * SEG - SEG / 2}deg) translate(0, -58px)` }}>{p.label}</span>
              </div>
            ))}
            <div className="wheel-hub"><Ic e="🎁" size={26} /></div>
          </div>
        </div>
        {result ? (
          <div className="spin-result">
            {result.code ? (
              <>
                <p><strong>{t('spin.win')}:</strong> {result.label}</p>
                <button className="primary-btn" onClick={() => copyCode(result.code)}><Ic e="🎟️" size={15} /> {t('spin.apply')}: {result.code}</button>
              </>
            ) : (
              <p>{t('spin.lose')}</p>
            )}
            <button className="ghost-btn" onClick={onDismiss}>{t('spin.close')}</button>
          </div>
        ) : (
          <button className="primary-btn spin-btn" onClick={spin} disabled={spinning}>
            {spinning ? '...' : <span><Ic e="🎡" size={17} /> {t('spin.spin')}</span>}
          </button>
        )}
      </div>
    </div>
  )
}
