const API = import.meta.env.VITE_API_URL || ''

// Uploads the original file to the server (saved on disk, served at
// /uploads/<id>.<ext>). Falls back to a resized data-URL (localStorage)
// when the server is unreachable, so uploads keep working offline.
export async function uploadImage(file, maxSide = 800) {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch(API + '/api/upload', { method: 'POST', body: fd })
    if (r.ok) {
      const j = await r.json()
      if (j && j.ok && j.url) return j.url
    }
  } catch { /* server offline -> data-URL fallback */ }
  return fileToDataUrl(file, maxSide)
}

// Reads an image file picked from the browser, downsizes it on a canvas and
// returns a data-URL so it can be stored in localStorage without bloating it.
// (product photos: max 800px, avatars: max 256px — see callers)
export function fileToDataUrl(file, maxSide = 800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('not-image'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read-failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode-failed'))
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
