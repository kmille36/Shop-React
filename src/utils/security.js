// Lightweight password hashing (SHA-256 via Web Crypto) so passwords are
// never stored in plaintext in localStorage / the server DB.
// Falls back to plaintext when Web Crypto is unavailable (non-secure contexts).
const SALT = 'shopreact::v1::'

export async function hashPassword(pw) {
  const data = SALT + String(pw)
  if (globalThis.crypto?.subtle) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
      return 'sha256$' + Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
    } catch { /* fall through to fallback */ }
  }
  // FNV-1a fallback (non-cryptographic, only for non-secure contexts)
  let h = 0x811c9dc5
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return 'fnv1a$' + h.toString(16)
}

// Compares a typed password against a stored value.
// Accepts both hashed values and legacy plaintext (auto-upgrade on next save).
export async function verifyPassword(pw, stored) {
  if (typeof stored !== 'string' || !stored) return false
  if (stored.startsWith('sha256$') || stored.startsWith('fnv1a$')) {
    return (await hashPassword(pw)) === stored
  }
  return pw === stored // legacy plaintext
}
