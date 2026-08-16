import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { formatPrice } from '../utils/format'
import ProductImg from '../components/ProductImg'
import Ic from '../components/Ic'

export default function WishlistPage({ onView }) {
  const { wishlist, toggleWishlist, getStock, products } = useStore()
  const { addToCart, cart } = useCart()
  const { toast } = useToast()
  const [moved, setMoved] = useState([])

  const items = products.filter(p => wishlist.includes(p.id))

  const moveToCart = (p) => {
    const stock = getStock(p)
    if (stock <= 0) return toast('Sản phẩm đã hết hàng!', 'error')
    const inCart = cart.find(i => i.id === p.id)?.qty || 0
    if (inCart >= stock) return toast(`Chỉ còn ${stock} sản phẩm!`, 'error')
    addToCart(p)
    toggleWishlist(p.id)
    setMoved(prev => [...prev, p.id])
    toast(`Đã chuyển "${p.name}" vào giỏ 🛒`)
  }

  return (
    <div className="page">
      <h1 className="page-title"><Ic e="❤️" size={24} className="inline-ic" /> Sản phẩm yêu thích ({items.length})</h1>
      {items.length === 0 ? (
        <div className="glass empty-page">
          <div className="empty-icon"><Ic e="💔" size={44} /></div>
          <h2>Chưa có sản phẩm nào</h2>
          <p>Nhấn vào <Ic e="🤍" size={15} className="inline-ic" /> trên sản phẩm để lưu vào đây</p>
        </div>
      ) : (
        <div className="wish-grid">
          {items.map(p => {
            const out = getStock(p) <= 0
            return (
              <div className="glass wish-item" key={p.id}>
                <div className="wish-img" onClick={() => onView(p)}><ProductImg src={p.image} alt={p.name} /></div>
                <div className="wish-info">
                  <h3 onClick={() => onView(p)}>{p.name}</h3>
                  <div className="card-price">
                    <span className="price">{formatPrice(p.price)}</span>
                    {p.oldPrice && <span className="old-price">{formatPrice(p.oldPrice)}</span>}
                  </div>
                  <div className="wish-actions">
                    <button className="primary-btn small" onClick={() => moveToCart(p)} disabled={out}>
                      {moved.includes(p.id) ? <span><Ic e="✓" size={15} /> Đã thêm</span> : out ? 'Hết hàng' : <span><Ic e="🛒" size={15} /> Thêm vào giỏ</span>}
                    </button>
                    <button className="ghost-btn small" onClick={() => { toggleWishlist(p.id); toast('Đã bỏ yêu thích', 'info') }}>
                      Bỏ <Ic e="✕" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
