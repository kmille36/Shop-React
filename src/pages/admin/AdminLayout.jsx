import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import Ic from '../../components/Ic'
import Dashboard from './Dashboard'
import OrdersAdmin from './OrdersAdmin'
import ProductsAdmin from './ProductsAdmin'
import UsersAdmin from './UsersAdmin'
import CouponsAdmin from './CouponsAdmin'
import SettingsAdmin from './SettingsAdmin'

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Tổng quan' },
  { id: 'orders', icon: '📦', label: 'Đơn hàng' },
  { id: 'products', icon: '📱', label: 'Sản phẩm' },
  { id: 'users', icon: '👥', label: 'Khách hàng' },
  { id: 'coupons', icon: '🎟️', label: 'Mã giảm giá' },
  { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
]

export default function AdminLayout({ onBack }) {
  const { admin, logout } = useAdmin()
  const { toast } = useToast()
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="admin-wrap">
      <aside className="admin-side glass">
        <div className="admin-brand">
          <span className="admin-brand-ic"><Ic e="🛍️" size={20} /></span>
          <div>
            <strong>ShopReact</strong>
            <small>Admin Panel</small>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV.map(n => (
            <button key={n.id} className={`admin-nav-btn ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
              <Ic e={n.icon} size={18} /> <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-side-foot">
          <div className="admin-admin">
            <span className="user-avatar">{(admin?.name || 'A')[0]}</span>
            <div><strong>{admin?.name}</strong><small>{admin?.email}</small></div>
          </div>
          <button className="ghost-btn small" onClick={() => { logout(); toast('Đã đăng xuất quản trị', 'info') }}>
            <Ic e="🚪" size={14} /> Đăng xuất
          </button>
          <button className="ghost-btn small" onClick={onBack}>
            <Ic e="→" size={14} className="flip" /> Về cửa hàng
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar glass">
          <h1>{NAV.find(n => n.id === tab)?.label}</h1>
          <span className="admin-topbar-sub">Quản lý cửa hàng trực tuyến</span>
        </div>
        {tab === 'dashboard' && <Dashboard go={setTab} />}
        {tab === 'orders' && <OrdersAdmin />}
        {tab === 'products' && <ProductsAdmin />}
        {tab === 'users' && <UsersAdmin />}
        {tab === 'coupons' && <CouponsAdmin />}
        {tab === 'settings' && <SettingsAdmin />}
      </main>
    </div>
  )
}
