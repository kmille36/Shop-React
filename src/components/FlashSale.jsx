import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { useLang } from '../utils/i18n'
import { flashActive, flashWindow } from '../utils/flash'
import { formatPrice } from '../utils/format'
import ProductImg from './ProductImg'
import Ic from './Ic'

function useCountdown(endTs) {
  const [left, setLeft] = useState(endTs ? Math.max(0, endTs - Date.now()) : 0)
  useEffect(() => {
    if (!endTs) return
    const tick = () => setLeft(Math.max(0, endTs - Date.now()))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [endTs])
  const h = Math.floor(left / 3600000)
  const m = Math.floor(left / 60000) % 60
  const s = Math.floor(left / 1000) % 60
  return [h, m, s].map(n => String(n).padStart(2, '0'))
}

export default function FlashSale({ onView }) {
  const { products } = useStore()
  const { getStock } = useStore()
  const { t } = useLang()
  // only products inside their flash window (scheduled or end-of-day)
  const flash = products.filter(p => flashActive(p) && getStock(p) > 0)
  if (flash.length === 0) return null
  // countdown to the earliest ending window
  const [h, m, s] = useCountdown(Math.min(...flash.map(p => flashWindow(p).end)))

  return (
    <section className="container flash-section">
      <div className="glass flash-box">
        <div className="flash-head">
          <h2><Ic e="⚡" size={24} /> {t('flash.title')}</h2>
          <div className="countdown">
            <span className="cd-unit">{h}</span><span className="cd-sep">:</span>
            <span className="cd-unit">{m}</span><span className="cd-sep">:</span>
            <span className="cd-unit">{s}</span>
            <span className="cd-label">{t('flash.ends')}</span>
          </div>
        </div>
        <div className="flash-grid">
          {flash.map(p => (
            <div className="flash-item" key={p.id} onClick={() => onView(p)}>
              <span className="flash-img"><ProductImg src={p.image} alt={p.name} /></span>
              <div className="flash-info">
                <strong>{p.name}</strong>
                <div className="flash-price">
                  <span className="price">{formatPrice(p.price)}</span>
                  <span className="old-price">{formatPrice(p.oldPrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
