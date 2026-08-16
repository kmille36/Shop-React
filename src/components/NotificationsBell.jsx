import { useState, useRef, useEffect } from 'react'
import { useNotify } from '../context/NotifyContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../utils/i18n'
import Ic from './Ic'

export default function NotificationsBell() {
  const { notifs, markAll, clear } = useNotify()
  const { user } = useAuth()
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  // only show notifications addressed to the current user (or unscoped ones)
  const mine = notifs.filter(n => !n.email || !user || n.email === user.email)
  const unseen = mine.filter(n => !n.read).length

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="theme-btn" onClick={() => { setOpen(o => !o); if (!open) markAll() }} title={t('nav.notif')}>
        <Ic e="🔔" size={18} />
        {unseen > 0 && <span className="notif-dot">{unseen > 9 ? '9+' : unseen}</span>}
      </button>
      {open && (
        <div className="glass notif-panel">
          <div className="notif-head">
            <strong>{t('notif.title')}</strong>
            {notifs.length > 0 && <button className="ghost-btn small" onClick={clear}><Ic e="🗑️" size={12} /></button>}
          </div>
          {mine.length === 0 ? (
            <p className="notif-empty">{t('notif.empty')}</p>
          ) : (
            <div className="notif-list">
              {mine.map(n => (
                <div key={n.id} className="notif-item">
                  <span className="notif-ic"><Ic e="📦" size={15} /></span>
                  <div>
                    <p>{n.text}</p>
                    <small>{new Date(n.date).toLocaleString('vi-VN')}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
