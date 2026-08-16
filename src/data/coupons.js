// Coupon definitions use a SERIALIZABLE spec (no functions) so custom
// coupons added by the admin can be persisted to localStorage.
export const seedCoupons = {
  GIAM10:   { id: 'GIAM10', label: 'GIAM10', desc: 'Giảm 10% (tối đa 500K)', minTotal: 500000,  type: 'percent', value: 10, cap: 500000 },
  SAVE50:   { id: 'SAVE50', label: 'SAVE50', desc: 'Giảm 50K (tối thiểu 1 triệu)', minTotal: 1000000, type: 'fixed', value: 50000 },
  VIP20:    { id: 'VIP20', label: 'VIP20', desc: 'Giảm 20% (tối thiểu 5 triệu)', minTotal: 5000000, type: 'percent', value: 20 },
  FREESHIP: { id: 'FREESHIP', label: 'FREESHIP', desc: 'Miễn phí vận chuyển', minTotal: 0, type: 'freeship', value: 0 },
}

export const couponCalc = (c, total) => {
  if (!c) return 0
  if (c.type === 'percent') return Math.min(Math.round((total * c.value) / 100), c.cap || Infinity)
  if (c.type === 'fixed') return Math.min(c.value, total)
  return 0
}

export const couponDesc = (c) =>
  c.type === 'percent' ? `Giảm ${c.value}%${c.cap ? ` (tối đa ${Math.round(c.cap / 1000)}K)` : ''}`
  : c.type === 'fixed' ? `Giảm ${c.value.toLocaleString('vi-VN')}đ`
  : 'Miễn phí vận chuyển'
