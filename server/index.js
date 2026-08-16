// ============================================================
// Shop-React server — in-RAM database + periodic file persistence
// + image storage on disk. No external dependencies (Node >= 18).
//
//  - All shared data lives in `db` (an in-memory object).
//  - On startup it is loaded from data/db.json (if present).
//  - Whenever a mutation happens, the DB is marked dirty and is
//    written to disk on an interval (default 2s) and on shutdown.
//  - Uploaded images are saved to data/uploads/<id>.<ext> and
//    served at /uploads/<id>.<ext>.
// ============================================================
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.SHOP_DATA_DIR || path.join(__dirname, '..', 'data')
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
const DB_FILE = path.join(DATA_DIR, 'db.json')
const PORT = Number(process.env.PORT || 3001)
const SAVE_INTERVAL = Number(process.env.SAVE_INTERVAL_MS || 2000)
const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8MB

// ---------- in-RAM database ----------
const db = {
  meta: { createdAt: Date.now(), updatedAt: null },
  // shared keys (synced with the browser via /api/db)
  keys: {},
}

let dirty = false
let saving = false

const log = (...a) => console.log('[shop-server]', ...a)

// ---------- persistence ----------
function saveDb() {
  if (!dirty) return
  saving = true
  try {
    db.meta.updatedAt = Date.now()
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const tmp = DB_FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(db))
    fs.renameSync(tmp, DB_FILE)
    dirty = false
    log('DB persisted ->', DB_FILE)
  } catch (e) {
    log('DB save failed:', e.message)
  } finally {
    saving = false
  }
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      if (raw && typeof raw === 'object') {
        db.keys = raw.keys || {}
        db.meta = { ...db.meta, ...raw.meta }
        log('DB loaded from', DB_FILE, `(${Object.keys(db.keys).length} keys)`)
      }
    } else {
      log('No existing DB file — starting with an empty in-RAM DB.')
    }
  } catch (e) {
    log('DB load failed (starting empty):', e.message)
  }
}

// ---------- tiny helpers ----------
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  })
  res.end(body)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) { reject(new Error('too-large')); req.destroy(); return }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
}

// ---------- image upload ----------
// Detect the real image type from the file's magic bytes (reliable even when
// the request Content-Type is multipart/form-data, which it is for uploads).
function detectImageExt(buf) {
  if (!buf || buf.length < 12) return null
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return '.png'
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg'
  // GIF: 'GIF8'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return '.gif'
  // WebP: 'RIFF'....'WEBP'
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return '.webp'
  // AVIF / HEIF: 'ftyp' at offset 4 with 'avif'/'avis'
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70 &&
      (buf[8] === 0x61 || buf[8] === 0x6d)) return '.avif'
  // SVG / XML: starts with '<'
  const head = buf.slice(0, 200).toString('utf8').trim().toLowerCase()
  if (head.startsWith('<svg') || head.startsWith('<?xml')) return '.svg'
  return null
}

// Parse a multipart/form-data body and return the Buffer of the first file part.
// (The raw body starts with the boundary string, so we must extract the file
//  part before we can sniff its magic bytes.)
function extractMultipartFile(body, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType || '')
  if (!m) return null
  const boundary = '--' + (m[1] || m[2])
  const bBuf = Buffer.from(boundary)
  // find first occurrence of boundary, then the next (start of part headers)
  let start = body.indexOf(bBuf)
  if (start === -1) return null
  start += bBuf.length
  // skip possible leading CRLF / "--" (end boundary)
  if (body.slice(start, start + 2).toString() === '--') return null
  if (body.slice(start, start + 2).toString() === '\r\n') start += 2
  // part body begins after the first blank line (\r\n\r\n)
  const headerEnd = body.indexOf('\r\n\r\n', start)
  if (headerEnd === -1) return null
  let dataStart = headerEnd + 4
  // find the closing boundary after the data
  let end = body.indexOf(bBuf, dataStart)
  if (end === -1) return null
  return body.slice(dataStart, end)
}

async function handleUpload(req, res) {
  let raw
  try { raw = await readBody(req, MAX_IMAGE_BYTES) }
  catch { return sendJson(res, 413, { ok: false, error: 'file-too-large' }) }

  const ct = req.headers['content-type'] || ''
  let body
  if (/multipart\/form-data/i.test(ct)) {
    body = extractMultipartFile(raw, ct)
    if (!body) return sendJson(res, 400, { ok: false, error: 'no-file' })
  } else {
    body = raw // raw image bytes (Content-Type: image/*)
  }

  const ext = detectImageExt(body)
  if (!ext) return sendJson(res, 415, { ok: false, error: 'not-an-image' })

  const id = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex')
  const fname = id + ext
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    fs.writeFileSync(path.join(UPLOAD_DIR, fname), body)
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: 'save-failed', message: e.message })
  }
  log('Image saved:', fname, `(${body.length} bytes)`)
  sendJson(res, 200, { ok: true, url: '/uploads/' + fname })
}

// ---------- static uploads ----------
function serveUpload(res, name) {
  const safe = path.basename(name) // prevent path traversal
  const fpath = path.join(UPLOAD_DIR, safe)
  if (!fs.existsSync(fpath)) { res.writeHead(404); res.end('Not found'); return }
  const ext = path.extname(safe).toLowerCase()
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': fs.statSync(fpath).size,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin': '*',
  })
  fs.createReadStream(fpath).pipe(res)
}

// ---------- HTTP server ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const p = url.pathname

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return res.end()
  }

  try {
    // health
    if (p === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, uptime: process.uptime(), dirty, keys: Object.keys(db.keys).length })
    }

    // full DB snapshot
    if (p === '/api/db' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, db })
    }

    // upsert a single shared key (value === null deletes the key)
    if (p === '/api/db/key' && req.method === 'POST') {
      const body = await readBody(req, 50 * 1024 * 1024)
      let data
      try { data = JSON.parse(body.toString('utf8')) }
      catch { return sendJson(res, 400, { ok: false, error: 'bad-json' }) }
      if (!data || typeof data.key !== 'string' || (!data.key.startsWith('shop_') && data.key !== 'cart')) {
        return sendJson(res, 400, { ok: false, error: 'bad-key' })
      }
      if (data.value === null) delete db.keys[data.key]
      else db.keys[data.key] = data.value
      db.meta.updatedAt = Date.now()
      dirty = true
      return sendJson(res, 200, { ok: true, key: data.key })
    }

    // upsert many shared keys at once (used by the beforeunload beacon)
    if (p === '/api/db/bulk' && req.method === 'POST') {
      const body = await readBody(req, 100 * 1024 * 1024)
      let data
      try { data = JSON.parse(body.toString('utf8')) }
      catch { return sendJson(res, 400, { ok: false, error: 'bad-json' }) }
      const keys = data && data.keys
      if (!keys || typeof keys !== 'object') return sendJson(res, 400, { ok: false, error: 'bad-keys' })
      for (const [k, v] of Object.entries(keys)) {
        if (typeof k !== 'string' || (!k.startsWith('shop_') && k !== 'cart')) continue
        if (v === null) delete db.keys[k]
        else db.keys[k] = v
      }
      db.meta.updatedAt = Date.now()
      dirty = true
      return sendJson(res, 200, { ok: true, count: Object.keys(keys).length })
    }

    // image upload
    if (p === '/api/upload' && req.method === 'POST') {
      return await handleUpload(req, res)
    }

    // serve uploaded images
    if (p.startsWith('/uploads/')) {
      return serveUpload(res, decodeURIComponent(p.slice('/uploads/'.length)))
    }

    // simple API index
    if (p === '/api' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, endpoints: ['GET /api/health', 'GET /api/db', 'POST /api/db/key', 'POST /api/upload', 'GET /uploads/<file>'] })
    }

    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' })
    res.end('Not found')
  } catch (e) {
    log('request error:', e.message)
    try { sendJson(res, 500, { ok: false, error: e.message }) } catch {}
  }
})

// ---------- lifecycle ----------
loadDb()
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const interval = setInterval(saveDb, SAVE_INTERVAL)
const shutdown = () => {
  log('Shutting down — final DB save...')
  saveDb()
  clearInterval(interval)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 1500).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

server.listen(PORT, () => {
  log(`listening on http://localhost:${PORT}`)
  log(`DB file: ${DB_FILE}`)
  log(`Uploads: ${UPLOAD_DIR}`)
  log(`Auto-save every ${SAVE_INTERVAL}ms when dirty`)
})
