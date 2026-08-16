import { useAdmin } from '../../context/AdminContext'
import { PAID_STATUSES } from '../../utils/orderStatus'
import { formatPrice, formatShort } from '../../utils/format'
import { getFunnel } from '../../utils/track'
import Ic from '../../components/Ic'
import ProductImg from '../../components/ProductImg'

export default function Dashboard({ go }) {
  const { getOrders, getUsers, getProducts, getSold } = useAdmin()

  const orders = getOrders()
  const users = getUsers()
  const products = getProducts()
  const sold = getSold()

  const paidOrders = orders.filter(o => PAID_STATUSES.includes(o.status))
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0)
  const pending = orders.filter(o => o.status === 'cod').length

  // top products by units sold
  const units = {}
  orders.forEach(o => (o.items || []).forEach(i => { units[i.id] = (units[i.id] || 0) + i.qty }))
  const top = Object.entries(units)
    .map(([id, q]) => ({ p: products.find(x => x.id === Number(id)), q }))
    .filter(x => x.p)
    .sort((a, b) => b.q - a.q)
    .slice(0, 5)
  const maxQ = top[0]?.q || 1

  const totalUnits = Object.values(units).reduce((a, b) => a + b, 0)
  const avgOrder = paidOrders.length ? revenue / paidOrders.length : 0
  const lowStock = products.filter(p => (p.stock || 0) - (sold[p.id] || 0) <= 5)

  // Revenue by month (last 6 months)
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.getFullYear() + '-' + d.getMonth()
    const sum = paidOrders.filter(o => {
      const od = new Date(o.date)
      return od.getFullYear() + '-' + od.getMonth() === key
    }).reduce((s2, o) => s2 + o.total, 0)
    months.push({ label: d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }), sum })
  }
  const maxRev = Math.max(...months.map(m => m.sum), 1)

  const stats = [
    { icon: '💰', label: 'Doanh thu', value: formatPrice(revenue), sub: `${paidOrders.length} đơn đã TT` },
    { icon: '📦', label: 'Tổng đơn hàng', value: orders.length, sub: `${pending} chờ xử lý` },
    { icon: '👥', label: 'Khách hàng', value: users.length, sub: `${users.filter(u => u.orders?.length).length} đã mua` },
    { icon: '📱', label: 'Sản phẩm', value: products.length, sub: `${totalUnits} sp đã bán` },
  ]

  return (
    <div className="admin-content">
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="glass stat-card" key={i}>
            <span className="stat-ic"><Ic e={s.icon} size={22} /></span>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass panel">
        <h3>📈 Doanh thu 6 tháng gần nhất</h3>
        <div className="rev-chart">
          {months.map((m, i) => (
            <div key={i} className="rev-col" title={formatPrice(m.sum)}>
              <span className="rev-val">{m.sum > 0 ? formatShort(m.sum) : ''}</span>
              <div className="rev-bar"><span style={{ height: `${(m.sum / maxRev) * 100}%` }} /></div>
              <small>{m.label}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-cols">
        <div className="glass panel">
          <h3>🏆 Sản phẩm bán chạy</h3>
          {top.length === 0 ? <p className="panel-empty">Chưa có đơn hàng nào</p> : (
            <div className="top-list">
              {top.map((t, i) => (
                <div className="top-row" key={t.p.id}>
                  <span className="top-rank">{i + 1}</span>
                  <span className="top-img"><ProductImg src={t.p.image} alt={t.p.name} /></span>
                  <div className="top-info">
                    <strong>{t.p.name}</strong>
                    <div className="top-bar"><span style={{ width: `${(t.q / maxQ) * 100}%` }} /></div>
                  </div>
                  <strong className="top-q">{t.q}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass panel">
          <h3>⚠️ Hàng sắp hết ({lowStock.length})</h3>
          {lowStock.length === 0 ? <p className="panel-empty">Tất cả sản phẩm còn đủ hàng</p> : (
            <div className="low-list">
              {lowStock.map(p => {
                const left = (p.stock || 0) - (sold[p.id] || 0)
                return (
                  <div className="low-row" key={p.id}>
                    <strong>{p.name}</strong>
                    <span className={`low-left ${left <= 0 ? 'out' : ''}`}>{left <= 0 ? 'Hết hàng' : `Còn ${left}`}</span>
                  </div>
                )
              })}
            </div>
          )}
          <button className="ghost-btn small" style={{ marginTop: 12 }} onClick={() => go('products')}>
            <Ic e="📱" size={14} /> Quản lý sản phẩm
          </button>
        </div>
      </div>

      <div className="admin-cols">
        <div className="glass panel">
          <h3>🧮 Phễu bán hàng</h3>
          {(() => {
            const f = getFunnel()
            const rate = f.views ? Math.round((f.orders / f.views) * 100) : 0
            return (
              <div className="funnel">
                {[
                  { label: 'Xem sản phẩm', val: f.views, pct: 100 },
                  { label: 'Thêm vào giỏ', val: f.carts, pct: f.views ? Math.round(f.carts / f.views * 100) : 0 },
                  { label: 'Đặt hàng', val: f.orders, pct: f.views ? Math.round(f.orders / f.views * 100) : 0 },
                ].map((s, i) => (
                  <div key={i} className="funnel-row">
                    <span className="funnel-label">{s.label}</span>
                    <div className="funnel-bar"><span style={{ width: s.pct + '%' }} /></div>
                    <strong className="funnel-val">{s.val}</strong>
                  </div>
                ))}
                <div className="funnel-rate"><Ic e="🎯" size={14} /> Tỷ lệ chuyển đổi: <strong>{rate}%</strong></div>
              </div>
            )
          })()}
        </div>

        <div className="glass panel">
          <h3>🕘 Đơn hàng mới nhất</h3>
        {orders.length === 0 ? <p className="panel-empty">Chưa có đơn hàng</p> : (
          <div className="mini-orders">
            {orders.slice(0, 5).map(o => (
              <div className="mini-order" key={o.id}>
                <strong>#{o.id.slice(-6).toUpperCase()}</strong>
                <span>{o.customer || o.userName}</span>
                <span>{new Date(o.date).toLocaleDateString('vi-VN')}</span>
                <strong>{formatPrice(o.total)}</strong>
              </div>
            ))}
          </div>
        )}
        <button className="ghost-btn small" style={{ marginTop: 12 }} onClick={() => go('orders')}>
          <Ic e="📦" size={14} /> Xem tất cả đơn hàng
        </button>
        </div>
      </div>
    </div>
  )
}
