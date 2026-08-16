// Lightweight funnel counters for the admin report.
const KEY = 'shop_funnel'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { views: 0, carts: 0, orders: 0 } } catch { return { views: 0, carts: 0, orders: 0 } } }
export const trackEvent = (type) => {
  const f = load()
  if (type in f) { f[type] += 1; localStorage.setItem(KEY, JSON.stringify(f)) }
}
export const getFunnel = () => load()
