import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useTheme } from '../context/ThemeContext'
import Ic from './Ic'

export default function Navbar({ onOpenCart, search, setSearch, page, setPage, onRequireLogin }) {
  const { totalItems } = useCart()
  const { user } = useAuth()
  const { wishlist } = useStore()
  const { dark, toggle } = useTheme()

  const navBtn = (p, icon, label, badge) => (
    <button className={`nav-link ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
      <Ic e={icon} size={16} /> <span>{label}</span>
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </button>
  )

  return (
    <header className="navbar">
      <div className="nav-inner container">
        <a href="#" className="logo" onClick={e => { e.preventDefault(); setPage('home') }}><Ic e="🛍️" size={22} className="logo-ic" /> Shop<span>React</span></a>
        <input
          className="search"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={e => { setSearch(e.target.value); if (page !== 'home' && e.target.value) setPage('home') }}
        />
        <nav className="nav-links">
          {navBtn('home', '🏠', 'Trang chủ')}
          {navBtn('wishlist', '❤️', 'Yêu thích', wishlist.length)}
          {navBtn('wallet', '👛', 'Ví')}
          {navBtn('profile', '👤', 'Hồ sơ')}
        </nav>
        <div className="nav-right">
          <button className="theme-btn" onClick={toggle} title="Đổi giao diện">
            <Ic e={dark ? '☀️' : '🌙'} size={18} />
          </button>
          <button className="cart-btn" onClick={onOpenCart}>
            <Ic e="🛒" size={17} /> <span className="cart-label">Giỏ</span>
            {totalItems > 0 && <span className="badge">{totalItems}</span>}
          </button>
          {user ? (
            <button className="user-chip" onClick={() => setPage('profile')} title="Hồ sơ của tôi">
              <span className="user-avatar">{user.name[0].toUpperCase()}</span>
              <span className="user-name">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button className="login-btn" onClick={onRequireLogin}>Đăng nhập</button>
          )}
        </div>
      </div>
    </header>
  )
}
