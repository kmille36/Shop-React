import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'
import { downloadCSV } from '../../utils/csv'
import { SEGMENTS, segmentOf } from '../../utils/segments'
import Ic from '../../components/Ic'

export default function UsersAdmin() {
  const { getUsers, deleteUser, resetUserPassword, toggleUserBlock, adjustUserBalance } = useAdmin()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [segFilter, setSegFilter] = useState('all')
  const [action, setAction] = useState(null) // {type, user}
  const [val, setVal] = useState('')

  const allUsers = getUsers()
  const users = allUsers.filter(u => {
    const matchQ = !q || (u.name + u.email + (u.phone || '')).toLowerCase().includes(q.toLowerCase())
    const matchSeg = segFilter === 'all' || segmentOf(u).id === segFilter
    return matchQ && matchSeg
  })
  const segCount = (id) => allUsers.filter(u => segmentOf(u).id === id).length

  const doAction = () => {
    const u = action.user
    if (action.type === 'block') { toggleUserBlock(u.email); toast(u.blocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản', 'info') }
    if (action.type === 'delete') {
      if (confirm(`Xóa tài khoản ${u.email}?`)) { deleteUser(u.email); toast('Đã xóa tài khoản', 'info') }
    }
    if (action.type === 'password') {
      if (val.length < 6) return toast('Mật khẩu tối thiểu 6 ký tự!', 'error')
      resetUserPassword(u.email, val); toast('Đã đặt lại mật khẩu')
    }
    if (action.type === 'balance') {
      const d = Number(val)
      if (!d) return toast('Nhập số tiền hợp lệ!', 'error')
      adjustUserBalance(u.email, d); toast(`Đã ${d > 0 ? 'tăng' : 'giảm'} số dư`)
    }
    setAction(null); setVal('')
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="🔍 Tìm theo tên, email, SĐT..." value={q} onChange={e => setQ(e.target.value)} />
        <span className="muted">{users.length} khách hàng</span>
        <button className="ghost-btn" onClick={() => {
          downloadCSV(`customers-${new Date().toISOString().slice(0, 10)}.csv`, [
            ['Tên', 'Email', 'SĐT', 'Nhóm', 'Đơn hàng', 'Tổng chi', 'Số dư', 'Điểm', 'Trạng thái', 'Mã giới thiệu'],
            ...allUsers.map(u => { const sg = segmentOf(u); return [u.name, u.email, u.phone || '', sg.label, (u.orders || []).length,
              (u.orders || []).reduce((s2, o) => s2 + o.total, 0), u.balance || 0, u.points || 0,
              u.blocked ? 'Đã khóa' : 'Hoạt động', u.referralCode || ''] }),
          ])
          toast('Đã xuất danh sách khách hàng')
        }}><Ic e="📤" size={15} /> CSV</button>
      </div>

      <div className="admin-toolbar seg-toolbar">
        <button className={`chip ${segFilter === 'all' ? 'active' : ''}`} onClick={() => setSegFilter('all')}>Tất cả ({allUsers.length})</button>
        {SEGMENTS.map(sg => (
          <button key={sg.id} className={`chip ${segFilter === sg.id ? 'active' : ''}`} title={sg.desc} onClick={() => setSegFilter(sg.id)}>
            {sg.icon} {sg.label} ({segCount(sg.id)})
          </button>
        ))}
      </div>

      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead>
            <tr><th>Khách hàng</th><th>Nhóm</th><th>SĐT</th><th>Đơn</th><th>Số dư</th><th>Điểm</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.email} className={u.blocked ? 'blocked' : ''}>
                <td>
                  <div className="prod-cell">
                    <span className="user-avatar">{(u.name || 'U')[0].toUpperCase()}</span>
                    <div><strong>{u.name}</strong><small className="muted">{u.email}</small></div>
                  </div>
                </td>
                <td><span className={`seg-pill ${segmentOf(u).id}`} title={segmentOf(u).desc}>{segmentOf(u).icon} {segmentOf(u).label}</span></td>
                <td><small>{u.phone || '—'}</small></td>
                <td><strong>{(u.orders || []).length}</strong></td>
                <td><strong>{formatPrice(u.balance || 0)}</strong></td>
                <td><strong>{u.points || 0}</strong></td>
                <td>
                  <span className={`status-pill ${u.blocked ? 'cancelled' : 'paid'}`}>{u.blocked ? '🚫 Đã khóa' : '✅ Hoạt động'}</span>
                </td>
                <td className="row-actions">
                  <button className="ghost-btn small" onClick={() => setAction({ type: 'balance', user: u })}><Ic e="💰" size={14} /> Số dư</button>
                  <button className="ghost-btn small" onClick={() => setAction({ type: 'password', user: u })}><Ic e="🔐" size={14} /></button>
                  <button className="ghost-btn small" onClick={() => setAction({ type: 'block', user: u })}>{u.blocked ? '🔓 Mở khóa' : '🔒 Khóa'}</button>
                  <button className="ghost-btn small danger" onClick={() => setAction({ type: 'delete', user: u })}><Ic e="🗑️" size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {action && (
        <div className="modal-overlay" onClick={() => setAction(null)}>
          <div className="glass modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>
                {action.type === 'balance' && '💰 Chỉnh số dư'}
                {action.type === 'password' && '🔐 Đặt lại mật khẩu'}
                {action.type === 'block' && (action.user.blocked ? '🔓 Mở khóa tài khoản' : '🔒 Khóa tài khoản')}
                {action.type === 'delete' && '🗑️ Xóa tài khoản'}
              </h2>
              <button className="close-btn" onClick={() => setAction(null)}><Ic e="✕" size={18} /></button>
            </div>
            <p className="muted" style={{ marginBottom: 14 }}>{action.user.name} — {action.user.email}</p>
            {action.type === 'balance' && (
              <div className="auth-form">
                <label>Số tiền (+ để cộng, − để trừ)
                  <input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="vd: 50000 hoặc -20000" autoFocus />
                </label>
              </div>
            )}
            {action.type === 'password' && (
              <div className="auth-form">
                <label>Mật khẩu mới
                  <input type="text" value={val} onChange={e => setVal(e.target.value)} placeholder="Tối thiểu 6 ký tự" autoFocus />
                </label>
              </div>
            )}
            <button className="primary-btn" style={{ marginTop: 14 }} onClick={doAction}>
              <Ic e="✅" size={16} /> Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
