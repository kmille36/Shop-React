import { useState } from 'react'
import { useCart, GIFT_WRAP_FEE } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useStore } from '../context/StoreContext'
import { formatPrice } from '../utils/format'
import { seedCoupons, couponDesc } from '../data/coupons'
import ProductImg from './ProductImg'
import Ic from './Ic'

export default function CartDrawer({ open, onClose, onCheckout }) {
  const {
    cart, updateQty, removeFromCart,
    coupon, applyCoupon, setCoupon,
    giftWrap, setGiftWrap,
    totalItems, subtotal, discount, shipping, giftFee, total
  } = useCart()
  const { getStock } = useStore()
  const { toast } = useToast()
  const [code, setCode] = useState('')

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
          <h2><Ic e="🛒" size={20} /> Giỏ hàng ({totalItems})</h2>
          <button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button>
        </div>
        {cart.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Ic e="🛒" size={44} /></div>
            <p>Giỏ hàng của bạn đang trống</p>
            <button className="primary-btn" onClick={onClose}>Tiếp tục mua sắm</button>
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
                          if (item.qty >= stock) return toast(`Chỉ còn ${stock} sản phẩm!`, 'error')
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
                      <input placeholder="Mã giảm giá" value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && doApply()} />
                      <button className="ghost-btn" onClick={doApply}>Áp dụng</button>
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
                <span><Ic e="🎀" size={15} /> Đóng gói quà tặng (+{formatPrice(GIFT_WRAP_FEE)})</span>
              </label>

              <div className="sum-row"><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div>
              {discount > 0 && (
                <div className="sum-row disc"><span>Giảm giá</span><span>−{formatPrice(discount)}</span></div>
              )}
              <div className="sum-row sub"><span>Phí ship</span><span>{shipping === 0 ? <span><Ic e="🎉" size={14} /> Miễn phí</span> : formatPrice(shipping)}</span></div>
              {giftFee > 0 && (
                <div className="sum-row sub"><span>Đóng gói quà</span><span>{formatPrice(giftFee)}</span></div>
              )}
              <div className="sum-row total"><span>Tổng cộng</span><strong>{formatPrice(total)}</strong></div>
              <button className="checkout-btn" onClick={onCheckout}>Thanh toán <Ic e="→" size={16} /></button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
