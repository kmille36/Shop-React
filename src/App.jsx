import { useState, useMemo, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { AdminProvider, useAdmin } from './context/AdminContext'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import { StoreProvider } from './context/StoreContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import CartDrawer from './components/CartDrawer'
import CheckoutModal from './components/CheckoutModal'
import FlashSale from './components/FlashSale'
import ChatBot from './components/ChatBot'
import Footer from './components/Footer'
import AuthPage from './pages/AuthPage'
import WalletPage from './pages/WalletPage'
import ProfilePage from './pages/ProfilePage'
import WishlistPage from './pages/WishlistPage'
import { categories } from './data/products'
import { useStore } from './context/StoreContext'
import { formatPrice } from './utils/format'
import ProductImg from './components/ProductImg'
import Ic from './components/Ic'

const SORTS = [
  { id: 'default', label: 'Mặc định' },
  { id: 'price-asc', label: 'Giá tăng dần' },
  { id: 'price-desc', label: 'Giá giảm dần' },
  { id: 'rating', label: 'Đánh giá cao' },
  { id: 'newest', label: 'Mới nhất' },
]
const PRICE_RANGES = [
  { id: 'all', label: 'Mọi mức giá', min: 0, max: Infinity },
  { id: 'lt5', label: 'Dưới 5 triệu', min: 0, max: 5000000 },
  { id: '5-15', label: '5 - 15 triệu', min: 5000000, max: 15000000 },
  { id: '15-30', label: '15 - 30 triệu', min: 15000000, max: 30000000 },
  { id: 'gt30', label: 'Trên 30 triệu', min: 30000000, max: Infinity },
]

function RecentlyViewed({ onView }) {
  const { recentlyViewed, products } = useStore()
  const items = recentlyViewed.map(id => products.find(p => p.id === id)).filter(Boolean)
  if (items.length === 0) return null
  return (
    <section className="recent-section">
      <h2 className="recent-title"><Ic e="🕘" size={20} /> Xem gần đây</h2>
      <div className="recent-scroll">
        {items.map(p => (
          <div className="recent-item glass" key={p.id} onClick={() => onView(p)}>
            <span className="recent-img"><ProductImg src={p.image} alt={p.name} /></span>
            <strong>{p.name}</strong>
            <span className="price">{formatPrice(p.price)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function AdminGate({ children }) {
  const { admin } = useAdmin()
  return children({ admin })
}

function Shop() {
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [page, setPage] = useState(() => sessionStorage.getItem('shop_page') || 'home')
  const [category, setCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [priceRange, setPriceRange] = useState('all')
  const [viewing, setViewing] = useState(null)
  const { products } = useStore()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    sessionStorage.setItem('shop_page', page)
  }, [page])

  const filtered = useMemo(() => {
    const range = PRICE_RANGES.find(r => r.id === priceRange)
    let list = products.filter(p => {
      const matchCat = category === 'Tất cả' || p.category === category
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchPrice = p.price >= range.min && p.price <= range.max
      return matchCat && matchSearch && matchPrice
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    if (sort === 'newest') list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [category, search, sort, priceRange, products])

  const openAuth = (mode = 'login') => { setAuthMode(mode); setAuthOpen(true) }

  return (
    <>
      {page !== 'admin' && (
        <Navbar
          onOpenCart={() => setCartOpen(true)}
          search={search} setSearch={setSearch}
          page={page} setPage={setPage}
          onRequireLogin={() => openAuth('login')}
        />
      )}

      {page === 'home' && (
        <>
          <section className="hero">
            <div className="container">
              <h1>Siêu thị Công nghệ <span>giá tốt nhất</span></h1>
              <p>Miễn phí ship từ 10 triệu • Bảo hành 12 tháng • Đổi trả 7 ngày • <Ic e="🎁" size={14} className="inline-ic" /> Tặng 50K khi đăng ký</p>
            </div>
          </section>

          <FlashSale onView={setViewing} />

          <main className="container">
            <div className="filters">
              {categories.map(c => (
                <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
            <div className="filter-bar">
              <select className="glass select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORTS.map(s => <option key={s.id} value={s.id}>Sắp xếp: {s.label}</option>)}
              </select>
              <select className="glass select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                {PRICE_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <span className="result-count">{filtered.length} sản phẩm</span>
            </div>
            {filtered.length === 0 ? (
              <div className="no-result"><Ic e="😕" size={30} className="noresult-ic" /> Không tìm thấy sản phẩm phù hợp</div>
            ) : (
              <div className="grid">
                {filtered.map(p => <ProductCard key={p.id} product={p} onView={setViewing} />)}
              </div>
            )}
            <RecentlyViewed onView={setViewing} />
          </main>
        </>
      )}

      {page === 'wishlist' && <WishlistPage onView={setViewing} />}
      {page === 'admin' && (
        <AdminGate>
          {({ admin }) => admin
            ? <AdminLayout onBack={() => setPage('home')} />
            : <AdminLogin onBack={() => setPage('home')} />}
        </AdminGate>
      )}
      {page === 'wallet' && <WalletPage onRequireLogin={() => openAuth('login')} />}
      {page === 'profile' && <ProfilePage onRequireLogin={() => openAuth('login')} />}

      {page !== 'admin' && <Footer onAdmin={() => setPage('admin')} />}
      {page !== 'admin' && <ChatBot />}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onRequireLogin={() => openAuth('login')}
      />
      {viewing && (
        <ProductModal
          product={viewing}
          onClose={() => setViewing(null)}
          onRequireLogin={() => openAuth('login')}
        />
      )}
      {authOpen && (
        <AuthPage
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onSwitch={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AdminProvider>
          <AuthProvider>
            <StoreProvider>
              <CartProvider>
                <Shop />
              </CartProvider>
            </StoreProvider>
          </AuthProvider>
        </AdminProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
