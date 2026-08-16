import { createContext, useContext, useState } from 'react'

import { trackEvent } from '../utils/track'

const AuthContext = createContext(null)
export const POINTS_REDEEM_RATE = 1000 // 1000 điểm = 10.000đ (1 điểm = 10đ)
export const REFERRAL_BONUS = 20000 // 20K cho cả 2 bên khi giới thiệu

// Activity log (admin sees recent shop events)
export const logActivity = (action, detail = '') => {
  try {
    const log = JSON.parse(localStorage.getItem('shop_activity_log')) || []
    log.unshift({ id: Date.now() + Math.random(), action, detail, date: Date.now() })
    localStorage.setItem('shop_activity_log', JSON.stringify(log.slice(0, 60)))
  } catch {}
}

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

  const register = ({ name, email, phone, password, referralCode }) => {
    if (loadUsers().find(u => u.email === email))
      return { ok: false, msg: 'Email đã tồn tại!' }
    if (password.length < 6)
      return { ok: false, msg: 'Mật khẩu tối thiểu 6 ký tự!' }
    saveUser({
      name, email, phone, password,
      balance: 50000, points: 100, transactions: [
        { id: Date.now(), type: 'topup', amount: 50000, method: 'Quà tặng tân binh', date: Date.now() }
      ],
      orders: [], addresses: [], createdAt: Date.now(),
      referralCode: 'SR-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      referredBy: null
    })
    // Referral: reward the referrer 20K + log
    let refMsg = ''
    if (referralCode) {
      const users = loadUsers()
      const referrer = users.find(u => u.referralCode === String(referralCode).trim().toUpperCase())
      if (referrer && referrer.email !== email) {
        const i = users.findIndex(u => u.email === referrer.email)
        users[i] = {
          ...users[i],
          balance: (users[i].balance || 0) + REFERRAL_BONUS,
          transactions: [{ id: Date.now(), type: 'topup', amount: REFERRAL_BONUS, method: 'Thưởng giới thiệu', date: Date.now() }, ...(users[i].transactions || [])]
        }
        localStorage.setItem('shop_users', JSON.stringify(users))
        logActivity('referral', `${name} đăng ký với mã ${referrer.referralCode} — thưởng ${REFERRAL_BONUS.toLocaleString('vi-VN')}đ`)
        refMsg = ` • Thưởng ${REFERRAL_BONUS.toLocaleString('vi-VN')}đ cho người giới thiệu!`
      }
    }
    logActivity('register', `${name} <${email}>`)
    return { ok: true, msg: 'Đăng ký thành công! Tặng 50K + 100 điểm' + refMsg }
  }

  const login = (email, password) => {
    const u = loadUsers().find(x => x.email === email)
    if (!u) return { ok: false, msg: 'Email không tồn tại!' }
    if (u.blocked) return { ok: false, msg: 'Tài khoản đã bị khóa. Liên hệ hỗ trợ!' }
    if (u.password !== password) return { ok: false, msg: 'Sai mật khẩu!' }
    saveUser({ ...u, balance: u.balance || 0, points: u.points || 0,
      transactions: u.transactions || [], orders: u.orders || [],
      addresses: u.addresses || [],
      referralCode: u.referralCode || 'SR-' + Math.random().toString(36).slice(2, 8).toUpperCase() })
    return { ok: true, msg: 'Xin chào ' + u.name + '!' }
  }

  const logout = () => {
    localStorage.removeItem('shop_current')
    setUser(null)
  }

  // Re-read the current user from localStorage (source of truth).
  // Needed because admin-side mutations (order status, refunds) write to
  // localStorage directly and don't update this in-memory state.
  const refreshUser = () => {
    const email = localStorage.getItem('shop_current')
    if (!email) return
    const u = loadUsers().find(x => x.email === email)
    if (u) setUser(u)
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
    trackEvent('orders')
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
    trackEvent('orders')
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

  // Redeem a gift card code (admin-created) into wallet balance
  const redeemGiftCard = (code) => {
    if (!user) return { ok: false, msg: 'Vui lòng đăng nhập!' }
    const cards = (() => { try { return JSON.parse(localStorage.getItem('shop_giftcards')) || [] } catch { return [] } })()
    const i = cards.findIndex(c => c.code === String(code).trim().toUpperCase() && !c.used)
    if (i === -1) return { ok: false, msg: 'Thẻ quà không hợp lệ hoặc đã dùng!' }
    cards[i] = { ...cards[i], used: true, usedBy: user.email, usedAt: Date.now() }
    localStorage.setItem('shop_giftcards', JSON.stringify(cards))
    saveUser({
      ...user,
      balance: (user.balance || 0) + cards[i].amount,
      transactions: [{ id: Date.now(), type: 'topup', amount: cards[i].amount, method: 'Thẻ quà tặng ' + cards[i].code, date: Date.now() }, ...(user.transactions || [])]
    })
    logActivity('giftcard', `${user.name} đổi thẻ ${cards[i].code} (${cards[i].amount.toLocaleString('vi-VN')}đ)`)
    return { ok: true, msg: `Đã cộng ${cards[i].amount.toLocaleString('vi-VN')}đ vào ví! 🎁` }
  }

  // Daily check-in: 10-50 points based on streak (max 50)
  const dailyCheckin = () => {
    if (!user) return { ok: false, msg: 'Vui lòng đăng nhập!' }
    const today = new Date().toDateString()
    if (user.lastCheckin === today) return { ok: false, msg: 'Hôm nay đã điểm danh rồi!' }
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const streak = user.lastCheckin === yesterday ? (user.checkinStreak || 0) + 1 : 1
    const pts = Math.min(50, 10 + (streak - 1) * 10)
    saveUser({
      ...user,
      lastCheckin: today,
      checkinStreak: streak,
      points: (user.points || 0) + pts,
    })
    logActivity('checkin', `${user.name} điểm danh ngày ${streak} (+${pts} điểm)`)
    return { ok: true, msg: `Điểm danh thành công! +${pts} điểm (chuỗi ${streak} ngày)`, streak, pts }
  }

  // Return / exchange request
  const requestReturn = (orderId, reason) => {
    if (!user) return { ok: false }
    saveUser({
      ...user,
      orders: (user.orders || []).map(o => o.id === orderId
        ? { ...o, return: { status: 'pending', reason, date: Date.now() } }
        : o),
    })
    logActivity('return', `${user.name} yêu cầu đổi trả đơn #${orderId.slice(-6).toUpperCase()}`)
    return { ok: true }
  }

  // Address book
  const saveAddress = (addr) => {
    if (!user) return
    const addresses = [addr, ...(user.addresses || [])].slice(0, 6)
    saveUser({ ...user, addresses })
  }
  const deleteAddress = (idx) => {
    if (!user) return
    saveUser({ ...user, addresses: (user.addresses || []).filter((_, i) => i !== idx) })
  }

  return (
    <AuthContext.Provider value={{
      user, register, login, logout, topUp, payWithWallet,
      addOrder, cancelOrder, updateProfile, redeemGiftCard,
      saveAddress, deleteAddress, dailyCheckin, requestReturn, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
