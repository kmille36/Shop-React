import { useAdmin } from '../../context/AdminContext'
import Ic from '../../components/Ic'

const ICONS = { order: '📦', product: '📱', user: '👥', coupon: '🎟️', giftcard: '🎁', referral: '🤝', register: '✨' }

export default function ActivityAdmin() {
  const { getActivity } = useAdmin()
  const log = getActivity()

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <span className="muted">{log.length} hoạt động gần đây (giữ 60 mới nhất)</span>
      </div>
      {log.length === 0 ? (
        <div className="glass panel"><p className="panel-empty">Chưa có hoạt động nào</p></div>
      ) : (
        <div className="activity-list">
          {log.map(a => (
            <div key={a.id} className="activity-item glass">
              <span className="activity-ic">{ICONS[a.action] || '📌'}</span>
              <div className="activity-info">
                <strong>{a.detail}</strong>
                <small>{new Date(a.date).toLocaleString('vi-VN')}</small>
              </div>
              <span className="activity-tag">{a.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
