import { createContext, useContext, useState, useEffect } from 'react'
import { products as baseProducts } from '../data/products'
import { useAdmin } from './AdminContext'

const StoreContext = createContext(null)

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v ?? fallback
  } catch { return fallback }
}

// Seed a few sample reviews
const seedReviews = {}
const seedComments = [
  'Sản phẩm rất tốt, giao hàng nhanh, đóng gói cẩn thận!',
  'Đúng mô tả, giá hợp lý. Sẽ ủng hộ shop lần sau.',
  'Mình dùng được 2 tuần, rất hài lòng. Recommend!',
]
baseProducts.forEach((p, i) => {
  seedReviews[p.id] = [
    { id: p.id * 100 + 1, name: 'Minh Anh', rating: 5, comment: seedComments[i % 3], date: Date.now() - 86400000 * (i + 2) },
  ]
})

export function StoreProvider({ children }) {
  const { getProducts } = useAdmin()
  const products = getProducts() // admin-managed (price/stock/add/delete)

  const [wishlist, setWishlist] = useState(() => load('shop_wishlist', []))
  const [reviews, setReviews] = useState(() => load('shop_reviews', seedReviews))
  const [recentlyViewed, setRecentlyViewed] = useState(() => load('shop_recent', []))
  const [sold, setSold] = useState(() => load('shop_sold', {}))
  const [qa, setQA] = useState(() => load('shop_qa', {}))

  useEffect(() => localStorage.setItem('shop_wishlist', JSON.stringify(wishlist)), [wishlist])
  useEffect(() => localStorage.setItem('shop_reviews', JSON.stringify(reviews)), [reviews])
  useEffect(() => localStorage.setItem('shop_recent', JSON.stringify(recentlyViewed)), [recentlyViewed])
  useEffect(() => localStorage.setItem('shop_sold', JSON.stringify(sold)), [sold])
  useEffect(() => localStorage.setItem('shop_qa', JSON.stringify(qa)), [qa])

  const toggleWishlist = (id) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const addReview = (productId, review) =>
    setReviews(prev => ({ ...prev, [productId]: [review, ...(prev[productId] || [])] }))

  const viewProduct = (id) =>
    setRecentlyViewed(prev => [id, ...prev.filter(x => x !== id)].slice(0, 8))

  const getStock = (product) => Math.max(0, (product.stock || 0) - (sold[product.id] || 0))

  const decrementStock = (items) =>
    setSold(prev => {
      const next = { ...prev }
      items.forEach(i => { next[i.id] = (next[i.id] || 0) + i.qty })
      return next
    })

  const avgRating = (productId) => {
    const list = reviews[productId] || []
    if (!list.length) return 4.5
    return Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10
  }

  // Q&A
  const addQA = (productId, item) =>
    setQA(prev => ({ ...prev, [productId]: [item, ...(prev[productId] || [])] }))
  const answerQA = (productId, qaId, answer) =>
    setQA(prev => ({
      ...prev,
      [productId]: (prev[productId] || []).map(x => x.id === qaId ? { ...x, a: answer } : x),
    }))

  // Price / stock alerts (persisted to localStorage; admin manages them)
  const addPriceAlert = (alert) => {
    const list = load('shop_price_alerts', [])
    list.unshift(alert)
    localStorage.setItem('shop_price_alerts', JSON.stringify(list))
  }
  const addStockAlert = (alert) => {
    const list = load('shop_stock_alerts', [])
    list.unshift(alert)
    localStorage.setItem('shop_stock_alerts', JSON.stringify(list))
  }

  return (
    <StoreContext.Provider value={{
      products,
      wishlist, toggleWishlist, reviews, addReview,
      recentlyViewed, viewProduct, getStock, decrementStock, avgRating,
      qa, addQA, answerQA,
      addPriceAlert, addStockAlert
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
