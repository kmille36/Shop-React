import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useCompare } from '../context/CompareContext'
import { flashActive } from '../utils/flash'
import { detailImage } from '../utils/imggen'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'
import ProductImg from './ProductImg'
import Ic, { Stars } from './Ic'
import { Star } from 'lucide-react'
import Captcha from './Captcha'

export default function ProductModal({ product, onClose, onRequireLogin, onView }) {
  const { addToCart, cart } = useCart()
  const { wishlist, toggleWishlist, getStock, reviews, addReview, viewProduct, avgRating, products, qa, addQA, addPriceAlert, addStockAlert } = useStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const { ids, toggle: toggleCompare } = useCompare()
  const { t } = useLang()
  const inCompare = product ? ids.includes(product.id) : false
  // Similar products: same category, exclude self, top 4
  const similar = product
    ? products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)
    : []
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('desc')
  const [rv, setRv] = useState({ name: user?.name || '', rating: 5, comment: '' })
  const [variantIdx, setVariantIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)
  const [qaText, setQaText] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [alertPhone, setAlertPhone] = useState('')
  const [stockPhone, setStockPhone] = useState('')
  const [reviewCaptchaOk, setReviewCaptchaOk] = useState(false)

  // gallery: main photo + 2 generated detail shots
  const gallery = product ? [
    { src: product.image, alt: product.name },
    { src: detailImage(product.name, 250, 'CHI TIẾT 1'), alt: product.name + ' — chi tiết 1' },
    { src: detailImage(product.name, 170, 'CHI TIẾT 2'), alt: product.name + ' — chi tiết 2' },
  ] : []
  const variant = product?.variants?.[variantIdx]
  const effPrice = product ? product.price + (variant ? variant.priceDelta : 0) : 0
  const productQA = qa[product?.id] || []

  useEffect(() => {
    if (product) viewProduct(product.id)
    setVariantIdx(0); setImgIdx(0); setTab('desc')
  }, [product?.id]) // FIX: dep on id — product object identity changes on store re-render

  if (!product) return null
  const stock = getStock(product)
  const out = stock <= 0
  const inWish = wishlist.includes(product.id)
  const rating = avgRating(product.id)
  const list = reviews[product.id] || []
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0

  const add = () => {
    if (out) return toast(t('toast.out'), 'error')
    const inCart = cart.find(i => i.id === product.id)?.qty || 0
    const room = stock - inCart
    if (room <= 0) return toast(`${t('toast.stockOnly')} ${stock} ${t('toast.sp')} (${inCart} 🛒)`, 'error')
    const q = Math.min(qty, room)
    // pass variant-adjusted price + label
    addToCart(variant ? { ...product, price: effPrice, name: `${product.name} (${variant.label})` } : product, q)
    toast(`${t('toast.added')} ${q} × "${product.name}" 🛒`)
  }

  const submitReview = (e) => {
    e.preventDefault()
    if (!rv.comment.trim()) return toast('Vui lòng nhập nhận xét!', 'error')
    if (!reviewCaptchaOk) return toast('Trả lời câu hỏi chống spam chưa đúng!', 'error')
    addReview(product.id, {
      id: Date.now(), name: rv.name || 'Khách hàng',
      rating: rv.rating, comment: rv.comment, date: Date.now()
    })
    setRv({ name: user?.name || '', rating: 5, comment: '' })
    toast('Cảm ơn bạn đã đánh giá! ⭐')
  }

  const doCompare = () => {
    if (!inCompare && ids.length >= 4) return toast(t('compare.max'), 'error')
    toggleCompare(product.id)
  }

  const submitQA = (e) => {
    e.preventDefault()
    if (!qaText.trim()) return
    addQA(product.id, { id: Date.now(), q: qaText.trim(), a: null, date: Date.now() })
    setQaText('')
    toast('Đã gửi câu hỏi! 💬')
  }

  const submitPriceAlert = () => {
    const p = Number(alertPrice)
    if (!p || !alertPhone.trim()) return toast('Nhập giá mong muốn và SĐT!', 'error')
    addPriceAlert({ id: Date.now(), productId: product.id, price: p, phone: alertPhone.trim(), email: user?.email || null, done: false })
    setAlertPrice(''); setAlertPhone('')
    toast(t('alert.done'))
  }

  const submitStockAlert = () => {
    if (!stockPhone.trim()) return toast('Nhập số điện thoại!', 'error')
    addStockAlert({ id: Date.now(), productId: product.id, phone: stockPhone.trim(), email: user?.email || null, done: false })
    setStockPhone('')
    toast(t('alert.done'))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal product-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn modal-close" onClick={onClose} aria-label="Đóng"><Ic e="✕" size={18} /></button>
        <div className="pm-grid">
          <div className="pm-img">
            {flashActive(product) && <span className="b-flash"><Ic e="⚡" size={12} /> FLASH SALE</span>}
            <div className="pm-gallery">
              <ProductImg src={gallery[imgIdx]?.src} alt={gallery[imgIdx]?.alt} className={out ? 'img-out' : 'img-in'} />
              {gallery.length > 1 && (
                <div className="gallery-thumbs">
                  {gallery.map((g, i) => (
                    <button key={i} className={`thumb ${i === imgIdx ? 'active' : ''}`} onClick={() => setImgIdx(i)} title={t('gallery.zoom')}>
                      <ProductImg src={g.src} alt={g.alt} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className={`wish-btn pm-wish ${inWish ? 'active' : ''}`}
              onClick={() => { toggleWishlist(product.id); toast(inWish ? t('toast.wishRemove') : t('toast.wishAdd'), 'info') }}>
              <Ic e={inWish ? '❤️' : '🤍'} size={18} className={inWish ? 'wish-on' : ''} />
            </button>
          </div>
          <div className="pm-info">
            <span className="card-cat">{product.category}</span>
            <h2>{product.name}</h2>
            <div className="pm-rating">
              <Stars value={rating} size={16} />
              <strong>{rating}</strong>
              <span className="rating-count">({list.length} đánh giá)</span>
            </div>
            {product.variants && (
              <div className="variant-row">
                <span className="variant-label">{t('variant.label')}:</span>
                {product.variants.map((v, i) => (
                  <button key={i} className={`variant-chip ${i === variantIdx ? 'active' : ''}`} onClick={() => setVariantIdx(i)}>
                    {v.label} {v.priceDelta > 0 ? `+${formatPrice(v.priceDelta)}` : v.priceDelta < 0 ? `−${formatPrice(-v.priceDelta)}` : ''}
                  </button>
                ))}
              </div>
            )}
            <div className="card-price">
              <span className="price big">{formatPrice(effPrice)}</span>
              {product.oldPrice && (
                <>
                  <span className="old-price">{formatPrice(product.oldPrice)}</span>
                  <span className="b-discount">-{discount}%</span>
                </>
              )}
            </div>
            <p className="pm-desc">{product.desc}. Bảo hành chính hãng 12 tháng, đổi trả miễn phí trong 7 ngày.</p>
            <div className={`pm-stock ${out ? 'out' : stock <= 5 ? 'low' : 'ok'}`}>
              {out ? <span><Ic e="🚫" size={14} /> {t('pm.stockOut')}</span> : stock <= 5 ? <span><Ic e="⚠️" size={14} /> {t('pm.stock')} {stock}</span> : <span><Ic e="✅" size={14} /> {t('pm.stock')} {stock}</span>}
            </div>
            <div className="pm-buy">
              <div className="qty big">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(stock || 1, q + 1))}>+</button>
              </div>
              <button className="primary-btn" onClick={add} disabled={out}>
                {out ? t('card.out') : <span><Ic e="🛒" size={16} /> {t('card.add')}</span>}
              </button>
              <button className={`ghost-btn cmp-btn ${inCompare ? 'active' : ''}`} onClick={doCompare} title={t('card.compare')}>
                <Ic e="⚖️" size={16} /> {inCompare ? t('card.compareOn') : t('card.compare')}
              </button>
            </div>

            {/* Price drop alert */}
            <div className="alert-box">
              <div className="alert-head"><Ic e="📉" size={15} /> {t('alert.price')}</div>
              <div className="alert-row">
                <input placeholder={t('alert.pricePh')} type="number" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} />
                <input placeholder={t('alert.phonePh')} value={alertPhone} onChange={e => setAlertPhone(e.target.value)} />
                <button className="ghost-btn small" onClick={submitPriceAlert}>{t('alert.submit')}</button>
              </div>
            </div>
            {/* Back-in-stock alert (only when out) */}
            {out && (
              <div className="alert-box">
                <div className="alert-head"><Ic e="📋" size={15} /> {t('alert.stock')}</div>
                <div className="alert-row">
                  <input placeholder={t('alert.phonePh')} value={stockPhone} onChange={e => setStockPhone(e.target.value)} />
                  <button className="ghost-btn small" onClick={submitStockAlert}>{t('alert.submit')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pm-tabs">
          <button className={`tab ${tab === 'desc' ? 'active' : ''}`} onClick={() => setTab('desc')}><Ic e="📋" size={15} /> {t('pm.desc')}</button>
          <button className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}><Ic e="⭐" size={15} /> {t('pm.reviews')} ({list.length})</button>
          <button className={`tab ${tab === 'qa' ? 'active' : ''}`} onClick={() => setTab('qa')}><Ic e="❓" size={15} /> {t('qa.title')} ({productQA.length})</button>
        </div>

        {tab === 'desc' && (
          <div className="pm-tab-content">
            <p>{product.desc}.</p>
            <ul className="pm-features">
              <li><Ic e="✔" size={14} className="feat-ic" /> {t('pm.warranty')}</li>
              <li><Ic e="✔" size={14} className="feat-ic" /> {t('pm.ship')}</li>
              <li><Ic e="✔" size={14} className="feat-ic" /> {t('pm.check')}</li>
              <li><Ic e="✔" size={14} className="feat-ic" /> {t('pm.return')}</li>
              <li><Ic e="✔" size={14} className="feat-ic" /> {t('pm.points')}</li>
            </ul>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="pm-tab-content">
            <form onSubmit={submitReview} className="review-form">
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map(st => (
                  <button type="button" key={st}
                    className={st <= rv.rating ? 'on' : ''}
                    onClick={() => setRv({ ...rv, rating: st })}>
                    <Star size={22} fill={st <= rv.rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
              <div className="review-row">
                <input placeholder={user ? user.name : t('pm.namePh')} value={rv.name}
                  onChange={e => setRv({ ...rv, name: e.target.value })} />
                <input placeholder={t('pm.reviewPh')} value={rv.comment}
                  onChange={e => setRv({ ...rv, comment: e.target.value })} />
              </div>
              <Captcha onValid={setReviewCaptchaOk} />
              <button className="primary-btn" type="submit">{t('pm.submitReview')}</button>
            </form>
            <div className="review-list">
              {list.length === 0 && <p className="tx-empty">{t('pm.noReview')}</p>}
              {list.map(r => (
                <div className="review-item" key={r.id}>
                  <div className="review-head">
                    <span className="review-avatar">{r.name[0].toUpperCase()}</span>
                    <div>
                      <strong>{r.name}</strong>
                      <Stars value={r.rating} size={13} />
                    </div>
                    <small className="review-date">{new Date(r.date).toLocaleDateString('vi-VN')}</small>
                  </div>
                  <p>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'qa' && (
          <div className="pm-tab-content">
            <form onSubmit={submitQA} className="qa-form">
              <input placeholder={t('qa.ask')} value={qaText} onChange={e => setQaText(e.target.value)} />
              <button className="primary-btn" type="submit"><Ic e="❓" size={14} /> {t('qa.submit')}</button>
            </form>
            <div className="qa-list">
              {productQA.length === 0 && <p className="tx-empty">{t('qa.empty')}</p>}
              {productQA.map(item => (
                <div key={item.id} className="qa-item">
                  <p className="qa-q"><Ic e="❓" size={13} /> {item.q} <small>{new Date(item.date).toLocaleDateString('vi-VN')}</small></p>
                  {item.a ? (
                    <p className="qa-a"><Ic e="💬" size={13} /> {item.a} <span className="qa-tag">{t('qa.answered')}</span></p>
                  ) : (
                    <p className="qa-wait"><Ic e="⏳" size={13} /> Đang chờ chủ shop trả lời...</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <div className="pm-similar">
            <h3><Ic e="✨" size={16} /> {t('similar.title')}</h3>
            <div className="similar-grid">
              {similar.map(p => (
                <div key={p.id} className="similar-item glass" onClick={() => onView && onView(p)}>
                  <span className="similar-img"><ProductImg src={p.image} alt={p.name} /></span>
                  <strong>{p.name}</strong>
                  <span className="price">{formatPrice(p.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
