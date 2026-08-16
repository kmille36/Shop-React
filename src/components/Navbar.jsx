import { useState, useRef, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'
import Ic from './Ic'
import ProductImg from './ProductImg'
import NotificationsBell from './NotificationsBell'

export default function Navbar({ onOpenCart, search, setSearch, page, setPage, onRequireLogin, onView }) {
  const { totalItems } = useCart()
  const { user } = useAuth()
  const { wishlist, products } = useStore()
  const { dark, toggle } = useTheme()
  const { lang, toggle: toggleLang, t } = useLang()
  const [showSug, setShowSug] = useState(false)
  const [listening, setListening] = useState(false)
  const sugRef = useRef(null)
  const recRef = useRef(null)

  // Search suggestions (autocomplete)
  const suggestions = search.trim().length >= 2
    ? products.filter(p => p.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 5)
    : []

  useEffect(() => {
    const h = (e) => { if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Voice search (Web Speech API)
  const voiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert('Trình duyệt không hỗ trợ tìm kiếm giọng nói')
    const rec = new SR()
    rec.lang = lang === 'vi' ? 'vi-VN' : 'en-US'
    rec.onresult = (e) => { setSearch(e.results[0][0].transcript); setShowSug(true) }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

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
        <div className="search-wrap" ref={sugRef}>
          <input
            className="search"
            placeholder={t('nav.search')}
            value={search}
            onFocus={() => setShowSug(true)}
            onChange={e => { setSearch(e.target.value); setShowSug(true); if (page !== 'home' && e.target.value) setPage('home') }}
          />
          <button className="voice-btn" onClick={voiceSearch} title={t('nav.searchVoice')}>
            <Ic e={listening ? '🎤' : '🎤'} size={15} className={listening ? 'listening' : ''} />
          </button>
          {showSug && suggestions.length > 0 && (
            <div className="suggestions glass">
              {suggestions.map(p => (
                <button key={p.id} className="suggestion" onClick={() => { setShowSug(false); setSearch(''); if (onView) onView(p) }}>
                  <span className="sug-img"><ProductImg src={p.image} alt={p.name} /></span>
                  <span className="sug-name">{p.name}</span>
                  <span className="sug-price">{formatPrice(p.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <nav className="nav-links">
          {navBtn('home', '🏠', t('nav.home'))}
          {navBtn('blog', '📰', t('blog.title').split(' ')[0])}
          {navBtn('wishlist', '❤️', t('nav.wishlist'), wishlist.length)}
          {navBtn('wallet', '👛', t('nav.wallet'))}
          {navBtn('profile', '👤', t('nav.profile'))}
        </nav>
        <div className="nav-right">
          <button className="lang-btn" onClick={toggleLang} title="Switch language">
            {lang === 'vi' ? 'EN' : 'VI'}
          </button>
          <NotificationsBell />
          <button className="theme-btn" onClick={toggle} title="Đổi giao diện">
            <Ic e={dark ? '☀️' : '🌙'} size={18} />
          </button>
          <button className="cart-btn" onClick={onOpenCart}>
            <Ic e="🛒" size={17} /> <span className="cart-label">{t('nav.cart')}</span>
            {totalItems > 0 && <span className="badge">{totalItems}</span>}
          </button>
          {user ? (
            <button className="user-chip" onClick={() => setPage('profile')} title="Hồ sơ của tôi">
              <span className="user-avatar">{user.name[0].toUpperCase()}</span>
              <span className="user-name">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button className="login-btn" onClick={onRequireLogin}>{t('nav.login')}</button>
          )}
        </div>
      </div>
    </header>
  )
}
