import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import { ORDER_STATUS } from '../../utils/orderStatus'
import { formatPrice } from '../../utils/format'
import { downloadCSV } from '../../utils/csv'
import Ic from '../../components/Ic'
import ProductImg from '../../components/ProductImg'

const FLOW = ['cod', 'paid', 'processing', 'shipped', 'delivered']

export default function OrdersAdmin() {
  const { getOrders, setOrderStatus } = useAdmin()
  const { toast } = useToast()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)

  const orders = getOrders().filter(o => {
    const matchF = filter === 'all' || o.status === filter
    const s = (o.id + (o.customer || '') + (o.userEmail || '')).toLowerCase()
    const matchQ = !q || s.includes(q.toLowerCase())
    return matchF && matchQ
  })

  const setStatus = (o, status) => {
    setOrderStatus(o.userEmail, o.id, status)
    toast(`Đơn #${o.id.slice(-6).toUpperCase()} → ${ORDER_STATUS[status]?.label}`)
  }

  const counts = { all: getOrders().length }
  Object.keys(ORDER_STATUS).forEach(k => counts[k] = getOrders().filter(o => o.status === k).length)

  const exportCSV = () => {
    downloadCSV(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Mã đơn', 'Khách hàng', 'Email', 'Sản phẩm', 'Tổng', 'Trạng thái', 'Ngày'],
      ...orders.map(o => [
        o.id, o.customer || o.userName, o.userEmail,
        (o.items || []).map(i => `${i.name} x${i.qty}`).join('; '),
        o.total, ORDER_STATUS[o.status]?.label || o.status,
        new Date(o.date).toLocaleString('vi-VN'),
      ]),
    ])
    toast('Đã xuất ' + orders.length + ' đơn hàng')
  }

  const printInvoice = (o) => {
    const w = window.open('', '_blank', 'width=480,height=640')
    if (!w) return toast('Popup bị chặn!', 'error')
    w.document.write(`<!doctype html><html><head><title>Hóa đơn #${o.id.slice(-6).toUpperCase()}</title>
      <style>
        body{font-family:Segoe UI,sans-serif;padding:24px;color:#1e2235}
        h1{font-size:1.3rem} .muted{color:#6b7280;font-size:.85rem}
        table{width:100%;border-collapse:collapse;margin:14px 0}
        td,th{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:.9rem}
        .total{font-weight:800;font-size:1.1rem}
      </style></head><body>
      <h1>🛍️ ShopReact — Hóa đơn</h1>
      <p class="muted">Đơn #${o.id.slice(-6).toUpperCase()} • ${new Date(o.date).toLocaleString('vi-VN')}</p>
      <p><strong>${o.customer || o.userName}</strong> • ${o.userEmail || ''}<br/>${o.address || ''}</p>
      <table><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Tiền</th></tr>
      ${(o.items || []).map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${formatPrice(i.price)}</td><td>${formatPrice(i.price * i.qty)}</td></tr>`).join('')}
      </table>
      <p>Tạm tính: ${formatPrice(o.subtotal || 0)}<br/>
      ${(o.discount || 0) > 0 ? `Giảm giá: −${formatPrice(o.discount)}<br/>` : ''}
      Ship: ${formatPrice(o.shipping || 0)}<br/>
      ${(o.giftFee || 0) > 0 ? `Đóng gói quà: ${formatPrice(o.giftFee)}<br/>` : ''}
      <span class="total">Tổng cộng: ${formatPrice(o.total)}</span></p>
      <p class="muted">Trạng thái: ${ORDER_STATUS[o.status]?.label} • Cảm ơn quý khách!</p>
      <script>window.print()<\/script></body></html>`)
    w.document.close()
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div className="admin-chips">
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả ({counts.all})</button>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{v.label} ({counts[k]})</button>
          ))}
        </div>
        <input className="admin-search" placeholder="🔍 Tìm theo mã, tên, email..." value={q} onChange={e => setQ(e.target.value)} />
        <button className="ghost-btn" onClick={exportCSV}><Ic e="📤" size={15} /> Xuất CSV</button>
      </div>

      {orders.length === 0 ? (
        <div className="glass panel"><p className="panel-empty">Không có đơn hàng nào</p></div>
      ) : (
        <div className="admin-table-wrap glass">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>TT</th><th>Ngày</th><th>Trạng thái</th><th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className={open === o.id ? 'open' : ''}>
                  <td><strong>#{o.id.slice(-6).toUpperCase()}</strong></td>
                  <td>
                    <div>{o.customer || o.userName}</div>
                    <small className="muted">{o.userEmail}</small>
                  </td>
                  <td><small>{(o.items || []).map(i => i.name).join(', ').slice(0, 40)}{(o.items || []).length > 1 ? '…' : ''}</small></td>
                  <td><strong>{formatPrice(o.total)}</strong></td>
                  <td><small>{new Date(o.date).toLocaleDateString('vi-VN')}</small></td>
                  <td>
                    <select className="status-select" value={o.status} onChange={e => setStatus(o, e.target.value)}>
                      {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td><button className="ghost-btn small" onClick={() => setOpen(open === o.id ? null : o.id)}>Chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* detail drawer */}
      {open && (() => {
        const o = getOrders().find(x => x.id === open)
        if (!o) return null
        return (
          <div className="admin-detail glass">
            <div className="admin-detail-head">
              <h3>Đơn #<strong>{o.id.slice(-6).toUpperCase()}</strong></h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ghost-btn small" onClick={() => printInvoice(o)}><Ic e="🖨️" size={14} /> In hóa đơn</button>
                <button className="close-btn" onClick={() => setOpen(null)}><Ic e="✕" size={18} /></button>
              </div>
            </div>
            <div className="detail-grid">
              <div><span className="muted">Khách hàng</span><strong>{o.customer || o.userName}</strong></div>
              <div><span className="muted">Email</span><strong>{o.userEmail}</strong></div>
              <div><span className="muted">Phương thức</span><strong>{o.method}</strong></div>
              <div><span className="muted">Ngày đặt</span><strong>{new Date(o.date).toLocaleString('vi-VN')}</strong></div>
              <div className="detail-wide"><span className="muted">Địa chỉ</span><strong>{o.address || '—'}</strong></div>
            </div>
            <div className="detail-items">
              {(o.items || []).map(i => (
                <div className="detail-item" key={i.id}>
                  <span className="detail-item-img"><ProductImg src={i.image} alt={i.name} /></span>
                  <div className="detail-item-info"><strong>{i.name}</strong><small>×{i.qty} — {formatPrice(i.price)}</small></div>
                </div>
              ))}
            </div>
            <div className="detail-totals">
              <div className="sum-row"><span>Tạm tính</span><span>{formatPrice(o.subtotal || 0)}</span></div>
              {(o.discount || 0) > 0 && <div className="sum-row disc"><span>Giảm giá</span><span>−{formatPrice(o.discount)}</span></div>}
              <div className="sum-row"><span>Ship</span><span>{formatPrice(o.shipping || 0)}</span></div>
              {(o.giftFee || 0) > 0 && <div className="sum-row"><span>Đóng gói quà</span><span>{formatPrice(o.giftFee)}</span></div>}
              {(o.redeemValue || 0) > 0 && <div className="sum-row disc"><span>Điểm thưởng ({o.pointsUsed})</span><span>−{formatPrice(o.redeemValue)}</span></div>}
              <div className="sum-row total"><span>Tổng</span><strong>{formatPrice(o.total)}</strong></div>
            </div>
            <div className="detail-flow">
              {FLOW.map((st, i) => {
                const idx = FLOW.indexOf(o.status)
                const active = o.status !== 'cancelled' && i <= idx
                return (
                  <div key={st} className={`flow-step ${active ? 'active' : ''}`}>
                    <span className="flow-dot">{active ? '✓' : i + 1}</span>
                    <small>{ORDER_STATUS[st].label}</small>
                  </div>
                )
              })}
              {o.status === 'cancelled' && <span className="cancelled-tag">🚫 Đơn đã hủy</span>}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
