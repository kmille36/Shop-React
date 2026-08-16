import { createContext, useContext, useState, useCallback } from 'react'
import { products as baseProducts } from '../data/products'
import { logActivity } from './AuthContext'
import { pushNotification } from './NotifyContext'
import { seedCoupons } from '../data/coupons'
import { hashPassword, verifyPassword } from '../utils/security'

const AdminContext = createContext(null)

const ADMIN_DEFAULT = { email: 'admin@shopreact.vn', password: 'admin123' }

const load = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb } catch { return fb } }
const save = (k, v) => localStorage.setItem(k, v)

// ---------- data accessors (read) ----------
const getUsers = () => load('shop_users', [])

const getAdminCreds = () => ({ ...ADMIN_DEFAULT, ...load('shop_admin_creds', {}) })

const getProductOverrides = () => load('shop_product_overrides', {})
const getCustomProducts = () => load('shop_custom_products', [])
const getDeletedProducts = () => load('shop_deleted_products', [])
const getSold = () => load('shop_sold', {})

// merged product list (base + custom, minus deleted, with overrides)
const getProducts = () => {
  const overrides = getProductOverrides()
  const deleted = new Set(getDeletedProducts())
  const list = [
    ...baseProducts.filter(p => !deleted.has(p.id)),
    ...getCustomProducts().filter(p => !deleted.has(p.id)),
  ]
  return list.map(p => ({ ...p, ...overrides[p.id] }))
}

const getCustomCoupons = () => load('shop_custom_coupons', {})

// all orders flattened, with owner info
const getOrders = () => {
  const out = []
  getUsers().forEach(u => (u.orders || []).forEach(o => out.push({ ...o, userEmail: u.email, userName: u.customer || u.name })))
  out.sort((a, b) => b.date - a.date)
  return out
}

// ---------- mutations ----------
const mutateUser = (email, fn) => {
  const users = getUsers()
  const i = users.findIndex(u => u.email === email)
  if (i === -1) return false
  users[i] = fn(users[i])
  save('shop_users', JSON.stringify(users))
  return true
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => load('shop_admin', null))
  const [, force] = useState(0)
  const bump = () => force(x => x + 1)

  const login = async (email, password) => {
    const c = getAdminCreds()
    const passOk = await verifyPassword(password, c.password)
    if (email.trim().toLowerCase() === c.email && passOk) {
      const a = { email: c.email, name: 'Quản trị viên', loginAt: Date.now() }
      save('shop_admin', JSON.stringify(a))
      setAdmin(a)
      return { ok: true, msg: 'Xin chào ' + c.email + '! 👋' }
    }
    return { ok: false, msg: 'Email hoặc mật khẩu quản trị sai!' }
  }

  const logout = () => {
    localStorage.removeItem('shop_admin')
    setAdmin(null)
  }

  const changePassword = async (oldPass, newPass) => {
    const c = getAdminCreds()
    if (!(await verifyPassword(oldPass, c.password))) return { ok: false, msg: 'Mật khẩu cũ sai!' }
    if (newPass.length < 6) return { ok: false, msg: 'Mật khẩu mới tối thiểu 6 ký tự!' }
    save('shop_admin_creds', JSON.stringify({ ...c, password: await hashPassword(newPass) }))
    return { ok: true, msg: 'Đã đổi mật khẩu quản trị!' }
  }

  // ===== Orders =====
  const setOrderStatus = (email, orderId, status) => {
    mutateUser(email, u => ({
      ...u,
      orders: (u.orders || []).map(o => o.id === orderId ? { ...o, status } : o)
    }))
    const STATUS_TXT = { paid: 'đã được xác nhận thanh toán', processing: 'đang được xử lý', shipped: 'đang được giao', delivered: 'đã được giao thành công', cancelled: 'đã bị hủy' }
    if (STATUS_TXT[status]) pushNotification(`Đơn hàng #${orderId.slice(-6).toUpperCase()} ${STATUS_TXT[status]}`)
    logActivity('order', `Đơn #${orderId.slice(-6).toUpperCase()} → ${status}`)
    bump()
  }

  // ===== Products =====
  const updateProduct = (id, fields) => {
    const ov = getProductOverrides()
    ov[id] = { ...(ov[id] || {}), ...fields }
    save('shop_product_overrides', JSON.stringify(ov))
    logActivity('product', `Cập nhật sản phẩm #${id}`)
    bump()
  }

  const addProduct = (p) => {
    const list = getCustomProducts()
    const id = Math.max(1000, ...list.map(x => x.id), ...baseProducts.map(x => x.id)) + 1
    list.push({ ...p, id, flash: false })
    save('shop_custom_products', JSON.stringify(list))
    logActivity('product', `Thêm sản phẩm "${p.name}"`)
    bump()
  }

  const deleteProduct = (id) => {
    const del = new Set(getDeletedProducts()); del.add(id)
    save('shop_deleted_products', JSON.stringify([...del]))
    save('shop_custom_products', JSON.stringify(getCustomProducts().filter(p => p.id !== id)))
    logActivity('product', `Xóa sản phẩm #${id}`)
    bump()
  }

  // ===== Users =====
  const deleteUser = (email) => {
    save('shop_users', JSON.stringify(getUsers().filter(u => u.email !== email)))
    logActivity('user', `Xóa tài khoản ${email}`)
    bump()
  }
  const resetUserPassword = async (email, newPass) => {
    mutateUser(email, u => ({ ...u, password: newPass })) // caller hashes newPass
    bump()
  }
  const toggleUserBlock = (email) => {
    const wasBlocked = getUsers().find(u => u.email === email)?.blocked
    mutateUser(email, u => ({ ...u, blocked: !u.blocked }))
    logActivity('user', `${wasBlocked ? 'Mở khóa' : 'Khóa'} tài khoản ${email}`)
    bump()
  }
  const adjustUserBalance = (email, delta) => {
    mutateUser(email, u => ({
      ...u,
      balance: Math.max(0, (u.balance || 0) + delta),
      transactions: [{ id: Date.now(), type: delta > 0 ? 'topup' : 'payment', amount: delta, method: 'Chỉnh sửa bởi admin', date: Date.now() }, ...(u.transactions || [])]
    }))
    bump()
  }

  // ===== Coupons =====
  const addCoupon = (c) => {
    const custom = getCustomCoupons()
    custom[c.id] = c
    save('shop_custom_coupons', JSON.stringify(custom))
    logActivity('coupon', `Thêm mã ${c.id}`)
    bump()
  }
  const deleteCoupon = (id) => {
    if (seedCoupons[id]) return { ok: false, msg: 'Không thể xóa mã mặc định!' }
    const custom = getCustomCoupons()
    delete custom[id]
    save('shop_custom_coupons', JSON.stringify(custom))
    bump()
    return { ok: true }
  }

  // ===== Gift cards =====
  const getGiftCards = () => load('shop_giftcards', [])
  const createGiftCard = (amount) => {
    const cards = getGiftCards()
    const code = 'GC-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    cards.unshift({ code, amount, createdAt: Date.now(), used: false, usedBy: null, usedAt: null })
    save('shop_giftcards', JSON.stringify(cards))
    logActivity('giftcard', `Tạo thẻ ${code} (${amount.toLocaleString('vi-VN')}đ)`)
    bump()
    return code
  }
  const deleteGiftCard = (code) => {
    save('shop_giftcards', JSON.stringify(getGiftCards().filter(c => c.code !== code)))
    logActivity('giftcard', `Xóa thẻ ${code}`)
    bump()
  }

  // ===== Activity log =====
  const getActivity = () => load('shop_activity_log', [])

  // ===== Q&A (admin answers customer questions) =====
  const getQA = () => load('shop_qa', {})
  const answerQA = (productId, qaId, answer) => {
    const all = load('shop_qa', {})
    all[productId] = (all[productId] || []).map(x => x.id === qaId ? { ...x, a: answer } : x)
    save('shop_qa', JSON.stringify(all))
    logActivity('qa', `Trả lời câu hỏi sản phẩm #${productId}`)
    bump()
  }

  // ===== Price / stock alerts =====
  const getPriceAlerts = () => load('shop_price_alerts', [])
  const getStockAlerts = () => load('shop_stock_alerts', [])
  const markAlertDone = (type, id) => {
    const key = type === 'price' ? 'shop_price_alerts' : 'shop_stock_alerts'
    const list = load(key, []).map(a => a.id === id ? { ...a, done: true } : a)
    save(key, JSON.stringify(list))
    const a = list.find(x => x.id === id)
    if (a && a.email) pushNotification(type === 'price' ? 'Sản phẩm bạn theo dõi đã giảm giá! 📉' : 'Sản phẩm bạn chờ đã có hàng! 📦', a.email)
    logActivity('alert', `Xử lý ${type === 'price' ? 'báo giá' : 'báo hàng'} #${id}`)
    bump()
  }

  // ===== Returns (exchange/refund) =====
  const getReturns = () => {
    const out = []
    getUsers().forEach(u => (u.orders || []).forEach(o => {
      if (o.return) out.push({ ...o.return, orderId: o.id, orderTotal: o.total, userEmail: u.email, userName: u.customer || u.name, orderDate: o.date })
    }))
    return out.sort((a, b) => b.date - a.date)
  }
  const setReturnStatus = (email, orderId, status) => {
    mutateUser(email, u => ({
      ...u,
      orders: (u.orders || []).map(o => o.id === orderId ? { ...o, return: { ...o.return, status, resolvedAt: Date.now() } } : o),
      // refund to wallet when approved
      ...(status === 'approved'
        ? (() => {
            const order = (u.orders || []).find(o => o.id === orderId)
            return {
              balance: (u.balance || 0) + (order?.total || 0),
              transactions: [{ id: Date.now(), type: 'topup', amount: order?.total || 0, method: 'Hoàn tiền đổi trả #' + orderId.slice(-6).toUpperCase(), date: Date.now() }, ...(u.transactions || [])],
            }
          })()
        : {}),
    }))
    logActivity('return', `Đơn #${orderId.slice(-6).toUpperCase()} đổi trả → ${status}`)
    if (status === 'approved') pushNotification('Yêu cầu đổi trả của bạn đã được duyệt — tiền đã hoàn vào ví! 💰', email)
    if (status === 'rejected') pushNotification('Yêu cầu đổi trả của bạn đã bị từ chối. Liên hệ hỗ trợ để biết thêm.', email)
    bump()
  }

  // ===== Blog =====
  const getBlog = () => load('shop_blog', [])
  const addBlogPost = (post) => {
    const list = getBlog()
    // unique id (timestamp) to avoid colliding with seed post ids
    list.unshift({ ...post, id: Date.now(), date: Date.now() })
    save('shop_blog', JSON.stringify(list))
    logActivity('blog', `Thêm bài "${post.title}"`)
    bump()
  }
  const deleteBlogPost = (id) => {
    save('shop_blog', JSON.stringify(getBlog().filter(x => x.id !== id)))
    logActivity('blog', `Xóa bài #${id}`)
    bump()
  }

  // ===== Product CSV import =====
  const importProducts = (rows) => {
    // rows: [{name, category, price, oldPrice, stock, image, desc}]
    let added = 0
    rows.forEach(p => {
      if (!p.name || !p.price) return
      const list = getCustomProducts()
      const id = Math.max(1000, ...list.map(x => x.id), ...baseProducts.map(x => x.id)) + 1
      list.push({
        id, name: p.name, category: p.category || 'Phụ kiện',
        price: Number(p.price), oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
        stock: Number(p.stock) || 10, image: p.image || '📦', desc: p.desc || '', flash: false,
      })
      save('shop_custom_products', JSON.stringify(list))
      added++
    })
    logActivity('product', `Nhập CSV: ${added} sản phẩm`)
    bump()
    return added
  }

  return (
    <AdminContext.Provider value={{
      admin, login, logout, changePassword,
      getUsers, getProducts, getOrders, getSold, getCustomCoupons,
      setOrderStatus, updateProduct, addProduct, deleteProduct,
      deleteUser, resetUserPassword, toggleUserBlock, adjustUserBalance,
      addCoupon, deleteCoupon,
      getGiftCards, createGiftCard, deleteGiftCard, getActivity,
      getQA, answerQA,
      getPriceAlerts, getStockAlerts, markAlertDone,
      getReturns, setReturnStatus,
      getBlog, addBlogPost, deleteBlogPost,
      importProducts,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
