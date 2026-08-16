import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { formatPrice } from '../utils/format'
import ProductImg from './ProductImg'
import Ic from './Ic'

function useCountdown() {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    const end = new Date(); end.setHours(23, 59, 59, 999)
    const tick = () => setLeft(Math.max(0, end - Date.now()))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])
  const h = Math.floor(left / 3600000)
  const m = Math.floor(left / 60000) % 60
  const s = Math.floor(left / 1000) % 60
  return [h, m, s].map(n => String(n).padStart(2, '0'))
}

export default function FlashSale({ onView }) {
  const { products } = useStore()
  const [h, m, s] = useCountdown()
  const { getStock } = useStore()
  const flash = products.filter(p => p.flash && getStock(p) > 0)
  if (flash.length === 0) return null

  return (
    <section className="container flash-section">
      <div className="glass flash-box">
        <div className="flash-head">
          <h2><Ic e="⚡" size={24} /> FLASH SALE</h2>
          <div className="countdown">
            <span className="cd-unit">{h}</span><span className="cd-sep">:</span>
            <span className="cd-unit">{m}</span><span className="cd-sep">:</span>
            <span className="cd-unit">{s}</span>
            <span className="cd-label">kết thúc hôm nay</span>
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
