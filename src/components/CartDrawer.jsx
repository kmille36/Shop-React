import { useState, useMemo } from 'react'
import { useCart, GIFT_WRAP_FEE, SHIP_ZONES } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useStore } from '../context/StoreContext'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'
import { seedCoupons, couponDesc } from '../data/coupons'
import ProductImg from './ProductImg'
import Ic from './Ic'

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { t } = useLang()
  const {
    cart, updateQty, removeFromCart, addToCart,
    coupon, applyCoupon, setCoupon,
    giftWrap, setGiftWrap, zone, setZone,
    totalItems, subtotal, discount, qtyDiscount, comboDiscount, comboEligible,
    shipping, giftFee, total
  } = useCart()
  const { getStock, products } = useStore()
  const { toast } = useToast()
  const [code, setCode] = useState('')

  // Upsell: top-rated products in cart categories, not already in cart
  const upsell = useMemo(() => {
    const cats = new Set(cart.map(i => i.category))
    const inCart = new Set(cart.map(i => i.id))
    return products
      .filter(p => cats.has(p.category) && !inCart.has(p.id) && getStock(p) > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
  }, [cart, products])

  const doApply = () => {
    if (!code.trim()) return
    const res = applyCoupon(code, subtotal)
    if (res.ok) { setCoupon(res.coupon); setCode(''); toast(res.msg) }
    else toast(res.msg, 'error')
  }

  return (
    <>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          <h2><Ic e="🛒" size={20} /> {t('cart.title')} ({totalItems})</h2>
          <button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button>
        </div>
        {cart.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Ic e="🛒" size={44} /></div>
            <p>{t('cart.empty')}</p>
            <button className="primary-btn" onClick={onClose}>{t('cart.continue')}</button>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {cart.map(item => {
                const stock = getStock(item)
                return (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-img"><ProductImg src={item.image} alt={item.name} /></div>
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <span className="cart-item-price">{formatPrice(item.price)}</span>
                      <div className="qty">
                        <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => {
                          if (item.qty >= stock) return toast(`${t('toast.stockOnly')} ${stock} ${t('toast.sp')}`, 'error')
                          updateQty(item.id, item.qty + 1)
                        }}>+</button>
                      </div>
                    </div>
                    <button className="remove" onClick={() => removeFromCart(item.id)}><Ic e="🗑️" size={17} /></button>
                  </div>
                )
              })}
            </div>

            <div className="drawer-foot">
              {/* Upsell suggestions */}
              {upsell.length > 0 && (
                <div className="upsell-box">
                  <h4><Ic e="✨" size={14} /> {t('cart.upsell')}</h4>
                  <div className="upsell-list">
                    {upsell.map(p => (
                      <div key={p.id} className="upsell-item">
                        <span className="upsell-img"><ProductImg src={p.image} alt={p.name} /></span>
                        <div className="upsell-info">
                          <strong>{p.name}</strong>
                          <span className="price">{formatPrice(p.price)}</span>
                        </div>
                        <button className="ghost-btn small" onClick={() => { addToCart(p); toast(`${t('toast.added')} "${p.name}"`, 'info') }}>
                          <Ic e="🛒" size={13} /> {t('cart.addSuggest')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupon */}
              <div className="coupon-box">
                {coupon ? (
                  <div className="coupon-applied">
                    <Ic e="🎟️" size={16} /> <strong>{coupon.label}</strong> — {couponDesc(coupon)}
                    <button className="close-btn" onClick={() => setCoupon(null)}><Ic e="✕" size={14} /></button>
                  </div>
                ) : (
                  <>
                    <div className="coupon-row">
                      <input placeholder={t('cart.coupon')} value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && doApply()} />
                      <button className="ghost-btn" onClick={doApply}>{t('cart.apply')}</button>
                    </div>
                    <div className="coupon-hints">
                      Thử: {Object.keys(seedCoupons).map(h => (
                        <button key={h} className="hint-chip" onClick={() => { setCode(h); }}>{h}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Gift wrap */}
              <label className="gift-wrap">
                <input type="checkbox" checked={giftWrap} onChange={e => setGiftWrap(e.target.checked)} />
                <span><Ic e="🎀" size={15} /> {t('cart.giftwrap')} (+{formatPrice(GIFT_WRAP_FEE)})</span>
              </label>

              <div className="sum-row"><span>{t('cart.subtotal')}</span><strong>{formatPrice(subtotal)}</strong></div>
              {discount > 0 && (
                <div className="sum-row disc"><span>{t('cart.discount')}</span><span>−{formatPrice(discount)}</span></div>
              )}
              {qtyDiscount > 0 && (
                <div className="sum-row disc"><span>{t('cart.qtyDisc')}</span><span>−{formatPrice(qtyDiscount)}</span></div>
              )}
              {comboDiscount > 0 && (
                <div className="sum-row disc"><span>{t('cart.combo')} ✓</span><span>−{formatPrice(comboDiscount)}</span></div>
              )}
              {!comboEligible && cart.length >= 2 && (
                <div className="combo-hint"><Ic e="💡" size={13} /> {t('cart.comboHint')}</div>
              )}
              {/* Delivery zone */}
              <div className="zone-row">
                <span>{t('ship.zone')}</span>
                <select className="zone-select" value={zone} onChange={e => setZone(e.target.value)}>
                  {SHIP_ZONES.map(z => <option key={z.id} value={z.id}>{t('zone.' + z.id)} — {formatPrice(z.fee)}</option>)}
                </select>
              </div>
              <div className="sum-row sub"><span>{t('cart.shipping')}</span><span>{shipping === 0 ? <span><Ic e="🎉" size={14} /> {t('cart.free')}</span> : formatPrice(shipping)}</span></div>
              {giftFee > 0 && (
                <div className="sum-row sub"><span>{t('cart.gift')}</span><span>{formatPrice(giftFee)}</span></div>
              )}
              <div className="sum-row total"><span>{t('cart.total')}</span><strong>{formatPrice(total)}</strong></div>
              <button className="checkout-btn" onClick={onCheckout}>{t('cart.checkout')} <Ic e="→" size={16} /></button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
