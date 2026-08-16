import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAdmin } from '../context/AdminContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'
import Ic from '../components/Ic'

const PRESETS = [100000, 200000, 500000, 1000000, 2000000, 5000000]
const METHODS = [
  { id: 'card', icon: '💳', name: 'Thẻ ATM / Credit' },
  { id: 'bank', icon: '🏦', name: 'Chuyển khoản ngân hàng' },
  { id: 'ewallet', icon: '📱', name: 'Ví điện tử (MoMo, ZaloPay)' },
]

export default function WalletPage({ onRequireLogin }) {
  const { user, topUp, redeemGiftCard } = useAuth()
  const { toast } = useToast()
  const { t } = useLang()
  const [amount, setAmount] = useState(200000)
  const [gcCode, setGcCode] = useState('')
  const [custom, setCustom] = useState('')
  const [method, setMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastTopUp, setLastTopUp] = useState(null) // FIX: giữ số tiền thực để toast không đổi khi custom bị clear
  const [mode, setMode] = useState('auto') // 'auto' = instant, 'request' = chờ admin duyệt
  const { getTopupRequests, createTopupRequest } = useAdmin()
  const [requests, setRequests] = useState([])
  // refresh pending requests (admin may approve them in another tab)
  useEffect(() => {
    setRequests(getTopupRequests().filter(r => r.email === user?.email))
    const t = setInterval(() => setRequests(getTopupRequests().filter(r => r.email === user?.email)), 2000)
    return () => clearInterval(t)
  }, [user?.email, user?.transactions?.length])

  if (!user) {
    return (
      <div className="page">
        <div className="glass empty-page">
          <div className="empty-icon"><Ic e="🔐" size={44} /></div>
          <h2>{t('wallet.title')}</h2>
          <p>{t('wallet.loginFirst')}</p>
          <button className="primary-btn" onClick={onRequireLogin}>Đăng nhập</button>
        </div>
      </div>
    )
  }

  const finalAmount = custom ? Math.floor(Number(custom)) : amount
  const methodObj = METHODS.find(m => m.id === method)

  const doTopUp = () => {
    if (!finalAmount || finalAmount < 10000) return
    if (mode === 'request') {
      // send a request — admin approves it later
      createTopupRequest(user.email, user.name, finalAmount, methodObj.name)
      setRequests(getTopupRequests().filter(r => r.email === user.email))
      toast(`Đã gửi yêu cầu nạp ${formatPrice(finalAmount)} — chờ admin duyệt! ⏳`)
      setCustom('')
      return
    }
    // instant top-up
    setProcessing(true)
    setTimeout(() => {
      topUp(finalAmount, methodObj.name)
      setLastTopUp(finalAmount)
      setProcessing(false)
      setSuccess(true)
      setCustom('')
    }, 1200)
  }

  const txs = user.transactions.slice(0, 8)

  return (
    <div className="page">
      <div className="wallet-grid">
        {/* Balance card */}
        <div className="glass balance-card">
          <div className="balance-label">{t('wallet.balance')}</div>
          <div className="balance-amount">{formatPrice(user.balance)}</div>
          <div className="balance-hint"><Ic e="💡" size={14} className="inline-ic" /> Nạp từ 10.000đ • Dùng để thanh toán nhanh</div>
          {success && (
            <div className="success-toast"><Ic e="✅" size={15} /> Nạp {formatPrice(lastTopUp || 0)} thành công!</div>
          )}
        </div>

        {/* TopUp form */}
        <div className="glass topup-card">
          <h2><Ic e="💸" size={20} /> {t('wallet.topup')}</h2>
          <div className="topup-mode">
            <label className={`topup-mode-opt ${mode === 'auto' ? 'active' : ''}`}>
              <input type="radio" name="topupmode" checked={mode === 'auto'} onChange={() => setMode('auto')} />
              <span><Ic e="⚡" size={14} /> Nạp tự động</span>
            </label>
            <label className={`topup-mode-opt ${mode === 'request' ? 'active' : ''}`}>
              <input type="radio" name="topupmode" checked={mode === 'request'} onChange={() => setMode('request')} />
              <span><Ic e="📨" size={14} /> Gửi yêu cầu (chờ duyệt)</span>
            </label>
          </div>
          <div className="preset-grid">
            {PRESETS.map(p => (
              <button
                key={p}
                className={`preset ${!custom && amount === p ? 'active' : ''}`}
                onClick={() => { setAmount(p); setCustom(''); setSuccess(false) }}
              >
                {formatPrice(p)}
              </button>
            ))}
          </div>
          <label className="custom-label">{t('wallet.custom')}
            <input
              type="number" min="10000" step="10000"
              placeholder="Nhập số tiền (tối thiểu 10.000đ)"
              value={custom}
              onChange={e => { setCustom(e.target.value); setSuccess(false) }}
            />
          </label>
          <div className="method-list">
            {METHODS.map(m => (
              <label key={m.id} className={`method ${method === m.id ? 'active' : ''}`}>
                <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} />
                <span className="method-icon"><Ic e={m.icon} size={20} /></span>
                <span>{m.name}</span>
              </label>
            ))}
          </div>
          <button className="primary-btn topup-btn" onClick={doTopUp} disabled={processing || !finalAmount || finalAmount < 10000}>
            {processing ? <span><Ic e="⏳" size={15} /> Đang xử lý...</span>
              : mode === 'request' ? <span><Ic e="📨" size={16} /> Gửi yêu cầu nạp {formatPrice(finalAmount || 0)}</span>
              : <span><Ic e="💸" size={16} /> {t('wallet.topupBtn')} {formatPrice(finalAmount || 0)}</span>}
          </button>

          {/* Top-up requests status */}
          {requests.length > 0 && (
            <div className="topup-requests">
              <h3><Ic e="📨" size={15} /> Yêu cầu nạp tiền</h3>
              {requests.slice(0, 5).map(r => (
                <div key={r.id} className="topup-req-item">
                  <div>
                    <strong>{formatPrice(r.amount)}</strong>
                    <small>{r.method} • {new Date(r.date).toLocaleString('vi-VN')}</small>
                  </div>
                  <span className={`topup-req-status ${r.status}`}>
                    {r.status === 'pending' ? '⏳ Chờ duyệt' : r.status === 'approved' ? '✅ Đã duyệt' : '🚫 Bị từ chối'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Gift card redemption */}
          <div className="giftcard-box">
            <h3><Ic e="🎁" size={16} /> {t('wallet.giftcard')}</h3>
            <div className="giftcard-row">
              <input placeholder={t('wallet.giftcardPh')} value={gcCode}
                onChange={e => setGcCode(e.target.value.toUpperCase())} />
              <button className="ghost-btn" onClick={() => {
                if (!gcCode.trim()) return
                const res = redeemGiftCard(gcCode)
                if (res.ok) { toast(res.msg); setGcCode('') }
                else toast(res.msg, 'error')
              }}>{t('wallet.giftcardBtn')}</button>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="glass tx-card">
          <h2><Ic e="📊" size={20} /> {t('wallet.history')}</h2>
          {txs.length === 0 ? (
            <p className="tx-empty">{t('wallet.empty')}</p>
          ) : (
            <div className="tx-list">
              {txs.map(t => (
                <div className="tx-item" key={t.id}>
                  <span className="tx-icon"><Ic e={t.type === 'topup' ? '⬆️' : '🛒'} size={18} /></span>
                  <div className="tx-info">
                    <strong>{t.type === 'topup' ? 'Nạp tiền' : 'Thanh toán đơn hàng'}</strong>
                    <small>{new Date(t.date).toLocaleString('vi-VN')} • {t.method}</small>
                  </div>
                  <span className={`tx-amount ${t.amount > 0 ? 'plus' : 'minus'}`}>
                    {t.amount > 0 ? '+' : ''}{formatPrice(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
