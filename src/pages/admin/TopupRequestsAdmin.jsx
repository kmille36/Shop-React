import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'
import Ic from '../../components/Ic'

export default function TopupRequestsAdmin() {
  const { getTopupRequests, approveTopupRequest, rejectTopupRequest } = useAdmin()
  const { toast } = useToast()
  const [filter, setFilter] = useState('all') // all | pending | approved | rejected
  const [, force] = useState(0)
  const bump = () => force(x => x + 1)

  const requests = getTopupRequests().filter(r => filter === 'all' || r.status === filter)
  const pending = getTopupRequests().filter(r => r.status === 'pending').length

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <span className="muted">📨 {pending} yêu cầu đang chờ duyệt</span>
        <div className="admin-filters">
          {[['all', 'Tất cả'], ['pending', 'Chờ duyệt'], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối']].map(([id, label]) => (
            <button key={id} className={`ghost-btn small ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="glass panel">
        {requests.length === 0 ? <p className="panel-empty">Chưa có yêu cầu nạp tiền nào</p> : (
          <div className="alert-list">
            {requests.map(r => (
              <div key={r.id} className={`alert-item ${r.status === 'pending' ? '' : 'done'}`}>
                <div className="alert-info">
                  <strong>{formatPrice(r.amount)}</strong>
                  <small>{r.name} • {r.email} • {r.method} • {new Date(r.date).toLocaleString('vi-VN')}</small>
                </div>
                {r.status === 'pending' ? (
                  <div className="row-actions">
                    <button className="primary-btn small" onClick={() => { approveTopupRequest(r.id); toast(`Đã duyệt & nạp ${formatPrice(r.amount)} vào ví khách! 💰`); bump() }}>
                      <Ic e="✅" size={13} /> Duyệt
                    </button>
                    <button className="ghost-btn small danger" onClick={() => { rejectTopupRequest(r.id); toast('Đã từ chối yêu cầu', 'info'); bump() }}>
                      <Ic e="🚫" size={13} /> Từ chối
                    </button>
                  </div>
                ) : (
                  <span className={`status-pill ${r.status === 'approved' ? 'paid' : 'cancelled'}`}>
                    {r.status === 'approved' ? '✅ Đã duyệt' : '🚫 Từ chối'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
