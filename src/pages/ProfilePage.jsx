import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatPrice } from '../utils/format'
import ProductImg from '../components/ProductImg'
import Ic from '../components/Ic'

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
  const { user, updateProfile, logout, cancelOrder } = useAuth()
  const { toast } = useToast()
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
          <h2>Hồ sơ của tôi</h2>
          <p>Vui lòng đăng nhập để xem thông tin cá nhân</p>
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
  const rank = user.points >= 2000 ? '💎 VIP Diamond' : user.points >= 500 ? '🥇 Gold' : user.points >= 100 ? '🥈 Silver' : '🥉 Bronze'

  return (
    <div className="page">
      <div className="profile-grid">
        <div className="glass profile-card">
          <div className="avatar">{(user.name || 'U')[0].toUpperCase()}</div>
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <div className="member-rank"><Ic e={rank.split(" ")[0]} size={16} className="inline-ic" /> {rank.split(" ").slice(1).join(" ")}</div>
          <div className="profile-stats">
            <div className="stat"><strong>{user.orders.length}</strong><span>Đơn hàng</span></div>
            <div className="stat"><strong>{formatPrice(user.balance)}</strong><span>Số dư ví</span></div>
            <div className="stat"><strong>{user.points || 0} <Ic e="🎁" size={13} /></strong><span>Điểm</span></div>
          </div>
          <div className="points-hint">
            <Ic e="🎁" size={14} className="inline-ic" /> Còn <strong>{user.points || 0}</strong> điểm = {formatPrice(Math.floor((user.points || 0) / 1000) * 10000)}
          </div>
          <button className="ghost-btn" onClick={() => { logout(); toast('Đã đăng xuất', 'info') }}><Ic e="🚪" size={15} /> Đăng xuất</button>
        </div>

        <div className="glass profile-detail">
          <div className="tabs">
            <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}><Ic e="👤" size={15} /> Thông tin</button>
            <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}><Ic e="📦" size={15} /> Đơn hàng ({user.orders.length})</button>
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
                    <button className="primary-btn" type="submit"><Ic e="💾" size={15} /> Lưu</button>
                    <button type="button" className="ghost-btn" onClick={() => setEditing(false)}>Hủy</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="info-row"><span>Họ tên</span><strong>{user.name}</strong></div>
                  <div className="info-row"><span>Email</span><strong>{user.email}</strong></div>
                  <div className="info-row"><span>Điện thoại</span><strong>{user.phone || '—'}</strong></div>
                  <div className="info-row"><span>Hạng thành viên</span><strong>{rank}</strong></div>
                  <div className="info-row"><span>Tổng đã chi</span><strong>{formatPrice(totalSpent)}</strong></div>
                  <div className="info-row"><span>Thành viên từ</span><strong>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</strong></div>
                  <button className="primary-btn" onClick={startEdit}><Ic e="✏️" size={15} /> Chỉnh sửa thông tin</button>
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
                          {o.status === 'paid' ? <span><Ic e='✅' size={13} /> Đã thanh toán</span> : o.status === 'cancelled' ? <span><Ic e='🚫' size={13} /> Đã hủy</span> : <span><Ic e='💳' size={13} /> Chờ nhận</span>}
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
    </div>
  )
}
