import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext(null)
export const MAX_COMPARE = 4

export function CompareProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shop_compare')) || [] } catch { return [] }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => localStorage.setItem('shop_compare', JSON.stringify(ids)), [ids])

  const toggle = (id) =>
    setIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, id]
    })

  return (
    <Ctx.Provider value={{ ids, toggle, clear: () => setIds([]), open, setOpen }}>
      {children}
    </Ctx.Provider>
  )
}

export const useCompare = () => useContext(Ctx)
