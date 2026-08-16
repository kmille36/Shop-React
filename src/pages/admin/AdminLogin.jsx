import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import Ic from '../../components/Ic'

export default function AdminLogin({ onBack }) {
  const { login } = useAdmin()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const res = login(email, password)
    if (!res.ok) return setError(res.msg)
    toast(res.msg)
  }

  return (
    <div className="admin-login-wrap">
      <div className="glass admin-login">
        <button className="admin-back" onClick={onBack}><Ic e="→" size={16} className="flip" /> Về cửa hàng</button>
        <div className="admin-login-icon"><Ic e="🛡️" size={40} /></div>
        <h1>Quản trị ShopReact</h1>
        <p className="admin-sub">Đăng nhập để quản lý cửa hàng</p>
        <form onSubmit={submit} className="auth-form">
          <label>Email quản trị
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@shopreact.vn" />
          </label>
          <label>Mật khẩu
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error && <div className="form-error"><Ic e="⚠️" size={16} /> {error}</div>}
          <button className="primary-btn" type="submit"><Ic e="🔐" size={16} /> Đăng nhập quản trị</button>
        </form>
        <div className="admin-hint">
          <Ic e="💡" size={14} className="inline-ic" /> Demo: <strong>admin@shopreact.vn</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  )
}
