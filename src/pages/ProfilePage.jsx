import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'
import ProductImg from '../components/ProductImg'
import Ic from '../components/Ic'
import CheckinCard from '../components/CheckinCard'
import Badges from '../components/Badges'

const STEPS = [
  { key: 'placed', icon: '📝', label: 'Đặt hàng' },
  { key: 'paid', icon: '💳', label: 'Đã thanh toán' },
  { key: 'shipping', icon: '🚚', label: 'Đang giao' },
  { key: 'done', icon: '✅', label: 'Hoàn thành' },
]

function orderStatus(order) {
  if (order.status === 'cancelled') return 'cancelled'
  if (order.status === 'paid') return 'paid'
  return 'placed'
}

function TrackModal({ order, onClose }) {
  const status = orderStatus(order)
  const stepIndex = { placed: 0, paid: 1, cancelled: -1 }[status]
  const days = Math.floor((Date.now() - order.date) / 86400000)
  const shippingDay = Math.min(days + 1, 3)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2><Ic e="📦" size={18} /> Theo dõi đơn #{order.id.slice(-6).toUpperCase()}</h2>
          <button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button>
        </div>
        {status === 'cancelled' ? (
          <div className="track-cancel">
            <div className="success-icon"><Ic e="🚫" size={48} /></div>
            <h3>Đơn hàng đã bị hủy</h3>
            <p>Số tiền (nếu đã thanh toán) sẽ được hoàn vào ví trong 1-2 ngày.</p>
          </div>
        ) : (
          <div className="track-steps">
            {STEPS.map((s, i) => {
              const active = i <= stepIndex
              const current = i === stepIndex + 1
              return (
                <div className={`track-step ${active ? 'active' : ''} ${current ? 'current' : ''}`} key={s.key}>
                  <div className="track-dot">
                    {active ? <Ic e={s.icon} size={20} /> : <Ic e="○" size={20} className="dot-off" />}
                    {current && <span className="track-pulse" />}
                  </div>
                  <div className="track-line" />
                  <div className="track-info">
                    <strong>{s.label}</strong>
                    <small>
                      {i === 0 && new Date(order.date).toLocaleString('vi-VN')}
                      {i === 1 && (order.status === 'paid' ? 'Hoàn tất' : 'Chờ thanh toán')}
                      {i === 2 && (current ? `Dự kiến ngày ${shippingDay}` : 'Đang chuyển phát')}
                      {i === 3 && (current ? 'Sắp hoàn thành' : '—')}
                    </small>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="track-items">
          {order.items.map(i => (
            <span key={i.id} className="order-chip"><ProductImg src={i.image} className="chip-img" /> {i.name} ×{i.qty}</span>
          ))}
        </div>
        <div className="order-bottom">
          <small>Giao đến: {order.address || '—'}</small>
          <strong>{formatPrice(order.total)}</strong>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage({ onRequireLogin }) {
  const { user, updateProfile, logout, cancelOrder, requestReturn, refreshUser } = useAuth()
  const { addToCart, cart } = useCart()
  const { getStock, products } = useStore()
  const { toast } = useToast()
  const { t } = useLang()
  const [returnFor, setReturnFor] = useState(null)
  const [returnReason, setReturnReason] = useState('')

  // Pull latest data (order statuses, refunds) that admin may have changed
  useEffect(() => { refreshUser() }, [])
  const [tab, setTab] = useState('info')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saved, setSaved] = useState(false)
  const [tracking, setTracking] = useState(null)

  if (!user) {
    return (
      <div className="page">
        <div className="glass empty-page">
          <div className="empty-icon"><Ic e="👤" size={44} /></div>
          <h2>{t('profile.title')}</h2>
          <p>{t('profile.loginFirst')}</p>
          <button className="primary-btn" onClick={onRequireLogin}>Đăng nhập</button>
        </div>
      </div>
    )
  }

  const startEdit = () => {
    setForm({ name: user.name, phone: user.phone || '' })
    setEditing(true); setSaved(false)
  }
  const saveEdit = (e) => {
    e.preventDefault()
    updateProfile(form)
    setEditing(false); setSaved(true)
    toast('Đã cập nhật thông tin! ✅')
    setTimeout(() => setSaved(false), 2500)
  }

  const totalSpent = user.orders.reduce((s, o) => s + o.total, 0)
  const RANKS = [
    { name: '🥉 Bronze', min: 0 }, { name: '🥈 Silver', min: 100 },
    { name: '🥇 Gold', min: 500 }, { name: '💎 VIP Diamond', min: 2000 },
  ]
  const rank = RANKS.filter(r => (user.points || 0) >= r.min).pop().name
  const nextRank = RANKS.find(r => (user.points || 0) < r.min)
  const rankPct = nextRank
    ? Math.round(((user.points || 0) - RANKS.filter(r => (user.points || 0) >= r.min).pop().min) / (nextRank.min - RANKS.filter(r => (user.points || 0) >= r.min).pop().min) * 100)
    : 100

  return (
    <div className="page">
      <div className="profile-grid">
        <div className="glass profile-card">
          <div className="avatar">{(user.name || 'U')[0].toUpperCase()}</div>
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <div className="member-rank"><Ic e={rank.split(" ")[0]} size={16} className="inline-ic" /> {rank.split(" ").slice(1).join(" ")}</div>
          {nextRank && (
            <div className="rank-progress">
              <div className="rank-bar"><span style={{ width: rankPct + '%' }} /></div>
              <small>{t('profile.nextRank')} <strong>{nextRank.min - (user.points || 0)}</strong> {t('profile.nextRank2')} {nextRank.name.split(' ').slice(1).join(' ')}</small>
            </div>
          )}
          <div className="profile-stats">
            <div className="stat"><strong>{user.orders.length}</strong><span>Đơn hàng</span></div>
            <div className="stat"><strong>{formatPrice(user.balance)}</strong><span>Số dư ví</span></div>
            <div className="stat"><strong>{user.points || 0} <Ic e="🎁" size={13} /></strong><span>Điểm</span></div>
          </div>
          <div className="points-hint">
            <Ic e="🎁" size={14} className="inline-ic" /> Còn <strong>{user.points || 0}</strong> điểm = {formatPrice(Math.floor((user.points || 0) / 1000) * 10000)}
          </div>
          <CheckinCard />
          <Badges />
          <button className="ghost-btn" onClick={() => { logout(); toast(t('profile.logout'), 'info') }}><Ic e="🚪" size={15} /> {t('nav.login') === 'Đăng nhập' ? 'Đăng xuất' : 'Sign out'}</button>
        </div>

        <div className="glass profile-detail">
          <div className="tabs">
            <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}><Ic e="👤" size={15} /> {t('profile.info')}</button>
            <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}><Ic e="📦" size={15} /> {t('profile.orders')} ({user.orders.length})</button>
          </div>

          {tab === 'info' && (
            <div className="tab-content">
              {editing ? (
                <form onSubmit={saveEdit} className="auth-form">
                  <label>Họ và tên
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </label>
                  <label>Số điện thoại
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </label>
                  <label>Email (không sửa được)
                    <input value={user.email} disabled />
                  </label>
                  <div className="btn-row">
                    <button className="primary-btn" type="submit"><Ic e="💾" size={15} /> {t('profile.save')}</button>
                    <button type="button" className="ghost-btn" onClick={() => setEditing(false)}>{t('profile.cancel')}</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="info-row"><span>Họ tên</span><strong>{user.name}</strong></div>
                  <div className="info-row"><span>Email</span><strong>{user.email}</strong></div>
                  <div className="info-row"><span>Điện thoại</span><strong>{user.phone || '—'}</strong></div>
                  <div className="info-row"><span>{t('profile.rank')}</span><strong>{rank}</strong></div>
                  <div className="info-row"><span>{t('profile.spent')}</span><strong>{formatPrice(totalSpent)}</strong></div>
                  <div className="info-row"><span>{t('profile.member')}</span><strong>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</strong></div>
                  <div className="referral-box">
                    <div>
                      <strong>{t('profile.referral')}</strong>
                      <small>{t('profile.referralHint')}</small>
                    </div>
                    <div className="referral-code-row">
                      <code>{user.referralCode}</code>
                      <button className="ghost-btn small" onClick={() => {
                        navigator.clipboard?.writeText(user.referralCode)
                        toast(t('profile.copied'))
                      }}><Ic e="📋" size={13} /> {t('profile.copy')}</button>
                    </div>
                  </div>
                  <button className="primary-btn" onClick={startEdit}><Ic e="✏️" size={15} /> {t('profile.edit')}</button>
                </>
              )}
            </div>
          )}

          {tab === 'orders' && (
            <div className="tab-content">
              {user.orders.length === 0 ? (
                <p className="tx-empty">Chưa có đơn hàng nào</p>
              ) : (
                <div className="order-list">
                  {user.orders.map(o => (
                    <div className="order-item" key={o.id}>
                      <div className="order-top">
                        <strong>Đơn #</strong>
                        <span className="order-id">{o.id.slice(-6).toUpperCase()}</span>
                        <span className={`order-status ${o.status}`}>
                          {o.status === 'paid' ? <span><Ic e='✅' size={13} /> Đã thanh toán</span>
                            : o.status === 'processing' ? <span><Ic e='⚙️' size={13} /> Đang xử lý</span>
                            : o.status === 'shipped' ? <span><Ic e='🚚' size={13} /> Đang giao</span>
                            : o.status === 'delivered' ? <span><Ic e='📦' size={13} /> Đã giao</span>
                            : o.status === 'cancelled' ? <span><Ic e='🚫' size={13} /> Đã hủy</span>
                            : <span><Ic e='💳' size={13} /> Chờ nhận</span>}
                        </span>
                      </div>
                      <div className="order-items">
                        {o.items.map(i => <span key={i.id} className="order-chip"><ProductImg src={i.image} className="chip-img" /> {i.name} ×{i.qty}</span>)}
                      </div>
                      <div className="order-bottom">
                        <small>{new Date(o.date).toLocaleString('vi-VN')} • {o.method}</small>
                        <div className="order-actions">
                          {o.status === 'cod' && (
                            <button className="ghost-btn small" onClick={() => { cancelOrder(o.id); toast('Đã hủy đơn hàng', 'info') }}>Hủy đơn</button>
                          )}
                          <button className="ghost-btn small" onClick={() => {
                            // buy again: re-add items, resolving current price/stock from the live catalog
                            let added = 0
                            o.items.forEach(i => {
                              const live = products.find(p => p.id === i.id)
                              const p = live || { id: i.id, name: i.name, image: i.image, price: i.price, category: 'Phụ kiện', stock: 99 }
                              const stock = live ? getStock(live) : 99
                              const inCart = cart.find(c => c.id === i.id)?.qty || 0
                              if (stock > inCart) { addToCart(p, Math.min(i.qty, stock - inCart)); added++ }
                            })
                            toast(added ? t('buyAgainToast') : t('toast.out'), added ? 'success' : 'error')
                          }}><Ic e="🔄" size={14} /> {t('buyAgain')}</button>
                          {(o.status === 'delivered' || o.status === 'shipped') && !o.return && (
                            <button className="ghost-btn small" onClick={() => { setReturnFor(o); setReturnReason('') }}><Ic e="↩️" size={14} /> {t('return.title')}</button>
                          )}
                          {o.return && (
                            <span className={`return-tag ${o.return.status}`}>
                              {o.return.status === 'pending' ? '⏳ ' + t('return.pending') : o.return.status === 'approved' ? '✅ ' + t('return.approved') : '🚫 ' + t('return.rejected')}
                            </span>
                          )}
                          <button className="primary-btn small" onClick={() => setTracking(o)}><Ic e="📍" size={14} /> Theo dõi</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {tracking && <TrackModal order={tracking} onClose={() => setTracking(null)} />}
      {returnFor && (
        <div className="modal-overlay" onClick={() => setReturnFor(null)}>
          <div className="glass modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2><Ic e="↩️" size={18} /> {t('return.title')} — #{returnFor.id.slice(-6).toUpperCase()}</h2>
              <button className="close-btn" onClick={() => setReturnFor(null)}><Ic e="✕" size={18} /></button>
            </div>
            <p className="muted" style={{ marginBottom: 12 }}>{t('return.refund')}: {formatPrice(returnFor.total)}</p>
            <div className="auth-form">
              <label>{t('return.reason')}
                <textarea rows="3" value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder={t('return.reasonPh')} />
              </label>
              <button className="primary-btn" onClick={() => {
                if (!returnReason.trim()) return toast(t('return.reasonPh'), 'error')
                requestReturn(returnFor.id, returnReason.trim())
                setReturnFor(null)
                toast('Đã gửi yêu cầu đổi trả! ⏳')
              }}><Ic e="✅" size={15} /> {t('return.submit')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
