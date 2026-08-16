export const formatPrice = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)

export const formatShort = (v) =>
  v >= 1000000 ? (v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1) + 'tr'
  : v >= 1000 ? Math.round(v / 1000) + 'K'
  : String(v)
