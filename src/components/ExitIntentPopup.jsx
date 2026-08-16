import { useState, useEffect } from 'react'
import { useLang } from '../utils/i18n'
import { useToast } from '../context/ToastContext'
import Ic from './Ic'

// Shows once per session when the user tries to leave (mouse leaves top of viewport)
export default function ExitIntentPopup({ onDismiss }) {
  const { t } = useLang()
  const { toast } = useToast()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('shop_exit_shown')) return
    const onLeave = (e) => {
      if (e.clientY <= 0) {
        setShow(true)
        sessionStorage.setItem('shop_exit_shown', '1')
      }
    }
    document.addEventListener('mouseout', onLeave)
    return () => document.removeEventListener('mouseout', onLeave)
  }, [])

  if (!show) return null

  const copyCode = () => {
    navigator.clipboard?.writeText('MAU10')
    toast('Đã sao chép mã MAU10! Dán vào giỏ hàng để dùng 🎟️')
    onDismiss()
  }

  return (
    <div className="modal-overlay exit-overlay" onClick={onDismiss}>
      <div className="glass modal exit-modal" onClick={e => e.stopPropagation()}>
        <div className="exit-emoji"><Ic e="🎁" size={54} /></div>
        <h2>{t('exit.title')}</h2>
        <p>{t('exit.desc')}</p>
        <div className="exit-code">MAU10</div>
        <div className="exit-actions">
          <button className="primary-btn" onClick={copyCode}><Ic e="🎟️" size={15} /> {t('exit.stay')}</button>
          <button className="ghost-btn" onClick={onDismiss}>{t('exit.leave')}</button>
        </div>
      </div>
    </div>
  )
}
