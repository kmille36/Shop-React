import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'
import { downloadCSV } from '../../utils/csv'
import Ic from '../../components/Ic'

const PRESETS = [50000, 100000, 200000, 500000]

export default function GiftCardsAdmin() {
  const { getGiftCards, createGiftCard, deleteGiftCard } = useAdmin()
  const { toast } = useToast()
  const [amount, setAmount] = useState(100000)
  const [custom, setCustom] = useState('')
  const [copied, setCopied] = useState(null)

  const cards = getGiftCards()
  const finalAmount = custom ? Math.floor(Number(custom)) : amount

  const create = () => {
    if (!finalAmount || finalAmount < 10000) return toast('Số tiền tối thiểu 10.000đ!', 'error')
    const code = createGiftCard(finalAmount)
    setCustom('')
    toast(`Đã tạo thẻ ${code} — gửi cho khách để đổi!`)
  }

  const copy = (code) => {
    navigator.clipboard?.writeText(code)
    setCopied(code)
    toast('Đã sao chép mã thẻ!')
    setTimeout(() => setCopied(null), 1500)
  }

  const exportCSV = () => {
    downloadCSV(`giftcards-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Mã thẻ', 'Mệnh giá', 'Trạng thái', 'Người dùng', 'Ngày tạo', 'Ngày dùng'],
      ...cards.map(c => [c.code, c.amount, c.used ? 'Đã dùng' : 'Còn trống', c.usedBy || '—',
        new Date(c.createdAt).toLocaleDateString('vi-VN'), c.usedAt ? new Date(c.usedAt).toLocaleDateString('vi-VN') : '—']),
    ])
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <span className="muted">{cards.length} thẻ • {cards.filter(c => c.used).length} đã dùng</span>
        <button className="ghost-btn" onClick={exportCSV} disabled={cards.length === 0}><Ic e="📤" size={15} /> Xuất CSV</button>
        <button className="primary-btn" onClick={create}><Ic e="✨" size={16} /> Tạo thẻ quà</button>
      </div>

      <div className="glass panel" style={{ marginBottom: 16 }}>
        <h3>🎁 Tạo thẻ quà tặng mới</h3>
        <div className="giftcard-create">
          {PRESETS.map(p => (
            <button key={p} className={`preset ${!custom && amount === p ? 'active' : ''}`}
              onClick={() => { setAmount(p); setCustom('') }}>{formatPrice(p)}</button>
          ))}
          <input type="number" min="10000" step="10000" placeholder="Tùy chỉnh (đ)" value={custom}
            onChange={e => setCustom(e.target.value)} className="gc-custom" />
          <button className="primary-btn" onClick={create}><Ic e="✅" size={15} /> Tạo</button>
        </div>
      </div>

      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr><th>Mã thẻ</th><th>Mệnh giá</th><th>Trạng thái</th><th>Người dùng</th><th>Ngày tạo</th><th></th></tr></thead>
          <tbody>
            {cards.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center' }} className="muted">Chưa có thẻ nào — bấm "Tạo thẻ quà"!</td></tr>
            )}
            {cards.map(c => (
              <tr key={c.code} className={c.used ? 'blocked' : ''}>
                <td><strong className="coupon-code">{c.code}</strong></td>
                <td><strong>{formatPrice(c.amount)}</strong></td>
                <td><span className={`status-pill ${c.used ? 'cancelled' : 'paid'}`}>{c.used ? '✅ Đã dùng' : '🎫 Còn trống'}</span></td>
                <td><small>{c.usedBy || '—'}</small></td>
                <td><small>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</small></td>
                <td className="row-actions">
                  <button className="ghost-btn small" onClick={() => copy(c.code)}>
                    <Ic e={copied === c.code ? '✓' : '📋'} size={14} /> {copied === c.code ? 'Đã chép' : 'Sao chép'}
                  </button>
                  {!c.used && <button className="ghost-btn small danger" onClick={() => { if (confirm(`Xóa thẻ ${c.code}?`)) { deleteGiftCard(c.code); toast('Đã xóa thẻ', 'info') } }}><Ic e="🗑️" size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
