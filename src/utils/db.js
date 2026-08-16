// ============================================================
// DB sync layer — mirrors the app's shared localStorage keys to
// the in-RAM server database (server/index.js).
//
//  - On boot: pulls the server DB into localStorage (server wins),
//    then pushes any local-only keys up (first boot / offline data).
//  - At runtime: a light poller detects changes/removals of the
//    shared keys and pushes them (debounced) to the server.
//  - On unload: flushes pending changes via sendBeacon.
//  - If the server is unreachable the app keeps working with
//    localStorage alone (offline mode) and retries in the background.
// ============================================================

const API = import.meta.env.VITE_API_URL || ''

// every shared key the app persists — all of them live in the DB
export const SYNC_KEYS = [
  'cart',
  'shop_activity_log', 'shop_admin', 'shop_admin_creds', 'shop_blog',
  'shop_compare', 'shop_coupon', 'shop_current', 'shop_custom_coupons',
  'shop_custom_products', 'shop_deleted_products', 'shop_giftcards',
  'shop_giftwrap', 'shop_lang', 'shop_notifs', 'shop_price_alerts',
  'shop_product_overrides', 'shop_qa', 'shop_recent', 'shop_reviews',
  'shop_sold', 'shop_spin_date', 'shop_stock_alerts', 'shop_theme',
  'shop_topup_mode', 'shop_topup_requests', 'shop_users', 'shop_view', 'shop_wishlist', 'shop_zone',
  'shop_branding',
]

let serverUp = false
const pending = new Map() // key -> value | null (null = removed)
let lastSeen = {}
let flushTimer = null
let started = false

async function fetchJson(url, opts = {}, timeoutMs = 2000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal })
    if (!r.ok) throw new Error('http ' + r.status)
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

async function boot() {
  try {
    const { db } = await fetchJson(API + '/api/db')
    if (!db || typeof db !== 'object' || typeof db.keys !== 'object') throw new Error('bad payload')
    // 1) server wins for every key it holds.
    //    The server stores the exact localStorage string, so write it back
    //    verbatim (do NOT re-stringify — that double-encodes JSON values and
    //    turns e.g. shop_notifs from [] into the string "[]", crashing .filter).
    for (const [k, v] of Object.entries(db.keys)) {
      const s = typeof v === 'string' ? v : JSON.stringify(v)
      localStorage.setItem(k, s)
      lastSeen[k] = s
    }
    serverUp = true
    // 2) push keys that only exist locally (first boot / created offline)
    for (const k of SYNC_KEYS) {
      const local = localStorage.getItem(k)
      if (local != null && lastSeen[k] === undefined) {
        lastSeen[k] = local
        pending.set(k, local)
      }
    }
    flushNow()
    console.info('[db] synced with server')
  } catch (e) {
    serverUp = false
    console.warn('[db] server offline — localStorage-only mode:', e.message)
  }
}

function pushKey(key, value) {
  pending.set(key, value)
  if (flushTimer) return
  flushTimer = setTimeout(flushNow, 800)
}

async function flushNow() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
  if (!serverUp || pending.size === 0) return
  const keys = Object.fromEntries(pending)
  pending.clear()
  try {
    await fetchJson(API + '/api/db/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    }, 4000)
  } catch {
    // re-queue and retry in 5s
    for (const [k, v] of Object.entries(keys)) if (!pending.has(k)) pending.set(k, v)
    flushTimer = setTimeout(flushNow, 5000)
  }
}

function startWatcher() {
  if (started) return
  started = true
  for (const k of SYNC_KEYS) lastSeen[k] = localStorage.getItem(k)
  setInterval(() => {
    if (!serverUp) return
    for (const k of SYNC_KEYS) {
      const cur = localStorage.getItem(k)
      if (cur === lastSeen[k]) continue
      const prev = lastSeen[k]
      lastSeen[k] = cur
      if (cur == null) {
        if (prev != null) pushKey(k, null) // sync removals too
      } else {
        pushKey(k, cur)
      }
    }
  }, 1000)
}

// Best-effort flush when the tab closes (sendBeacon is async + survives unload)
function onUnload() {
  if (!serverUp || pending.size === 0) return
  const blob = new Blob([JSON.stringify({ keys: Object.fromEntries(pending) })], { type: 'application/json' })
  if (navigator.sendBeacon) navigator.sendBeacon(API + '/api/db/bulk', blob)
}

// Boot: load server DB into localStorage, then start watching.
// Resolves after ~2.5s at most so the app always renders (even offline).
export async function initDb() {
  await Promise.race([boot(), new Promise(r => setTimeout(r, 2500))])
  startWatcher()
  window.addEventListener('beforeunload', onUnload)
}
