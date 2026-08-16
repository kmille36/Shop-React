import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
export const POINTS_REDEEM_RATE = 1000 // 100 điểm = 10.000đ

const loadUsers = () => {
  try { return JSON.parse(localStorage.getItem('shop_users')) || [] } catch { return [] }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('shop_current')
    if (!email) return null
    return loadUsers().find(x => x.email === email) || null
  })

  const saveUser = (u) => {
    const users = loadUsers().filter(x => x.email !== u.email)
    users.push(u)
    localStorage.setItem('shop_users', JSON.stringify(users))
    localStorage.setItem('shop_current', u.email)
    setUser(u)
  }

  const register = ({ name, email, phone, password }) => {
    if (loadUsers().find(u => u.email === email))
      return { ok: false, msg: 'Email đã tồn tại!' }
    if (password.length < 6)
      return { ok: false, msg: 'Mật khẩu tối thiểu 6 ký tự!' }
    saveUser({
      name, email, phone, password,
      balance: 50000, points: 100, transactions: [
        { id: Date.now(), type: 'topup', amount: 50000, method: 'Quà tặng tân binh', date: Date.now() }
      ],
      orders: [], createdAt: Date.now()
    })
    return { ok: true, msg: 'Đăng ký thành công! Tặng 50K + 100 điểm' }
  }

  const login = (email, password) => {
    const u = loadUsers().find(x => x.email === email)
    if (!u) return { ok: false, msg: 'Email không tồn tại!' }
    if (u.blocked) return { ok: false, msg: 'Tài khoản đã bị khóa. Liên hệ hỗ trợ!' }
    if (u.password !== password) return { ok: false, msg: 'Sai mật khẩu!' }
    saveUser({ ...u, balance: u.balance || 0, points: u.points || 0,
      transactions: u.transactions || [], orders: u.orders || [] })
    return { ok: true, msg: 'Xin chào ' + u.name + '!' }
  }

  const logout = () => {
    localStorage.removeItem('shop_current')
    setUser(null)
  }

  const topUp = (amount, method) => {
    if (!user) return
    saveUser({
      ...user,
      balance: user.balance + amount,
      transactions: [{ id: Date.now(), type: 'topup', amount, method, date: Date.now() }, ...user.transactions]
    })
  }

  const payWithWallet = (amount, order, pointsUsed = 0) => {
    if (!user) return { ok: false }
    const redeemValue = Math.floor(pointsUsed / POINTS_REDEEM_RATE) * 10000
    if (user.balance + redeemValue < amount) return { ok: false }
    const newPoints = Math.max(0, user.points - pointsUsed) + Math.floor(amount / 10000)
    saveUser({
      ...user,
      balance: user.balance - (amount - redeemValue),
      points: newPoints,
      transactions: [{ id: Date.now(), type: 'payment', amount: -amount, method: 'Ví điện tử', date: Date.now() }, ...user.transactions],
      orders: [order, ...user.orders]
    })
    return { ok: true }
  }

  const addOrder = (order) => {
    if (!user) return
    const newPoints = (user.points || 0) + Math.floor(order.total / 10000)
    saveUser({
      ...user,
      points: newPoints,
      orders: [order, ...user.orders]
    })
  }

  const cancelOrder = (orderId) => {
    if (!user) return
    const order = user.orders.find(o => o.id === orderId)
    if (!order || order.status !== 'cod') return
    saveUser({
      ...user,
      orders: user.orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o)
    })
  }

  const updateProfile = (fields) => {
    if (!user) return
    saveUser({ ...user, ...fields })
  }

  return (
    <AuthContext.Provider value={{
      user, register, login, logout, topUp, payWithWallet,
      addOrder, cancelOrder, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
