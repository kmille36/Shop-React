import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth, POINTS_REDEEM_RATE } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { formatPrice } from '../utils/format'
import Ic from './Ic'

export default function CheckoutModal({ open, onClose, onRequireLogin }) {
  const { cart, subtotal, discount, shipping, giftFee, total, clearCart, giftWrap } = useCart()
  const { user, payWithWallet, addOrder } = useAuth()
  const { decrementStock } = useStore()
  const { toast } = useToast()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: '' })
  const [payMethod, setPayMethod] = useState('cod')
  const [usePoints, setUsePoints] = useState(false)
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState(null) // FIX: capture totals at submit time
  const [error, setError] = useState('')

  // FIX: prefill name/phone when user logs in while modal is open
  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: f.name || user.name, phone: f.phone || user.phone || '' }))
  }, [user])

  // FIX: quantize to multiples of POINTS_REDEEM_RATE so points used always have real value
  const rawMax = user ? Math.min(user.points, Math.floor(total / 10000) * POINTS_REDEEM_RATE) : 0
  const maxPoints = Math.floor(rawMax / POINTS_REDEEM_RATE) * POINTS_REDEEM_RATE
  const pointsUsed = usePoints ? maxPoints : 0
  const redeemValue = Math.floor(pointsUsed / POINTS_REDEEM_RATE) * 10000
  const finalTotal = total - redeemValue
  const canUseWallet = user && user.balance + redeemValue >= total

  const makeOrder = (status, method) => ({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    items: cart.map(i => ({ id: i.id, name: i.name, image: i.image, qty: i.qty, price: i.price })),
    subtotal, discount, shipping, giftFee,
    total, pointsUsed, redeemValue,
    date: Date.now(), status, method,
    address: form.address, customer: form.name
  })

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (cart.length === 0) return
    let order
    if (payMethod === 'wallet') {
      if (!canUseWallet) return setError('Số dư ví không đủ!')
      order = makeOrder('paid', 'Ví điện tử')
      const res = payWithWallet(total, order, pointsUsed)
      if (!res.ok) return setError('Thanh toán thất bại!')
    } else if (payMethod === 'bank') {
      order = makeOrder('paid', 'Chuyển khoản')
      if (user) addOrder(order)
    } else {
      order = makeOrder('cod', 'COD')
      if (user) addOrder(order)
    }
    // FIX: decrement stock for purchased items
    decrementStock(order.items)
    // FIX: snapshot everything the success screen needs BEFORE clearing the cart
    setSummary({
      orderId: order.id,
      payMethod,
      total: order.total,
      finalTotal,
      pointsUsed,
      redeemValue
    })
    clearCart()
    setDone(true)
    toast('Đặt hàng thành công! 🎉')
  }

  const close = () => {
    setDone(false); setError(''); setUsePoints(false); setSummary(null)
    setForm({ name: user?.name || '', phone: user?.phone || '', address: '' })
    onClose()
  }
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        {done && summary ? (
          <div className="success">
            <div className="success-icon"><Ic e="✅" size={52} /></div>
            <h2>Đặt hàng thành công!</h2>
            <p>
              Đơn hàng <strong>#{summary.orderId.slice(-6).toUpperCase()}</strong> đã được ghi nhận.<br />
              {summary.payMethod === 'wallet' && <>Đã trừ {formatPrice(summary.total)} từ ví.</>}
              {summary.payMethod === 'bank' && <>Vui lòng chuyển khoản {formatPrice(summary.finalTotal)}<br />
                <small>STK: <strong>1903 2345 678</strong> — ShopReact (MBBank)</small></>}
              {summary.payMethod === 'cod' && <>Bạn sẽ thanh toán {formatPrice(summary.finalTotal)} khi nhận hàng.</>}
              {summary.pointsUsed > 0 && <><br /><Ic e="🎁" size={14} className="inline-ic" /> Đã dùng {summary.pointsUsed} điểm (−{formatPrice(summary.redeemValue)})</>}
            </p>
            <button className="primary-btn" onClick={close}>OK</button>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <h2><Ic e="💳" size={20} /> Thanh toán</h2>
              <button className="close-btn" onClick={close}><Ic e="✕" size={18} /></button>
            </div>
            {cart.length === 0 ? (
              <div className="empty" style={{ padding: '30px 0' }}>
                <div className="empty-icon"><Ic e="🛒" size={40} /></div>
                <p>Giỏ hàng trống — không có gì để thanh toán</p>
                <button className="primary-btn" onClick={close}>Tiếp tục mua sắm</button>
              </div>
            ) : (
              <form onSubmit={submit} className="auth-form">
                <label>Họ và tên *
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </label>
                <label>Số điện thoại *
                  <input required type="tel" pattern="[0-9]{10,11}" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </label>
                <label>Địa chỉ giao hàng *
                  <textarea required rows="2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </label>

                <div className="pay-methods">
                  <label className={`pay-opt ${payMethod === 'cod' ? 'active' : ''}`}>
                    <input type="radio" name="pay" checked={payMethod === 'cod'} onChange={() => setPayMethod('cod')} />
                    <span><Ic e="💵" size={16} /> Thanh toán khi nhận hàng (COD)</span>
                  </label>
                  {user && (
                    <label className={`pay-opt ${payMethod === 'wallet' ? 'active' : ''} ${!canUseWallet ? 'disabled' : ''}`}>
                      <input type="radio" name="pay" checked={payMethod === 'wallet'} disabled={!canUseWallet} onChange={() => setPayMethod('wallet')} />
                      <span><Ic e="👛" size={16} /> Ví điện tử <small>số dư: {formatPrice(user.balance)}{!canUseWallet && ' (không đủ)'}</small></span>
                    </label>
                  )}
                  <label className={`pay-opt ${payMethod === 'bank' ? 'active' : ''}`}>
                    <input type="radio" name="pay" checked={payMethod === 'bank'} onChange={() => setPayMethod('bank')} />
                    <span><Ic e="🏦" size={16} /> Chuyển khoản ngân hàng</span>
                  </label>
                </div>

                {user && maxPoints > 0 && (
                  <label className={`pay-opt ${usePoints ? 'active' : ''}`}>
                    <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} />
                    <span><Ic e="🎁" size={16} /> Dùng {maxPoints} điểm thưởng <small>−{formatPrice(redeemValue)} (tặng {Math.floor(total / 10000)} điểm sau khi mua)</small></span>
                  </label>
                )}

                {error && <div className="form-error"><Ic e="⚠️" size={16} /> {error}</div>}

                <div className="sum-mini">
                  <div className="sum-row"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
                  {discount > 0 && <div className="sum-row disc"><span>Giảm giá</span><span>−{formatPrice(discount)}</span></div>}
                  <div className="sum-row"><span>Ship {giftWrap && <span> + quà <Ic e="🎀" size={13} /></span>}</span><span>{formatPrice(shipping + giftFee)}</span></div>
                  {pointsUsed > 0 && <div className="sum-row disc"><span>Điểm thưởng</span><span>−{formatPrice(redeemValue)}</span></div>}
                  <div className="sum-row total"><span>Tổng thanh toán</span><strong>{formatPrice(finalTotal)}</strong></div>
                </div>
                <button className="primary-btn" type="submit"><Ic e="✅" size={16} /> Xác nhận đặt hàng</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
