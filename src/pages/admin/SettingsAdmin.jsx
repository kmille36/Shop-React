import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import Ic from '../../components/Ic'

export default function SettingsAdmin() {
  const { changePassword, getTopupMode, setTopupMode } = useAdmin()
  const { toast } = useToast()
  const [topupMode, setTopupModeState] = useState(getTopupMode())
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [err, setErr] = useState('')

  const doChange = async (e) => {
    e.preventDefault()
    setErr('')
    const res = await changePassword(oldPass, newPass)
    if (!res.ok) return setErr(res.msg)
    toast(res.msg)
    setOldPass(''); setNewPass('')
  }

  const resetAll = () => {
    if (!confirm('XÓA TOÀN BỘ dữ liệu (tài khoản, đơn hàng, giỏ, review, tồn kho, mã tùy chỉnh...)? Hành động này không thể hoàn tác.')) return
    localStorage.clear()
    location.reload()
  }

  const pickMode = (m) => {
    setTopupMode(m)
    setTopupModeState(m)
    toast(m === 'both' ? 'Đã bật cả 2 chế độ nạp' : m === 'auto' ? 'Chỉ cho phép nạp tự động' : 'Chỉ cho phép nạp chờ duyệt', 'info')
  }

  return (
    <div className="admin-content" style={{ maxWidth: 560 }}>
      <div className="glass panel">
        <h3><Ic e="💸" size={16} /> Chế độ nạp tiền</h3>
        <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>
          Bật/tắt chế độ khách được dùng khi nạp tiền vào ví.
        </p>
        <div className="topup-mode">
          {[
            ['auto', '⚡', 'Chỉ nạp tự động', 'Tiền vào ví ngay, không cần duyệt'],
            ['request', '📨', 'Chỉ chờ duyệt', 'Khách gửi yêu cầu, admin duyệt'],
            ['both', '🔀', 'Cả hai chế độ', 'Khách tự chọn'],
          ].map(([id, icon, label, hint]) => (
            <label key={id} className={`topup-mode-opt ${topupMode === id ? 'active' : ''}`}>
              <input type="radio" name="topupmode-admin" checked={topupMode === id} onChange={() => pickMode(id)} />
              <span><Ic e={icon} size={14} /> {label}<small className="muted" style={{ display: 'block', fontWeight: 500 }}>{hint}</small></span>
            </label>
          ))}
        </div>
      </div>

      <div className="glass panel">
        <h3>🔐 Đổi mật khẩu quản trị</h3>
        <form className="auth-form" onSubmit={doChange}>
          <label>Mật khẩu hiện tại
            <input required type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} />
          </label>
          <label>Mật khẩu mới
            <input required type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Tối thiểu 6 ký tự" />
          </label>
          {err && <div className="form-error"><Ic e="⚠️" size={16} /> {err}</div>}
          <button className="primary-btn" type="submit"><Ic e="💾" size={16} /> Đổi mật khẩu</button>
        </form>
      </div>

      <div className="glass panel danger-zone">
        <h3>⚠️ Vùng nguy hiểm</h3>
        <p className="muted">Xóa toàn bộ dữ liệu cửa hàng và về trạng thái ban đầu.</p>
        <button className="ghost-btn small danger" onClick={resetAll}><Ic e="🗑️" size={14} /> Reset toàn bộ dữ liệu</button>
      </div>
    </div>
  )
}
