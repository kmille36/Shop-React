import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { formatPrice } from '../utils/format'
import Ic from './Ic'
import { useLang } from '../utils/i18n'

export default function QRModal({ amount, onClose }) {
  const { t } = useLang()
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    // VietQR-format payload (demo): bank account + amount
    const payload = JSON.stringify({
      '00': 'ID', '01': 'VN', '11': '025000000', '27': 'MB Bank',
      '30': '19032345678', '31': 'ShopReact', '54': String(amount), '58': 'VN'
    })
    QRCode.toDataURL(payload, { width: 260, margin: 1, color: { dark: '#1e2235' } })
      .then(setDataUrl).catch(() => setDataUrl(''))
  }, [amount])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal qr-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2><Ic e="📱" size={20} /> {t('qr.title')}</h2>
          <button className="close-btn" onClick={onClose}><Ic e="✕" size={18} /></button>
        </div>
        <div className="qr-box">
          {dataUrl ? <img src={dataUrl} alt="QR" /> : <p className="muted">Đang tạo mã QR...</p>}
        </div>
        <div className="qr-amount">
          <span>{t('qr.amount')}</span>
          <strong>{formatPrice(amount)}</strong>
        </div>
        <p className="qr-stk">STK: <strong>1903 2345 678</strong> — ShopReact (MBBank)</p>
        <button className="primary-btn" onClick={onClose}><Ic e="✅" size={15} /> {t('checkout.confirm')}</button>
      </div>
    </div>
  )
}
