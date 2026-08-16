import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useCompare } from '../context/CompareContext'
import { flashActive } from '../utils/flash'
import { useLang } from '../utils/i18n'
import { formatPrice } from '../utils/format'
import ProductImg from './ProductImg'
import Ic from './Ic'

export default function ProductCard({ product, onView }) {
  const { addToCart, cart } = useCart()
  const { wishlist, toggleWishlist, getStock, avgRating, reviews } = useStore()
  const { toast } = useToast()
  const { ids, toggle: toggleCompare } = useCompare()
  const { t } = useLang()
  const inCompare = ids.includes(product.id)

  const stock = getStock(product)
  const out = stock <= 0
  const low = stock > 0 && stock <= 5
  const inWish = wishlist.includes(product.id)
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const rating = avgRating(product.id)

  const add = () => {
    if (out) return toast(t('toast.out'), 'error')
    const inCart = cart.find(i => i.id === product.id)?.qty || 0
    if (inCart >= stock) return toast(`${t('toast.stockOnly')} ${stock} ${t('toast.sp')}`, 'error')
    addToCart(product)
    toast(`${t('toast.added')} "${product.name}" 🛒`)
  }

  const doCompare = () => {
    if (!inCompare && ids.length >= 4) return toast(t('compare.max'), 'error')
    toggleCompare(product.id)
    if (!inCompare && ids.length + 1 >= 2) toast(`${t('card.compare')}: chọn thêm để so sánh`, 'info')
  }

  return (
    <div className={`card ${out ? 'out' : ''}`}>
      <div className="card-badges">
        {flashActive(product) && <span className="b-flash"><Ic e="⚡" size={12} /> FLASH SALE</span>}
        {discount > 0 && <span className="b-discount">-{discount}%</span>}
        {low && <span className="b-low">Còn {stock}!</span>}
        {out && <span className="b-out">Hết hàng</span>}
      </div>
      <button className={`wish-btn ${inWish ? 'active' : ''}`}
        onClick={() => { toggleWishlist(product.id); toast(inWish ? t('toast.wishRemove') : t('toast.wishAdd'), 'info') }}>
        <Ic e={inWish ? '❤️' : '🤍'} size={17} className={inWish ? 'wish-on' : ''} />
      </button>
      <div className="card-img" onClick={() => onView(product)}>
        <ProductImg src={product.image} alt={product.name} className={out ? 'img-out' : 'img-in'} />
      </div>
      <div className="card-body">
        <span className="card-cat">{product.category}</span>
        <h3 className="card-name" onClick={() => onView(product)}>{product.name}</h3>
        <p className="card-desc">{product.desc}</p>
        <div className="card-rating"><Ic e="⭐" size={14} className="rate-ic" /> {rating} <span className="rating-count">{(reviews[product.id] || []).length} {t('card.reviews')}</span></div>
        <div className="card-price">
          <span className="price">{formatPrice(product.price)}</span>
          {product.oldPrice && <span className="old-price">{formatPrice(product.oldPrice)}</span>}
        </div>
        <div className="card-actions">
          <button className="add-btn" onClick={add} disabled={out}>
            {out ? t('card.out') : <span><Ic e="🛒" size={15} /> {t('card.add')}</span>}
          </button>
          <button className={`view-btn cmp-btn ${inCompare ? 'active' : ''}`} onClick={doCompare} title={inCompare ? t('card.compareOn') : t('card.compare')}>
            <Ic e="⚖️" size={16} />
          </button>
          <button className="view-btn" onClick={() => onView(product)} title={t('card.view')}><Ic e="👁️" size={18} /></button>
        </div>
      </div>
    </div>
  )
}
