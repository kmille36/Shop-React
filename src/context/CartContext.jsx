import { createContext, useContext, useState, useEffect } from 'react'
import { seedCoupons, couponCalc } from '../data/coupons'
import { formatPrice } from '../utils/format'

const CartContext = createContext(null)
export const GIFT_WRAP_FEE = 25000

// Coupons = seed + admin-added (persisted as serializable objects)
function loadAllCoupons() {
  try {
    const custom = JSON.parse(localStorage.getItem('shop_custom_coupons')) || {}
    return { ...seedCoupons, ...custom }
  } catch {
    return { ...seedCoupons }
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || [] } catch { return [] }
  })
  // restore coupon by CODE (object is serializable now)
  const [coupon, setCoupon] = useState(() => {
    const code = localStorage.getItem('shop_coupon')
    return code ? loadAllCoupons()[code] || null : null
  })
  const [giftWrap, setGiftWrap] = useState(() => localStorage.getItem('shop_giftwrap') === '1')

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart])
  useEffect(() => {
    if (coupon) localStorage.setItem('shop_coupon', coupon.id)
    else localStorage.removeItem('shop_coupon')
  }, [coupon])
  useEffect(() => localStorage.setItem('shop_giftwrap', giftWrap ? '1' : '0'), [giftWrap])

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id)
      if (found) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i)
      return [...prev, { ...product, qty }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id)
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const clearCart = () => { setCart([]); setCoupon(null); setGiftWrap(false) }

  const applyCoupon = (code, subtotal) => {
    const c = loadAllCoupons()[String(code).trim().toUpperCase()]
    if (!c) return { ok: false, msg: 'Mã giảm giá không tồn tại!' }
    if (subtotal < c.minTotal)
      return { ok: false, msg: `Mã ${c.label} yêu cầu đơn tối thiểu ${formatPrice(c.minTotal)}!` }
    return { ok: true, msg: `Áp mã ${c.label} thành công!`, coupon: c }
  }

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0)
  const discount = coupon ? couponCalc(coupon, subtotal) : 0
  const afterDiscount = subtotal - discount
  const shipping = (afterDiscount > 10000000 || (coupon && coupon.type === 'freeship')) ? 0 : 30000
  const giftFee = giftWrap ? GIFT_WRAP_FEE : 0
  const total = afterDiscount + shipping + giftFee

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQty, clearCart,
      coupon, applyCoupon, setCoupon,
      giftWrap, setGiftWrap,
      totalItems, subtotal, discount, shipping, giftFee, total
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
