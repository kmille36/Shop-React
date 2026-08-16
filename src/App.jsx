import { useState, useMemo, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { AdminProvider, useAdmin } from './context/AdminContext'
import { CompareProvider } from './context/CompareContext'
import { NotifyProvider } from './context/NotifyContext'
import { LangProvider, useLang } from './utils/i18n'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import { StoreProvider } from './context/StoreContext'
import { CartProvider } from './context/CartContext'
import { CompareBar, CompareModal } from './components/Compare'
import FreeShippingBar from './components/FreeShippingBar'
import SpinWheel from './components/SpinWheel'
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
import BlogPage from './pages/BlogPage'
import ExitIntentPopup from './components/ExitIntentPopup'
import { trackEvent } from './utils/track'
import { categories } from './data/products'
import { useStore } from './context/StoreContext'
import { formatPrice } from './utils/format'
import ProductImg from './components/ProductImg'
import Ic from './components/Ic'

const SORTS = ['default', 'price-asc', 'price-desc', 'rating', 'newest']
const PRICE_RANGES = [
  { id: 'all', min: 0, max: Infinity },
  { id: 'lt5', min: 0, max: 5000000 },
  { id: '5-15', min: 5000000, max: 15000000 },
  { id: '15-30', min: 15000000, max: 30000000 },
  { id: 'gt30', min: 30000000, max: Infinity },
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
  const { t } = useLang()
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [page, setPage] = useState(() => {
    const h = window.location.hash.replace(/^#\/?/, '')
    return h || sessionStorage.getItem('shop_page') || 'home'
  })
  const [category, setCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [priceRange, setPriceRange] = useState('all')
  const [viewing, setViewing] = useState(null)
  const [visible, setVisible] = useState(12) // pagination
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('shop_view') || 'grid') // grid | list
  const [spinOpen, setSpinOpen] = useState(() => {
    return localStorage.getItem('shop_spin_date') !== new Date().toDateString()
  })
  const { products, avgRating } = useStore()

  // reset pagination when filters change
  useEffect(() => { setVisible(12) }, [category, search, sort, priceRange])
  useEffect(() => { localStorage.setItem('shop_view', viewMode) }, [viewMode])
  // Hash routing: keep URL in sync (#/home, #/wishlist, ...) + back/forward support
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    sessionStorage.setItem('shop_page', page)
    const target = '#/' + page
    if (window.location.hash !== target) {
      history.pushState(null, '', target)
    }
  }, [page])

  useEffect(() => {
    const onPop = () => {
      const h = window.location.hash.replace(/^#\/?/, '')
      if (h) setPage(h)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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
    if (sort === 'rating') list = [...list].sort((a, b) => avgRating(b.id) - avgRating(a.id)) // FIX: khớp rating hiển thị
    if (sort === 'newest') list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [category, search, sort, priceRange, products, avgRating])

  const openAuth = (mode = 'login') => { setAuthMode(mode); setAuthOpen(true) }

  // funnel: track product views
  const openProduct = (p) => { trackEvent('views'); setViewing(p) }

  return (
    <>
      {page !== 'admin' && (
        <Navbar
          onOpenCart={() => setCartOpen(true)}
          search={search} setSearch={setSearch}
          page={page} setPage={setPage}
          onRequireLogin={() => openAuth('login')}
          onView={openProduct}
        />
      )}

      {page === 'home' && (
        <>
          <section className="hero">
            <div className="container">
              <h1>{t('hero.title')} <span>{t('hero.title2')}</span></h1>
              <p>{t('hero.sub').split('🎁')[0]}<Ic e="🎁" size={14} className="inline-ic" />{t('hero.sub').split('🎁')[1]}</p>
            </div>
          </section>
          <FreeShippingBar />

          <FlashSale onView={openProduct} />

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
                {SORTS.map(id => <option key={id} value={id}>{t('sort.label')}: {t('sort.' + id)}</option>)}
              </select>
              <select className="glass select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                {PRICE_RANGES.map(r => <option key={r.id} value={r.id}>{t('price.' + r.id)}</option>)}
              </select>
              <span className="result-count">{filtered.length} {t('products.count')}</span>
              <div className="view-toggle">
                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Lưới"><Ic e="🔲" size={15} /></button>
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="Danh sách"><Ic e="📃" size={15} /></button>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="no-result"><Ic e="😕" size={30} className="noresult-ic" /> {t('products.none')}</div>
            ) : (
              <>
                <div className={`grid ${viewMode === 'list' ? 'grid-list' : ''}`}>
                  {filtered.slice(0, visible).map(p => <ProductCard key={p.id} product={p} onView={openProduct} />)}
                </div>
                {visible < filtered.length && (
                  <div className="load-more">
                    <button className="ghost-btn" onClick={() => setVisible(v => v + 12)}>
                      <Ic e="⬇️" size={15} /> {t('products.more')} ({filtered.length - visible})
                    </button>
                  </div>
                )}
              </>
            )}
            <RecentlyViewed onView={openProduct} />
          </main>
        </>
      )}

      {page === 'wishlist' && <WishlistPage onView={openProduct} />}
      {page === 'admin' && (
        <AdminGate>
          {({ admin }) => admin
            ? <AdminLayout onBack={() => setPage('home')} />
            : <AdminLogin onBack={() => setPage('home')} />}
        </AdminGate>
      )}
      {page === 'wallet' && <WalletPage onRequireLogin={() => openAuth('login')} />}
      {page === 'profile' && <ProfilePage onRequireLogin={() => openAuth('login')} />}
      {page === 'blog' && <BlogPage onBack={() => setPage('home')} onView={setViewing} />}

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
          onView={openProduct}
        />
      )}
      <CompareBar />
      <CompareModal />
      {spinOpen && <SpinWheel onDismiss={() => setSpinOpen(false)} />}
      <ExitIntentPopup onDismiss={() => {}} />
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
    <LangProvider>
      <ThemeProvider>
        <NotifyProvider>
          <ToastProvider>
            <AdminProvider>
              <AuthProvider>
                <CompareProvider>
                  <StoreProvider>
                    <CartProvider>
                      <Shop />
                    </CartProvider>
                  </StoreProvider>
                </CompareProvider>
              </AuthProvider>
            </AdminProvider>
          </ToastProvider>
        </NotifyProvider>
      </ThemeProvider>
    </LangProvider>
  )
}
