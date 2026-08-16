import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Ic from '../components/Ic'

export default function AuthPage({ mode, onClose, onSwitch }) {
  const { login, register } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const res = mode === 'login'
      ? login(form.email, form.password)
      : register(form)
    if (!res.ok) return setError(res.msg)
    toast(res.msg)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2><Ic e={mode === 'login' ? '🔐' : '✨'} size={20} /> {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
          <button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <>
              <label>Họ và tên
                <input required value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" />
              </label>
              <label>Số điện thoại
                <input value={form.phone} onChange={set('phone')} placeholder="0901234567" />
              </label>
            </>
          )}
          <label>Email
            <input required type="email" value={form.email} onChange={set('email')} placeholder="ban@email.com" />
          </label>
          <label>Mật khẩu
            <input required type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
          </label>
          {error && <div className="form-error"><Ic e="⚠️" size={16} /> {error}</div>}
          <button className="primary-btn" type="submit">
            <Ic e={mode === 'login' ? '🔐' : '✨'} size={16} /> {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
        <p className="switch-mode">
          {mode === 'login' ? "Chưa có tài khoản? " : 'Đã có tài khoản? '}
          <a href="#" onClick={(e) => { e.preventDefault(); onSwitch() }}>
            {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
          </a>
        </p>
      </div>
    </div>
  )
}
