import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import Ic from '../../components/Ic'

export default function SettingsAdmin() {
  const { changePassword } = useAdmin()
  const { toast } = useToast()
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

  return (
    <div className="admin-content" style={{ maxWidth: 560 }}>
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
