import { createContext, useContext, useState, useCallback } from 'react'
import { products as baseProducts } from '../data/products'
import { seedCoupons } from '../data/coupons'

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

  const login = (email, password) => {
    const c = getAdminCreds()
    if (email.trim().toLowerCase() === c.email && password === c.password) {
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

  const changePassword = (oldPass, newPass) => {
    const c = getAdminCreds()
    if (oldPass !== c.password) return { ok: false, msg: 'Mật khẩu cũ sai!' }
    if (newPass.length < 6) return { ok: false, msg: 'Mật khẩu mới tối thiểu 6 ký tự!' }
    save('shop_admin_creds', JSON.stringify({ ...c, password: newPass }))
    return { ok: true, msg: 'Đã đổi mật khẩu quản trị!' }
  }

  // ===== Orders =====
  const setOrderStatus = (email, orderId, status) => {
    mutateUser(email, u => ({
      ...u,
      orders: (u.orders || []).map(o => o.id === orderId ? { ...o, status } : o)
    }))
    bump()
  }

  // ===== Products =====
  const updateProduct = (id, fields) => {
    const ov = getProductOverrides()
    ov[id] = { ...(ov[id] || {}), ...fields }
    save('shop_product_overrides', JSON.stringify(ov))
    bump()
  }

  const addProduct = (p) => {
    const list = getCustomProducts()
    const id = Math.max(1000, ...list.map(x => x.id), ...baseProducts.map(x => x.id)) + 1
    list.push({ ...p, id, flash: false })
    save('shop_custom_products', JSON.stringify(list))
    bump()
  }

  const deleteProduct = (id) => {
    const del = new Set(getDeletedProducts()); del.add(id)
    save('shop_deleted_products', JSON.stringify([...del]))
    save('shop_custom_products', JSON.stringify(getCustomProducts().filter(p => p.id !== id)))
    bump()
  }

  // ===== Users =====
  const deleteUser = (email) => {
    save('shop_users', JSON.stringify(getUsers().filter(u => u.email !== email)))
    bump()
  }
  const resetUserPassword = (email, newPass) => {
    mutateUser(email, u => ({ ...u, password: newPass }))
    bump()
  }
  const toggleUserBlock = (email) => {
    mutateUser(email, u => ({ ...u, blocked: !u.blocked }))
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

  return (
    <AdminContext.Provider value={{
      admin, login, logout, changePassword,
      getUsers, getProducts, getOrders, getSold, getCustomCoupons,
      setOrderStatus, updateProduct, addProduct, deleteProduct,
      deleteUser, resetUserPassword, toggleUserBlock, adjustUserBalance,
      addCoupon, deleteCoupon,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
