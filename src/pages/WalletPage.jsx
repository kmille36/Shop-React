import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/format'
import Ic from '../components/Ic'

const PRESETS = [100000, 200000, 500000, 1000000, 2000000, 5000000]
const METHODS = [
  { id: 'card', icon: '💳', name: 'Thẻ ATM / Credit' },
  { id: 'bank', icon: '🏦', name: 'Chuyển khoản ngân hàng' },
  { id: 'ewallet', icon: '📱', name: 'Ví điện tử (MoMo, ZaloPay)' },
]

export default function WalletPage({ onRequireLogin }) {
  const { user, topUp } = useAuth()
  const [amount, setAmount] = useState(200000)
  const [custom, setCustom] = useState('')
  const [method, setMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!user) {
    return (
      <div className="page">
        <div className="glass empty-page">
          <div className="empty-icon"><Ic e="🔐" size={44} /></div>
          <h2>Ví điện tử</h2>
          <p>Vui lòng đăng nhập để sử dụng ví và nạp tiền</p>
          <button className="primary-btn" onClick={onRequireLogin}>Đăng nhập</button>
        </div>
      </div>
    )
  }

  const finalAmount = custom ? Math.floor(Number(custom)) : amount
  const methodObj = METHODS.find(m => m.id === method)

  const doTopUp = () => {
    if (!finalAmount || finalAmount < 10000) return
    setProcessing(true)
    setTimeout(() => {
      topUp(finalAmount, methodObj.name)
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
          <div className="balance-label">Số dư ví</div>
          <div className="balance-amount">{formatPrice(user.balance)}</div>
          <div className="balance-hint"><Ic e="💡" size={14} className="inline-ic" /> Nạp từ 10.000đ • Dùng để thanh toán nhanh</div>
          {success && (
            <div className="success-toast"><Ic e="✅" size={15} /> Nạp {formatPrice(finalAmount)} thành công!</div>
          )}
        </div>

        {/* TopUp form */}
        <div className="glass topup-card">
          <h2><Ic e="💸" size={20} /> Nạp tiền vào ví</h2>
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
          <label className="custom-label">Số tiền tùy chỉnh
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
            {processing ? <span><Ic e="⏳" size={15} /> Đang xử lý...</span> : <span><Ic e="💸" size={16} /> Nạp {formatPrice(finalAmount || 0)}</span>}
          </button>
        </div>

        {/* Transactions */}
        <div className="glass tx-card">
          <h2><Ic e="📊" size={20} /> Lịch sử giao dịch</h2>
          {txs.length === 0 ? (
            <p className="tx-empty">Chưa có giao dịch nào</p>
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
