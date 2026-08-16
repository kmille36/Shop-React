import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatPrice } from '../utils/format'
import ProductImg from './ProductImg'
import Ic, { Stars } from './Ic'
import { Star } from 'lucide-react'

export default function ProductModal({ product, onClose, onRequireLogin }) {
  const { addToCart, cart } = useCart()
  const { wishlist, toggleWishlist, getStock, reviews, addReview, viewProduct, avgRating } = useStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('desc')
  const [rv, setRv] = useState({ name: user?.name || '', rating: 5, comment: '' })

  useEffect(() => {
    if (product) viewProduct(product.id)
  }, [product])

  if (!product) return null
  const stock = getStock(product)
  const out = stock <= 0
  const inWish = wishlist.includes(product.id)
  const rating = avgRating(product.id)
  const list = reviews[product.id] || []
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0

  const add = () => {
    if (out) return toast('Sản phẩm đã hết hàng!', 'error')
    const inCart = cart.find(i => i.id === product.id)?.qty || 0
    const room = stock - inCart
    if (room <= 0) return toast(`Chỉ còn ${stock} sản phẩm (đã có ${inCart} trong giỏ)!`, 'error')
    const q = Math.min(qty, room)
    addToCart(product, q)
    toast(`Đã thêm ${q} × "${product.name}" vào giỏ`)
  }

  const submitReview = (e) => {
    e.preventDefault()
    if (!rv.comment.trim()) return toast('Vui lòng nhập nhận xét!', 'error')
    addReview(product.id, {
      id: Date.now(), name: rv.name || 'Khách hàng',
      rating: rv.rating, comment: rv.comment, date: Date.now()
    })
    setRv({ name: user?.name || '', rating: 5, comment: '' })
    toast('Cảm ơn bạn đã đánh giá! ⭐')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal product-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn modal-close" onClick={onClose}><Ic e="✕" size={18} /></button>
        <div className="pm-grid">
          <div className="pm-img">
            {product.flash && <span className="b-flash"><Ic e="⚡" size={12} /> FLASH SALE</span>}
            <ProductImg src={product.image} alt={product.name} className={out ? 'img-out' : 'img-in'} />
            <button className={`wish-btn pm-wish ${inWish ? 'active' : ''}`}
              onClick={() => { toggleWishlist(product.id); toast(inWish ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích', 'info') }}>
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
            <div className="card-price">
              <span className="price big">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <>
                  <span className="old-price">{formatPrice(product.oldPrice)}</span>
                  <span className="b-discount">-{discount}%</span>
                </>
              )}
            </div>
            <p className="pm-desc">{product.desc}. Bảo hành chính hãng 12 tháng, đổi trả miễn phí trong 7 ngày.</p>
            <div className={`pm-stock ${out ? 'out' : stock <= 5 ? 'low' : 'ok'}`}>
              {out ? <span><Ic e="🚫" size={14} /> Hết hàng</span> : stock <= 5 ? <span><Ic e="⚠️" size={14} /> Còn {stock} sản phẩm</span> : <span><Ic e="✅" size={14} /> Còn {stock} sản phẩm</span>}
            </div>
            <div className="pm-buy">
              <div className="qty big">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(stock || 1, q + 1))}>+</button>
              </div>
              <button className="primary-btn" onClick={add} disabled={out}>
                {out ? 'Hết hàng' : <span><Ic e="🛒" size={16} /> Thêm vào giỏ</span>}
              </button>
            </div>
          </div>
        </div>

        <div className="pm-tabs">
          <button className={`tab ${tab === 'desc' ? 'active' : ''}`} onClick={() => setTab('desc')}><Ic e="📋" size={15} /> Mô tả</button>
          <button className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}><Ic e="⭐" size={15} /> Đánh giá ({list.length})</button>
        </div>

        {tab === 'desc' && (
          <div className="pm-tab-content">
            <p>{product.desc}.</p>
            <ul className="pm-features">
              <li><Ic e="✔" size={14} className="feat-ic" /> Bảo hành chính hãng 12 tháng</li>
              <li><Ic e="✔" size={14} className="feat-ic" /> Giao hàng toàn quốc 1-3 ngày</li>
              <li><Ic e="✔" size={14} className="feat-ic" /> Kiểm tra hàng trước khi nhận</li>
              <li><Ic e="✔" size={14} className="feat-ic" /> Đổi trả miễn phí 7 ngày</li>
              <li><Ic e="✔" size={14} className="feat-ic" /> Tích điểm thưởng 1%/giá trị đơn hàng</li>
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
                <input placeholder={user ? user.name : 'Tên của bạn'} value={rv.name}
                  onChange={e => setRv({ ...rv, name: e.target.value })} />
                <input placeholder="Viết nhận xét của bạn..." value={rv.comment}
                  onChange={e => setRv({ ...rv, comment: e.target.value })} />
              </div>
              <button className="primary-btn" type="submit">Gửi đánh giá</button>
            </form>
            <div className="review-list">
              {list.length === 0 && <p className="tx-empty">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>}
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
      </div>
    </div>
  )
}
