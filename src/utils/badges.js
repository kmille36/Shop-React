// Achievement badges computed from a user's data.
export const BADGES = [
  { id: 'first', icon: '🎯', name: 'Đơn đầu tiên', desc: 'Đặt 1 đơn hàng', test: (u) => (u.orders || []).length >= 1 },
  { id: 'loyal', icon: '💜', name: 'Khách thân thiết', desc: 'Đặt 5 đơn hàng', test: (u) => (u.orders || []).length >= 5 },
  { id: 'spend', icon: '💎', name: 'Tỷ phú', desc: 'Chi 100 triệu', test: (u) => (u.orders || []).reduce((s, o) => s + o.total, 0) >= 100000000 },
  { id: 'vip', icon: '👑', name: 'VIP Diamond', desc: '2000+ điểm', test: (u) => (u.points || 0) >= 2000 },
  { id: 'wish', icon: '❤️', name: 'Sưu tầm', desc: '5+ sản phẩm yêu thích', test: (u, wish) => (wish || []).length >= 5 },
  { id: 'reviewer', icon: '⭐', name: 'Đánh giá viên', desc: 'Viết 1 đánh giá', test: (u, reviews) => (Object.values(reviews || {}).flat().some(r => r.name === u.name)) },
  { id: 'checkin', icon: '📅', name: 'Siêu chăm', desc: 'Điểm danh 7 ngày', test: (u) => (u.checkinStreak || 0) >= 7 },
  { id: 'gc', icon: '🎁', name: 'Thích quà', desc: 'Dùng 1 thẻ quà', test: (u) => (u.transactions || []).some(t => (t.method || '').includes('Thẻ quà')) },
]
export const earnedBadges = (user, wishlist, reviews) =>
  BADGES.filter(b => b.test(user, wishlist, reviews))
