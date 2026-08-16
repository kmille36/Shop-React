// Admin-customizable site title + favicon (stored in shop_branding, synced to DB).
const KEY = 'shop_branding'

export const DEFAULT_BRANDING = {
  title: 'ShopReact - Cửa hàng trực tuyến',
  favicon: null, // data-URL or http(s) URL; null = default emoji favicon
}

export const loadBranding = () => {
  try { return { ...DEFAULT_BRANDING, ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
  catch { return { ...DEFAULT_BRANDING } }
}

export const saveBranding = (b) => localStorage.setItem(KEY, JSON.stringify(b))

// Applies title + favicon to the live document
export const applyBranding = (b) => {
  b = b || DEFAULT_BRANDING
  if (b.title) document.title = b.title
  let link = document.querySelector("link[rel='icon'][data-branding]")
  if (b.favicon) {
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      link.setAttribute('data-branding', '1')
      document.head.appendChild(link)
    }
    link.href = b.favicon
  } else if (link) {
    link.remove()
  }
}
