import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const Ctx = createContext(null)
const load = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb } catch { return fb } }

// Admin/user actions push notifications via a custom event
// (so any context can notify without prop-drilling)
// email scopes the notification to one user (undefined = everyone)
export function pushNotification(text, email) {
  window.dispatchEvent(new CustomEvent('shop-notify', { detail: { text, email } }))
}

export function NotifyProvider({ children }) {
  const [notifs, setNotifs] = useState(() => load('shop_notifs', []))

  useEffect(() => localStorage.setItem('shop_notifs', JSON.stringify(notifs)), [notifs])

  const add = useCallback(({ text, email }) => {
    setNotifs(prev => [{ id: Date.now() + Math.random(), text, email: email || null, date: Date.now(), read: false }, ...prev].slice(0, 60))
  }, [])

  useEffect(() => {
    const h = (e) => add(e.detail || { text: e.detail })
    window.addEventListener('shop-notify', h)
    return () => window.removeEventListener('shop-notify', h)
  }, [add])

  const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  const clear = () => setNotifs([])
  const unseen = notifs.filter(n => !n.read).length

  return <Ctx.Provider value={{ notifs, unseen, markAll, clear, add }}>{children}</Ctx.Provider>
}

export const useNotify = () => useContext(Ctx)
