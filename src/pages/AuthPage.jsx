import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../utils/i18n'
import Ic from '../components/Ic'
import Captcha from '../components/Captcha'

export default function AuthPage({ mode, onClose, onSwitch }) {
  const { login, register } = useAuth()
  const { toast } = useToast()
  const { t } = useLang()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', referralCode: '' })
  const [error, setError] = useState('')
  const [captchaOk, setCaptchaOk] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'register' && !captchaOk) return setError('Trả lời câu hỏi chống spam chưa đúng!')
    const res = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form)
    if (!res.ok) return setError(res.msg)
    toast(res.msg)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2><Ic e={mode === 'login' ? '🔐' : '✨'} size={20} /> {mode === 'login' ? t('auth.login') : t('auth.register')}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Đóng"><Ic e="✕" size={18} /></button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <>
              <label>{t('auth.name')}
                <input required value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" />
              </label>
              <label>{t('auth.phone')}
                <input value={form.phone} onChange={set('phone')} placeholder="0901234567" />
              </label>
              <label>{t('auth.referral')}
                <input value={form.referralCode} onChange={set('referralCode')} placeholder={t('auth.referralPh')} />
              </label>
            </>
          )}
          <label>{t('auth.email')}
            <input required type="email" value={form.email} onChange={set('email')} placeholder="ban@email.com" />
          </label>
          <label>{t('auth.password')}
            <input required type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
          </label>
          {mode === 'register' && <Captcha onValid={setCaptchaOk} />}
          {error && <div className="form-error"><Ic e="⚠️" size={16} /> {error}</div>}
          <button className="primary-btn" type="submit">
            <Ic e={mode === 'login' ? '🔐' : '✨'} size={16} /> {mode === 'login' ? t('auth.login') : t('auth.create')}
          </button>
        </form>
        <p className="switch-mode">
          {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
          <a href="#" onClick={(e) => { e.preventDefault(); onSwitch() }}>
            {mode === 'login' ? t('auth.register') : t('auth.login')}
          </a>
        </p>
      </div>
    </div>
  )
}
