// Flash sale scheduling: products can have optional flashStart/flashEnd (timestamps).
// Without times, flash runs until end of day (legacy behavior).
export function flashWindow(p) {
  const now = Date.now()
  if (p.flashEnd) {
    const active = (!p.flashStart || now >= p.flashStart) && now <= p.flashEnd
    return { active, end: p.flashEnd }
  }
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { active: true, end: end.getTime() }
}

export const flashActive = (p) => !!(p.flash && flashWindow(p).active)

// datetime-local helpers
export const toLocalInput = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (v) => {
  if (!v) return null
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : null
}
