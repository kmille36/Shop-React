// Customer segmentation rules (computed from user data)
export const SEGMENTS = [
  { id: 'vip', icon: '💎', label: 'VIP', desc: '2000+ điểm hoặc chi 50 triệu+',
    test: (u) => (u.points || 0) >= 2000 || (u.orders || []).reduce((s, o) => s + o.total, 0) >= 50000000 },
  { id: 'regular', icon: '⭐', label: 'Thường xuyên', desc: 'Từ 3 đơn hàng',
    test: (u) => (u.orders || []).length >= 3 },
  { id: 'new', icon: '🌱', label: 'Mới', desc: 'Đăng ký trong 7 ngày',
    test: (u) => Date.now() - (u.createdAt || 0) < 7 * 86400000 },
  { id: 'inactive', icon: '😴', label: 'Không hoạt động', desc: '30+ ngày chưa mua',
    test: (u) => {
      if ((u.orders || []).length === 0) return false // new users handled above
      const last = Math.max(...u.orders.map(o => o.date))
      return Date.now() - last > 30 * 86400000
    },
  },
]

// First matching segment wins (order matters: VIP > regular > new > inactive)
export function segmentOf(user) {
  return SEGMENTS.find(s => s.test(user)) || { id: 'normal', icon: '👤', label: 'Khách hàng', desc: 'Thông thường' }
}
