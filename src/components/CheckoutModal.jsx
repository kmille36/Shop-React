import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth, POINTS_REDEEM_RATE, logActivity } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'
import Ic from './Ic'
import QRModal from './QRModal'

export default function CheckoutModal({ open, onClose, onRequireLogin, onGoProfile }) {
  const { cart, subtotal, discount, qtyDiscount, comboDiscount, shipping, giftFee, total, clearCart, giftWrap } = useCart()
  const { user, payWithWallet, addOrder, saveAddress } = useAuth()
  const { decrementStock } = useStore()
  const { toast } = useToast()
  const { t } = useLang()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: '', note: '' })
  const [savedAddrIdx, setSavedAddrIdx] = useState('')
  const [saveAddr, setSaveAddr] = useState(false)
  const [payMethod, setPayMethod] = useState('cod')
  const [installment, setInstallment] = useState(0) // 0 = full, else months
  const [usePoints, setUsePoints] = useState(false)
  const INSTALLMENTS = [3, 6, 12]
  const [done, setDone] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [summary, setSummary] = useState(null) // FIX: capture totals at submit time
  const [error, setError] = useState('')
  const savedAddresses = user?.addresses || []

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
    subtotal, discount, qtyDiscount, comboDiscount, shipping, giftFee,
    total, pointsUsed, redeemValue,
    date: Date.now(), status, method,
    address: form.address, customer: form.name, note: form.note || '',
    installment: installment > 0 ? { months: installment, monthly: Math.ceil(finalTotal / installment) } : null
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
    // Save address to book if requested
    if (saveAddr && user && form.address.trim()) {
      saveAddress({ name: form.name, phone: form.phone, address: form.address, id: Date.now() })
    }
    logActivity('order', `Đơn mới #${order.id.slice(-6).toUpperCase()} — ${formatPrice(order.total)} (${order.method})`)
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
    setDone(false); setError(''); setUsePoints(false); setSummary(null); setShowQR(false); setSaveAddr(false); setSavedAddrIdx(''); setInstallment(0)
    setForm({ name: user?.name || '', phone: user?.phone || '', address: '', note: '' })
    onClose()
  }

  const pickSaved = (idx) => {
    if (idx === '') return
    const a = savedAddresses[Number(idx)]
    if (a) setForm(f => ({ ...f, address: a.address, name: f.name || a.name, phone: f.phone || a.phone }))
  }
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        {done && summary ? (
          <div className="success">
            <div className="success-icon"><Ic e="✅" size={52} /></div>
            <h2>{t('checkout.success')}</h2>
            <p>
              Đơn hàng <strong>#{summary.orderId.slice(-6).toUpperCase()}</strong> đã được ghi nhận.<br />
              {summary.payMethod === 'wallet' && <>Đã trừ {formatPrice(summary.total)} từ ví.</>}
              {summary.payMethod === 'bank' && <>Vui lòng chuyển khoản {formatPrice(summary.finalTotal)}<br />
                <small>STK: <strong>1903 2345 678</strong> — ShopReact (MBBank)</small><br />
                <button type="button" className="ghost-btn small" style={{ marginTop: 10 }} onClick={() => setShowQR(true)}>
                  <Ic e="📱" size={14} /> {t('checkout.viewQR')}
                </button></>}
              {summary.payMethod === 'cod' && <>Bạn sẽ thanh toán {formatPrice(summary.finalTotal)} khi nhận hàng.</>}
              {summary.pointsUsed > 0 && <><br /><Ic e="🎁" size={14} className="inline-ic" /> Đã dùng {summary.pointsUsed} điểm (−{formatPrice(summary.redeemValue)})</>}
            </p>
            <div className="success-actions">
              {user && onGoProfile && (
                <button className="ghost-btn" onClick={() => { close(); onGoProfile() }}>
                  <Ic e="📍" size={15} /> {t('checkout.trackOrder')}
                </button>
              )}
              <button className="primary-btn" onClick={close}>{t('checkout.ok')}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <h2><Ic e="💳" size={20} /> {t('checkout.title')}</h2>
              <button className="close-btn" onClick={close} aria-label="Đóng"><Ic e="✕" size={18} /></button>
            </div>
            {cart.length === 0 ? (
              <div className="empty" style={{ padding: '30px 0' }}>
                <div className="empty-icon"><Ic e="🛒" size={40} /></div>
                <p>{t('cart.empty')}</p>
                <button className="primary-btn" onClick={close}>{t('cart.continue')}</button>
              </div>
            ) : (
              <form onSubmit={submit} className="auth-form">
                {savedAddresses.length > 0 && (
                  <label>{t('checkout.savedAddress')}
                    <select value={savedAddrIdx} onChange={e => { setSavedAddrIdx(e.target.value); pickSaved(e.target.value) }}>
                      <option value="">{t('checkout.savedPh')}</option>
                      {savedAddresses.map((a, i) => (
                        <option key={a.id} value={i}>{a.name} — {a.address.slice(0, 40)}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label>{t('checkout.name')} *
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </label>
                <label>{t('checkout.phone')} *
                  <input required type="tel" pattern="[0-9]{10,11}" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </label>
                <label>{t('checkout.address')} *
                  <textarea required rows="2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </label>
                <label>{t('checkout.note')}
                  <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder={t('checkout.notePh')} />
                </label>
                {user && (
                  <label className="pay-opt">
                    <input type="checkbox" checked={saveAddr} onChange={e => setSaveAddr(e.target.checked)} />
                    <span><Ic e="📍" size={15} /> {t('checkout.saveAddress')}</span>
                  </label>
                )}

                <div className="pay-methods">
                  <label className={`pay-opt ${payMethod === 'cod' ? 'active' : ''}`}>
                    <input type="radio" name="pay" checked={payMethod === 'cod'} onChange={() => setPayMethod('cod')} />
                    <span><Ic e="💵" size={16} /> {t('checkout.cod')}</span>
                  </label>
                  {user && (
                    <label className={`pay-opt ${payMethod === 'wallet' ? 'active' : ''} ${!canUseWallet ? 'disabled' : ''}`}>
                      <input type="radio" name="pay" checked={payMethod === 'wallet'} disabled={!canUseWallet} onChange={() => setPayMethod('wallet')} />
                      <span><Ic e="👛" size={16} /> {t('checkout.wallet')} <small>{t('checkout.balance')}: {formatPrice(user.balance)}{!canUseWallet && t('checkout.insufficient')}</small></span>
                    </label>
                  )}
                  <label className={`pay-opt ${payMethod === 'bank' ? 'active' : ''}`}>
                    <input type="radio" name="pay" checked={payMethod === 'bank'} onChange={() => setPayMethod('bank')} />
                    <span><Ic e="🏦" size={16} /> {t('checkout.bank')}</span>
                  </label>
                </div>

                {/* 0% installment (card / bank) */}
                {(payMethod === 'bank' || payMethod === 'cod') && (
                  <div className="installment-box">
                    <label className="pay-opt">
                      <input type="checkbox" checked={installment > 0} onChange={e => setInstallment(e.target.checked ? 6 : 0)} />
                      <span><Ic e="💳" size={16} /> {t('cart.installment')} <small>{t('cart.installmentHint')}</small></span>
                    </label>
                    {installment > 0 && (
                      <div className="installment-plans">
                        {INSTALLMENTS.map(m => (
                          <button key={m} type="button"
                            className={`inst-plan ${installment === m ? 'active' : ''}`}
                            onClick={() => setInstallment(m)}>
                            <strong>{m} {t('cart.months')}</strong>
                            <small>{formatPrice(Math.ceil(finalTotal / m))} {t('cart.monthly')}</small>
                          </button>
                        ))}
                        <p className="inst-note"><Ic e="🛡️" size={12} /> {t('installment.fee')}</p>
                      </div>
                    )}
                  </div>
                )}

                {user && maxPoints > 0 && (
                  <label className={`pay-opt ${usePoints ? 'active' : ''}`}>
                    <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} />
                    <span><Ic e="🎁" size={16} /> {t('checkout.points')} {maxPoints} <small>−{formatPrice(redeemValue)} ({Math.floor(total / 10000)} {t('checkout.pointsEarn')})</small></span>
                  </label>
                )}

                {error && <div className="form-error"><Ic e="⚠️" size={16} /> {error}</div>}

                <div className="sum-mini">
                  <div className="sum-row"><span>{t('checkout.subtotal')}</span><span>{formatPrice(subtotal)}</span></div>
                  {discount > 0 && <div className="sum-row disc"><span>{t('checkout.discount')}</span><span>−{formatPrice(discount)}</span></div>}
                  {qtyDiscount > 0 && <div className="sum-row disc"><span>{t('cart.qtyDisc')}</span><span>−{formatPrice(qtyDiscount)}</span></div>}
                  {comboDiscount > 0 && <div className="sum-row disc"><span>{t('cart.combo')}</span><span>−{formatPrice(comboDiscount)}</span></div>}
                  <div className="sum-row"><span>{t('checkout.ship')} {giftWrap && <span> + quà <Ic e="🎀" size={13} /></span>}</span><span>{formatPrice(shipping + giftFee)}</span></div>
                  {pointsUsed > 0 && <div className="sum-row disc"><span>{t('checkout.pointsLine')}</span><span>−{formatPrice(redeemValue)}</span></div>}
                  <div className="sum-row total"><span>{t('checkout.payTotal')}</span><strong>{formatPrice(finalTotal)}</strong></div>
                </div>
                <button className="primary-btn" type="submit"><Ic e="✅" size={16} /> {t('checkout.confirm')}</button>
                <p className="checkout-trust"><Ic e="🔒" size={13} /> {t('checkout.trust')}</p>
              </form>
            )}
          </>
        )}
      </div>
      {showQR && <QRModal amount={finalTotal} onClose={() => setShowQR(false)} />}
    </div>
  )
}
